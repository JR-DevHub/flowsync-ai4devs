import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * The assignee as the task list needs it: who is on it, and nothing else.
 * Returning the whole user record would leak account data to a view that does
 * not use it, and once a client consumes it there is no taking it back.
 */
export default class TaskAssigneeTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'fullName'])
  }
}
