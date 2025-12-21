import { OrderFailurePage } from '~/components/order'

export function meta() {
  return [{ title: 'Đặt hàng thất bại | MEDISPACE' }, { name: 'description', content: 'Đơn hàng không thành công' }]
}

export default function OrderFailureRoute() {
  return <OrderFailurePage />
}
