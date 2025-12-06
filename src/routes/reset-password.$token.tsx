import { AuthLayout } from '~/components/layout/AuthLayout'
import { ResetPasswordPage } from '~/components/auth/ResetPasswordPage'

export function meta() {
  return [
    { title: 'Đặt lại mật khẩu | MEDISPACE' },
    { name: 'description', content: 'Đặt lại mật khẩu mới cho tài khoản' },
  ]
}

export default function ResetPassword() {
  return (
    <AuthLayout>
      <ResetPasswordPage />
    </AuthLayout>
  )
}
