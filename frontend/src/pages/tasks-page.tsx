import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AlertCircleIcon } from 'lucide-react'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/auth/use-auth'
import { FullScreenLoader } from '@/components/full-screen-loader'
import { NewTaskForm } from '@/components/new-task-form'
import { TaskRow } from '@/components/task-row'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Task, TaskStatus } from '@/lib/types'

export function TasksPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // El fallo de un cambio de estado no tumba la lista: se avisa y se sigue.
  const [statusError, setStatusError] = useState<string | null>(null)
  // Filas con un cambio en vuelo: dos peticiones sobre la misma tarea podrían
  // contestar en orden inverso y dejarla en el estado que no es.
  const [pendingIds, setPendingIds] = useState<number[]>([])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    api
      .getTasks(token)
      .then((loaded) => {
        if (cancelled) return
        setTasks(loaded)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'No hemos podido cargar las tareas.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleCreate = useCallback(
    async (title: string) => {
      if (!token) return

      const created = await api.createTask(token, { title })
      // La tarea recién creada se ve sin volver a pedir la lista entera.
      setTasks((current) => [...(current ?? []), created])
    },
    [token],
  )

  const handleStatusChange = useCallback(
    async (task: Task, status: TaskStatus) => {
      if (!token || status === task.status) return

      const previousStatus = task.status
      const replace = (updated: Task) =>
        setTasks(
          (current) =>
            current?.map((item) => (item.id === updated.id ? updated : item)) ??
            current,
        )

      // Se pinta antes de preguntar, y se deshace si el servidor dice que no:
      // enseñar un estado que no es el de verdad sería peor que la espera.
      setStatusError(null)
      replace({ ...task, status })
      setPendingIds((current) => [...current, task.id])

      try {
        replace(await api.updateTaskStatus(token, task.id, { status }))
      } catch (error: unknown) {
        replace({ ...task, status: previousStatus })
        setStatusError(
          error instanceof ApiError
            ? error.message
            : 'No hemos podido cambiar el estado.',
        )
      } finally {
        setPendingIds((current) => current.filter((id) => id !== task.id))
      }
    },
    [token],
  )

  if (!tasks && !loadError) return <FullScreenLoader />

  return (
    <div className="flex min-h-svh justify-center bg-muted/40 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">FlowSync</h1>
          <Link
            to="/profile"
            className="text-sm font-medium text-muted-foreground underline"
          >
            Mi perfil
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tareas del equipo</CardTitle>
            <CardDescription>
              La lista es la misma para todos: cualquiera puede crear una tarea
              y mover el estado de cualquier otra.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid min-w-0 gap-6">
            {loadError ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            ) : (
              <>
                <NewTaskForm onCreate={handleCreate} />

                {statusError && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertDescription>{statusError}</AlertDescription>
                  </Alert>
                )}

                {tasks && tasks.length > 0 ? (
                  <ul className="min-w-0 divide-y">
                    {tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        disabled={pendingIds.includes(task.id)}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Aquí va todo el trabajo del equipo, con quién lo lleva y en
                    qué punto está. Todavía no hay ninguna tarea: escribe un
                    título ahí arriba y crea la primera.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
