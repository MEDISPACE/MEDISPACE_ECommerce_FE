import { Navigate } from 'react-router'

export function meta() {
  return [{ title: 'Dashboard | MEDISPACE' }, { name: 'description', content: 'Bảng điều khiển cá nhân MEDISPACE' }]
}

export default function Dashboard() {
  // Redirect to account dashboard instead of having separate dashboard
  return <Navigate to='/account' replace />
}
