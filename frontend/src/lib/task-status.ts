import { TASK_STATUSES, type TaskStatus } from '@/lib/types'

/**
 * El único sitio donde un estado se escribe en castellano. Por la API viajan
 * los identificadores; aquí se decide cómo se llaman en pantalla.
 */
const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Hecho',
}

/** Los tres estados en el orden en que se ofrecen. */
export const TASK_STATUS_ORDER = TASK_STATUSES

export function taskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status]
}
