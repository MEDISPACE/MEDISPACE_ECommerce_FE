import { useState, useEffect } from 'react'
import { Save, User, Shield, Phone, Mail, MapPin, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { settingsService } from '~/services/pharmacist'
import type { PharmacistProfile, UpdateProfileData } from '~/services/pharmacist/types'

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
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        email: profile.email,
        address: profile.address,
        bio: profile.bio,
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
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
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
    } catch (error) {
      console.error('Change password error:', error)
      toast.error('Lỗi đổi mật khẩu')
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
                  {profile.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-gray-900'>{profile.fullName}</h3>
                <p className='text-sm text-gray-600 mt-1'>{profile.role}</p>
                <p className='text-sm text-gray-500 mt-2'>JPG, PNG. Tối đa 2MB</p>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='fullName'>Họ và tên *</Label>
                  <Input
                    id='fullName'
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className='border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Số điện thoại *</Label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      id='phone'
                      value={profile.phoneNumber}
                      onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                      className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email *</Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      id='email'
                      type='email'
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='role'>Vai trò</Label>
                  <Input id='role' value={profile.role} disabled className='border-2 border-gray-200 bg-gray-50' />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='address'>Địa chỉ</Label>
                <div className='relative'>
                  <MapPin className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
                  <Textarea
                    id='address'
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className='pl-10 border-2 border-blue-200 focus:border-blue-500 min-h-[80px]'
                    placeholder='Nhập địa chỉ đầy đủ'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bio'>Giới thiệu bản thân</Label>
                <Textarea
                  id='bio'
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className='border-2 border-blue-200 focus:border-blue-500 min-h-[100px]'
                  placeholder='Chia sẻ về kinh nghiệm và chuyên môn của bạn...'
                />
                <p className='text-sm text-gray-500'>{(profile.bio || '').length}/500 ký tự</p>
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
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='oldPassword'
                    type='password'
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập mật khẩu hiện tại'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword'>Mật khẩu mới *</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='newPassword'
                    type='password'
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập mật khẩu mới'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Xác nhận mật khẩu mới *</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='confirmPassword'
                    type='password'
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                    placeholder='Nhập lại mật khẩu mới'
                  />
                </div>
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
                    <Shield className='w-4 h-4 mr-2' />
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
