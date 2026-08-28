import { useState } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import { useAuthForm } from '@/auth/use-auth-form'
import { FieldError } from '@/components/field-error'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FIELDS = ['title'] as const

type NewTaskFormProps = {
  onCreate: (title: string) => Promise<void>
}

/**
 * El título es lo único que se pide: el responsable y el estado los decide el
 * servidor, y aquí no se ofrecen ni se sugieren.
 */
export function NewTaskForm({ onCreate }: NewTaskFormProps) {
  const { isSubmitting, formError, fieldErrors, submit } = useAuthForm(FIELDS)
  const [title, setTitle] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    // El botón ya está bloqueado, pero con Enter se puede volver a enviar
    // mientras el primero sigue en vuelo.
    if (isSubmitting) return

    await submit(async () => {
      await onCreate(title)
      // Solo se vacía si la creación ha ido bien: si falla, lo escrito sigue
      // ahí para corregirlo.
      setTitle('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Label htmlFor="title">Nueva tarea</Label>

      <div className="flex gap-2">
        <Input
          id="title"
          name="title"
          placeholder="¿Qué hay que hacer?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? 'title-error' : undefined}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando…' : 'Crear'}
        </Button>
      </div>

      <FieldError id="title-error" message={fieldErrors.title} />
    </form>
  )
}
