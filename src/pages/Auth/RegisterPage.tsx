import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, User, Phone, Mail, Lock, UserPlus, Sparkles, Users } from 'lucide-react'
import { toast } from '~/utils/toast'
import LoadingSpinner from '~/components/ui/LoadingSpinner'
import GoogleLoginButton from './GoogleLoginButton'
import SuccessAnimation from '~/components/ui/SuccessAnimation'
import { validateRegisterForm } from '~/utils/validation'
import '~/style/Register.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const validation = validateRegisterForm(formData)

    if (!validation.isValid) {
      toast.auth.validationError(validation.firstError || 'Vui lòng kiểm tra thông tin')
      return
    }

    setIsLoading(true)

    try {
      // Show loading toast
      toast.loading('Đang tạo tài khoản...', { id: 'register' })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Success - Show success animation
      console.log('Register data:', formData)
      setShowSuccess(true)

      // Handle registration logic here
      // Success animation will handle redirect
    } catch (error) {
      console.error('Registration failed:', error)
      toast.error('Đăng ký thất bại. Vui lòng thử lại!', { id: 'register' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='register-container'>
      <div className='register-form-card'>
        {/* Logo with Sparkle Effect */}
        <div className='register-logo-container'>
          <div className='register-logo'>
            <Sparkles className='register-logo-icon' size={24} />
            MEDISPACE
          </div>
          <div className='register-logo-glow'></div>
        </div>
        <p className='register-subtitle'>Trở thành thành viên để mua sắm dễ dàng hơn</p>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className='register-form' style={{ position: 'relative' }}>
          {isLoading && (
            <div className='form-loading-overlay'>
              <LoadingSpinner size='md' variant='activity' text='Đang tạo tài khoản...' />
            </div>
          )}
          {/* First Name & Last Name */}
          <div className='register-input-row'>
            <div className='register-input-group'>
              <label htmlFor='firstName' className='register-label'>
                <User size={16} className='register-label-icon' />
                Họ
              </label>
              <div className='register-input-wrapper'>
                <User size={18} className='register-input-icon' />
                <input
                  type='text'
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className='register-input'
                  placeholder='Nhập họ'
                  required
                />
              </div>
            </div>
            <div className='register-input-group'>
              <label htmlFor='lastName' className='register-label'>
                <User size={16} className='register-label-icon' />
                Tên
              </label>
              <div className='register-input-wrapper'>
                <User size={18} className='register-input-icon' />
                <input
                  type='text'
                  id='lastName'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className='register-input'
                  placeholder='Nhập tên'
                  required
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className='register-input-group'>
            <label className='register-label'>
              <Users size={16} className='register-label-icon' />
              Giới tính
            </label>
            <div className='register-gender-group'>
              <label className='register-gender-option'>
                <input
                  type='radio'
                  name='gender'
                  value='male'
                  checked={formData.gender === 'male'}
                  onChange={handleInputChange}
                  className='register-gender-radio'
                />
                <span className='register-gender-custom'></span>
                <span className='register-gender-text'>Nam</span>
              </label>

              <label className='register-gender-option'>
                <input
                  type='radio'
                  name='gender'
                  value='female'
                  checked={formData.gender === 'female'}
                  onChange={handleInputChange}
                  className='register-gender-radio'
                />
                <span className='register-gender-custom'></span>
                <span className='register-gender-text'>Nữ</span>
              </label>
            </div>
          </div>

          {/* Phone Number */}
          <div className='register-input-group'>
            <label htmlFor='phone' className='register-label'>
              <Phone size={16} className='register-label-icon' />
              Số điện thoại
            </label>
            <div className='register-input-wrapper'>
              <Phone size={18} className='register-input-icon' />
              <input
                type='tel'
                id='phone'
                name='phone'
                value={formData.phone}
                onChange={handleInputChange}
                className='register-input'
                placeholder='Nhập số điện thoại'
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className='register-input-group'>
            <label htmlFor='email' className='register-label'>
              <Mail size={16} className='register-label-icon' />
              Email
            </label>
            <div className='register-input-wrapper'>
              <Mail size={18} className='register-input-icon' />
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                className='register-input'
                placeholder='Nhập địa chỉ email'
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className='register-input-group'>
            <label htmlFor='password' className='register-label'>
              <Lock size={16} className='register-label-icon' />
              Mật khẩu
            </label>
            <div className='register-input-wrapper'>
              <Lock size={18} className='register-input-icon' />
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                className='register-input register-password-input'
                placeholder='Nhập mật khẩu'
                required
                minLength={6}
              />
              <button type='button' className='register-password-toggle' onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className='register-input-group'>
            <label htmlFor='confirmPassword' className='register-label'>
              <Lock size={16} className='register-label-icon' />
              Xác nhận mật khẩu
            </label>
            <div className='register-input-wrapper'>
              <Lock size={18} className='register-input-icon' />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id='confirmPassword'
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className='register-input register-password-input'
                placeholder='Nhập lại mật khẩu'
                required
                minLength={6}
              />
              <button
                type='button'
                className='register-password-toggle'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button type='submit' className={`register-button ${isLoading ? 'loading-button' : ''}`} disabled={isLoading}>
            {isLoading ? (
              <LoadingSpinner size='sm' variant='pulse' />
            ) : (
              <>
                <UserPlus size={18} className='register-button-icon' />
                Đăng ký
              </>
            )}
            <div className='register-button-glow'></div>
          </button>
        </form>

        {/* Social Login Section */}
        <div className='social-login-section'>
          <div className='social-divider'>
            <span className='social-divider-text'>hoặc</span>
          </div>

          <GoogleLoginButton text='Đăng ký với Google' onClick={() => console.log('Google signup clicked')} />
        </div>

        {/* Login Link */}
        <div className='register-login-link'>
          Đã có tài khoản?{' '}
          <Link to='/auth/login' className='register-login-cta'>
            Đăng nhập ngay
          </Link>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation
        isVisible={showSuccess}
        title='Đăng ký thành công!'
        subtitle='Vui lòng kiểm tra email để xác thực tài khoản'
        type='register'
        onComplete={() => {
          setShowSuccess(false)
          toast.auth.registerSuccess()
          navigate('/auth/login')
        }}
        duration={4000}
      />
    </div>
  )
}
