import { useState } from 'react'
import { Bell, Check, Settings } from 'lucide-react'

import { NotificationItem } from './NotificationItem'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'order' | 'prescription' | 'promotion' | 'health' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  actionText?: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Đơn hàng đã được giao thành công',
    message: 'Đơn hàng #DH001 đã được giao đến địa chỉ của bạn. Cảm ơn bạn đã mua sắm tại MediSpace!',
    timestamp: '2024-01-15T10:30:00Z',
    isRead: false,
    actionUrl: '/account/orders/DH001',
    actionText: 'Xem đơn hàng',
  },
  {
    id: '2',
    type: 'prescription',
    title: 'Đơn thuốc cần bổ sung thông tin',
    message: 'Đơn thuốc #DT002 cần bổ sung ảnh mặt sau của đơn thuốc. Vui lòng cập nhật để chúng tôi xử lý nhanh hơn.',
    timestamp: '2024-01-15T09:15:00Z',
    isRead: false,
    actionUrl: '/account/prescriptions/DT002',
    actionText: 'Bổ sung thông tin',
  },
  {
    id: '3',
    type: 'promotion',
    title: '🎉 Flash Sale - Giảm đến 40%',
    message:
      'Chương trình Flash Sale đang diễn ra! Giảm giá đến 40% cho các sản phẩm chăm sóc sức khỏe. Chỉ còn 2 giờ!',
    timestamp: '2024-01-15T08:00:00Z',
    isRead: true,
    actionUrl: '/products/category/cham-soc-ca-nhan',
    actionText: 'Mua ngay',
  },
  {
    id: '4',
    type: 'health',
    title: 'Nhắc nhở uống thuốc',
    message: 'Đã đến giờ uống thuốc Vitamin D3. Hãy duy trì thói quen tốt cho sức khỏe của bạn!',
    timestamp: '2024-01-15T07:00:00Z',
    isRead: true,
    actionUrl: '/health-corner',
    actionText: 'Xem lời khuyên',
  },
  {
    id: '5',
    type: 'system',
    title: 'Cập nhật bảo mật tài khoản',
    message: 'Chúng tôi đã phát hiện đăng nhập từ thiết bị mới. Nếu không phải bạn, vui lòng đổi mật khẩu ngay.',
    timestamp: '2024-01-14T22:30:00Z',
    isRead: true,
    actionUrl: '/account/security',
    actionText: 'Kiểm tra bảo mật',
  },
]

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  orderUpdates: boolean
  prescriptionReminders: boolean
  promotions: boolean
  healthTips: boolean
  systemAlerts: boolean
  quietHours: boolean
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = useState('all')
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    orderUpdates: true,
    prescriptionReminders: true,
    promotions: true,
    healthTips: false,
    systemAlerts: true,
    quietHours: true,
  })

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notification.isRead
    return notification.type === activeTab
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    )
    toast.success('Đã đánh dấu là đã đọc')
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    )
    toast.success('Đã đánh dấu tất cả là đã đọc')
  }

  const handleNotificationAction = (actionUrl: string) => {
    // Navigate to the action URL
    window.location.href = actionUrl
  }

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast.success('Đã cập nhật cài đặt thông báo')
  }

  const getTabCount = (type: string) => {
    if (type === 'all') return notifications.length
    if (type === 'unread') return unreadCount
    return notifications.filter((n) => n.type === type).length
  }

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                  Thông báo
                </h1>
                {unreadCount > 0 && <Badge className='bg-red-500 text-white'>{unreadCount} chưa đọc</Badge>}
              </div>
              <p className='text-gray-600 mt-1'>Theo dõi các thông báo quan trọng</p>
            </div>

            <div className='flex gap-2'>
              {unreadCount > 0 && (
                <Button
                  variant='outline'
                  onClick={handleMarkAllAsRead}
                  className='text-blue-600 border-blue-200 hover:bg-blue-50'
                >
                  <Check className='w-4 h-4 mr-2' />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className='px-6 pt-6'>
              <TabsList className='grid grid-cols-6 w-full'>
                <TabsTrigger value='all' className='flex items-center gap-1'>
                  Tất cả
                  {getTabCount('all') > 0 && (
                    <Badge variant='secondary' className='ml-1 text-xs'>
                      {getTabCount('all')}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value='unread' className='flex items-center gap-1'>
                  Chưa đọc
                  {getTabCount('unread') > 0 && (
                    <Badge variant='secondary' className='ml-1 text-xs bg-red-100 text-red-800'>
                      {getTabCount('unread')}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value='order'>Đơn hàng ({getTabCount('order')})</TabsTrigger>
                <TabsTrigger value='promotion'>Khuyến mãi ({getTabCount('promotion')})</TabsTrigger>
                <TabsTrigger value='health'>Sức khỏe ({getTabCount('health')})</TabsTrigger>
                <TabsTrigger value='settings' className='flex items-center gap-1'>
                  <Settings className='w-4 h-4' />
                  Cài đặt
                </TabsTrigger>
              </TabsList>
            </div>

            <Separator />

            {/* Notification Lists */}
            <TabsContent value='all' className='p-6 space-y-4'>
              {filteredNotifications.length === 0 ? (
                <div className='text-center py-12'>
                  <Bell className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có thông báo</h3>
                  <p className='text-gray-500'>Các thông báo mới sẽ xuất hiện tại đây</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onAction={handleNotificationAction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value='unread' className='p-6 space-y-4'>
              {filteredNotifications.length === 0 ? (
                <div className='text-center py-12'>
                  <Check className='w-16 h-16 mx-auto text-green-300 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Tất cả đã đọc</h3>
                  <p className='text-gray-500'>Bạn đã đọc hết tất cả thông báo</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onAction={handleNotificationAction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value='order' className='p-6 space-y-4'>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onAction={handleNotificationAction}
                />
              ))}
            </TabsContent>

            <TabsContent value='promotion' className='p-6 space-y-4'>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onAction={handleNotificationAction}
                />
              ))}
            </TabsContent>

            <TabsContent value='health' className='p-6 space-y-4'>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onAction={handleNotificationAction}
                />
              ))}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value='settings' className='p-6'>
              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Settings className='w-5 h-5' />
                      Cài đặt thông báo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Notification Channels */}
                    <div>
                      <h3 className='font-medium mb-4'>Kênh nhận thông báo</h3>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='email'>Email</Label>
                            <p className='text-sm text-gray-500'>Nhận thông báo qua email</p>
                          </div>
                          <Switch
                            id='email'
                            checked={settings.email}
                            onCheckedChange={(checked) => handleSettingChange('email', checked)}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='sms'>SMS</Label>
                            <p className='text-sm text-gray-500'>Nhận thông báo qua tin nhắn</p>
                          </div>
                          <Switch
                            id='sms'
                            checked={settings.sms}
                            onCheckedChange={(checked) => handleSettingChange('sms', checked)}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='push'>Push Notification</Label>
                            <p className='text-sm text-gray-500'>Thông báo đẩy trên trình duyệt</p>
                          </div>
                          <Switch
                            id='push'
                            checked={settings.push}
                            onCheckedChange={(checked) => handleSettingChange('push', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Notification Types */}
                    <div>
                      <h3 className='font-medium mb-4'>Loại thông báo</h3>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='orderUpdates'>Cập nhật đơn hàng</Label>
                            <p className='text-sm text-gray-500'>Trạng thái giao hàng, thanh toán</p>
                          </div>
                          <Switch
                            id='orderUpdates'
                            checked={settings.orderUpdates}
                            onCheckedChange={(checked) => handleSettingChange('orderUpdates', checked)}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='prescriptionReminders'>Nhắc nhở đơn thuốc</Label>
                            <p className='text-sm text-gray-500'>Thời gian uống thuốc, tái khám</p>
                          </div>
                          <Switch
                            id='prescriptionReminders'
                            checked={settings.prescriptionReminders}
                            onCheckedChange={(checked) => handleSettingChange('prescriptionReminders', checked)}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='promotions'>Khuyến mãi & Ưu đãi</Label>
                            <p className='text-sm text-gray-500'>Sale, discount, voucher mới</p>
                          </div>
                          <Switch
                            id='promotions'
                            checked={settings.promotions}
                            onCheckedChange={(checked) => handleSettingChange('promotions', checked)}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='healthTips'>Lời khuyên sức khỏe</Label>
                            <p className='text-sm text-gray-500'>Tips chăm sóc sức khỏe</p>
                          </div>
                          <Switch
                            id='healthTips'
                            checked={settings.healthTips}
                            onCheckedChange={(checked) => handleSettingChange('healthTips', checked)}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <div>
                            <Label htmlFor='systemAlerts'>Cảnh báo hệ thống</Label>
                            <p className='text-sm text-gray-500'>Bảo mật, cập nhật hệ thống</p>
                          </div>
                          <Switch
                            id='systemAlerts'
                            checked={settings.systemAlerts}
                            onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quiet Hours */}
                    <div>
                      <h3 className='font-medium mb-4'>Giờ yên tĩnh</h3>
                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='quietHours'>Tắt thông báo từ 21:00 - 07:00</Label>
                          <p className='text-sm text-gray-500'>Không nhận thông báo trong giờ nghỉ ngơi</p>
                        </div>
                        <Switch
                          id='quietHours'
                          checked={settings.quietHours}
                          onCheckedChange={(checked) => handleSettingChange('quietHours', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    
  )
}
