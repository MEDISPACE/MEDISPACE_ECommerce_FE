import { PaymentMethodsPage } from '~/components/account'

export function meta() {
  return [
    { title: 'Phương thức thanh toán | MEDISPACE' },
    { name: 'description', content: 'Quản lý thẻ và phương thức thanh toán' },
  ]
}

export default function PaymentMethodsRoute() {
  return <PaymentMethodsPage />
}
