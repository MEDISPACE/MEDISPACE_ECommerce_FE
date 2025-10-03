import CartPage from '~/components/cart/CartPage'

export function meta() {
  return [{ title: 'Giỏ hàng | MEDISPACE' }, { name: 'description', content: 'Xem và quản lý giỏ hàng của bạn' }]
}

export default function Cart() {
  return <CartPage />
}
