import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { toast } from 'sonner'
import { useRoleNavigation } from '../hooks'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated } = useAuth()
  const navigateByRole = useRoleNavigation()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const accessToken = searchParams.get('accessToken')

      if (!accessToken) {
        toast.error('Đăng nhập thất bại', {
          description: 'Không nhận được mã xác thực từ Google',
          duration: 4000,
        })
        navigate('/login')
        return
      }

      try {
        // Save access token
        authService.saveTokens(accessToken)

        // Fetch user profile
        const userProfile = await authService.getMe()

        if (!userProfile) {
          throw new Error('User profile is undefined')
        }

        // Update auth context
        setUser(userProfile)
        setIsAuthenticated(true)

        // Save user data to localStorage
        localStorage.setItem('medispace_user_data', JSON.stringify(userProfile))

        toast.success('Đăng nhập thành công!', {
          description: 'Chào mừng bạn đến với MEDISPACE',
          duration: 2000,
        })

        // Navigate based on user role
        navigateByRole(userProfile.role)
      } catch {
        toast.error('Đăng nhập thất bại', {
          description: 'Không thể lấy thông tin người dùng',
          duration: 4000,
        })
        authService.clearTokens()
        navigate('/login')
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, setUser, setIsAuthenticated, navigateByRole])

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F8FAFB] to-[#F0F6FF]'>
      <div className='text-center'>
        <div className='inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#1E40AF] border-r-transparent'></div>
        <p className='mt-4 text-lg font-medium text-gray-700'>Đang xử lý đăng nhập...</p>
      </div>
    </div>
  )
}
