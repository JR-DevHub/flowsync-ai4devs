import Task, { DEFAULT_TASK_STATUS } from '#models/task'
import { createTaskValidator, updateTaskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'

export default class TasksController {
  /**
   * The one shared list, identical for everybody. No ordering clause on
   * purpose: how the list is ordered is still an open product decision, and a
   * provisional order becomes the expected behaviour as soon as anyone sees it.
   */
  async index({ serialize }: HttpContext) {
    const tasks = await Task.query().preload('assignee')

    return serialize(TaskTransformer.transform(tasks))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const { title } = await request.validateUsing(createTaskValidator)
    const user = auth.getUserOrFail()

    const task = await Task.create({
      title,
      status: DEFAULT_TASK_STATUS,
      assigneeId: user.id,
    })
    await task.load('assignee')

    response.status(201)

    return serialize(TaskTransformer.transform(task))
  }

  /**
   * Moves a task to another state. Anybody can move any task, and the state is
   * the only thing this accepts.
   */
  async update({ params, request, serialize }: HttpContext) {
    const { status } = await request.validateUsing(updateTaskValidator)
    const task = await Task.findOrFail(params.id)

    task.status = status
    await task.save()
    await task.load('assignee')

    return serialize(TaskTransformer.transform(task))
  }
}
