import AccountLayout from '~/components/account/AccountLayout'

export function meta() {
  return [
    { title: 'Tài khoản | MEDISPACE' },
    { name: 'description', content: 'Quản lý thông tin tài khoản và đơn hàng' },
  ]
}

export default function AccountLayoutRoute() {
  return <AccountLayout />
}
