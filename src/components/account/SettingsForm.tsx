import { useState } from 'react'
import { Link } from 'react-router'
import { Bell, Eye, Key, Lock, Mail, Shield, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'

interface SettingsFormProps {
  onSuccess?: () => void
}

export function SettingsForm({ onSuccess }: SettingsFormProps) {
  const { user } = useAuth()
  const [isResending, setIsResending] = useState(false)

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

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      await authService.resendVerifyEmail()
      toast.success('Đã gửi lại email xác thực')
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể gửi lại email xác thực'
      toast.error(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  const accountStatus = getAccountStatus()

  return (
    <div className='space-y-6' data-testid='settings-page'>
      <Card className='border-[#E8EDF5]' data-testid='account-status-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='w-5 h-5 text-[#1E40AF]' />
            Trạng thái tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Trạng thái hiện tại</p>
              <Badge variant={accountStatus.variant} className='mt-1'>
                {accountStatus.label}
              </Badge>
            </div>
            {user?.status === 0 && (
              <Button
                size='sm'
                onClick={handleResendVerification}
                disabled={isResending}
                className='bg-[#0A2463] hover:bg-[#071A49]'
                data-testid='resend-verification-btn'
              >
                <Mail className='w-4 h-4 mr-2' />
                {isResending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className='border-red-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lock className='w-5 h-5 text-red-600' />
            Bảo mật tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center justify-between rounded-lg bg-gray-50 p-4'>
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

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Smartphone className='w-5 h-5 text-gray-600' />
              <div>
                <h3 className='font-medium text-gray-900'>Xác thực hai yếu tố (2FA)</h3>
                <p className='text-sm text-gray-600'>Tính năng này sẽ được bật khi backend 2FA sẵn sàng</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <Badge variant='secondary'>Sắp có</Badge>
              <Switch checked={false} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='w-5 h-5 text-[#1E40AF]' />
            Cài đặt thông báo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Quản lý kênh và loại thông báo</h3>
              <p className='text-sm text-gray-600'>Các tuỳ chọn thông báo đang được lưu bằng API thông báo thật.</p>
            </div>
            <Link to='/account/notifications' data-testid='notification-settings-link'>
              <Button variant='outline'>Mở cài đặt thông báo</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='w-5 h-5 text-[#1E40AF]' />
            Quyền riêng tư
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Hiển thị hồ sơ</h3>
              <p className='text-sm text-gray-600'>Chưa bật cấu hình quyền riêng tư theo tài khoản</p>
            </div>
            <Badge variant='secondary' data-testid='privacy-coming-soon'>Sắp có</Badge>
          </div>
          <Separator />
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium text-gray-900'>Trạng thái online và dữ liệu cải thiện dịch vụ</h3>
              <p className='text-sm text-gray-600'>Sẽ được lưu khi có API user settings riêng</p>
            </div>
            <Switch checked={false} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
