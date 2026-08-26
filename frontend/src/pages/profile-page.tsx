import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nombre: </span>
            {user.fullName ?? 'Sin nombre'}
          </p>
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Iniciales: </span>
            {user.initials}
          </p>
          <p>
            <span className="text-muted-foreground">Miembro desde: </span>
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
