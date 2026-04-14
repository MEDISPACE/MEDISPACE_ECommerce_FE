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

const RegisterPage = () => {
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
          navigate('/login', {
            state: {
              message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
            },
          })
        }, 5000)
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
            Vui lòng <span className='font-bold text-blue-700'>kiểm tra email</span> để xác thực tài khoản trước khi
            đăng nhập.
          </motion.p>

          <Button
            onClick={() => navigate('/login')}
            className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl mb-4'
          >
            Đăng nhập ngay
          </Button>

          <p className='text-sm text-gray-500'>Tự động chuyển đến trang đăng nhập sau vài giây...</p>
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
        <h1 className='text-blue-600 mb-2 relative inline-block text-2xl md:text-2xl font-semibold'>
          Trở thành thành viên để mua sắm dễ dàng hơn
          <Sparkles className='inline-block ml-2 w-5 h-5 text-cyan-500 animate-pulse' />
        </h1>
        <p className='text-gray-500 text-base md:text-lg mt-2'>Tạo tài khoản chỉ trong vài phút!</p>
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
            <div className='relative group'>
              <User className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5' />
              <Input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder='Nhập họ'
                className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                  errors.firstName
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                    : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
                }`}
              />
            </div>
            {errors.firstName && (
              <motion.p
                className='text-red-500 text-sm flex items-center gap-1'
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className='w-3 h-3' />
                {errors.firstName}
              </motion.p>
            )}
          </div>

          <div className='space-y-2.5'>
            <Label htmlFor='lastName' className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
              <UserCircle2 className='w-4 h-4' />
              TÊN
            </Label>
            <div className='relative group'>
              <UserCircle2 className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5' />
              <Input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder='Nhập tên'
                className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                  errors.lastName
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                    : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
                }`}
              />
            </div>
            {errors.lastName && (
              <motion.p
                className='text-red-500 text-sm flex items-center gap-1'
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className='w-3 h-3' />
                {errors.lastName}
              </motion.p>
            )}
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
          <div className='relative group'>
            <Phone className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5' />
            <Input
              type='tel'
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder='Nhập số điện thoại'
              className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.phoneNumber
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
              }`}
            />
          </div>
          {errors.phoneNumber && (
            <motion.p
              className='text-red-500 text-sm flex items-center gap-1'
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className='w-3 h-3' />
              {errors.phoneNumber}
            </motion.p>
          )}
        </div>

        {/* Email */}
        <div className='space-y-2.5'>
          <Label htmlFor='email' className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
            <Mail className='w-4 h-4' />
            EMAIL
          </Label>
          <div className='relative group'>
            <Mail className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5' />
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder='Nhập địa chỉ email'
              className={`pl-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
              }`}
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
        </div>

        {/* Password */}
        <div className='space-y-2.5'>
          <Label htmlFor='password' className='text-blue-600 uppercase text-xs tracking-wide flex items-center gap-2'>
            <Lock className='w-4 h-4' />
            MẬT KHẨU
          </Label>
          <div className='relative group'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5' />
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder='Nhập mật khẩu'
              className={`pl-12 pr-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
              }`}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors'
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
          <div className='relative group'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5' />
            <Input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder='Nhập lại mật khẩu'
              className={`pl-12 pr-12 h-14 bg-white border-2 rounded-xl transition-all duration-200 ${
                errors.confirmPassword
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-200'
                  : 'border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
              }`}
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors'
            >
              {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          </div>
          {errors.confirmPassword && (
            <motion.p
              className='text-red-500 text-sm flex items-center gap-1'
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className='w-3 h-3' />
              {errors.confirmPassword}
            </motion.p>
          )}
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

export { RegisterPage }
