import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AlertCircleIcon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/auth/use-auth'
import { FullScreenLoader } from '@/components/full-screen-loader'
import { TaskDueDateField } from '@/components/task-due-date-field'
import { TaskOverdueNotice } from '@/components/task-overdue-notice'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { taskStatusLabel } from '@/lib/task-status'
import type { Task } from '@/lib/types'

export function TaskPage() {
  const { token } = useAuth()
  const { id } = useParams()
  const taskId = Number(id)
  const [task, setTask] = useState<Task | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !Number.isInteger(taskId)) {
      if (!Number.isInteger(taskId)) setLoadError('Esa tarea no existe.')
      return
    }

    let cancelled = false

    api
      .getTask(token, taskId)
      .then((loaded) => {
        if (!cancelled) setTask(loaded)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? 'Esa tarea no existe.'
            : error instanceof ApiError
              ? error.message
              : 'No hemos podido cargar la tarea.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token, taskId])

  /**
   * El servidor es quien decide si la tarea queda vencida, así que se pinta lo
   * que devuelva en lugar de adelantar un veredicto que aquí no sabemos dar.
   */
  const handleDueDateChange = useCallback(
    async (dueDate: string | null) => {
      if (!token) return
      setTask(await api.updateTask(token, taskId, { dueDate }))
    },
    [token, taskId],
  )

  if (loadError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
        <div className="grid w-full max-w-md gap-4">
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button asChild variant="outline">
            <Link to="/tasks">Volver a la lista</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!task) return <FullScreenLoader />

  return (
    <div className="flex min-h-svh justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/tasks"
            className="text-sm font-medium text-muted-foreground underline"
          >
            ← Tareas del equipo
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
            <CardDescription>
              {task.assignee.fullName ?? 'Sin nombre'} ·{' '}
              {taskStatusLabel(task.status)}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            {task.isOverdue && <TaskOverdueNotice />}

            <TaskDueDateField
              key={task.id}
              value={task.dueDate}
              onChange={handleDueDateChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
