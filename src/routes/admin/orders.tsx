import { OrderManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý đơn hàng | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý đơn hàng và giao hàng' },
  ]
}

export default function OrdersRoute() {
  return <OrderManagementPage />
}
