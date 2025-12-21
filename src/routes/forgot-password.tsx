import { ForgotPasswordPage } from '~/components/auth/ForgotPasswordPage'
import { AuthLayout } from '~/components/layout/AuthLayout'

export function meta() {
  return [
    { title: 'Quên mật khẩu | MEDISPACE' },
    { name: 'description', content: 'Đặt lại mật khẩu cho tài khoản MEDISPACE của bạn' },
  ]
}

export default function ForgotPassword() {
  return (
    <AuthLayout>
      <ForgotPasswordPage />
    </AuthLayout>
  )
}
