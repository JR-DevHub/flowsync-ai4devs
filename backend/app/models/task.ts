import User from '#models/user'
import { DateTime } from 'luxon'
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

  /**
   * The one and only place that decides whether a task is overdue. Three
   * conditions, all of them required: it has a due date, that date is *before*
   * the reference day, and the task is not done yet.
   *
   * The reference day comes in as an argument instead of being read from the
   * clock, because the verdict belongs to whoever is looking: two people on
   * different sides of midnight get different answers and both are right. A
   * rule that consults the clock on its own cannot be asked about two days.
   */
  isOverdueOn(referenceDay: DateTime): boolean {
    if (!this.dueDate) return false
    if (this.status === 'done') return false

    // Calendar days as plain ISO strings, never instants. Comparing instants is
    // what makes a task due today look overdue because its midnight has already
    // passed, and it also drags the process time zone into a decision that has
    // nothing to do with it. 'YYYY-MM-DD' sorts chronologically as text.
    return this.dueDate.toISODate()! < referenceDay.toISODate()!
  }
}
