import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { PasswordInput } from '../forms/PasswordInput'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Clock, Shield, Sparkles } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'

type Step = 'email' | 'sent' | 'reset' | 'success'

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [currentStep, setCurrentStep] = useState<Step>(token ? 'reset' : 'email')
  const [email, setEmail] = useState('')
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Step 1: Email input
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setErrors({ email: 'Vui lòng nhập email' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Email không hợp lệ' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate successful email send
      setCurrentStep('sent')
      setCountdown(60)

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setErrors({ general: 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Resend email
  const handleResendEmail = () => {
    if (countdown > 0) return

    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Step 3: Reset password
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!passwords.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu mới'
    } else if (passwords.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    }

    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (passwords.password !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setCurrentStep('success')
    } catch {
      setErrors({ general: 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <div className='text-center mb-8'>
              <div className='relative mb-6'>
                <div className='w-20 h-20 bg-white/80 backdrop-blur-lg border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                  <Mail className='w-10 h-10 text-blue-600' />
                </div>
                <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse'></div>
              </div>
              <h2 className='text-3xl font-bold mb-3 text-blue-800'>Quên mật khẩu?</h2>
              <p className='text-gray-600 text-lg leading-relaxed'>
                Không sao cả! Nhập email của bạn và chúng tôi sẽ gửi
                <br />
                link đặt lại mật khẩu ngay lập tức.
              </p>
            </div>

            {errors.general && (
              <Alert className='mb-6 border-red-200 bg-red-50'>
                <AlertCircle className='h-4 w-4 text-red-500' />
                <AlertDescription className='text-red-700'>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailSubmit} className='space-y-6'>
              <div className='space-y-3'>
                <Label htmlFor='email' className='text-gray-700 font-medium text-sm'>
                  Email đăng ký
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Nhập email của bạn'
                    className={`pl-12 pr-4 h-14 border-2 transition-all duration-200 ${errors.email ? 'border-red-300 focus:border-red-500 bg-red-50/20' : 'border-blue-200 focus:border-blue-500 bg-white/80'} backdrop-blur-lg rounded-xl shadow-sm hover:shadow-md focus:shadow-lg font-medium`}
                  />
                </div>
                {errors.email && (
                  <div className='flex items-center gap-2 text-red-500 text-sm'>
                    <AlertCircle className='w-4 h-4' />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-900 h-14 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-xl border-0'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='flex items-center gap-3'>
                    <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    <span>Đang gửi link khôi phục...</span>
                  </div>
                ) : (
                  <div className='flex items-center gap-3'>
                    <Mail className='w-5 h-5' />
                    <span>Gửi link khôi phục mật khẩu</span>
                  </div>
                )}
              </Button>
            </form>

            <div className='mt-8 text-center'>
              <Link
                to='/login'
                className='inline-flex items-center font-medium text-blue-600 hover:text-blue-700 transition-all'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )

      case 'sent':
        return (
          <div className='text-center'>
            <div className='relative mb-8'>
              <div className='w-24 h-24 bg-white/80 backdrop-blur-lg border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                <CheckCircle className='w-12 h-12 text-blue-600' />
              </div>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse'></div>
            </div>

            <h2 className='text-3xl font-bold mb-3 text-blue-800'>Email đã được gửi!</h2>

            <p className='text-gray-600 mb-8 text-lg leading-relaxed'>
              Chúng tôi đã gửi link đặt lại mật khẩu đến email
              <br />
              <strong className='text-blue-700'>{email}</strong>
            </p>

            <div className='bg-white/80 backdrop-blur-lg border border-blue-100 rounded-2xl p-6 mb-8 shadow-lg'>
              <div className='flex items-center justify-center gap-2 mb-3'>
                <Shield className='w-5 h-5 text-blue-600' />
                <span className='font-semibold text-blue-800'>Lưu ý bảo mật</span>
              </div>
              <div className='space-y-2 text-sm text-blue-700'>
                <p>• Kiểm tra thư mục spam nếu không thấy email</p>
                <p>• Link sẽ hết hạn sau 15 phút</p>
                <p>• Không chia sẻ link với người khác</p>
              </div>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={countdown > 0}
              variant='outline'
              className='w-full mb-6 h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 font-medium backdrop-blur-sm'
            >
              {countdown > 0 ? (
                <div className='flex items-center gap-2'>
                  <Clock className='w-5 h-5 text-gray-500' />
                  Gửi lại sau {countdown}s
                </div>
              ) : (
                <>
                  <Mail className='w-5 h-5 mr-2' />
                  Gửi lại email
                </>
              )}
            </Button>

            <Link
              to='/login'
              className='inline-flex items-center font-medium text-blue-600 hover:text-blue-700 transition-all'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại đăng nhập
            </Link>
          </div>
        )

      case 'reset':
        return (
          <>
            <div className='text-center mb-8'>
              <div className='relative mb-6'>
                <div className='w-20 h-20 bg-white/80 backdrop-blur-lg border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                  <Shield className='w-10 h-10 text-blue-600' />
                </div>
                <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse'></div>
              </div>
              <h2 className='text-3xl font-bold mb-3 text-blue-800'>Đặt lại mật khẩu</h2>
              <p className='text-gray-600 text-lg'>Tạo mật khẩu mới mạnh mẽ để bảo vệ tài khoản của bạn</p>
            </div>

            {errors.general && (
              <Alert className='mb-6 border-red-200 bg-red-50'>
                <AlertCircle className='h-4 w-4 text-red-500' />
                <AlertDescription className='text-red-700'>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordReset} className='space-y-6'>
              <div className='space-y-2'>
                <Label className='text-gray-700 font-medium'>Mật khẩu mới</Label>
                <PasswordInput
                  value={passwords.password}
                  onChange={(password) => setPasswords({ ...passwords, password })}
                  placeholder='Nhập mật khẩu mới'
                  error={errors.password}
                  showStrength={true}
                  className='bg-blue-50/50 focus:bg-white backdrop-blur-sm border-blue-200 focus:border-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-gray-700 font-medium'>Xác nhận mật khẩu</Label>
                <PasswordInput
                  value={passwords.confirmPassword}
                  onChange={(confirmPassword) => setPasswords({ ...passwords, confirmPassword })}
                  placeholder='Nhập lại mật khẩu mới'
                  error={errors.confirmPassword}
                  className='bg-blue-50/50 focus:bg-white backdrop-blur-sm border-blue-200 focus:border-blue-500'
                />
              </div>

              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Đang cập nhật...
                  </div>
                ) : (
                  <>
                    <Shield className='w-5 h-5 mr-2' />
                    Đặt lại mật khẩu
                  </>
                )}
              </Button>
            </form>
          </>
        )

      case 'success':
        return (
          <div className='text-center'>
            <div className='relative mb-8'>
              <div className='w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl'>
                <CheckCircle className='w-12 h-12 text-white' />
              </div>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-xl opacity-30 animate-pulse'></div>
            </div>

            <h2 className='text-3xl font-bold mb-4 text-blue-800'>Hoàn tất!</h2>

            <p className='text-gray-600 mb-8 text-lg leading-relaxed'>
              Mật khẩu của bạn đã được đặt lại thành công.
              <br />
              Bây giờ bạn có thể đăng nhập với mật khẩu mới.
            </p>

            <div className='bg-white/80 backdrop-blur-lg border border-blue-100 rounded-2xl p-6 mb-8 shadow-lg'>
              <div className='flex items-center justify-center gap-2 mb-3'>
                <Sparkles className='w-5 h-5 text-blue-600' />
                <span className='font-semibold text-blue-800'>Mẹo bảo mật</span>
              </div>
              <p className='text-sm text-blue-700'>Hãy ghi nhớ mật khẩu mới và không chia sẻ với bất kỳ ai!</p>
            </div>

            <Button
              onClick={() => navigate('/login')}
              className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
            >
              <ArrowLeft className='w-5 h-5 mr-2' />
              Đăng nhập ngay
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className='p-8'>{renderStep()}</div>
  )
}
