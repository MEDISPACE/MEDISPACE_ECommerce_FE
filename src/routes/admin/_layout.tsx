import { Outlet } from 'react-router'
import { AdminLayout } from '~/components/layout/AdminLayout'

export function meta() {
  return [{ title: 'Quản trị | MEDISPACE' }, { name: 'description', content: 'Bảng điều khiển quản trị MEDISPACE' }]
}

export default function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
