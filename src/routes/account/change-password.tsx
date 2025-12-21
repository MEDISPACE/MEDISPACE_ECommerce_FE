import { ChangePasswordPage } from '~/components/account'

export function meta() {
  return [{ title: 'Đổi mật khẩu | MEDISPACE' }, { name: 'description', content: 'Thay đổi mật khẩu tài khoản' }]
}

export default function ChangePasswordRoute() {
  return <ChangePasswordPage />
}
