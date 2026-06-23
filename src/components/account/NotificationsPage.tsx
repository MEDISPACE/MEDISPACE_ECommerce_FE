import { useState } from 'react'
import { Bell, Check, Settings, Star } from 'lucide-react'

import { NotificationItem } from './NotificationItem'
import { Button } from '../ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem as PaginationItemUI,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { useNotificationPreferences, useNotifications, useUnreadNotificationCount } from '~/hooks/useNotifications'
import type { NotificationFilter, NotificationPreferences, NotificationType } from '~/types/account'


type UiNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  actionText?: string
}



const DEFAULT_PREFERENCES: NotificationPreferences = {
  channels: { inApp: true, email: true, push: false, sms: false },
  types: {
    order: true,
    payment: true,
    shipping: true,
    prescription: true,
    promotion: true,
    reminder: true,
    system: true,
    review: true,
    return: true,
    security: true,
    community: true,
  },
}

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const { preferences = DEFAULT_PREFERENCES, updatePreferences, isUpdatingPreferences } = useNotificationPreferences()

  // Use real hook with live data
  const filter = activeTab === 'all' || activeTab === 'unread' || activeTab === 'settings'
    ? activeTab === 'settings' ? 'all' : activeTab as 'all' | 'unread'
    : activeTab as NotificationFilter

  const { notifications: rawNotifications, pagination, markAsRead, markAllAsRead, deleteNotification } = useNotifications(filter, page)
  const unreadCount = useUnreadNotificationCount()

  // Map API notifications to UI format
  const notifications: UiNotification[] = rawNotifications.map((n) => {
    const obj = n as unknown as {
      id?: string; _id?: string; type?: string; title?: string
      message?: string; createdAt?: string; isRead?: boolean
      actionUrl?: string; actionText?: string
    }
    return {
      id: obj._id ?? obj.id ?? '',
      type: (obj.type as UiNotification['type']) ?? 'system',
      title: obj.title ?? '',
      message: obj.message ?? '',
      timestamp: obj.createdAt ?? new Date().toISOString(),
      isRead: Boolean(obj.isRead),
      actionUrl: obj.actionUrl,
      actionText: obj.actionText,
    }
  })

  const filteredNotifications = activeTab === 'settings' ? [] : notifications

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
    toast.success('Đã đánh dấu là đã đọc')
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification(notificationId)
    toast.success('Đã xóa thông báo')
  }

  const handleNotificationAction = (actionUrl: string) => {
    window.location.href = actionUrl
  }

  const handleChannelChange = (key: keyof NotificationPreferences['channels'], value: boolean) => {
    updatePreferences({ channels: { ...preferences.channels, [key]: value } })
  }

  const handleTypeChange = (key: NotificationType, value: boolean) => {
    updatePreferences({ types: { ...preferences.types, [key]: value } })
  }

  const getTabCount = (type: string) => {
    if (type === 'all') return notifications.length
    if (type === 'unread') return unreadCount
    return notifications.filter((n) => n.type === type).length
  }

  return (
    <div className='space-y-6' data-testid='notifications-page'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] bg-clip-text text-transparent'>
                Thông báo
              </h1>
              {unreadCount > 0 && <Badge className='bg-red-500 text-white' data-testid='unread-badge'>{unreadCount} chưa đọc</Badge>}
            </div>
            <p className='text-gray-600 mt-1'>Theo dõi các thông báo quan trọng</p>
          </div>

          <div className='flex gap-2'>
            {unreadCount > 0 && (
              <Button
                variant='outline'
                onClick={handleMarkAllAsRead}
                data-testid='mark-all-read-btn'
                className='text-[#1E40AF] border-[#BFDBFE] hover:bg-[#F0F6FF]'
              >
                <Check className='w-4 h-4 mr-2' />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
          <div className='px-6 pt-6'>
            <TabsList className='inline-flex w-full overflow-x-auto bg-[#E8EDF5] p-1 rounded-lg shadow-sm scrollbar-hide'>
              <TabsTrigger
                value='all'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  Tất cả
                  {getTabCount('all') > 0 && (
                    <span className='ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-white text-[#1E40AF]'>
                      {getTabCount('all')}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='unread'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  Chưa đọc
                  {getTabCount('unread') > 0 && (
                    <span className='ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-500 text-white'>
                      {getTabCount('unread')}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='order'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:!shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  Đơn hàng
                  {getTabCount('order') > 0 && (
                    <span className='ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-white text-[#1E40AF]'>
                      {getTabCount('order')}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='review'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-amber-500 data-[state=active]:!text-white data-[state=active]:!shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  <Star className='w-3.5 h-3.5' />
                  Đánh giá
                  {getTabCount('review') > 0 && (
                    <span className='ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-white text-amber-600'>
                      {getTabCount('review')}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='promotion'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:!shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  Khuyến mãi
                  {getTabCount('promotion') > 0 && (
                    <span className='ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-white text-[#1E40AF]'>
                      {getTabCount('promotion')}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='reminder'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:!shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  Nhắc nhở
                  {getTabCount('reminder') > 0 && (
                    <span className='ml-1 rounded-full px-2 py-0.5 text-xs font-medium bg-white text-[#1E40AF]'>
                      {getTabCount('reminder')}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='settings'
                data-testid='notifications-settings-tab'
                className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-[#E8EDF5] text-[#1E40AF] border-0 data-[state=active]:!bg-[#0A2463] data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-[#BFDBFE]'
              >
                <span className='whitespace-nowrap flex items-center gap-1'>
                  <Settings className='w-4 h-4' />
                  Cài đặt
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <Separator />

          {/* Notification Lists */}
          <TabsContent value='all' className='p-6 space-y-4' data-testid='notification-list'>
            {filteredNotifications.length === 0 ? (
              <div className='text-center py-12' data-testid='notifications-empty-state'>
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
                  onDelete={handleDeleteNotification}
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
                  onDelete={handleDeleteNotification}
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
                onDelete={handleDeleteNotification}
              />
            ))}
          </TabsContent>

          {/* Review notifications tab — approved & rejected */}
          <TabsContent value='review' className='p-6 space-y-4'>
            {filteredNotifications.length === 0 ? (
              <div className='text-center py-12'>
                <Star className='w-16 h-16 mx-auto text-amber-200 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có thông báo đánh giá</h3>
                <p className='text-gray-500'>Thông báo khi đánh giá được duyệt hoặc từ chối sẽ xuất hiện tại đây</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onAction={handleNotificationAction}
                  onDelete={handleDeleteNotification}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value='promotion' className='p-6 space-y-4'>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onAction={handleNotificationAction}
                onDelete={handleDeleteNotification}
              />
            ))}
          </TabsContent>

          <TabsContent value='reminder' className='p-6 space-y-4'>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onAction={handleNotificationAction}
                onDelete={handleDeleteNotification}
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
                    <div className='mb-4 flex items-center justify-between gap-3'>
                      <h3 className='font-medium'>Kênh nhận thông báo</h3>
                      {isUpdatingPreferences && <span className='text-xs text-gray-500'>Đang lưu...</span>}
                    </div>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='email'>Email</Label>
                          <p className='text-sm text-gray-500'>Nhận thông báo qua email</p>
                        </div>
                        <Switch
                          id='email'
                          data-testid='notification-email-toggle'
                          data-saved='true'
                          checked={preferences.channels.email}
                          onCheckedChange={(checked) => handleChannelChange('email', checked)}
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='sms'>SMS</Label>
                          <p className='text-sm text-gray-500'>Kênh SMS sẽ được bật khi có nhà cung cấp gửi tin</p>
                        </div>
                        <Switch
                          id='sms'
                          checked={false}
                          disabled
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='push'>Push Notification</Label>
                          <p className='text-sm text-gray-500'>Thông báo đẩy trình duyệt sẽ được bật sau khi cấu hình web push</p>
                        </div>
                        <Switch
                          id='push'
                          checked={false}
                          disabled
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
                          checked={preferences.types.order && preferences.types.payment && preferences.types.shipping}
                          onCheckedChange={(checked) => { handleTypeChange('order', checked); handleTypeChange('payment', checked); handleTypeChange('shipping', checked) }}
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='prescriptionReminders'>Nhắc nhở đơn thuốc</Label>
                          <p className='text-sm text-gray-500'>Thời gian uống thuốc, tái khám</p>
                        </div>
                        <Switch
                          id='prescriptionReminders'
                          checked={preferences.types.prescription && preferences.types.reminder}
                          onCheckedChange={(checked) => { handleTypeChange('prescription', checked); handleTypeChange('reminder', checked) }}
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='promotions'>Khuyến mãi & Ưu đãi</Label>
                          <p className='text-sm text-gray-500'>Sale, discount, voucher mới</p>
                        </div>
                        <Switch
                          id='promotions'
                          checked={preferences.types.promotion}
                          onCheckedChange={(checked) => handleTypeChange('promotion', checked)}
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='healthTips'>Lời khuyên sức khỏe</Label>
                          <p className='text-sm text-gray-500'>Tips chăm sóc sức khỏe</p>
                        </div>
                        <Switch
                          id='healthTips'
                          checked={preferences.types.community}
                          onCheckedChange={(checked) => handleTypeChange('community', checked)}
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <Label htmlFor='systemAlerts'>Cảnh báo hệ thống</Label>
                          <p className='text-sm text-gray-500'>Bảo mật, cập nhật hệ thống</p>
                        </div>
                        <Switch
                          id='systemAlerts'
                          checked={preferences.types.system && preferences.types.review}
                          onCheckedChange={(checked) => { handleTypeChange('system', checked); handleTypeChange('review', checked) }}
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
                        <p className='text-sm text-gray-500'>Sẽ được bật khi backend hỗ trợ khung giờ yên tĩnh riêng</p>
                      </div>
                      <Switch
                        id='quietHours'
                        checked={false}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination Controls */}
        {activeTab !== 'settings' && pagination && pagination.totalPages > 1 && (
          <div className='px-6 py-4 border-t border-[#E8EDF5]/50 mt-4'>
            <Pagination>
              <PaginationContent>
                <PaginationItemUI>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItemUI>

                {Array.from({ length: pagination.totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <PaginationItemUI key={pageNum}>
                        <PaginationLink
                          isActive={page === pageNum}
                          onClick={() => setPage(pageNum)}
                          className='cursor-pointer'
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItemUI>
                    )
                  }
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <PaginationItemUI key={pageNum}>
                        <PaginationEllipsis />
                      </PaginationItemUI>
                    )
                  }
                  return null
                })}

                <PaginationItemUI>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    data-testid='notifications-next-page'
                    className={page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItemUI>
              </PaginationContent>
            </Pagination>
            <span className='sr-only' data-testid='notifications-page-current'>{page}</span>
          </div>
        )}
      </div>
    </div>
  )
}
