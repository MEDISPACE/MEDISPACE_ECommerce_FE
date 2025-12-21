import { CheckoutPage } from '../../components/cart/CheckoutPage'

export function meta() {
  return [
    { title: 'Thanh toán | MEDISPACE' },
    { name: 'description', content: 'Thanh toán đơn hàng an toàn và tiện lợi' },
  ]
}

export default function CartCheckout() {
  return <CheckoutPage />
}
