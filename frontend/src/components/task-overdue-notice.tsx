import { AlertCircleIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * La señal de vencida. Lleva palabras además de color: quien mira no tiene que
 * comparar la fecha con hoy, ni distinguir tonos, para saber que se ha pasado.
 */
export function TaskOverdueNotice() {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertDescription>
        <span className="font-medium text-destructive">
          Vencida: se ha pasado de plazo.
        </span>
      </AlertDescription>
    </Alert>
  )
}
