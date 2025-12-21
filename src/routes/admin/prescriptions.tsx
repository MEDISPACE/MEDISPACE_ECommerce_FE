import { PrescriptionManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý đơn thuốc | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý đơn thuốc và kê đơn' },
  ]
}

export default function PrescriptionsRoute() {
  return <PrescriptionManagementPage />
}
