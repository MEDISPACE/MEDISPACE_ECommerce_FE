import { useState, useEffect } from 'react'
import { Save, User, Shield, Phone, Mail, Loader2, Lock, KeyIcon, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { settingsService, type PharmacistProfile, type UpdateProfileData } from '~/services/pharmacist'

export function PharmacistSettingsPage() {
  const [profile, setProfile] = useState<PharmacistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Password visibility state
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation errors
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await settingsService.getProfile()
      setProfile(data)
    } catch (error) {
      console.error('Load profile error:', error)
      toast.error('Lỗi tải thông tin tài khoản')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    try {
      setSaving(true)
      const updateData: UpdateProfileData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        avatar: profile.avatar,
        lisenseNumber: profile.lisenseNumber,
      }

      await settingsService.updateProfile(updateData)
      toast.success('Đã lưu thông tin cá nhân')
      await loadProfile()
    } catch (error) {
      console.error('Save profile error:', error)
      toast.error('Lỗi lưu thông tin')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    // Reset errors
    setPasswordErrors({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    // Validate fields
    const errors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    let hasError = false

    if (!passwordData.oldPassword) {
      errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại'
      hasError = true
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới'
      hasError = true
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
      hasError = true
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)'
      hasError = true
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
      hasError = true
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
      hasError = true
    }

    if (hasError) {
      setPasswordErrors(errors)
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }

    try {
      setSaving(true)
      await settingsService.updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success('Đã đổi mật khẩu thành công')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: unknown) {
      console.error('Change password error:', error)

      // Handle specific error from API
      const apiError = error as { response?: { data?: { message?: string } } }
      if (apiError?.response?.data?.message) {
        const errorMessage = apiError.response.data.message

        if (errorMessage.includes('Old password') || errorMessage.includes('incorrect')) {
          setPasswordErrors((prev) => ({ ...prev, oldPassword: 'Mật khẩu hiện tại không đúng' }))
          toast.error('Mật khẩu hiện tại không đúng')
        } else {
          toast.error(errorMessage)
        }
      } else {
        toast.error('Lỗi đổi mật khẩu. Vui lòng thử lại')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Không thể tải thông tin tài khoản</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <div className='flex items-center gap-4'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg'>
            <User className='w-8 h-8 text-white' />
          </div>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
              Cài đặt tài khoản
            </h1>
            <p className='text-gray-600 mt-1'>Quản lý thông tin cá nhân và bảo mật</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <Tabs defaultValue='personal' className='p-6'>
          <TabsList className='grid w-full grid-cols-2 bg-blue-50'>
            <TabsTrigger value='personal' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
              <User className='w-4 h-4 mr-2' />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value='security' className='data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
              <Shield className='w-4 h-4 mr-2' />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value='personal' className='space-y-6 mt-6'>
            {/* Avatar Section */}
            <div className='flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl'>
              <Avatar className='w-24 h-24 border-4 border-white shadow-lg'>
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className='bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl'>
                  {profile.firstName?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className='text-sm text-gray-600 mt-1'>{profile.role}</p>
                <p className='text-sm text-gray-500 mt-2'>JPG, PNG. Tối đa 2MB</p>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>Tên *</Label>
                  <Input
                    id='firstName'
                    value={profile.firstName || ''}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className='border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập tên'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Họ *</Label>
                  <Input
                    id='lastName'
                    value={profile.lastName || ''}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className='border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập họ'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Số điện thoại</Label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      id='phone'
                      value={profile.phoneNumber || ''}
                      onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                      className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                      placeholder='Nhập số điện thoại'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email'>Email *</Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      id='email'
                      type='email'
                      value={profile.email}
                      disabled
                      className='pl-10 border-2 border-gray-200 bg-gray-50'
                    />
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='lisenseNumber'>Số chứng chỉ hành nghề</Label>
                  <Input
                    id='lisenseNumber'
                    value={profile.lisenseNumber || ''}
                    onChange={(e) => setProfile({ ...profile, lisenseNumber: e.target.value })}
                    className='border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập số chứng chỉ'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='role'>Vai trò</Label>
                  <Input id='role' value={profile.role} disabled className='border-2 border-gray-200 bg-gray-50' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='dateOfBirth'>Ngày sinh</Label>
                  <Input
                    id='dateOfBirth'
                    type='date'
                    value={profile.dateOfBirth || ''}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='gender'>Giới tính</Label>
                  <select
                    id='gender'
                    value={profile.gender ?? ''}
                    onChange={(e) =>
                      setProfile({ ...profile, gender: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className='w-full px-3 py-2 border-2 border-blue-200 rounded-md focus:border-blue-500'
                  >
                    <option value=''>Chọn giới tính</option>
                    <option value='0'>Nam</option>
                    <option value='1'>Nữ</option>
                    <option value='2'>Khác</option>
                  </select>
                </div>
              </div>
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button variant='outline' onClick={loadProfile} disabled={saving}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
              >
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className='w-4 h-4 mr-2' />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value='security' className='space-y-6 mt-6'>
            <div className='p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl'>
              <div className='flex items-center gap-3 mb-2'>
                <Lock className='w-5 h-5 text-blue-600' />
                <h3 className='text-lg font-semibold text-gray-900'>Đổi mật khẩu</h3>
              </div>
              <p className='text-sm text-gray-600'>Cập nhật mật khẩu của bạn để đảm bảo an toàn cho tài khoản</p>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='oldPassword'>Mật khẩu hiện tại *</Label>
                <div className='relative'>
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      passwordErrors.oldPassword ? 'text-red-400' : 'text-gray-400'
                    }`}
                  />
                  <Input
                    id='oldPassword'
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordData.oldPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, oldPassword: e.target.value })
                      if (passwordErrors.oldPassword) {
                        setPasswordErrors({ ...passwordErrors, oldPassword: '' })
                      }
                    }}
                    className={`pl-10 pr-10 border-2 ${
                      passwordErrors.oldPassword
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                    placeholder='Nhập mật khẩu hiện tại'
                  />
                  <button
                    type='button'
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showOldPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className='text-sm text-red-600 mt-1'>{passwordErrors.oldPassword}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword'>Mật khẩu mới *</Label>
                <div className='relative'>
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      passwordErrors.newPassword ? 'text-red-400' : 'text-gray-400'
                    }`}
                  />
                  <Input
                    id='newPassword'
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                      if (passwordErrors.newPassword) {
                        setPasswordErrors({ ...passwordErrors, newPassword: '' })
                      }
                    }}
                    className={`pl-10 pr-10 border-2 ${
                      passwordErrors.newPassword
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                    placeholder='Nhập mật khẩu mới'
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showNewPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className='text-sm text-red-600 mt-1'>{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Xác nhận mật khẩu mới *</Label>
                <div className='relative'>
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      passwordErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'
                    }`}
                  />
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors({ ...passwordErrors, confirmPassword: '' })
                      }
                    }}
                    className={`pl-10 pr-10 border-2 ${
                      passwordErrors.confirmPassword
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                    placeholder='Nhập lại mật khẩu mới'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className='text-sm text-red-600 mt-1'>{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={() => setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={saving}
                className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
              >
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <KeyIcon className='w-4 h-4 mr-2' />
                    Đổi mật khẩu
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
