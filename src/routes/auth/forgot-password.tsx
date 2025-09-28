import ForgotPasswordPage from '../../pages/Auth/ForgotPasswordPage'

export function meta() {
  return [
    { title: 'Quên mật khẩu | MEDISPACE' },
    { name: 'description', content: 'Khôi phục mật khẩu tài khoản MEDISPACE của bạn' },
  ]
}

export default function ForgotPassword() {
  return <ForgotPasswordPage />
}
