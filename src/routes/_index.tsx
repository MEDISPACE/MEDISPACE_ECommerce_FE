import { Navigate } from 'react-router'
import { HomePage } from '~/components/home/HomePage'
import { useAuth } from '~/contexts/AuthContext'
import { UserRole } from '~/types/user'

export function meta() {
  return [
    { title: 'MEDISPACE - Nhà thuốc trực tuyến #1 Việt Nam' },
    {
      name: 'description',
      content: 'Mua thuốc trực tuyến an toàn, tiện lợi. Giao hàng nhanh, tư vấn miễn phí từ dược sĩ chuyên nghiệp.',
    },
  ]
}

export default function Index() {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-blue-600'>Đang tải...</p>
        </div>
      </div>
    )
  }

  // Redirect authenticated users based on their role
  if (isAuthenticated && user) {
    // Admin users go to admin dashboard
    if (user.role === UserRole.Admin) {
      return <Navigate to='/admin/dashboard' replace />
    }

    // Pharmacist users go to pharmacist dashboard
    if (user.role === UserRole.Pharmacist) {
      // return <Navigate to='/pharmacist/dashboard' replace />
      return <Navigate to='/pharmacist' replace />
    }

    // Customer users (UserRole.Customer) see the normal homepage
    // Fall through to return <HomePage />
  }

  // Unauthenticated users and customers see the normal homepage
  return <HomePage />
}
