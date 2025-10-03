import RegisterPage from '~/components/auth/RegisterPage'

export function meta() {
  return [
    { title: 'Đăng ký | MEDISPACE' },
    { name: 'description', content: 'Tạo tài khoản MEDISPACE để mua thuốc trực tuyến an toàn' },
  ]
}

export default function Register() {
  return <RegisterPage />
}
