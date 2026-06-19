import { useState, useMemo } from 'react'
import { PageTransition } from '../shared/PageTransition'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, AlertCircle, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRoleNavigation } from '../../hooks'

const getGoogleAuthUrl = () => {
  const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI } = import.meta.env
  const url = 'https://accounts.google.com/o/oauth2/v2/auth'
  const query = {
    client_id: VITE_GOOGLE_CLIENT_ID,
    redirect_uri: VITE_GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(
      ' ',
    ),
    prompt: 'consent',
    access_type: 'offline', // ✅ Sửa typo: acccess_type -> access_type
  }
  const queryString = new URLSearchParams(query).toString()
  return `${url}?${queryString}`
}

export function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigateByRole = useRoleNavigation()

  // Memoize Google OAuth URL để tránh tính lại mỗi render
  const googleOAuthUrl = useMemo(() => getGoogleAuthUrl(), [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đăng nhập', {
        description: 'Có một số trường chưa được điền đúng',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)

    try {
      const loggedInUser = await login(formData.email, formData.password, formData.rememberMe)

      if (loggedInUser) {
        toast.success('Đăng nhập thành công!', {
          description: 'Chào mừng bạn quay trở lại MEDISPACE',
          duration: 2000,
        })

        // Navigate based on the returned user's role. Using the returned
        // user avoids any race where context.user hasn't updated yet.
        navigateByRole(loggedInUser.role)
      } else {
        throw new Error('Email hoặc mật khẩu không đúng')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setErrors({
        general: errorMessage,
      })
      toast.error('Đăng nhập thất bại', {
        description: errorMessage,
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        className='text-center mb-10'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className='text-[#1E40AF] mb-2 text-center relative inline-block text-2xl md:text-2xl font-semibold'>
          Đăng nhập để tiếp tục mua sắm
          <Sparkles className='inline-block ml-2 w-5 h-5 text-[#1E40AF] animate-pulse' />
        </h1>
        <p className='text-gray-500 text-base md:text-lg mt-2'>Chào mừng bạn quay trở lại!</p>
      </motion.div>

      {/* Error Alert */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Alert className='mb-6 border-red-200 bg-red-50 shadow-md'>
            <AlertCircle className='h-4 w-4 text-red-500' />
            <AlertDescription className='text-red-700'>{errors.general}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Email */}
        <motion.div
          className='space-y-2.5'
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Label htmlFor='email' className='text-[#1E40AF] uppercase text-xs tracking-wide flex items-center gap-2'>
            <Mail className='w-4 h-4' />
            EMAIL
          </Label>
          <div className='relative group'>
            <Mail
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'
              }`}
            />
            <Input
              id='email'
              type='text'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-[#BFDBFE] focus:border-[#1E40AF] focus:ring-4 focus:ring-blue-100 hover:border-[#BFDBFE]'
              }`}
              placeholder='Nhập email hoặc tên đăng nhập'
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <motion.p
              className='text-red-500 text-sm flex items-center gap-1'
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className='w-3 h-3' />
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div
          className='space-y-2.5'
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Label htmlFor='password' className='text-[#1E40AF] uppercase text-xs tracking-wide flex items-center gap-2'>
            <Lock className='w-4 h-4' />
            MẬT KHẨU
          </Label>
          <div className='relative group'>
            <Lock
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'
              }`}
            />
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`pl-12 pr-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-[#BFDBFE] focus:border-[#1E40AF] focus:ring-4 focus:ring-blue-100 hover:border-[#BFDBFE]'
              }`}
              placeholder='Nhập mật khẩu'
              disabled={isLoading}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E40AF] transition-all duration-200 hover:scale-110'
            >
              {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              className='text-red-500 text-sm flex items-center gap-1'
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className='w-3 h-3' />
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        {/* Remember Me & Forgot Password */}
        <motion.div
          className='flex items-center justify-between'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className='flex items-center gap-2.5'>
            <Checkbox
              id='rememberMe'
              checked={formData.rememberMe}
              onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
              className='border-2 border-[#BFDBFE] data-[state=checked]:bg-[#0A2463] data-[state=checked]:border-[#1E40AF] transition-all duration-200'
            />
            <Label
              htmlFor='rememberMe'
              className='text-sm text-gray-700 cursor-pointer hover:text-[#1E40AF] transition-colors'
            >
              Ghi nhớ đăng nhập
            </Label>
          </div>
          <Link
            to='/forgot-password'
            className='text-sm text-blue-500 hover:text-[#1E40AF] transition-all duration-200 relative group'
          >
            <span>Quên mật khẩu?</span>
            <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-[#0A2463] group-hover:w-full transition-all duration-300' />
          </Link>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            type='submit'
            className='w-full bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] hover:from-[#071A49] hover:via-[#0A2463] hover:to-[#1E40AF] text-white h-14 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 mt-8 uppercase tracking-wide relative overflow-hidden group'
            disabled={isLoading}
          >
            {/* Shimmer effect */}
            <span className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />

            {isLoading ? (
              <div className='flex items-center gap-2 relative z-10'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Đang đăng nhập...
              </div>
            ) : (
              <div className='flex items-center gap-2 relative z-10'>
                <LogIn size={18} />
                Đăng nhập
              </div>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        className='relative my-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-gray-300' />
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-4 bg-white text-gray-600 uppercase tracking-wider text-xs border-none'>hoặc</span>
        </div>
      </motion.div>

      {/* Google Login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Button
          type='button'
          variant='outline'
          className='w-full h-14 bg-white border-2 border-gray-400 hover:bg-gray-50 hover:border-[#1E40AF] hover:shadow-md rounded-xl transition-all duration-200 group'
          onClick={() => {
            window.location.href = googleOAuthUrl
          }}
          disabled={isLoading}
        >
          <svg className='w-5 h-5 mr-3 transition-transform group-hover:scale-110 duration-200' viewBox='0 0 24 24'>
            <path
              fill='#4285F4'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='#34A853'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='#FBBC05'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
            />
            <path
              fill='#EA4335'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            />
          </svg>
          <span className='text-gray-700'>Đăng nhập với Google</span>
        </Button>
      </motion.div>

      {/* Register Link */}
      <motion.div
        className='text-center mt-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <span className='text-gray-600'>Chưa có tài khoản? </span>
        <Link
          to='/register'
          className='text-blue-500 hover:text-[#1E40AF] transition-all duration-200 relative group inline-block'
        >
          <span>Đăng ký ngay</span>
          <span className='absolute bottom-0 left-0 w-full h-0.5 bg-[#0A2463] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left' />
        </Link>
      </motion.div>
    </PageTransition>
  )
}
