import { MyCouponsPage } from '~/components/account'

export function meta() {
  return [
    { title: 'Ưu đãi của tôi | MEDISPACE' },
    { name: 'description', content: 'Danh sách mã giảm giá dành cho tài khoản của bạn' },
  ]
}

export default function AccountCouponsRoute() {
  return <MyCouponsPage />
}
