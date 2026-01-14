import { PrescriptionsPage } from '~/components/account/PrescriptionsPage'

export function meta() {
  return [{ title: 'Đơn thuốc của tôi | MEDISPACE' }, { name: 'description', content: 'Quản lý và theo dõi đơn thuốc của bạn' }]
}

export default function AccountPrescriptions() {
  return <PrescriptionsPage />
}
