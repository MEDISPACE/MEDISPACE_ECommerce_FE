import { Navigate, useLocation } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import PageLoader from '~/components/ui/PageLoader'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return <PageLoader />
  }

  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to='/auth/login' state={{ from: location }} replace />
  }

  if (!requireAuth && isAuthenticated && location.pathname.startsWith('/auth')) {
    // Only redirect authenticated users away from auth pages, not from home
    return <Navigate to='/' replace />
  }

  return <>{children}</>
}
