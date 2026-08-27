import { Button } from '@/components/ui/button'
import { TASK_STATUS_ORDER, taskStatusLabel } from '@/lib/task-status'
import type { TaskStatus } from '@/lib/types'

type TaskStatusControlProps = {
  value: TaskStatus
  onChange: (status: TaskStatus) => void
  disabled?: boolean
  /** Para que cada botón diga en voz alta a qué tarea pertenece. */
  taskTitle: string
}

/**
 * Los tres estados como tres botones: un solo clic, sin abrir la tarea y sin
 * confirmar. Un desplegable en condiciones exigiría traer un componente nuevo,
 * y este cambio no añade dependencias.
 */
export function TaskStatusControl({
  value,
  onChange,
  disabled,
  taskTitle,
}: TaskStatusControlProps) {
  return (
    <div
      role="group"
      aria-label={`Estado de «${taskTitle}»`}
      className="flex gap-1"
    >
      {TASK_STATUS_ORDER.map((status) => {
        const isCurrent = status === value

        return (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={isCurrent ? 'default' : 'outline'}
            aria-pressed={isCurrent}
            disabled={disabled}
            onClick={() => onChange(status)}
          >
            {taskStatusLabel(status)}
          </Button>
        )
      })}
    </div>
  )
}
