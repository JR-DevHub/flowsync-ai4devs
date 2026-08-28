import Task, { DEFAULT_LIST_STATUSES } from '#models/task'
import {
  createTaskValidator,
  listTasksValidator,
  taskReferenceDayValidator,
  toCalendarDay,
} from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import TaskDetailTransformer from '#transformers/task_detail_transformer'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@foadonis/openapi/decorators'
import {
  createTaskBody,
  listOf,
  ref,
  referenceDayQuery,
  taskStatusQuery,
  wrapped,
} from '#openapi/schemas'

@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description:
    'Falta la cabecera `Authorization` o el token ya no vale. No se devuelve ninguna tarea.',
  schema: ref('UnauthorizedError'),
})
export default class TasksController {
  /**
   * La lista del espacio: una sola, la misma para todo el mundo, sin filtrar
   * por quién la pide. El responsable va precargado en la misma consulta —
   * es el 100 % de los accesos y resolverlo tarea a tarea sería el error caro
   * y evidente aquí.
   *
   * Admite acotarse por estado, y aquí hay tres caminos que no se cruzan:
   * un estado válido devuelve solo el suyo (aunque no haya ninguna, y eso es
   * una lista vacía legítima, no un error); no pedir nada devuelve lo que
   * sigue abierto; y un estado que no existe ni siquiera llega, porque el
   * validador lo corta antes con un 422. Devolverlo vacío sería el fallo
   * silencioso que esta lista no se puede permitir.
   *
   * Acotar es solo lectura: ninguna tarea cambia por consultarla.
   */
  @ApiOperation({
    summary: 'La lista compartida del espacio',
    description:
      'Devuelve las tareas del alcance pedido, iguales para cualquier cuenta y ordenadas de la más reciente a la más antigua. Llegan todas en una sola respuesta, sin paginar. Sin `status`, el alcance son las pendientes y las que están en curso: la ausencia de filtro no es «todas», porque lo hecho queda fuera.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Acota la lista a un único estado. Omitirlo devuelve la vista por defecto —pendientes y en curso—; un valor que no sea uno de los tres es un 422 y nunca una lista vacía.',
    schema: taskStatusQuery,
  })
  @ApiResponse({
    status: 200,
    description:
      'La lista del alcance pedido. Puede venir vacía, y una lista vacía por un filtro válido es una respuesta legítima con la misma forma que cualquier otra.',
    schema: wrapped(listOf(ref('Task'))),
  })
  @ApiResponse({
    status: 422,
    description:
      'El `status` pedido no es ninguno de los tres estados del dominio. Se señala ese campo, y no se responde con una lista vacía.',
    schema: ref('ValidationError'),
  })
  async index({ request, serialize }: HttpContext) {
    const { status } = await request.validateUsing(listTasksValidator)

    const query = Task.query().preload('assignee')

    if (status) {
      query.where('status', status)
    } else {
      // Sin filtro no es «todas»: lo hecho se queda fuera.
      query.whereIn('status', [...DEFAULT_LIST_STATUSES])
    }

    const tasks = await query
      .orderBy('createdAt', 'desc')
      // Desempate estable: dos tareas creadas en el mismo milisegundo tienen
      // la misma marca de tiempo, y sin esto su orden relativo sería el que
      // quisiera la base de datos.
      .orderBy('id', 'desc')

    return serialize(TaskTransformer.transform(tasks))
  }

  /**
   * Una tarea suelta, con todo lo que tiene: es la única lectura que informa
   * del vencimiento, y por eso es la única que exige el día de quien mira.
   */
  @ApiOperation({
    summary: 'Una tarea suelta',
    description:
      'La única lectura que informa del vencimiento, y por eso la única que exige el día de quien mira. No comprueba quién es el responsable: cualquier cuenta con sesión la recibe entera.',
  })
  @ApiQuery({
    name: 'today',
    required: true,
    description:
      'El día de quien consulta. No tiene valor por defecto a propósito: sustituirlo por el día del servidor daría la lectura equivocada a quien mire desde otro huso.',
    schema: referenceDayQuery,
  })
  @ApiResponse({
    status: 200,
    description: 'La tarea, con su fecha de vencimiento —o su ausencia— y su condición de vencida.',
    schema: wrapped(ref('TaskDetail')),
  })
  @ApiResponse({
    status: 404,
    description: 'No existe ninguna tarea con ese identificador.',
    schema: ref('NotFoundError'),
  })
  @ApiResponse({
    status: 422,
    description: 'Falta `today` o no es una fecha del calendario. No se devuelve ninguna tarea.',
    schema: ref('ValidationError'),
  })
  async show({ params, request, serialize }: HttpContext) {
    const { today } = await request.validateUsing(taskReferenceDayValidator)
    const task = await Task.findOrFail(params.id)
    await task.load('assignee')

    return serialize(TaskDetailTransformer.transform(task, toCalendarDay(today)))
  }

  /**
   * Crear cuesta un título. El responsable y el estado no se leen de la
   * petición ni aunque vengan: los pone el sistema.
   */
  @ApiOperation({
    summary: 'Crear una tarea',
    description:
      'Cuesta un título y nada más. La tarea nace pendiente y a nombre de quien la crea; el estado, el responsable y la fecha que vengan en el cuerpo se ignoran, no se rechazan.',
  })
  @ApiBody({ schema: createTaskBody })
  @ApiResponse({
    status: 201,
    description: 'La tarea ya creada, en `pending` y a nombre de la cuenta dueña del token.',
    schema: wrapped(ref('Task')),
  })
  @ApiResponse({
    status: 422,
    description:
      'El título falta, viene vacío, es solo espacios o pasa de 200 caracteres. No se crea ninguna tarea ni se guarda una versión recortada.',
    schema: ref('ValidationError'),
  })
  async store({ request, response, auth, serialize }: HttpContext) {
    const { title } = await request.validateUsing(createTaskValidator)
    const user = auth.getUserOrFail()

    // El estado va explícito y no se deja al valor por defecto de la columna:
    // el modelo recién creado no vuelve a leerse de la base de datos, así que
    // ese defecto no llegaría a la respuesta.
    const task = await Task.create({ title, status: 'pending', assigneeId: user.id })
    await task.load('assignee')

    // El estado se marca aparte y el cuerpo se devuelve: `serialize()` entrega
    // una promesa que resuelve el pipeline al devolverla, y pasársela a
    // `response.created()` deja la respuesta con el cuerpo vacío.
    response.status(201)
    return serialize(TaskTransformer.transform(task))
  }
}
