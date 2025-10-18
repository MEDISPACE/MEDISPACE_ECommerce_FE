import { useParams } from 'react-router'
import { AuthLayout } from '~/components/layout/AuthLayout'

export function meta() {
  return [
    { title: 'Đặt lại mật khẩu | MEDISPACE' },
    { name: 'description', content: 'Đặt lại mật khẩu mới cho tài khoản' },
  ]
}

export default function ResetPassword() {
  const { token } = useParams()

  return (
    <AuthLayout>
      <div className='bg-white p-8 rounded-lg shadow-lg w-full max-w-md'>
        <h1 className='text-2xl font-bold text-center mb-6'>Đặt lại mật khẩu</h1>

        <div className='text-center py-8'>
          <p className='text-gray-500'>Tính năng đặt lại mật khẩu đang được phát triển...</p>
          <p className='text-sm text-gray-400 mt-2'>Token: {token}</p>
        </div>
      </div>
    </AuthLayout>
  )
}
