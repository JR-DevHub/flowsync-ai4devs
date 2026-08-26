import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/context/auth-context'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
