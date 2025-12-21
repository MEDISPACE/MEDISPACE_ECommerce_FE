import { OrderSuccessPage } from '~/components/order'

export function meta() {
  return [
    { title: 'Đặt hàng thành công | MEDISPACE' },
    { name: 'description', content: 'Xác nhận đơn hàng thành công' },
  ]
}

export default function OrderSuccessRoute() {
  return <OrderSuccessPage />
}
