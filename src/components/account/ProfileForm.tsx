import { useState, useRef } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, User as UserIcon, Phone, Calendar, Save, X, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'
import { mediaService } from '../../services/mediaService'
import type { User, UserGender } from '../../types/user'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự').max(50, 'Họ không được vượt quá 50 ký tự'),
  lastName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên không được vượt quá 50 ký tự'),
  phoneNumber: z
    .string()
    .regex(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.union([z.literal('0'), z.literal('1')]).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProfileForm({ onSuccess, onCancel }: ProfileFormProps) {
  const { user, updateUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      // Format as yyyy-mm-dd for HTML date input
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      dateOfBirth: formatDateForInput(user?.dateOfBirth),
      gender: user?.gender !== undefined ? (user.gender.toString() as '0' | '1') : undefined,
    },
  })

  const watchedGender = watch('gender')

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResendEmail = async () => {
    setIsResendingEmail(true)
    try {
      await authService.resendVerifyEmail()
      toast.success('Email xác thực đã được gửi lại', {
        description: 'Vui lòng kiểm tra hộp thư của bạn.',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi email'
      toast.error('Gửi email thất bại', {
        description: errorMessage,
      })
    } finally {
      setIsResendingEmail(false)
    }
  }

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setIsSubmitting(true)

    try {
      let avatarUrl: string | undefined = undefined

      // Upload avatar nếu có
      if (avatarFile) {
        setIsUploadingAvatar(true)
        toast.info('Đang upload avatar...')

        try {
          avatarUrl = await mediaService.uploadImageWithProgress(avatarFile, (progress) => {
            setUploadProgress(progress)
          })

          toast.success('Upload avatar thành công!')
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload avatar'
          toast.error('Upload avatar thất bại', {
            description: errorMessage,
          })
          setIsUploadingAvatar(false)
          setIsSubmitting(false)
          return
        } finally {
          setIsUploadingAvatar(false)
        }
      }

      const updateData: Partial<User> = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender ? (parseInt(data.gender) as UserGender) : undefined,
      }

      // Thêm avatar URL nếu có
      if (avatarUrl) {
        updateData.avatar = avatarUrl
      }

      const updatedUser = await authService.updateProfile(updateData)
      updateUser(updatedUser)

      toast.success('Cập nhật hồ sơ thành công', {
        description: 'Thông tin cá nhân của bạn đã được cập nhật.',
      })

      // Reset avatar state
      setAvatarFile(null)
      setAvatarPreview(null)
      setUploadProgress(0)

      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật hồ sơ'
      toast.error('Cập nhật hồ sơ thất bại', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleLabel = (role?: number) => {
    switch (role) {
      case 0:
        return 'Khách hàng'
      case 1:
        return 'Dược sĩ'
      case 2:
        return 'Quản trị viên'
      default:
        return 'Không xác định'
    }
  }

  const getStatusBadge = (status?: number) => {
    switch (status) {
      case 0:
        return <Badge variant='secondary'>Chưa xác thực</Badge>
      case 1:
        return <Badge variant='default'>Đã xác thực</Badge>
      case 2:
        return <Badge variant='destructive'>Đã khóa</Badge>
      default:
        return <Badge variant='outline'>Không xác định</Badge>
    }
  }

  return (
    <div className='space-y-6'>
      {/* Profile Header */}
      <Card className='border border-blue-200 hover:shadow-md transition-all duration-300'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <UserIcon className='w-5 h-5 text-blue-600' />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-6'>
            {/* Avatar Section */}
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <Avatar className='w-24 h-24 border-4 border-blue-100'>
                  <AvatarImage src={avatarPreview || user?.avatar} alt={`${user?.firstName} ${user?.lastName}`} />
                  <AvatarFallback className='text-2xl bg-blue-100 text-blue-600'>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors'
                >
                  <Camera className='w-4 h-4' />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                capture='environment'
                onChange={handleAvatarChange}
                className='hidden'
              />

              <div className='flex gap-2'>
                <Button type='button' variant='outline' size='sm' onClick={() => fileInputRef.current?.click()}>
                  Đổi ảnh
                </Button>
              </div>

              <div className='text-center'>
                <p className='text-sm font-medium text-gray-900'>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className='text-xs text-gray-500'>{user?.email}</p>
                <div className='flex gap-2 mt-2 justify-center'>
                  {getStatusBadge(user?.status)}
                  <Badge variant='outline'>{getRoleLabel(user?.role)}</Badge>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className='flex-1 space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Email</Label>
                  <div className='mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md'>
                    <p className='text-sm text-gray-900'>{user?.email}</p>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Email không thể thay đổi</p>
                </div>

                <div>
                  <Label className='text-sm font-medium text-gray-700'>Vai trò</Label>
                  <div className='mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md'>
                    <p className='text-sm text-gray-900'>{getRoleLabel(user?.role)}</p>
                  </div>
                </div>

                <div>
                  <Label className='text-sm font-medium text-gray-700'>Trạng thái tài khoản</Label>
                  <div className='mt-1'>
                    {getStatusBadge(user?.status)}
                    {user?.status === 0 && (
                      <div className='mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                        <div className='flex items-start gap-3'>
                          <Mail className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' />
                          <div className='flex-1'>
                            <h4 className='text-sm font-medium text-amber-800 mb-1'>Tài khoản chưa được xác thực</h4>
                            <p className='text-sm text-amber-700 mb-3'>
                              Bạn cần xác thực email để sử dụng đầy đủ tính năng của MediSpace.
                            </p>
                            <Button
                              onClick={handleResendEmail}
                              disabled={isResendingEmail}
                              variant='outline'
                              size='sm'
                              className='border-amber-300 text-amber-700 hover:bg-amber-100'
                            >
                              {isResendingEmail ? (
                                <>
                                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                                  Đang gửi...
                                </>
                              ) : (
                                <>
                                  <Mail className='w-4 h-4 mr-2' />
                                  Gửi lại email xác thực
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className='text-sm font-medium text-gray-700'>Ngày tạo tài khoản</Label>
                  <div className='mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md'>
                    <p className='text-sm text-gray-900'>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className='border border-blue-200 hover:shadow-md transition-all duration-300'>
        <CardHeader>
          <CardTitle>Chỉnh sửa thông tin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* First Name */}
              <div className='space-y-2'>
                <Label htmlFor='firstName' className='flex items-center gap-2'>
                  <UserIcon className='w-4 h-4 text-gray-600' />
                  Họ *
                </Label>
                <Input
                  id='firstName'
                  {...register('firstName')}
                  placeholder='Nhập họ của bạn'
                  className='border-2 border-blue-200 focus:border-blue-500'
                />
                {errors.firstName && (
                  <p className='text-sm text-red-600 flex items-center gap-1'>
                    <X className='w-3 h-3' />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className='space-y-2'>
                <Label htmlFor='lastName' className='flex items-center gap-2'>
                  <UserIcon className='w-4 h-4 text-gray-600' />
                  Tên *
                </Label>
                <Input
                  id='lastName'
                  {...register('lastName')}
                  placeholder='Nhập tên của bạn'
                  className='border-2 border-blue-200 focus:border-blue-500'
                />
                {errors.lastName && (
                  <p className='text-sm text-red-600 flex items-center gap-1'>
                    <X className='w-3 h-3' />
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className='space-y-2'>
                <Label htmlFor='phoneNumber' className='flex items-center gap-2'>
                  <Phone className='w-4 h-4 text-gray-600' />
                  Số điện thoại
                </Label>
                <Input
                  id='phoneNumber'
                  {...register('phoneNumber')}
                  placeholder='Ví dụ: 0987654321'
                  className='border-2 border-blue-200 focus:border-blue-500'
                />
                {errors.phoneNumber && (
                  <p className='text-sm text-red-600 flex items-center gap-1'>
                    <X className='w-3 h-3' />
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className='space-y-2'>
                <Label htmlFor='dateOfBirth' className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4 text-gray-600' />
                  Ngày sinh
                </Label>
                <Input
                  id='dateOfBirth'
                  type='date'
                  {...register('dateOfBirth')}
                  className='border-2 border-blue-200 focus:border-blue-500'
                />
                {errors.dateOfBirth && (
                  <p className='text-sm text-red-600 flex items-center gap-1'>
                    <X className='w-3 h-3' />
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <UserIcon className='w-4 h-4 text-gray-600' />
                  Giới tính
                </Label>
                <Select value={watchedGender} onValueChange={(value) => setValue('gender', value as '0' | '1')}>
                  <SelectTrigger className='border-2 border-blue-200 focus:border-blue-500'>
                    <SelectValue placeholder='Chọn giới tính' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='0'>Nam</SelectItem>
                    <SelectItem value='1'>Nữ</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className='text-sm text-red-600 flex items-center gap-1'>
                    <X className='w-3 h-3' />
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-6 border-t border-gray-200'>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              >
                {isSubmitting ? (
                  <>
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className='w-5 h-5 mr-2' />
                    Lưu thay đổi
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={onCancel}
                  className='border-2 border-gray-300 hover:bg-gray-50'
                >
                  <X className='w-4 h-4 mr-2' />
                  Hủy bỏ
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
