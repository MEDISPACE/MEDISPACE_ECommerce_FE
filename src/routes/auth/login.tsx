import LoginPage from '~/components/auth/LoginPage'

export function meta() {
  return [
    { title: 'Đăng nhập | MEDISPACE' },
    { name: 'description', content: 'Đăng nhập vào tài khoản MEDISPACE để mua thuốc trực tuyến' },
  ]
}

export default function Login() {
  return <LoginPage />
}
