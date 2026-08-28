import { DateTime } from 'luxon'
import { errors } from '@vinejs/vine'
import Task, { DEFAULT_TASK_STATUS } from '#models/task'
import { createTaskValidator, referenceDayValidator, updateTaskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'

export default class TasksController {
  /**
   * The one shared list, identical for everybody. No ordering clause on
   * purpose: how the list is ordered is still an open product decision, and a
   * provisional order becomes the expected behaviour as soon as anyone sees it.
   */
  async index({ request, serialize }: HttpContext) {
    const referenceDay = await this.#referenceDay(request)
    const tasks = await Task.query().preload('assignee')

    return serialize(TaskTransformer.transform(tasks, referenceDay))
  }

  async show({ params, request, serialize }: HttpContext) {
    const referenceDay = await this.#referenceDay(request)
    const task = await Task.query().where('id', params.id).preload('assignee').firstOrFail()

    return serialize(TaskTransformer.transform(task, referenceDay))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const referenceDay = await this.#referenceDay(request)
    const { title, dueDate } = await request.validateUsing(createTaskValidator)
    const user = auth.getUserOrFail()

    const task = await Task.create({
      title,
      dueDate: dueDate ?? null,
      status: DEFAULT_TASK_STATUS,
      assigneeId: user.id,
    })
    await task.load('assignee')

    response.status(201)

    return serialize(TaskTransformer.transform(task, referenceDay))
  }

  /**
   * Moves a task to another state, sets or clears its due date, or both.
   * Anybody can do it to any task.
   */
  async update({ params, request, serialize }: HttpContext) {
    const referenceDay = await this.#referenceDay(request)
    const { status, dueDate } = await request.validateUsing(updateTaskValidator)

    // An update that asks for nothing is nearly always a mistaken client — a
    // misspelled field, a form that did not send what it thought. Answering 200
    // to that hides the bug exactly where it costs most to find.
    if (status === undefined && dueDate === undefined) {
      throw new errors.E_VALIDATION_ERROR([
        {
          message: 'Send a status, a due date, or both',
          rule: 'atLeastOne',
          field: 'status',
        },
      ])
    }

    const task = await Task.findOrFail(params.id)

    if (status !== undefined) task.status = status
    // `undefined` leaves the date alone; `null` takes it off.
    if (dueDate !== undefined) task.dueDate = dueDate

    await task.save()
    await task.load('assignee')

    return serialize(TaskTransformer.transform(task, referenceDay))
  }

  /**
   * The day the overdue verdict is resolved against: the caller's, when they
   * send one, and the server's own otherwise.
   */
  async #referenceDay(request: HttpContext['request']): Promise<DateTime> {
    const { today } = await referenceDayValidator.validate(request.qs())

    return today ?? DateTime.now()
  }
}
