import { useState } from 'react'
import { PageTransition } from '../shared/PageTransition'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Alert, AlertDescription } from '../ui/alert'
import {
  Mail,
  AlertCircle,
  CheckCircle,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  UserCircle2,
  UserPlus,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { UserGender } from '../../types/user'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '' as 'Nam' | 'Nữ' | '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vui lòng nhập họ'
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'Họ chỉ được chứa chữ cái và khoảng trắng'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Vui lòng nhập tên'
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Tên chỉ được chứa chữ cái và khoảng trắng'
    }

    if (!formData.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính'
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại'
    } else if (formData.phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin', {
        description: 'Có một số trường chưa được điền đúng',
        duration: 3000,
      })
      return
    }

    if (!formData.agreeToTerms) {
      toast.error('Vui lòng đồng ý với điều khoản', {
        description: 'Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)

    try {
      // Convert gender string to UserGender enum
      const genderValue =
        formData.gender === 'Nam' ? UserGender.Male : formData.gender === 'Nữ' ? UserGender.Female : UserGender.Male

      const registerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
        gender: genderValue,
      }

      const success = await register(registerData)

      if (success) {
        setSuccess(true)
        toast.success('Đăng ký thành công!', {
          description: 'Chào mừng bạn đến với MEDISPACE',
          duration: 2000,
        })

        setTimeout(() => {
          navigate('/', {
            state: {
              message: 'Đăng ký thành công! Chào mừng bạn đến với MEDISPACE.',
            },
          })
        }, 3000)
      } else {
        throw new Error('Đăng ký thất bại. Vui lòng thử lại.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setErrors({ general: errorMessage })
      toast.error('Đăng ký thất bại', {
        description: errorMessage,
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <PageTransition>
        <motion.div
          className='text-center'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className='relative mb-8'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className='w-24 h-24 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/50'>
              <CheckCircle className='w-12 h-12 text-white' />
            </div>
            {/* Animated rings */}
            <motion.div
              className='absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-300 rounded-full'
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          <motion.h2
            className='text-gray-900 mb-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Đăng ký thành công!
          </motion.h2>

          <motion.p
            className='text-gray-600 mb-8 leading-relaxed'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Chào mừng bạn đến với <span className='text-blue-600'>MEDISPACE</span>!<br />
            Tài khoản của bạn đã được tạo thành công.
            <br />
            Bạn sẽ được chuyển đến trang đăng nhập trong giây lát.
          </motion.p>

          <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto' />
        </motion.div>
      </PageTransition>
    )
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
        <h1 className='text-blue-600 mb-2 relative inline-block'>
          Trở thành thành viên để mua sắm dễ dàng hơn
          <Sparkles className='inline-block ml-2 w-5 h-5 text-cyan-500 animate-pulse' />
        </h1>
        <p className='text-gray-500 text-sm mt-2'>Tạo tài khoản chỉ trong vài phút!</p>
      </motion.div>

      {/* Error Alert */}
      {errors.general && (
        <Alert className='mb-6 border-red-200 bg-red-50'>
          <AlertCircle className='h-4 w-4 text-red-500' />
          <AlertDescription className='text-red-700'>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Name Fields */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2.5'>
            <Label
              htmlFor='firstName'
              className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'
            >
              <User className='w-4 h-4' />
              HỌ
            </Label>
            <div className='relative'>
              <User className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
              <Input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder='Nhập họ'
                className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                  errors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
                }`}
              />
            </div>
            {errors.firstName && <p className='text-red-500 text-sm'>{errors.firstName}</p>}
          </div>

          <div className='space-y-2.5'>
            <Label htmlFor='lastName' className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
              <UserCircle2 className='w-4 h-4' />
              TÊN
            </Label>
            <div className='relative'>
              <UserCircle2 className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
              <Input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder='Nhập tên'
                className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                  errors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
                }`}
              />
            </div>
            {errors.lastName && <p className='text-red-500 text-sm'>{errors.lastName}</p>}
          </div>
        </div>

        {/* Gender */}
        <div className='space-y-2.5'>
          <Label className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
            <UserCircle2 className='w-4 h-4' />
            GIỚI TÍNH
          </Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value: 'Nam' | 'Nữ') => setFormData({ ...formData, gender: value })}
            className='grid grid-cols-2 gap-4'
          >
            <div
              className={`flex items-center justify-center h-14 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                formData.gender === 'Nam'
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                  : 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <RadioGroupItem value='Nam' id='male' className='sr-only' />
              <Label
                htmlFor='male'
                className={`w-full h-full flex items-center justify-center cursor-pointer transition-colors ${formData.gender === 'Nam' ? 'text-blue-600' : 'text-gray-600'}`}
              >
                Nam
              </Label>
            </div>
            <div
              className={`flex items-center justify-center h-14 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                formData.gender === 'Nữ'
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                  : 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <RadioGroupItem value='Nữ' id='female' className='sr-only' />
              <Label
                htmlFor='female'
                className={`w-full h-full flex items-center justify-center cursor-pointer transition-colors ${formData.gender === 'Nữ' ? 'text-blue-600' : 'text-gray-600'}`}
              >
                Nữ
              </Label>
            </div>
          </RadioGroup>
          {errors.gender && <p className='text-red-500 text-sm'>{errors.gender}</p>}
        </div>

        {/* Phone */}
        <div className='space-y-2.5'>
          <Label className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
            <Phone className='w-4 h-4' />
            SỐ ĐIỆN THOẠI
          </Label>
          <div className='relative'>
            <Phone className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              type='tel'
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder='Nhập số điện thoại'
              className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.phoneNumber
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
              }`}
            />
          </div>
          {errors.phoneNumber && <p className='text-red-500 text-sm'>{errors.phoneNumber}</p>}
        </div>

        {/* Email */}
        <div className='space-y-2.5'>
          <Label htmlFor='email' className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
            <Mail className='w-4 h-4' />
            EMAIL
          </Label>
          <div className='relative'>
            <Mail className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder='Nhập địa chỉ email'
              className={`pl-12 h-14 bg-white ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl transition-colors`}
            />
          </div>
          {errors.email && <p className='text-red-500 text-sm'>{errors.email}</p>}
        </div>

        {/* Password */}
        <div className='space-y-2.5'>
          <Label htmlFor='password' className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
            <Lock className='w-4 h-4' />
            MẬT KHẨU
          </Label>
          <div className='relative'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder='Nhập mật khẩu'
              className={`pl-12 pr-12 h-14 bg-white ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl transition-colors`}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors'
            >
              {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          </div>
          {errors.password && <p className='text-red-500 text-sm'>{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className='space-y-2.5'>
          <Label
            htmlFor='confirmPassword'
            className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'
          >
            <Lock className='w-4 h-4' />
            XÁC NHẬN MẬT KHẨU
          </Label>
          <div className='relative'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder='Nhập lại mật khẩu'
              className={`pl-12 pr-12 h-14 bg-white ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl transition-colors`}
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors'
            >
              {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          </div>
          {errors.confirmPassword && <p className='text-red-500 text-sm'>{errors.confirmPassword}</p>}
        </div>

        {/* Terms and Conditions */}
        <motion.div
          className='flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-100'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Checkbox
            id='agreeToTerms'
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
            className='border-2 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0'
          />
          <div className='flex-1'>
            <Label htmlFor='agreeToTerms' className='text-sm text-gray-700 cursor-pointer block'>
              Tôi đồng ý với{' '}
              <Link to='#' className='text-blue-600 hover:text-blue-700 hover:underline transition-colors'>
                Điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link to='#' className='text-blue-600 hover:text-blue-700 hover:underline transition-colors'>
                Chính sách bảo mật
              </Link>{' '}
              của MEDISPACE
            </Label>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            type='submit'
            className='w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-500 text-white h-14 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 mt-6 uppercase tracking-wide relative overflow-hidden group'
            disabled={isLoading || !formData.agreeToTerms}
          >
            {/* Shimmer effect */}
            <span className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />

            {isLoading ? (
              <div className='flex items-center gap-2 relative z-10'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Đang đăng ký...
              </div>
            ) : (
              <div className='flex items-center gap-2 relative z-10'>
                <UserPlus size={18} />
                Đăng ký
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
          <div className='w-full border-t-2 border-gradient-to-r from-transparent via-gray-200 to-transparent' />
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-4 bg-white text-gray-400 uppercase tracking-wider text-xs'>hoặc</span>
        </div>
      </motion.div>

      {/* Google Sign up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Button
          type='button'
          variant='outline'
          className='w-full h-14 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-blue-300 hover:shadow-md rounded-xl transition-all duration-200 group'
          onClick={() => {
            toast.info('Tính năng đang phát triển', {
              description: 'Đăng ký với Google sẽ sớm được ra mắt',
              duration: 3000,
            })
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
          <span className='text-gray-700'>Đăng ký với Google</span>
        </Button>
      </motion.div>

      {/* Login Link */}
      <motion.div
        className='text-center mt-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <span className='text-gray-600'>Đã có tài khoản? </span>
        <Link
          to='/login'
          className='text-blue-500 hover:text-blue-600 transition-all duration-200 relative group inline-block'
        >
          <span>Đăng nhập ngay</span>
          <span className='absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left' />
        </Link>
      </motion.div>
    </PageTransition>
  )
}
