import { CreateOrderPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Tạo đơn hàng | MEDISPACE Admin' },
    { name: 'description', content: 'Tạo đơn hàng mới cho khách hàng' },
  ]
}

export default function AdminCreateOrderRoute() {
  return <CreateOrderPage />
}
