import type { OpenAPIV3 } from 'openapi-types'

/**
 * Los esquemas que el documento OpenAPI publica para la capability de tareas.
 *
 * Se escriben aquí y no se derivan de los validadores porque el JSON Schema que
 * VineJS genera no sabe expresar `vine.date({ formats: 'YYYY-MM-DD' })` —lo
 * emite como un esquema vacío— y porque marcaría `additionalProperties: false`,
 * que diría que enviar `status` al crear es un error cuando en realidad se
 * ignora. Documentar eso sería mentir sobre el contrato.
 *
 * Este módulo NO importa nada de `#models/*`, y no es una casualidad: lo carga
 * `config/openapi.ts`, o sea antes de que la aplicación arranque, y tirar de ahí
 * del modelo `Task` arrastraría a `User`, que se compone con el servicio `hash`
 * en el momento de importarse. Ese servicio todavía no existe durante la carga
 * de la configuración, y el mixin se quedaría con un `hash` indefinido para todo
 * el proceso. Es el mismo motivo por el que `config/auth.ts` referencia el
 * modelo con un import diferido.
 *
 * El precio es tener los tres estados escritos a mano. Lo cubre
 * `tests/unit/openapi/schemas.spec.ts`, que falla si dejan de coincidir con
 * `TASK_STATUSES`.
 *
 * El documento se emite como OpenAPI 3.0, así que lo nulable se escribe con
 * `nullable: true` y no con un `type` en lista, que es de 3.1.
 */

/** Copia documental de `TASK_STATUSES` de `#models/task`. Ver el aviso de arriba. */
const TASK_STATUSES = ['pending', 'in_progress', 'done']

/**
 * Un día del calendario, sin hora ni huso. Es la forma que exige
 * `#validators/task` tanto para `today` como para `dueDate`.
 */
const calendarDay: OpenAPIV3.SchemaObject = {
  type: 'string',
  format: 'date',
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  example: '2026-09-30',
}

const TaskAssignee: OpenAPIV3.SchemaObject = {
  type: 'object',
  description:
    'El responsable de una tarea: lo justo para identificarlo. No incluye el email ni ningún otro dato de la cuenta.',
  properties: {
    id: { type: 'integer', example: 1 },
    fullName: {
      type: 'string',
      nullable: true,
      description: 'Nulo si la cuenta se registró sin nombre. Las iniciales llegan igualmente.',
      example: 'Ada Lovelace',
    },
    initials: { type: 'string', example: 'AL' },
  },
  required: ['id', 'fullName', 'initials'],
}

const Task: OpenAPIV3.SchemaObject = {
  type: 'object',
  description:
    'Una tarea tal y como la devuelven la lista y las escrituras sobre ella. No lleva fecha de vencimiento ni condición de vencida: eso es exclusivo de la consulta de una tarea suelta.',
  properties: {
    id: { type: 'integer', example: 1 },
    title: { type: 'string', maxLength: 200, example: 'Revisar el informe' },
    status: { type: 'string', enum: TASK_STATUSES },
    assignee: { $ref: '#/components/schemas/TaskAssignee' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'title', 'status', 'assignee', 'createdAt', 'updatedAt'],
}

const TaskDetail: OpenAPIV3.SchemaObject = {
  description:
    'Una tarea con todo lo que tiene. Es un tipo aparte de `Task`, y no `Task` con campos opcionales, porque la lista no debe poder enseñar el vencimiento.',
  allOf: [
    { $ref: '#/components/schemas/Task' },
    {
      type: 'object',
      properties: {
        dueDate: {
          ...calendarDay,
          nullable: true,
          description: 'Un día del calendario, o nulo si la tarea no tiene fecha.',
        },
        isOverdue: {
          type: 'boolean',
          description:
            'Resuelto por el servidor contra el `today` de quien consulta. Cierto solo si hay fecha, es anterior a ese día y la tarea no está hecha.',
        },
      },
      required: ['dueDate', 'isOverdue'],
    },
  ],
}

const ValidationError: OpenAPIV3.SchemaObject = {
  type: 'object',
  description: 'El error de validación de VineJS, con el mismo formato en toda la API.',
  properties: {
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'The selected status is invalid' },
          rule: { type: 'string', example: 'enum' },
          field: { type: 'string', example: 'status' },
          meta: {
            type: 'object',
            additionalProperties: true,
            description: 'Datos de la regla que ha fallado. Para `enum`, los valores admitidos.',
          },
        },
        required: ['message', 'rule', 'field'],
      },
    },
  },
  required: ['errors'],
}

