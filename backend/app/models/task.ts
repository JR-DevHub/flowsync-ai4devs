import User from '#models/user'
import { TaskSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * Repertorio cerrado de estados. Estos son los identificadores con los que el
 * estado se guarda y viaja por la API; su etiqueta en castellano vive en el
 * frontend, para no atar el dato a un idioma ni a una redacción.
 */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

/**
 * Estado con el que nace toda tarea. Nadie puede indicarlo al crearla.
 */
export const DEFAULT_TASK_STATUS: TaskStatus = 'pending'

export default class Task extends TaskSchema {
  declare status: TaskStatus

  @belongsTo(() => User, { foreignKey: 'assigneeId' })
  declare assignee: BelongsTo<typeof User>
}
