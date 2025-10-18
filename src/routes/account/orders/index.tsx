import { OrdersPage } from '~/components/order'

export function meta() {
  return [{ title: 'Đơn hàng của tôi | MEDISPACE' }, { name: 'description', content: 'Xem lịch sử đơn hàng' }]
}

export default function AccountOrdersRoute() {
  return <OrdersPage />
}
