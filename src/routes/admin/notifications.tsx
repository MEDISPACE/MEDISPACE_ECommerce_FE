import { AdminNotificationsPage } from '~/components/admin/AdminNotificationsPage'

export function meta() {
  return [
    { title: 'Thông báo | MEDISPACE Admin' },
    { name: 'description', content: 'Trung tâm thông báo dành cho Admin' },
  ]
}

export default function AdminNotificationsRoute() {
  return <AdminNotificationsPage role='admin' />
}
