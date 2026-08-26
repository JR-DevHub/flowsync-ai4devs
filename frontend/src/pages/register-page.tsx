import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { ApiError } from '@/lib/api-client'

export function RegisterPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSubmitting) return
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await signup({
        fullName: fullName.trim() || null,
        email,
        password,
        passwordConfirmation,
      })
      navigate('/profile')
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Ocurrió un error. Intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Nombre</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="passwordConfirmation">Confirmar contraseña</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                required
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta? <Link to="/login" className="hover:underline">Iniciá sesión</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
