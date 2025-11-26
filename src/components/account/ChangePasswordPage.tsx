import { useState } from 'react'

import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { PasswordInput } from '../forms/PasswordInput'
import { Shield, Lock, CheckCircle, AlertTriangle, Info, Key } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { authService } from '../../services/authService'

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    minLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      minLength: password.length >= 6, // Match backend: min 6 chars
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password), // Match backend: requires symbols
    }

    const score = Object.values(requirements).filter(Boolean).length

    let label = 'Rất yếu'
    let color = 'text-red-600'

    if (score >= 5) {
      label = 'Rất mạnh'
      color = 'text-green-600'
    } else if (score >= 4) {
      label = 'Mạnh'
      color = 'text-blue-600'
    } else if (score >= 3) {
      label = 'Trung bình'
      color = 'text-yellow-600'
    } else if (score >= 2) {
      label = 'Yếu'
      color = 'text-orange-600'
    }

    return { score, label, color, requirements }
  }

  const passwordStrength = checkPasswordStrength(newPassword)
  const strengthPercentage = (passwordStrength.score / 5) * 100

  const validatePasswords = () => {
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return false
    }

    if (!newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới')
      return false
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return false
    }

    if (newPassword === currentPassword) {
      toast.warning('Mật khẩu mới phải khác mật khẩu hiện tại')
      return false
    }

    if (!confirmPassword) {
      toast.error('Vui lòng xác nhận mật khẩu mới')
      return false
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return false
    }

    // Backend requires ALL criteria to be met, not just score >= 3
    if (passwordStrength.score < 5) {
      toast.error('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswords()) {
      return
    }

    setIsSubmitting(true)

    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword)

      // Success
      toast.success('Đổi mật khẩu thành công', {
        description: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.',
        duration: 3000,
        icon: <CheckCircle className='w-5 h-5 text-green-600' />,
        action: {
          label: 'Đăng nhập',
          onClick: () => (window.location.href = '/login'),
        },
      })

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Mật khẩu hiện tại không đúng. Vui lòng thử lại.'
      toast.error('Đổi mật khẩu thất bại', {
        description: errorMessage,
        duration: 4000,
        icon: <AlertTriangle className='w-5 h-5 text-red-600' />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const securityTips = [
    'Sử dụng ít nhất 6 ký tự',
    'Kết hợp chữ hoa, chữ thường',
    'Có ít nhất 1 chữ số',
    'Có ít nhất 1 ký tự đặc biệt (!@#$%)',
    'Không sử dụng thông tin cá nhân',
    'Không tái sử dụng mật khẩu cũ',
  ]

  return (
    <EnhancedPageTransition>
      <div className='max-w-3xl space-y-6'>
        {/* Page Header */}
        <div>
          <h1 className='text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            Đổi mật khẩu
          </h1>
          <p className='text-gray-600'>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
        </div>

        {/* Security Alert */}
        <Alert className='bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200'>
          <Shield className='w-5 h-5 text-blue-600' />
          <AlertDescription className='text-blue-900'>
            <span className='font-semibold'>Bảo mật tài khoản:</span> Chúng tôi khuyến nghị bạn đổi mật khẩu định kỳ
            (3-6 tháng/lần) để đảm bảo an toàn tài khoản.
          </AlertDescription>
        </Alert>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Change Password Form */}
          <div className='lg:col-span-2'>
            <Card className='bg-white/80 backdrop-blur-lg border-2 border-blue-100 shadow-xl'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Lock className='w-6 h-6 text-blue-600' />
                  Thay đổi mật khẩu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Current Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='currentPassword' className='flex items-center gap-2'>
                      <Key className='w-4 h-4 text-gray-600' />
                      Mật khẩu hiện tại *
                    </Label>
                    <PasswordInput
                      value={currentPassword}
                      onChange={(value) => setCurrentPassword(value)}
                      placeholder='Nhập mật khẩu hiện tại'
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                    <p className='text-xs text-gray-500 flex items-center gap-1'>
                      <Info className='w-3 h-3' />
                      Nhập mật khẩu bạn đang sử dụng
                    </p>
                  </div>

                  {/* New Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='newPassword' className='flex items-center gap-2'>
                      <Lock className='w-4 h-4 text-gray-600' />
                      Mật khẩu mới *
                    </Label>
                    <PasswordInput
                      value={newPassword}
                      onChange={(value) => setNewPassword(value)}
                      placeholder='Nhập mật khẩu mới'
                      className='border-2 border-blue-200 focus:border-blue-500'
                      showStrength={true}
                    />

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='space-y-2'>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-gray-600'>Độ mạnh mật khẩu:</span>
                          <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                        </div>
                        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${strengthPercentage}%` }}
                            className={`h-full rounded-full ${
                              passwordStrength.score >= 5
                                ? 'bg-green-600'
                                : passwordStrength.score >= 4
                                  ? 'bg-blue-600'
                                  : passwordStrength.score >= 3
                                    ? 'bg-yellow-600'
                                    : passwordStrength.score >= 2
                                      ? 'bg-orange-600'
                                      : 'bg-red-600'
                            }`}
                            transition={{ duration: 0.3 }}
                          />
                        </div>

                        {/* Requirements Checklist */}
                        <div className='grid grid-cols-2 gap-2 text-xs'>
                          <div
                            className={`flex items-center gap-1 ${
                              passwordStrength.requirements.minLength ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {passwordStrength.requirements.minLength ? (
                              <CheckCircle className='w-3 h-3' />
                            ) : (
                              <div className='w-3 h-3 border border-current rounded-full' />
                            )}
                            <span>Tối thiểu 6 ký tự</span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${
                              passwordStrength.requirements.hasUpperCase ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {passwordStrength.requirements.hasUpperCase ? (
                              <CheckCircle className='w-3 h-3' />
                            ) : (
                              <div className='w-3 h-3 border border-current rounded-full' />
                            )}
                            <span>Chữ hoa (A-Z)</span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${
                              passwordStrength.requirements.hasLowerCase ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {passwordStrength.requirements.hasLowerCase ? (
                              <CheckCircle className='w-3 h-3' />
                            ) : (
                              <div className='w-3 h-3 border border-current rounded-full' />
                            )}
                            <span>Chữ thường (a-z)</span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${
                              passwordStrength.requirements.hasNumber ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {passwordStrength.requirements.hasNumber ? (
                              <CheckCircle className='w-3 h-3' />
                            ) : (
                              <div className='w-3 h-3 border border-current rounded-full' />
                            )}
                            <span>Số (0-9)</span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${
                              passwordStrength.requirements.hasSpecial ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {passwordStrength.requirements.hasSpecial ? (
                              <CheckCircle className='w-3 h-3' />
                            ) : (
                              <div className='w-3 h-3 border border-current rounded-full' />
                            )}
                            <span>Ký tự đặc biệt (!@#$)</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword' className='flex items-center gap-2'>
                      <Shield className='w-4 h-4 text-gray-600' />
                      Xác nhận mật khẩu mới *
                    </Label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(value) => setConfirmPassword(value)}
                      placeholder='Nhập lại mật khẩu mới'
                      className='border-2 border-blue-200 focus:border-blue-500'
                    />
                    {confirmPassword && newPassword && (
                      <p
                        className={`text-xs flex items-center gap-1 ${
                          confirmPassword === newPassword ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {confirmPassword === newPassword ? (
                          <>
                            <CheckCircle className='w-3 h-3' />
                            Mật khẩu khớp
                          </>
                        ) : (
                          <>
                            <AlertTriangle className='w-3 h-3' />
                            Mật khẩu không khớp
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-3 pt-4'>
                    <Button
                      type='submit'
                      disabled={isSubmitting}
                      className='flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12'
                    >
                      {isSubmitting ? (
                        <>
                          <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className='w-5 h-5 mr-2' />
                          Cập nhật mật khẩu
                        </>
                      )}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      className='border-2 border-gray-300 hover:bg-gray-50'
                    >
                      Hủy bỏ
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Security Tips Sidebar */}
          <div className='space-y-4'>
            {/* Tips Card */}
            <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Shield className='w-5 h-5 text-purple-600' />
                  Mẹo bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm text-gray-700'>
                  {securityTips.map((tip, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <CheckCircle className='w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0' />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Additional Security */}
            <Card className='bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200'>
              <CardContent className='p-4'>
                <h3 className='flex items-center gap-2 mb-3'>
                  <Info className='w-5 h-5 text-blue-600' />
                  Bảo mật nâng cao
                </h3>
                <p className='text-sm text-gray-700 mb-3'>
                  Kích hoạt xác thực 2 yếu tố để tăng cường bảo mật cho tài khoản của bạn.
                </p>
                <Button
                  variant='outline'
                  className='w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-100'
                  onClick={() => toast.info('Tính năng đang phát triển')}
                >
                  Cài đặt xác thực 2FA
                </Button>
              </CardContent>
            </Card>

            {/* Password Manager Tip */}
            <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'>
              <CardContent className='p-4'>
                <h3 className='flex items-center gap-2 mb-2'>
                  <Key className='w-5 h-5 text-green-600' />
                  Gợi ý
                </h3>
                <p className='text-sm text-gray-700'>
                  Sử dụng trình quản lý mật khẩu để tạo và lưu trữ mật khẩu mạnh một cách an toàn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EnhancedPageTransition>
  )
}
