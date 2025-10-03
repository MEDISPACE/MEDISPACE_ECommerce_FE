import ForgotPasswordPage from '~/components/auth/ForgotPasswordPage'

export function meta() {
  return [
    { title: 'Quên mật khẩu | MEDISPACE' },
    { name: 'description', content: 'Đặt lại mật khẩu cho tài khoản MEDISPACE của bạn' },
  ]
}

export default function ForgotPassword() {
  return <ForgotPasswordPage />
}
