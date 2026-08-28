import Task from '#models/task'
import { setTaskDueDateValidator, toCalendarDay } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskDetailTransformer from '#transformers/task_detail_transformer'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import { ref, setTaskDueDateBody, wrapped } from '#openapi/schemas'

@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description:
    'Falta la cabecera `Authorization` o el token ya no vale. Nada cambia en el espacio.',
  schema: ref('UnauthorizedError'),
})
export default class TaskDueDatesController {
  /**
   * Fijar, cambiar y retirar la fecha de vencimiento son la misma operación, y
   * por eso comparten endpoint: quitar la fecha no es borrar un recurso, es
   * poner el valor «sin fecha», que es un valor legítimo del campo.
   *
   * Endpoint propio en vez de un update genérico de la tarea, por el mismo
   * motivo que el estado: por ahí se colarían el título y el responsable, que
   * este change no permite tocar.
   *
   * Cualquiera con sesión puede cambiar la fecha de cualquier tarea, igual que
   * el estado. No se comprueba quién es el responsable.
   */
  @ApiOperation({
    summary: 'Fijar, cambiar o retirar la fecha de vencimiento',
    description:
      'Las tres son la misma operación: `dueDate` a `null` retira la fecha y es un caso normal, no un error. Responde con la tarea ya resuelta contra el día de quien pide, de modo que aplazar una tarea vencida deja de mostrarla vencida en esta misma respuesta. El título, el responsable y el estado no se tocan.',
  })
  @ApiBody({ schema: setTaskDueDateBody })
  @ApiResponse({
    status: 200,
    description: 'La tarea con su nueva fecha y su condición de vencida ya recalculada.',
    schema: wrapped(ref('TaskDetail')),
  })
  @ApiResponse({
    status: 404,
    description: 'No existe ninguna tarea con ese identificador.',
    schema: ref('NotFoundError'),
  })
  @ApiResponse({
    status: 422,
    description:
      'La fecha es imposible o está mal formada, o falta `today`. La tarea conserva intacta la fecha que tuviera.',
    schema: ref('ValidationError'),
  })
  async update({ params, request, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    const { today, dueDate } = await request.validateUsing(setTaskDueDateValidator)

    // El `DateTime` del validador se queda aquí: hacia dentro, una fecha de
    // vencimiento es un día en texto y nunca un instante.
    task.dueDate = dueDate === null ? null : toCalendarDay(dueDate)
    await task.save()
    await task.load('assignee')

    // Se devuelve ya resuelta contra el día de quien pide, para que aplazar una
    // tarea vencida deje de mostrarla vencida en esta misma respuesta.
    return serialize(TaskDetailTransformer.transform(task, toCalendarDay(today)))
  }
}
