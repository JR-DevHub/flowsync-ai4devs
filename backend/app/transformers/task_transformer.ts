import type { DateTime } from 'luxon'
import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'
import TaskAssigneeTransformer from '#transformers/task_assignee_transformer'

export default class TaskTransformer extends BaseTransformer<Task> {
  /**
   * The day the overdue verdict is resolved against comes in from the outside,
   * because it belongs to whoever is looking, not to the task.
   */
  constructor(
    resource: Task,
    private referenceDay: DateTime
  ) {
    super(resource)
  }

  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status']),
      dueDate: this.resource.dueDate?.toISODate() ?? null,
      isOverdue: this.resource.isOverdueOn(this.referenceDay),
      assignee: TaskAssigneeTransformer.transform(this.whenLoaded(this.resource.assignee)),
    }
  }
}
