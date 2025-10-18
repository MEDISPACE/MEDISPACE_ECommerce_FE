import { Outlet } from 'react-router'
import { AccountLayout } from '~/components/layout/AccountLayout'

export function meta() {
  return [
    { title: 'Tài khoản | MEDISPACE' },
    { name: 'description', content: 'Quản lý thông tin tài khoản và đơn hàng' },
  ]
}

export default function AccountLayoutRoute() {
  return (
    <AccountLayout>
      <Outlet />
    </AccountLayout>
  )
}
