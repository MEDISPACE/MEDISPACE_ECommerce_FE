import { useState } from 'react'
import { Bell, Check, Trash2, Package, FileText, Tag, Heart, Settings, AlertCircle, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { useNotifications, useUnreadNotificationCount } from '~/hooks/useNotifications'
import { useAuth } from '~/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Notification } from '~/types/account'

// ─── Type icon map ─────────────────────────────────────────────────────────────
const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  order: Package,
  prescription: FileText,
  promotion: Tag,
  health: Heart,
  reminder: Heart,
  system: AlertCircle,
  review: Star,
}

const typeColors: Record<string, string> = {
  order: 'text-blue-500 bg-blue-500/10',
  prescription: 'text-green-500 bg-green-500/10',
  promotion: 'text-orange-500 bg-orange-500/10',
  health: 'text-pink-500 bg-pink-500/10',
  reminder: 'text-purple-500 bg-purple-500/10',
  system: 'text-gray-500 bg-gray-500/10',
  review: 'text-amber-500 bg-amber-500/10',
}

function NotificationListItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (url?: string) => void
}) {
  const n = notification as unknown as {
    _id?: string
    id?: string
    type?: string
    title?: string
    message?: string
    isRead?: boolean
    createdAt?: string
    actionUrl?: string
  }

  const id = n._id ?? n.id ?? ''
  const type = n.type ?? 'system'
  const Icon = typeIcons[type] ?? Settings
  const colorClass = typeColors[type] ?? typeColors.system
  const isRead = Boolean(n.isRead)

  const timeAgo = n.createdAt
    ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer outline-none border border-transparent hover:bg-blue-500/10 ${
        !isRead ? 'bg-blue-500/5' : ''
      }`}
      onClick={() => {
        if (!isRead) onMarkAsRead(id)
        if (n.actionUrl) onNavigate(n.actionUrl)
      }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className='w-4 h-4' />
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <p className={`text-sm font-medium truncate ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
            {n.title}
          </p>
          {!isRead && (
            <span className='flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1' />
          )}
        </div>
        <p className='text-xs text-gray-500 line-clamp-2 mt-0.5'>{n.message}</p>
        <p className='text-xs text-gray-400 mt-1'>{timeAgo}</p>
      </div>

      {/* Delete button (visible on hover) */}
      <button
        className='flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500'
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        title='Xóa thông báo'
      >
        <Trash2 className='w-3.5 h-3.5' />
      </button>
    </motion.div>
  )
}

// ─── Main Dropdown ─────────────────────────────────────────────────────────────

export function NotificationDropdown({ viewAllUrl = '/account/notifications' }: { viewAllUrl?: string } = {}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const unreadCount = useUnreadNotificationCount()
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications('all', 1)

  if (!isAuthenticated) return null

  // Show only 5 most recent in dropdown
  const preview = notifications.slice(0, 5)

  const handleNavigate = (url?: string) => {
    setOpen(false)
    if (url) navigate(url)
  }

  return (
    <div className='relative'>
      {/* Bell trigger */}
      <Button
        variant='ghost'
        size='sm'
        className='relative hover:!bg-blue-50 p-2'
        onClick={() => setOpen((prev) => !prev)}
        aria-label='Thông báo'
      >
        <Bell className='w-5 h-5 text-gray-600' />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key='badge'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className='absolute right-0 top-full mt-2 w-96 z-50 bg-white border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden'
            >
              {/* Header */}
              <div className='flex items-center justify-between px-4 py-3 border-b border-blue-500/10'>
                <div className='flex items-center gap-2'>
                  <Bell className='w-4 h-4 text-blue-500' />
                  <span className='font-semibold text-gray-800 text-sm'>Thông báo</span>
                  {unreadCount > 0 && (
                    <Badge className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-full'>
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className='text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium'
                  >
                    <Check className='w-3 h-3' />
                    Đọc hết
                  </button>
                )}
              </div>

              {/* List */}
              <ScrollArea className='max-h-80 [&>[data-slot=scroll-area-viewport]]:max-h-80'>
                {preview.length === 0 ? (
                  <div className='text-center py-10'>
                    <Bell className='w-10 h-10 mx-auto text-gray-200 mb-2' />
                    <p className='text-sm text-gray-400'>Chưa có thông báo</p>
                  </div>
                ) : (
                  <div className='py-2'>
                    {preview.map((n, i) => (
                      <div key={(n as unknown as { _id?: string })._id ?? i}>
                        <NotificationListItem
                          notification={n}
                          onMarkAsRead={(id) => markAsRead(id)}
                          onDelete={(id) => deleteNotification(id)}
                          onNavigate={handleNavigate}
                        />
                        {i < preview.length - 1 && <Separator className='mx-4 opacity-40' />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className='border-t border-blue-500/10 px-4 py-2.5 bg-white relative z-10'>
                <Link
                  to={viewAllUrl}
                  onClick={() => setOpen(false)}
                  className='block text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors'
                >
                  Xem tất cả thông báo →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
