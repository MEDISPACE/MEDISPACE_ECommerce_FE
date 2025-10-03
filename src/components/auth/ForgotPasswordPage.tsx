import { useState } from 'react'
import { Link } from 'react-router'
import { Mail, ArrowLeft, Send, Sparkles, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '~/components/ui/LoadingSpinner'
import SuccessAnimation from '~/components/ui/SuccessAnimation'
import { validateForgotPasswordForm } from '~/utils/validation'
import '~/style/ForgotPassword.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const validation = validateForgotPasswordForm({ email })

    if (!validation.isValid) {
      toast.error(validation.firstError || 'Vui lòng kiểm tra thông tin')
      return
    }

    setIsLoading(true)

    try {
      // Show loading toast
      toast.loading('Đang gửi email khôi phục...', { id: 'forgot-password' })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Success - Show success animation first
      console.log('Reset password for:', email)
      setShowSuccess(true)

      // Handle password reset logic here
    } catch (error) {
      console.error('Password reset failed:', error)
      toast.error('Gửi email thất bại. Vui lòng thử lại!', { id: 'forgot-password' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log('Resending email to:', email)
      // Handle resend logic
    } catch (error) {
      console.error('Resend failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className='forgot-password-container'>
        <div className='forgot-password-form-card'>
          {/* Success State */}
          <div className='forgot-password-success'>
            <div className='forgot-password-success-icon'>
              <CheckCircle size={48} className='success-check' />
              <div className='success-glow'></div>
            </div>

            <div className='forgot-password-logo-container'>
              <div className='forgot-password-logo-glow'></div>
              <h1 className='forgot-password-logo'>
                <Sparkles size={28} className='forgot-password-logo-icon' />
                MEDISPACE
              </h1>
            </div>

            <h2 className='forgot-password-success-title'>Email đã được gửi!</h2>
            <p className='forgot-password-success-subtitle'>
              Chúng tôi đã gửi link đặt lại mật khẩu đến địa chỉ email <strong>{email}</strong>
            </p>

            <div className='forgot-password-success-instructions'>
              <p>Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.</p>
              <p className='forgot-password-note'>Không thấy email? Kiểm tra thư mục spam hoặc thư rác.</p>
            </div>

            <div className='forgot-password-success-actions'>
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className={`forgot-password-resend-btn ${isLoading ? 'loading-button' : ''}`}
              >
                {isLoading ? (
                  <LoadingSpinner size='sm' variant='pulse' />
                ) : (
                  <>
                    <Send size={16} />
                    Gửi lại email
                  </>
                )}
              </button>

              <Link to='/auth/login' className='forgot-password-back-link'>
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='forgot-password-container'>
      <div className='forgot-password-form-card'>
        {/* Back Button */}
        <Link to='/auth/login' className='forgot-password-back-button'>
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </Link>

        {/* Logo */}
        <div className='forgot-password-logo-container'>
          <div className='forgot-password-logo-glow'></div>
          <h1 className='forgot-password-logo'>
            <Sparkles size={28} className='forgot-password-logo-icon' />
            MEDISPACE
          </h1>
        </div>

        <h2 className='forgot-password-title'>Quên mật khẩu?</h2>
        <p className='forgot-password-subtitle'>
          Nhập địa chỉ email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu
        </p>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className='forgot-password-form' style={{ position: 'relative' }}>
          {isLoading && (
            <div className='form-loading-overlay'>
              <LoadingSpinner size='md' variant='pill' text='Đang gửi email...' />
            </div>
          )}

          {/* Email Input */}
          <div className='forgot-password-input-group'>
            <label htmlFor='email' className='forgot-password-label'>
              <Mail size={16} className='forgot-password-label-icon' />
              Email
            </label>
            <div className='forgot-password-input-wrapper'>
              <div className='forgot-password-input-icon'>
                <Mail size={18} />
              </div>
              <input
                type='email'
                id='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Nhập email của bạn'
                className='forgot-password-input'
                required
              />
            </div>
          </div>

          {/* Send Button */}
          <button
            type='submit'
            className={`forgot-password-button ${isLoading ? 'loading-button' : ''}`}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <LoadingSpinner size='sm' variant='pulse' />
            ) : (
              <>
                <Send size={18} className='forgot-password-button-icon' />
                Gửi link đặt lại mật khẩu
              </>
            )}
            <div className='forgot-password-button-glow'></div>
          </button>
        </form>

        {/* Login Link */}
        <div className='forgot-password-login-link'>
          Nhớ lại mật khẩu?{' '}
          <Link to='/auth/login' className='forgot-password-login-cta'>
            Đăng nhập
          </Link>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation
        isVisible={showSuccess}
        title='Email đã được gửi!'
        subtitle='Vui lòng kiểm tra hộp thư để đặt lại mật khẩu'
        type='forgot-password'
        onComplete={() => {
          setShowSuccess(false)
          setIsEmailSent(true)
          toast.success('Link đặt lại mật khẩu đã được gửi!')
        }}
        duration={3500}
      />
    </div>
  )
}
