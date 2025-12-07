import { OrderManagementPage } from '~/components/pharmacist'

export function meta() {
  return [
    { title: 'Quản lý đơn hàng | Dược sĩ | MEDISPACE' },
    { name: 'description', content: 'Quản lý và xử lý đơn hàng - MEDISPACE Pharmacist' },
  ]
}

export default function PharmacistOrdersRoute() {
  return <OrderManagementPage />
}
