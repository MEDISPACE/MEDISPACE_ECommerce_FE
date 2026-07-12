import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Bell,
  Check,
  Trash2,
  Package,
  FileText,
  Tag,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Truck,
  RotateCcw,
  Shield,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useNotifications, useUnreadNotificationCount } from '~/hooks/useNotifications'
import type { NotificationFilter } from '~/types/account'

// ─── Types ───────────────────────────────────────────────────────────────────

type Filter = NotificationFilter

interface Props {
  role?: 'admin' | 'pharmacist'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order: { icon: Package, color: 'text-[#1E40AF]', bg: 'bg-[#F0F6FF]', label: 'Đơn hàng' },
  payment: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Thanh toán' },
  shipping: { icon: Truck, color: 'text-sky-600', bg: 'bg-sky-50', label: 'Vận chuyển' },
  prescription: { icon: FileText, color: 'text-green-600', bg: 'bg-green-50', label: 'Đơn thuốc' },
  promotion: { icon: Tag, color: 'text-[#1E40AF]', bg: 'bg-[#F0F6FF]', label: 'Khuyến mãi' },
  system: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Hệ thống' },
  reminder: { icon: Bell, color: 'text-[#1E40AF]', bg: 'bg-[#F0F6FF]', label: 'Nhắc nhở' },
  review: { icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Đánh giá' },
  return: { icon: RotateCcw, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Đổi trả' },
  security: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50', label: 'Bảo mật' },
  community: { icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Cộng đồng' },
}
const DEFAULT_META = TYPE_META.system

const NOTIFICATION_FILTER_TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'order', label: 'Đơn hàng' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'shipping', label: 'Vận chuyển' },
  { key: 'prescription', label: 'Đơn thuốc' },
  { key: 'promotion', label: 'Khuyến mãi' },
  { key: 'reminder', label: 'Nhắc nhở' },
  { key: 'review', label: 'Đánh giá' },
  { key: 'return', label: 'Đổi trả' },
  { key: 'security', label: 'Bảo mật' },
  { key: 'community', label: 'Cộng đồng' },
  { key: 'system', label: 'Hệ thống' },
]

const typeBadgeClass: Record<string, string> = {
  order: 'bg-[#E8EDF5] text-[#0A2463]',
  payment: 'bg-emerald-100 text-emerald-700',
  shipping: 'bg-sky-100 text-sky-700',
  prescription: 'bg-green-100 text-green-700',
  promotion: 'bg-blue-100 text-blue-700',
  reminder: 'bg-indigo-100 text-indigo-700',
  system: 'bg-orange-100 text-orange-700',
  review: 'bg-amber-100 text-amber-700',
  return: 'bg-violet-100 text-violet-700',
  security: 'bg-red-100 text-red-700',
  community: 'bg-cyan-100 text-cyan-700',
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className='flex gap-3 px-4 py-4 border-b border-gray-50'>
      <Skeleton className='w-10 h-10 rounded-full flex-shrink-0' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-4 w-2/3' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-1/4' />
      </div>
    </div>
  )
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  n,
  onMarkAsRead,
  onDelete,
}: {
  n: Record<string, unknown>
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const id = (n._id ?? n.id ?? '') as string
  const type = (n.type as string) ?? 'system'
  const meta = TYPE_META[type] ?? DEFAULT_META
  const Icon = meta.icon
  const isRead = Boolean(n.isRead)
  const timeAgo = n.createdAt
    ? formatDistanceToNow(new Date(n.createdAt as string), { addSuffix: true, locale: vi })
    : ''

  const handleClick = () => {
    if (id && !isRead) onMarkAsRead(id)
    if (n.actionUrl) navigate(n.actionUrl as string)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex gap-4 px-4 py-4 border-b border-blue-50 last:border-0 cursor-pointer transition-colors hover:bg-[#F0F6FF]/50 ${
        !isRead ? 'bg-[#F0F6FF]/30' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator bar */}
      {!isRead && <span className='absolute left-0 top-3 bottom-3 w-0.5 bg-[#0A2463] rounded-r-full' />}

      {/* Type icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${meta.bg}`}>
        <Icon className={`w-5 h-5 ${meta.color}`} />
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <p className={`text-sm font-semibold leading-snug ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
            {n.title as string}
          </p>
          <div className='flex items-center gap-1.5 flex-shrink-0'>
            {!isRead && <span className='w-2 h-2 bg-[#0A2463] rounded-full mt-1 flex-shrink-0' />}
            <button
              className='opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500'
              title='Xóa thông báo'
              onClick={(e) => {
                e.stopPropagation()
                if (!id) return
                onDelete(id)
              }}
            >
              <Trash2 className='w-3.5 h-3.5' />
            </button>
          </div>
        </div>
        <p className='text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed'>{n.message as string}</p>
        <div className='flex items-center gap-2 mt-1.5'>
          <Badge
            variant='outline'
            className={`text-[10px] px-1.5 py-0 h-4 font-medium border-0 ${typeBadgeClass[type] ?? typeBadgeClass.system}`}
          >
            {meta.label}
          </Badge>
          <span className='text-[11px] text-gray-400'>{timeAgo}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminNotificationsPage({ role = 'admin' }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  const unreadCount = useUnreadNotificationCount()
  const { notifications, pagination, isLoading, isFetching, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(filter, page)

  const hasMore = pagination ? page < pagination.totalPages : false

  const handleDelete = (id: string) => {
    deleteNotification(id)
  }

  const handleMarkAll = () => {
    markAllAsRead()
  }

  // Stats summary: unread / total
  const totalCount = pagination?.total ?? notifications.length

  return (
    <div className='space-y-6'>
      {/* ── Page Header (matches system gradient pattern) ── */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{ backgroundImage: 'linear-gradient(to right, #0A2463, #1E40AF)' }}
          >
            Trung tâm thông báo
          </h1>
          <p className='text-gray-600 mt-1'>
            {unreadCount > 0 ? (
              <>
                Bạn có <span className='text-red-500 font-semibold'>{unreadCount}</span> thông báo chưa đọc
                {totalCount > 0 && <span className='text-gray-400'> / {totalCount} tổng</span>}
              </>
            ) : (
              `Tất cả ${totalCount} thông báo đã được đọc`
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant='outline'
            className='gap-2 border-[#BFDBFE] text-[#1E40AF] hover:bg-[#F0F6FF]'
            onClick={handleMarkAll}
          >
            <Check className='w-4 h-4' />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* ── Filter Tabs (matches InventoryManagementPage tab style) ── */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-4'>
          <div className='flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg w-fit max-w-full'>
            {NOTIFICATION_FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilter(tab.key)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === tab.key
                    ? 'bg-white text-[#0A2463] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.key === 'unread' && unreadCount > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      filter === 'unread' ? 'bg-[#E8EDF5] text-[#0A2463]' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Notification List Card ── */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='w-5 h-5 text-[#1E40AF]' />
            Danh sách thông báo
            {isFetching && !isLoading && <RefreshCw className='w-3.5 h-3.5 text-blue-400 animate-spin ml-1' />}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            // Skeleton per frontend_guidelines §5
            <div>
              {Array.from({ length: 6 }).map((_, i) => (
                <NotifSkeleton key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className='py-20 text-center'>
              <div className='w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4'>
                <Bell className='w-8 h-8 text-gray-200' />
              </div>
              <p className='text-gray-500 font-medium'>Không có thông báo nào</p>
              <p className='text-gray-400 text-sm mt-1'>
                {filter === 'unread' ? 'Bạn đã đọc hết tất cả thông báo 🎉' : 'Chưa có thông báo trong danh mục này'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {notifications.map((n) => {
                const key =
                  (n as unknown as { _id?: string })._id ??
                  (n as unknown as { id?: string }).id ??
                  Math.random().toString()
                return (
                  <NotifRow
                    key={key}
                    n={n as unknown as Record<string, unknown>}
                    onMarkAsRead={markAsRead}
                    onDelete={handleDelete}
                  />
                )
              })}
            </AnimatePresence>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className='px-4 py-4 border-t border-blue-50'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: pagination.totalPages }).map((_, i) => {
                    const pageNum = i + 1
                    // Show first, last, and current page +/- 1
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={page === pageNum}
                            onClick={() => setPage(pageNum)}
                            className='cursor-pointer'
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }

                    // Show ellipsis for gaps
                    if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }

                    return null
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      className={page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
