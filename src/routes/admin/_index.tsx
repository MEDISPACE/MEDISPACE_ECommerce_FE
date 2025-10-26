import { Navigate } from 'react-router'

export default function AdminRoute() {
  // Canonical redirect: keep /admin/dashboard as the primary dashboard route
  return <Navigate to='/admin/dashboard' replace />
}
