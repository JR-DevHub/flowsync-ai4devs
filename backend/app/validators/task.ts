import vine from '@vinejs/vine'
import { TASK_STATUSES } from '#models/task'

/**
 * Shared rule for a calendar day: no time, no zone, just a date.
 */
const calendarDay = () => vine.date({ formats: ['YYYY-MM-DD'] })

/**
 * Validator for the reference day the caller sends with every request. Whoever
 * is looking decides which day the overdue verdict is resolved against; when
 * they say nothing, the server falls back to its own day.
 */
export const referenceDayValidator = vine.create({
  today: calendarDay().optional(),
})

/**
 * Validator to use when creating a task. The title is the only required input;
 * a due date may come along. The assignee and the status are decided by the
 * server, and so is whether the task is overdue.
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
  dueDate: calendarDay().nullable().optional(),
})

/**
 * Validator to use when updating a task. Both fields are optional, and the due
 * date is nullable on top of that: absent means "leave it alone", explicitly
 * empty means "take the date off". Without that distinction a partial update
 * would erase by omission.
 */
export const updateTaskValidator = vine.create({
  status: vine.enum(TASK_STATUSES).optional(),
  dueDate: calendarDay().nullable().optional(),
})