const UnauthorizedError: OpenAPIV3.SchemaObject = {
  type: 'object',
  description:
    'Falta el token de acceso o ya no vale. Mismo envoltorio que la validación, sin campo ni regla.',
  properties: {
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Unauthorized access' } },
        required: ['message'],
      },
    },
  },
  required: ['errors'],
}

const NotFoundError: OpenAPIV3.SchemaObject = {
  type: 'object',
  description:
    'La tarea pedida no existe. Esta es la forma que devuelve el manejador de excepciones fuera de desarrollo; con `debug` activo lo sustituye el volcado de Youch, que no es contrato.',
  properties: { message: { type: 'string', example: 'Row not found' } },
  required: ['message'],
}

/**
 * Los componentes que se registran en el documento desde `config/openapi.ts`.
 */
export const taskSchemas = {
  TaskAssignee,
  Task,
  TaskDetail,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
}

/**
 * Referencia a un componente registrado.
 *
 * El cast existe porque los decoradores declaran `schema` como `SchemaObject` y
 * una referencia no lo es, pero el generador devuelve ese valor tal cual
 * (`loadType` corta en `options.schema`), así que un `$ref` viaja intacto hasta
 * el documento. Es un hueco del tipado del paquete, no del formato.
 */
export const ref = (name: keyof typeof taskSchemas) =>
  ({ $ref: `#/components/schemas/${name}` }) as unknown as OpenAPIV3.SchemaObject

/** Envuelve un esquema en el `{ data: ... }` que pone el serializer de la API. */
export const wrapped = (schema: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject => ({
  type: 'object',
  properties: { data: schema },
  required: ['data'],
})

/** Una colección del esquema dado. */
export const listOf = (schema: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject => ({
  type: 'array',
  items: schema,
})

/**
 * El estado por el que se acota la lista. Opcional: su ausencia significa la
 * vista por defecto —pendientes y en curso—, que no es «todas».
 */
export const taskStatusQuery: OpenAPIV3.SchemaObject = {
  type: 'string',
  enum: TASK_STATUSES,
}

/** El día de referencia contra el que se resuelve el vencimiento. */
export const referenceDayQuery: OpenAPIV3.SchemaObject = calendarDay

/**
 * El cuerpo de la creación. No se declara `additionalProperties: false`
 * a propósito: enviar `status`, responsable o fecha no es un error, se ignora.
 */
export const createTaskBody: OpenAPIV3.SchemaObject = {
  type: 'object',
  description:
    'El título es el único dato que se lee. El responsable y el estado los pone el sistema, y cualquier otro campo del cuerpo se ignora en silencio.',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'Se recortan los espacios de los extremos antes de comprobar el mínimo.',
      example: 'Revisar el informe',
    },
  },
  required: ['title'],
}

export const updateTaskStatusBody: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: { status: { type: 'string', enum: TASK_STATUSES } },
  required: ['status'],
}

export const setTaskDueDateBody: OpenAPIV3.SchemaObject = {
  type: 'object',
  description:
    'Lleva el día de referencia porque la respuesta devuelve la tarea con su condición de vencida ya resuelta.',
  properties: {
    dueDate: {
      ...calendarDay,
      nullable: true,
      description: 'La fecha a fijar, o `null` para retirarla. Retirarla es una operación normal.',
    },
    today: calendarDay,
  },
  required: ['dueDate', 'today'],
}
