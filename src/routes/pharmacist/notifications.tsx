import { AdminNotificationsPage } from '~/components/admin/AdminNotificationsPage'

export function meta() {
  return [
    { title: 'Thông báo | MEDISPACE Pharmacist' },
    { name: 'description', content: 'Trung tâm thông báo dành cho Dược sĩ' },
  ]
}

export default function PharmacistNotificationsRoute() {
  return <AdminNotificationsPage role='pharmacist' />
}
