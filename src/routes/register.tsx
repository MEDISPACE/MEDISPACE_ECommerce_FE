import { RegisterPage } from '~/components/auth/RegisterPage'
import { AuthLayout } from '~/components/layout/AuthLayout'

export function meta() {
  return [
    { title: 'Đăng ký | MEDISPACE' },
    { name: 'description', content: 'Tạo tài khoản MEDISPACE để mua thuốc trực tuyến an toàn' },
  ]
}

export default function Register() {
  return (
    <AuthLayout>
      <RegisterPage />
    </AuthLayout>
  )
}
