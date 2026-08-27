import { useRef, useState } from 'react'
import { FieldError } from '@/components/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TaskDueDateFieldProps = {
  /** La fecha que la tarea tiene de verdad, según el servidor. */
  value: string | null
  onChange: (dueDate: string | null) => Promise<void>
}

/**
 * Campo de fecha nativo: trae calendario, teclado y accesibilidad ya resueltos
 * por el navegador, y no añade ninguna dependencia.
 *
 * Se guarda solo, sin botón. Lo que se ve mientras tanto es lo que la persona
 * acaba de escribir; lo único que espera al servidor es el veredicto de
 * vencimiento, que no se puede adivinar aquí sin reimplementar la regla.
 *
 * El campo NO se controla mientras se edita. Un campo de fecha se rellena por
 * segmentos, y repintarlo en cada pulsación deshace lo que la persona acaba de
 * borrar: quitar la fecha se volvería imposible. Solo se fuerza a la verdad del
 * servidor cuando esa verdad cambia, o cuando un guardado falla.
 */
export function TaskDueDateField({ value, onChange }: TaskDueDateFieldProps) {
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  // Sube cada vez que hay que devolver el campo a la fecha real, para que el
  // navegador vuelva a tomar `defaultValue`.
  const [reset, setReset] = useState(0)
  const lastSaved = useRef<string | null>(value)

  /**
   * Un campo de fecha a medias («mm/01/2026») y uno vacío del todo valen los dos
   * cadena vacía: por el valor son indistinguibles, y lo que los separa es
   * `badInput`.
   *
   * Hay que mirarlo además al salir del campo, no solo al cambiarlo. El
   * navegador deja de emitir «change» en cuanto el valor es cadena vacía, así
   * que borrar el primer segmento es el último aviso que llega: quien siga
   * borrando hasta vaciarlo del todo no generaría ningún evento más, y la fecha
   * no habría forma de quitarla.
   */
  const evaluate = async (input: HTMLInputElement, salgoDelCampo = false) => {
    if (input.validity.badInput) {
      setError('Esa fecha está incompleta. Escribe el día, el mes y el año.')
      // Al salir con la fecha a medias se recupera la que la tarea tiene.
      if (salgoDelCampo) setReset((veces) => veces + 1)
      return
    }

    const dueDate = input.value === '' ? null : input.value
    if (isSaving || dueDate === lastSaved.current) {
      if (salgoDelCampo) setError(undefined)
      return
    }

    setSaving(true)
    setError(undefined)

    try {
      await onChange(dueDate)
      lastSaved.current = dueDate
    } catch (problema) {
      // Dejar en pantalla una fecha que no se ha guardado sería peor que no
      // haberla aceptado.
      setReset((veces) => veces + 1)
      setError(
        problema instanceof Error
          ? problema.message
          : 'No hemos podido guardar la fecha.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="dueDate">
        Fecha de vencimiento{' '}
        <span className="font-normal text-muted-foreground">(opcional)</span>
      </Label>

      <Input
        key={`${value ?? 'sin-fecha'}-${reset}`}
        id="dueDate"
        name="dueDate"
        type="date"
        className="w-auto"
        defaultValue={value ?? ''}
        disabled={isSaving}
        onChange={(event) => evaluate(event.target)}
        onBlur={(event) => evaluate(event.target, true)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'dueDate-error' : 'dueDate-hint'}
      />

      {error ? (
        <FieldError id="dueDate-error" message={error} />
      ) : (
        <p id="dueDate-hint" className="text-sm text-muted-foreground">
          {isSaving
            ? 'Guardando…'
            : value
              ? 'Se guarda sola. Vacíala para quitar el plazo.'
              : 'Sin plazo. Ponle una fecha si quieres comprometerte con un día.'}
        </p>
      )}
    </div>
  )
}
