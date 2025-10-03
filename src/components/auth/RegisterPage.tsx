import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { User, Phone, Mail, Lock, UserPlus, Sparkles, Users } from 'lucide-react'
import { toast } from '~/utils/toast'
import { useAuth } from '~/contexts/AuthContext'
import LoadingSpinner from '~/components/ui/LoadingSpinner'
import GoogleLoginButton from './GoogleLoginButton'
import SuccessAnimation from '~/components/ui/SuccessAnimation'
import { validateRegisterForm } from '~/utils/validation'
import { ValidatedInput } from '~/components/forms/ValidatedInput'
import { ValidatedRadioGroup } from '~/components/forms/ValidatedRadioGroup'
import type { RegisterRequest, ApiErrorResponse } from '~/types/user'
import '~/style/Register.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Validation errors state for real-time feedback
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Chỉ validate real-time nếu field đã được touch
    if (touchedFields[name]) {
      validateField(name, value)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
    validateField(name, formData[name as keyof typeof formData])
  }

  const validateField = (fieldName: string, value: string) => {
    let error = ''

    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          error = `${fieldName === 'firstName' ? 'Họ' : 'Tên'} là bắt buộc`
        } else if (value.length < 2) {
          error = `${fieldName === 'firstName' ? 'Họ' : 'Tên'} phải có ít nhất 2 ký tự`
        }
        break
      case 'email':
        if (!value.trim()) {
          error = 'Email là bắt buộc'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Email không đúng định dạng'
        }
        break
      case 'password':
        if (!value) {
          error = 'Mật khẩu là bắt buộc'
        } else if (value.length < 6) {
          error = 'Mật khẩu phải có ít nhất 6 ký tự'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
          error = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
        }
        break
      case 'confirmPassword':
        if (!value) {
          error = 'Xác nhận mật khẩu là bắt buộc'
        } else if (value !== formData.password) {
          error = 'Mật khẩu xác nhận không khớp'
        }
        break
      case 'phoneNumber':
        if (value && !/^[0-9]{10,11}$/.test(value.replace(/\s/g, ''))) {
          error = 'Số điện thoại không đúng định dạng'
        }
        break
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data - map phoneNumber to phone for validation function
    const validationData = { ...formData, phone: formData.phoneNumber }
    const validation = validateRegisterForm(validationData)

    if (!validation.isValid) {
      toast.auth.validationError(validation.firstError || 'Vui lòng kiểm tra thông tin')
      return
    }

    setIsLoading(true)

    try {
      // Show loading toast
      toast.loading('Đang tạo tài khoản...', { id: 'register' })

      // Prepare register data according to backend API
      const registerData: RegisterRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender === 'male' ? 0 : 1, // Convert to number as backend expects
      }

      // Call register API through AuthContext
      const registerSuccess = await register(registerData)

      if (registerSuccess) {
        toast.dismiss()
        console.log('Registration successful:', registerData.email)
        setShowSuccess(true)
        // Success animation will handle redirect
      } else {
        throw new Error('Đăng ký thất bại')
      }
    } catch (error: unknown) {
      console.error('Registration failed:', error)
      toast.dismiss()

      // Handle backend validation errors
      const apiError = error as ApiErrorResponse

      if (apiError.errors) {
        // Show first validation error as toast
        const firstError = Object.values(apiError.errors)[0]
        if (firstError.path === 'password') {
          toast.error('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
        } else if (firstError.path === 'email' && firstError.msg.includes('already exists')) {
          toast.error('Email đã được sử dụng. Vui lòng chọn email khác.')
        } else {
          toast.error(firstError.msg)
        }
      } else {
        // Generic error message
        const errorMessage = apiError.message || 'Đăng ký thất bại'
        if (errorMessage.includes('Email already exists')) {
          toast.error('Email đã được sử dụng. Vui lòng chọn email khác.')
        } else {
          toast.error(errorMessage)
        }
      }
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
        <form className='register-form' onSubmit={handleSubmit} noValidate>
          {isLoading && (
            <div className='form-loading-overlay'>
              <LoadingSpinner size='md' variant='activity' text='Đang tạo tài khoản...' />
            </div>
          )}
          {/* First Name & Last Name */}
          <div className='register-input-row'>
            <ValidatedInput
              label='Họ'
              name='firstName'
              type='text'
              value={formData.firstName}
              placeholder='Nhập họ'
              icon={<User size={16} className='register-label-icon' />}
              error={validationErrors.firstName}
              isTouched={touchedFields.firstName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
            />
            <ValidatedInput
              label='Tên'
              name='lastName'
              type='text'
              value={formData.lastName}
              placeholder='Nhập tên'
              icon={<User size={16} className='register-label-icon' />}
              error={validationErrors.lastName}
              isTouched={touchedFields.lastName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
            />
          </div>

          {/* Gender */}
          <ValidatedRadioGroup
            label='Giới tính'
            name='gender'
            value={formData.gender}
            options={[
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
            ]}
            icon={<Users size={16} className='register-label-icon' />}
            error={validationErrors.gender}
            isTouched={touchedFields.gender}
            onChange={handleInputChange}
            onBlur={handleBlur}
          />

          {/* Phone Number */}
          <ValidatedInput
            label='Số điện thoại'
            name='phoneNumber'
            type='tel'
            value={formData.phoneNumber}
            placeholder='Nhập số điện thoại'
            icon={<Phone size={16} className='register-label-icon' />}
            error={validationErrors.phoneNumber || validationErrors.phone}
            isTouched={touchedFields.phoneNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
          />

          {/* Email */}
          <ValidatedInput
            label='Email'
            name='email'
            type='email'
            value={formData.email}
            placeholder='Nhập địa chỉ email'
            icon={<Mail size={16} className='register-label-icon' />}
            error={validationErrors.email}
            isTouched={touchedFields.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
          />

          {/* Password */}
          <ValidatedInput
            label='Mật khẩu'
            name='password'
            type='password'
            value={formData.password}
            placeholder='Nhập mật khẩu'
            icon={<Lock size={16} className='register-label-icon' />}
            error={validationErrors.password}
            isTouched={touchedFields.password}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            minLength={6}
          />

          {/* Confirm Password */}
          <ValidatedInput
            label='Xác nhận mật khẩu'
            name='confirmPassword'
            type='password'
            value={formData.confirmPassword}
            placeholder='Nhập lại mật khẩu'
            icon={<Lock size={16} className='register-label-icon' />}
            error={validationErrors.confirmPassword}
            isTouched={touchedFields.confirmPassword}
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            minLength={6}
          />

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
