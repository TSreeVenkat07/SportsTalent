import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export function RequireRole({ role, children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export function RequireGodMode({ children }) {
  const { godModeToken, isLoading } = useAuthStore()
  if (isLoading) return null
  if (!godModeToken) return <Navigate to="/admin/login" replace />
  return children
}
