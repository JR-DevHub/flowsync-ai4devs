import vine from '@vinejs/vine'
import { TASK_STATUSES } from '#models/task'

/**
 * Validator to use when creating a task. The title is the only accepted input:
 * the assignee and the status are decided by the server.
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(255),
})

/**
 * Validator to use when moving a task to another state. The status is the only
 * accepted input, restricted to the closed set of states.
 */
export const updateTaskValidator = vine.create({
  status: vine.enum(TASK_STATUSES),
})
