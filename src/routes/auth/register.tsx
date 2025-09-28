import RegisterPage from '../../pages/Auth/RegisterPage'

export function meta() {
  return [
    { title: 'Đăng ký | MEDISPACE' },
    { name: 'description', content: 'Tạo tài khoản MEDISPACE để trải nghiệm dịch vụ mua thuốc trực tuyến' },
  ]
}

export default function Register() {
  return <RegisterPage />
}
