import { OrderDetailPage } from '~/components/order'

export function meta({ params }: { params: { orderId: string } }) {
  return [{ title: `Đơn hàng #${params.orderId} | MEDISPACE` }, { name: 'description', content: 'Chi tiết đơn hàng' }]
}

export default function AccountOrderDetailRoute() {
  return <OrderDetailPage />
}
