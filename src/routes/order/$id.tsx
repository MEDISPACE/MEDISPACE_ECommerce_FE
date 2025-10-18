import { OrderDetailPage } from '~/components/order'

export function meta({ params }: { params: { id: string } }) {
  return [
    { title: `Chi tiết đơn hàng ${params.id} | MEDISPACE` },
    { name: 'description', content: `Thông tin chi tiết đơn hàng ${params.id}` },
  ]
}

export default function OrderDetailRoute() {
  return <OrderDetailPage />
}
