import { AdminDashboard } from '~/components/admin'

export function meta() {
  return [
    { title: 'Dashboard Admin | MEDISPACE' },
    { name: 'description', content: 'Bảng điều khiển quản trị MEDISPACE' },
  ]
}

export default function AdminDashboardRoute() {
  return <AdminDashboard />
}
