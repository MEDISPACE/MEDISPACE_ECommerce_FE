import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Mail, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { authService } from '../../services/authService'
import { PageTransition } from '../shared/PageTransition'
import { getErrorMessage } from '../../constants/errorMapping'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'input' | 'sent'>('input')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!email) {
      setErrors({ email: 'Vui lòng nhập email của bạn' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Email không hợp lệ' })
      return
    }

    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setCurrentStep('sent')
      setCountdown(60) // 60s cooldown for resend
    } catch (error: any) {
      // Handle specific errors
      if (
        error.message === 'Email not found' ||
        error.errors?.email?.msg === 'Email not found' ||
        error.message?.includes('not found')
      ) {
        setErrors({ email: getErrorMessage('Email not found') })
      } else if (error.errors?.email) {
        // Handle other validation errors for email
        setErrors({ email: getErrorMessage(error.errors.email.msg) || 'Email không hợp lệ' })
      } else {
        setErrors({ general: getErrorMessage(error.message) || 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return

    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setCountdown(60)
    } catch (error: any) {
      setErrors({ general: getErrorMessage(error.message) || 'Gửi lại email thất bại. Vui lòng thử lại.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStep === 'sent') {
    return (
      <PageTransition>
        <div className='p-8 text-center'>
          <div className='relative mb-8'>
            <div className='w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl'>
              <Mail className='w-12 h-12 text-white' />
            </div>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-xl opacity-30 animate-pulse'></div>
          </div>

          <h2 className='text-3xl font-bold mb-4 text-blue-800'>Kiểm tra email của bạn</h2>

          <p className='text-gray-600 mb-8 text-lg leading-relaxed'>
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến
            <br />
            <span className='font-semibold text-blue-600'>{email}</span>
          </p>

          <div className='space-y-4'>
            <Button
              onClick={() => window.open('https://gmail.com', '_blank')}
              className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-white'
            >
              Mở Gmail
              <ArrowRight className='w-5 h-5 ml-2' />
            </Button>

            <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
              <span>Không nhận được email?</span>
              <button
                onClick={handleResend}
                disabled={countdown > 0 || isLoading}
                className='text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại'}
              </button>
            </div>

            <Link
              to='/login'
              className='inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mt-4'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className='p-8'>
        <div className='text-center mb-8'>
          <div className='relative mb-6'>
            <div className='w-20 h-20 bg-white/80 backdrop-blur-lg border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Mail className='w-10 h-10 text-blue-600' />
            </div>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse'></div>
          </div>
          <h2 className='text-3xl font-bold mb-3 text-blue-800'>Quên mật khẩu?</h2>
          <p className='text-gray-600 text-lg'>
            Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục.
          </p>
        </div>

        {errors.general && (
          <Alert className='mb-6 border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-500' />
            <AlertDescription className='text-red-700'>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleEmailSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label className='text-gray-700 font-medium'>Email</Label>
            <Input
              type='email'
              placeholder='Email của bạn'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 text-base px-4 bg-blue-50/50 focus:bg-white backdrop-blur-sm border-blue-200 focus:border-blue-500 transition-all duration-300 ${errors.email ? 'border-red-500 focus:border-red-500' : ''
                }`}
            />
            {errors.email && (
              <div className='flex items-center gap-2 text-red-500 text-sm animate-in slide-in-from-left-1'>
                <AlertCircle className='w-4 h-4' />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <Button
            type='submit'
            className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-white'
            disabled={isLoading}
          >
            {isLoading ? (
              <div className='flex items-center gap-2'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Đang gửi...
              </div>
            ) : (
              <>
                Gửi hướng dẫn
                <ArrowRight className='w-5 h-5 ml-2' />
              </>
            )}
          </Button>

          <div className='text-center mt-6'>
            <Link
              to='/login'
              className='inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
