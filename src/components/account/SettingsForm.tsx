import { useState } from 'react'
import { Link } from 'react-router'
import { Shield, Lock, Bell, Eye, Smartphone, Mail, Save, Key } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContext'

interface SettingsFormProps {
  onSuccess?: () => void
}

export function SettingsForm({ onSuccess }: SettingsFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Security Settings
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionEmails: false,
    prescriptionReminders: true,

    // Privacy settings
    profileVisibility: 'private' as 'public' | 'private',
    showOnlineStatus: true,
    allowDataCollection: true,

    // Security settings
    twoFactorEnabled: false,
    sessionTimeout: 30, // minutes
  })

  const handleSettingChange = (key: keyof typeof settings, value: boolean | string | number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveSettings = async () => {
    setIsSubmitting(true)

    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      toast.success('Cài đặt đã được lưu', {
        description: 'Các thay đổi của bạn đã được cập nhật thành công.',
      })

      onSuccess?.()
    } catch (error) {
      toast.error('Lưu cài đặt thất bại', {
        description: 'Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAccountStatus = () => {
    if (!user) return { label: 'Chưa đăng nhập', variant: 'secondary' as const }

    switch (user.status) {
      case 0:
        return { label: 'Chưa xác thực email', variant: 'secondary' as const }
      case 1:
        return { label: 'Đã xác thực', variant: 'default' as const }
      case 2:
        return { label: 'Tài khoản bị khóa', variant: 'destructive' as const }
      default:
        return { label: 'Trạng thái không xác định', variant: 'outline' as const }
    }
  }

  const accountStatus = getAccountStatus()

  return (
    <div className='space-y-6'>
      {/* Account Status */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='w-5 h-5 text-[#1E40AF]' />
            Trạng thái tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Trạng thái hiện tại</p>
              <Badge variant={accountStatus.variant} className='mt-1'>
                {accountStatus.label}
              </Badge>
            </div>
            {user?.status === 0 && (
              <Button size='sm' className='bg-[#0A2463] hover:bg-[#071A49]'>
                <Mail className='w-4 h-4 mr-2' />
                Gửi lại email xác thực
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className='border-red-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lock className='w-5 h-5 text-red-600' />
            Bảo mật tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Password Change */}
          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
            <div className='flex items-center gap-3'>
              <Key className='w-5 h-5 text-gray-600' />
              <div>
                <h3 className='font-medium text-gray-900'>Đổi mật khẩu</h3>
                <p className='text-sm text-gray-600'>Cập nhật mật khẩu để bảo vệ tài khoản</p>
              </div>
            </div>
            <Link to='/account/change-password'>
              <Button variant='outline' size='sm'>
                Thay đổi
              </Button>
            </Link>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Smartphone className='w-5 h-5 text-gray-600' />
              <div>
                <h3 className='font-medium text-gray-900'>Xác thực hai yếu tố (2FA)</h3>
                <p className='text-sm text-gray-600'>Thêm lớp bảo mật với mã xác thực</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <Badge variant='secondary'>Sắp có</Badge>
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                disabled
              />
            </div>
          </div>

          {/* Session Timeout */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>Thời gian phiên hoạt động (phút)</Label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-[#1E40AF]'
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={60}>1 giờ</option>
              <option value={120}>2 giờ</option>
              <option value={480}>8 giờ</option>
            </select>
            <p className='text-xs text-gray-500'>Thời gian tự động đăng xuất khi không hoạt động</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='w-5 h-5 text-[#1E40AF]' />
            Cài đặt thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Email Notifications */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Thông báo qua email</h3>
              <p className='text-sm text-gray-600'>Nhận thông báo qua email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          {/* SMS Notifications */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Thông báo qua SMS</h3>
              <p className='text-sm text-gray-600'>Nhận thông báo qua tin nhắn</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
            />
          </div>

          <Separator />

          {/* Order Updates */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Cập nhật đơn hàng</h3>
              <p className='text-sm text-gray-600'>Thông báo về trạng thái đơn hàng</p>
            </div>
            <Switch
              checked={settings.orderUpdates}
              onCheckedChange={(checked) => handleSettingChange('orderUpdates', checked)}
            />
          </div>

          {/* Prescription Reminders */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Nhắc nhở đơn thuốc</h3>
              <p className='text-sm text-gray-600'>Nhắc nhở uống thuốc và tái khám</p>
            </div>
            <Switch
              checked={settings.prescriptionReminders}
              onCheckedChange={(checked) => handleSettingChange('prescriptionReminders', checked)}
            />
          </div>

          {/* Promotion Emails */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Email khuyến mãi</h3>
              <p className='text-sm text-gray-600'>Nhận thông tin khuyến mãi và ưu đãi</p>
            </div>
            <Switch
              checked={settings.promotionEmails}
              onCheckedChange={(checked) => handleSettingChange('promotionEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='w-5 h-5 text-[#1E40AF]' />
            Quyền riêng tư
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Profile Visibility */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>Hiển thị hồ sơ</Label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => handleSettingChange('profileVisibility', e.target.value as 'public' | 'private')}
              className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF]'
            >
              <option value='private'>Riêng tư - Chỉ mình tôi</option>
              <option value='public'>Công khai - Dược sĩ có thể xem</option>
            </select>
            <p className='text-xs text-gray-500'>Kiểm soát ai có thể xem thông tin hồ sơ của bạn</p>
          </div>

          {/* Online Status */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Hiển thị trạng thái online</h3>
              <p className='text-sm text-gray-600'>Cho phép người khác thấy bạn đang online</p>
            </div>
            <Switch
              checked={settings.showOnlineStatus}
              onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
            />
          </div>

          {/* Data Collection */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Thu thập dữ liệu</h3>
              <p className='text-sm text-gray-600'>Cho phép thu thập dữ liệu để cải thiện dịch vụ</p>
            </div>
            <Switch
              checked={settings.allowDataCollection}
              onCheckedChange={(checked) => handleSettingChange('allowDataCollection', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end pt-6 border-t border-gray-200'>
        <Button
          onClick={handleSaveSettings}
          disabled={isSubmitting}
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
        >
          {isSubmitting ? (
            <>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className='w-5 h-5 mr-2' />
              Lưu cài đặt
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
