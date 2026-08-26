import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

export function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <Link to="/" className="font-heading font-medium">
        FlowSync
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-muted-foreground">Hola, {user.fullName ?? user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm hover:underline">
              Iniciar sesión
            </Link>
            <Link to="/register" className="text-sm hover:underline">
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
