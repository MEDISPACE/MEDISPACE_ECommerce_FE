import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles } from 'lucide-react'
import { toast } from '~/utils/toast'
import { useAuth } from '~/contexts/AuthContext'
import LoadingSpinner from '~/components/ui/LoadingSpinner'
import GoogleLoginButton from './GoogleLoginButton'
import SuccessAnimation from '~/components/ui/SuccessAnimation'
import { validateLoginForm } from '~/utils/validation'
import '~/style/Login.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const validation = validateLoginForm(formData)

    if (!validation.isValid) {
      toast.auth.validationError(validation.firstError || 'Vui lòng kiểm tra thông tin')
      return
    }

    setIsLoading(true)

    try {
      // Show loading toast
      toast.loading('Đang đăng nhập...')

      // Attempt login with AuthContext (now uses real API)
      const loginSuccess = await login(formData.email, formData.password)

      if (loginSuccess) {
        // Dismiss loading toast
        toast.dismiss()

        // Success - Show success animation
        console.log('Login successful:', formData.email)
        setShowSuccess(true)

        // Success animation will handle redirect
      } else {
        throw new Error('Đăng nhập thất bại')
      }
    } catch (error: unknown) {
      console.error('Login failed:', error)
      toast.dismiss()

      // Handle specific error messages
      const errorMessage = (error as { message?: string })?.message || 'Đăng nhập thất bại'
      if (errorMessage.includes('Email or password is not correct')) {
        toast.error('Email hoặc mật khẩu không chính xác')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='login-container'>
      <div className='login-form-card'>
        {/* Logo with Sparkle Effect */}
        <div className='login-logo-container'>
          <div className='login-logo'>
            <Sparkles className='login-logo-icon' size={24} />
            MEDISPACE
          </div>
          <div className='login-logo-glow'></div>
        </div>
        <p className='login-subtitle'>Đăng nhập để tiếp tục mua sắm</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className='login-form' style={{ position: 'relative' }}>
          {isLoading && (
            <div className='form-loading-overlay'>
              <LoadingSpinner size='md' variant='pill' text='Đang đăng nhập...' />
            </div>
          )}
          {/* Email Input */}
          <div className='login-input-group'>
            <label htmlFor='email' className='login-label'>
              <Mail size={16} className='login-label-icon' />
              Email/Tên đăng nhập
            </label>
            <div className='login-input-wrapper'>
              <Mail size={18} className='login-input-icon' />
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                className='login-input'
                placeholder='Nhập email hoặc tên đăng nhập'
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className='login-input-group'>
            <label htmlFor='password' className='login-label'>
              <Lock size={16} className='login-label-icon' />
              Mật khẩu
            </label>
            <div className='login-input-wrapper'>
              <Lock size={18} className='login-input-icon' />
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                className='login-input login-password-input'
                placeholder='Nhập mật khẩu'
                required
              />
              <button type='button' className='login-password-toggle' onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className='login-remember-forgot'>
            <label className='login-remember'>
              <input
                type='checkbox'
                name='rememberMe'
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className='login-checkbox'
              />
              <span className='login-checkbox-custom'></span>
              Ghi nhớ đăng nhập
            </label>
            <Link to='/auth/forgot-password' className='login-forgot-link'>
              Quên mật khẩu?
            </Link>
          </div>

          {/* Login Button */}
          <button type='submit' className={`login-button ${isLoading ? 'loading-button' : ''}`} disabled={isLoading}>
            {isLoading ? (
              <LoadingSpinner size='sm' variant='pulse' />
            ) : (
              <>
                <LogIn size={18} className='login-button-icon' />
                Đăng nhập
              </>
            )}
            <div className='login-button-glow'></div>
          </button>
        </form>

        {/* Social Login Section */}
        <div className='social-login-section'>
          <div className='social-divider'>
            <span className='social-divider-text'>hoặc</span>
          </div>

          <GoogleLoginButton text='Đăng nhập với Google' onClick={() => console.log('Google login clicked')} />
        </div>

        {/* Register Link */}
        <div className='login-register-link'>
          Chưa có tài khoản?{' '}
          <Link to='/auth/register' className='login-register-cta'>
            Đăng ký ngay
          </Link>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation
        isVisible={showSuccess}
        title='Đăng nhập thành công!'
        subtitle='Chào mừng bạn đến với MEDISPACE'
        type='login'
        onComplete={() => {
          setShowSuccess(false)
          toast.auth.loginSuccess()
          navigate('/')
        }}
        duration={3000}
      />
    </div>
  )
}
