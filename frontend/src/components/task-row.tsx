import { Link } from 'react-router'
import { TaskStatusControl } from '@/components/task-status-control'
import type { Task, TaskStatus } from '@/lib/types'

type TaskRowProps = {
  task: Task
  onStatusChange: (task: Task, status: TaskStatus) => void
  disabled?: boolean
}

/**
 * Una fila responde las tres cosas sin abrir nada: qué hay que hacer, quién lo
 * lleva y en qué punto está.
 */
export function TaskRow({ task, onStatusChange, disabled }: TaskRowProps) {
  return (
    <li className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <Link
          to={`/tasks/${task.id}`}
          className="block truncate font-medium hover:underline"
        >
          {task.title}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {task.assignee.fullName ?? 'Sin nombre'}
        </p>
      </div>

      <TaskStatusControl
        value={task.status}
        taskTitle={task.title}
        disabled={disabled}
        onChange={(status) => onStatusChange(task, status)}
      />
    </li>
  )
}
