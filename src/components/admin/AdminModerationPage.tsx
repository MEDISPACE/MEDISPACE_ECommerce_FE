import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  EyeOff,
  ShieldAlert,
  Trash2,
  UserX,
  MoreHorizontal,
  RefreshCw,
  History,
  Sparkles,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import moderationService from '~/services/moderationService'
import type {
  ModerationAction,
  ModerationActionLog,
  ModerationAppeal,
  ModerationAppealType,
  ModerationQueueItem,
} from '~/types/moderation'

const PAGE_SIZE = 20

const severityMeta: Record<string, { label: string; className: string }> = {
  low: { label: 'LOW', className: 'bg-[#E8EDF5] text-[#0A2463]' },
  medium: { label: 'MED', className: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'HIGH', className: 'bg-orange-100 text-orange-700' },
  critical: { label: 'CRIT', className: 'bg-red-100 text-red-700' },
}

const triggerLabel: Record<string, string> = {
  auto: 'Auto mod',
  user_report: 'Báo cáo người dùng',
  ai: 'AI moderation',
}

const deprecatedActionTypes = new Set(['mute_user', 'unmute_user', 'restore_message'])

const actionMeta: Record<string, { label: string; sentence: string; className: string }> = {
  approve: {
    label: 'Duyệt hiển thị',
    sentence: 'đã duyệt hiển thị nội dung của',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  hide: {
    label: 'Ẩn nội dung',
    sentence: 'đã ẩn nội dung của',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  delete: {
    label: 'Xóa nội dung',
    sentence: 'đã xóa nội dung của',
    className: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  ban_user: {
    label: 'Chặn người dùng',
    sentence: 'đã chặn người dùng',
    className: 'bg-red-50 text-red-700 border-red-100',
  },
  unban_user: {
    label: 'Bỏ chặn người dùng',
    sentence: 'đã bỏ chặn người dùng',
    className: 'bg-blue-50 text-[#0A2463] border-blue-100',
  },
}

const statusLabel: Record<string, string> = {
  visible: 'Đang hiển thị',
  hidden: 'Đã ẩn',
  deleted: 'Đã xóa',
}

function formatActionTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getPersonName(user?: { firstName?: string; lastName?: string; email?: string }, fallback?: string) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || fallback || 'Người dùng'
}

function getQueueKey(item: ModerationQueueItem) {
  return item.messageId || item.message?._id || item._id
}

function getTriggerText(item: ModerationQueueItem) {
  if ((item.reportCount || 0) > 0 || item.categories?.includes('user_report')) return triggerLabel.user_report
  return triggerLabel[item.trigger || 'auto'] || item.trigger || 'Auto mod'
}

function moderationPlainText(value?: string) {
  if (!value) return ''
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(value, 'text/html').body.textContent?.replace(/\u00a0/g, ' ').trim() || ''
  }
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function isThreadStarterFinding(item?: ModerationQueueItem | null) {
  if (!item) return false
  return Boolean(
    item.message?.isThreadStarter ||
      (item.thread?.starterMessageId && item.messageId && item.thread.starterMessageId === item.messageId) ||
      (item.thread?.starterMessageId && item.message?._id && item.thread.starterMessageId === item.message._id),
  )
}

function getModeratedContentLabel(item?: ModerationQueueItem | null) {
  return isThreadStarterFinding(item) ? 'Tiêu đề bài viết' : 'Nội dung tin nhắn'
}

function getModeratedContentText(item?: ModerationQueueItem | null) {
  if (!item) return 'Nội dung không khả dụng'
  if (isThreadStarterFinding(item) && item.thread?.title) return moderationPlainText(item.thread.title)
  return moderationPlainText(item.message?.content) || 'Nội dung không khả dụng'
}

function QueueRow({
  item,
  active,
  onSelect,
}: {
  item: ModerationQueueItem
  active: boolean
  onSelect: () => void
}) {
  const severity = item.severity || 'low'
  const severityBadge = severityMeta[severity] || severityMeta.low
  const previewText = getModeratedContentText(item)
  const createdAt = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })
    : ''

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        active ? 'border-blue-400 bg-[#F0F6FF]/60' : 'border-[#E8EDF5] hover:border-[#BFDBFE] hover:bg-[#F0F6FF]/40'
      }`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-gray-900 line-clamp-1'>
            {item.room?.name || 'Phòng cộng đồng'}
          </p>
          <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
            {previewText}
          </p>
        </div>
        <Badge className={severityBadge.className}>{severityBadge.label}</Badge>
      </div>

      <div className='flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500'>
        <span>{getTriggerText(item)}</span>
        {item.reportCount ? <span>• {item.reportCount} báo cáo</span> : null}
        {createdAt ? <span>• {createdAt}</span> : null}
      </div>
    </button>
  )
}

export function AdminModerationPage() {
  const [items, setItems] = useState<ModerationQueueItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isPerforming, setIsPerforming] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ModerationAction | null>(null)
  const [confirmTargetKey, setConfirmTargetKey] = useState<string | null>(null)
  const [actionLogs, setActionLogs] = useState<ModerationActionLog[]>([])
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([])
  const [queueSearch, setQueueSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [appealStatus, setAppealStatus] = useState<'all' | 'open' | 'approved' | 'rejected'>('open')
  const [appealType, setAppealType] = useState<'all' | ModerationAppealType>('all')
  const [appealSearch, setAppealSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [actionSearch, setActionSearch] = useState('')
  const [actionDateFrom, setActionDateFrom] = useState('')
  const [actionDateTo, setActionDateTo] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadQueue = useCallback(
    async (pageNum = 1) => {
      try {
        setIsLoading(true)
        const res = await moderationService.getQueue({
          page: pageNum,
          limit: PAGE_SIZE,
          severity: severityFilter === 'all' ? undefined : (severityFilter as any),
          trigger: triggerFilter === 'all' ? undefined : (triggerFilter as any),
          search: queueSearch.trim() || undefined,
        })
        setItems(res.items)
        setTotal(res.total)
        setPage(pageNum)
        if (res.items.length > 0) {
          const nextKey = getQueueKey(res.items[0])
          setSelectedKey((prev) => (prev && res.items.some((item) => getQueueKey(item) === prev) ? prev : nextKey))
        } else {
          setSelectedKey(null)
        }
      } catch {
        toast.error('Không thể tải danh sách kiểm duyệt')
      } finally {
        setIsLoading(false)
      }
    },
    [queueSearch, severityFilter, triggerFilter],
  )

  const loadActions = useCallback(async () => {
    try {
      const res = await moderationService.getActions({
        page: 1,
        limit: 10,
        action: actionFilter === 'all' ? undefined : actionFilter,
        search: actionSearch.trim() || undefined,
        dateFrom: actionDateFrom || undefined,
        dateTo: actionDateTo || undefined,
      })
      setActionLogs(res.items)
    } catch {
      // Audit history is secondary; keep queue usable if it fails.
    }
  }, [actionDateFrom, actionDateTo, actionFilter, actionSearch])

  const loadAppeals = useCallback(async () => {
    try {
      const res = await moderationService.getAppeals({
        page: 1,
        limit: 20,
        status: appealStatus === 'all' ? undefined : appealStatus,
        type: appealType === 'all' ? undefined : appealType,
        search: appealSearch.trim() || undefined,
      })
      setAppeals(res.items)
    } catch {
      // Appeal queue is secondary to moderation queue.
    }
  }, [appealSearch, appealStatus, appealType])

  useEffect(() => {
    loadQueue(1)
  }, [loadQueue])

  useEffect(() => {
    loadActions()
  }, [loadActions])

  useEffect(() => {
    loadAppeals()
  }, [loadAppeals])

  useEffect(() => {
    if (!selectedKey && items.length > 0) {
      setSelectedKey(getQueueKey(items[0]))
    }
  }, [items, selectedKey])

  const selectedItem = useMemo(
    () => items.find((item) => getQueueKey(item) === selectedKey) || null,
    [items, selectedKey],
  )
  const selectedMessageText = getModeratedContentText(selectedItem)
  const selectedContentLabel = getModeratedContentLabel(selectedItem)

  const filteredItems = items
  const visibleActionLogs = actionLogs.filter((log) => !deprecatedActionTypes.has(log.action))

  const performAction = async (action: ModerationAction, target: ModerationQueueItem) => {
    const messageId = target.messageId || target.message?._id
    if (!messageId) {
      toast.error('Không tìm thấy messageId để xử lý')
      return
    }

    try {
      setIsPerforming(true)
      await moderationService.takeAction({
        messageId,
        action,
        notes: notes.trim() || undefined,
        targetUserId: target.senderId,
      })

      toast.success('Đã thực hiện hành động')

      setItems((prev) => prev.filter((item) => getQueueKey(item) !== getQueueKey(target)))
      setTotal((prev) => Math.max(prev - 1, 0))
      setNotes('')
      loadActions()
    } catch {
      toast.error('Không thể thực hiện hành động')
    } finally {
      setIsPerforming(false)
    }
  }

  const handleAction = async (action: ModerationAction) => {
    if (!selectedItem) return

    if (action === 'delete' || action === 'ban_user') {
      setConfirmAction(action)
      setConfirmTargetKey(getQueueKey(selectedItem))
      setConfirmOpen(true)
      return
    }

    await performAction(action, selectedItem)
  }

  const handleConfirm = async () => {
    if (!confirmAction || !confirmTargetKey) return

    const target = items.find((item) => getQueueKey(item) === confirmTargetKey)
    if (!target) {
      toast.error('Mục cần xử lý không còn trong hàng đợi')
      setConfirmOpen(false)
      return
    }

    setConfirmOpen(false)
    await performAction(confirmAction, target)
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
    loadQueue(nextPage)
  }

  const handleResolveAppeal = async (appeal: ModerationAppeal, decision: 'approved' | 'rejected') => {
    try {
      setIsPerforming(true)
      await moderationService.resolveAppeal({
        appealId: appeal._id,
        decision,
        notes: notes.trim() || undefined,
      })
      toast.success(decision === 'approved' ? 'Đã chấp nhận appeal' : 'Đã từ chối appeal')
      setAppeals((prev) =>
        appealStatus === 'open'
          ? prev.filter((item) => item._id !== appeal._id)
          : prev.map((item) =>
              item._id === appeal._id ? { ...item, status: decision, decisionNotes: notes.trim() || undefined } : item,
            ),
      )
      setNotes('')
      loadActions()
      loadQueue(page)
    } catch {
      toast.error('Không thể xử lý appeal')
    } finally {
      setIsPerforming(false)
    }
  }

  return (
    <div className='space-y-6'>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) {
            setConfirmAction(null)
            setConfirmTargetKey(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hành động</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thực hiện hành động này? Hành động có thể không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPerforming}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPerforming}
              onClick={() => {
                void handleConfirm()
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{ backgroundImage: 'linear-gradient(to right, #0A2463, #1E40AF)' }}
          >
            Kiểm duyệt cộng đồng
          </h1>
          <p className='text-gray-600 mt-1'>Duyệt nội dung bị báo cáo hoặc bị tự động gắn cờ.</p>
        </div>
        <Button variant='outline' className='border-[#BFDBFE] gap-2' onClick={() => loadQueue(page)}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start'>
        <Card className='bg-white border-[#E8EDF5] lg:col-span-1 lg:max-h-[calc(100vh-180px)]'>
          <CardContent className='flex min-h-0 flex-col gap-3 p-4 lg:max-h-[calc(100vh-180px)]'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-gray-900'>Hàng đợi kiểm duyệt</h3>
              <Badge className='bg-[#E8EDF5] text-[#0A2463]'>{filteredItems.length}/{total}</Badge>
            </div>
            <div className='space-y-2'>
              <Input
                placeholder='Tìm phòng, slug, nội dung'
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
              />
              <div className='grid grid-cols-2 gap-2'>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Mọi mức độ</SelectItem>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='critical'>Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Mọi nguồn</SelectItem>
                    <SelectItem value='auto'>Auto mod</SelectItem>
                    <SelectItem value='user_report'>User report</SelectItem>
                    <SelectItem value='ai'>AI moderation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className='h-20 rounded-xl bg-[#F0F6FF] animate-pulse' />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className='text-center py-10 text-gray-500'>
                  <AlertCircle className='w-8 h-8 mx-auto mb-2 text-blue-400' />
                  Không có nội dung phù hợp
                </div>
              ) : (
                <div className='space-y-3'>
                  {filteredItems.map((item) => {
                    const key = getQueueKey(item)
                    return (
                      <QueueRow
                        key={key}
                        item={item}
                        active={key === selectedKey}
                        onSelect={() => setSelectedKey(key)}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(page + 1)} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>

        <Card className='bg-white border-[#E8EDF5] lg:col-span-2 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto'>
          <CardContent className='p-6 space-y-5'>
            {!selectedItem ? (
              <div className='text-center py-12 text-gray-500'>
                <ShieldAlert className='w-10 h-10 mx-auto mb-3 text-blue-400' />
                Chọn một mục để xem chi tiết
              </div>
            ) : (
              <>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h2 className='text-xl font-semibold text-gray-900'>
                      {selectedItem.room?.name || 'Phòng cộng đồng'}
                    </h2>
                    <p className='text-sm text-gray-500 mt-1'>
                      #{selectedItem.room?.slug || selectedItem.roomId}
                    </p>
                  </div>
                  <Badge className={severityMeta[selectedItem.severity || 'low']?.className || severityMeta.low.className}>
                    {severityMeta[selectedItem.severity || 'low']?.label || 'LOW'}
                  </Badge>
                </div>

                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-gray-700'>{selectedContentLabel}</p>
                  <div className='rounded-lg border border-[#E8EDF5] bg-[#F0F6FF] p-4 text-sm text-gray-800 whitespace-pre-wrap break-words'>
                    {selectedMessageText}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <p className='text-sm font-semibold text-gray-700'>Nhãn vi phạm</p>
                    <div className='flex flex-wrap gap-2'>
                      {(selectedItem.categories || []).length === 0 ? (
                        <Badge variant='outline' className='border-gray-200 text-gray-600'>
                          Không có
                        </Badge>
                      ) : (
                        selectedItem.categories?.map((cat) => (
                          <Badge key={cat} className='bg-[#E8EDF5] text-[#0A2463]'>
                            {cat}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm font-semibold text-gray-700'>Trigger</p>
                    <Badge variant='outline' className='border-gray-200 text-gray-600'>
                      {getTriggerText(selectedItem)}
                    </Badge>
                  </div>
                </div>

                <div className='rounded-lg border border-[#E8EDF5] bg-[#F0F6FF] p-4 space-y-3'>
                  <p className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                    <Sparkles className='w-4 h-4 text-[#1E40AF]' />
                    AI moderation
                  </p>
                  {selectedItem.ai ? (
                    <div className='text-sm'>
                      <p className='text-xs text-gray-500'>Lý do AI</p>
                      <p className='text-gray-700'>{selectedItem.ai.reason}</p>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-600'>Chưa có phân tích AI cho mục này.</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-gray-700'>Ghi chú</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder='Ghi chú nội bộ (tuỳ chọn)'
                    rows={3}
                  />
                </div>

                <div className='flex flex-wrap items-center gap-3 pt-2'>
                  <Button
                    className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'
                    onClick={() => handleAction('approve')}
                    disabled={isPerforming}
                  >
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Duyệt hiển thị
                  </Button>
                  <Button variant='outline' className='border-[#BFDBFE]' onClick={() => handleAction('hide')} disabled={isPerforming}>
                    <EyeOff className='w-4 h-4 mr-2' />
                    Ẩn
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' className='border-[#BFDBFE] text-[#0A2463]' disabled={isPerforming}>
                        <MoreHorizontal className='w-4 h-4 mr-2' />
                        Thêm
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='w-64 bg-white'>
                      <DropdownMenuLabel>Hành động nội dung</DropdownMenuLabel>
                      <DropdownMenuItem className='text-red-600 focus:text-red-600' onClick={() => handleAction('delete')}>
                        <Trash2 className='w-4 h-4 mr-2' />
                        Xóa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Hạn chế người dùng</DropdownMenuLabel>
                      <DropdownMenuItem className='text-red-600 focus:text-red-600' onClick={() => handleAction('ban_user')}>
                        <UserX className='w-4 h-4 mr-2' />
                        Ban user
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAction('unban_user')}>Unban</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='bg-white border-[#E8EDF5]'>
        <CardContent className='p-5 space-y-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
              <ShieldAlert className='w-4 h-4 text-[#1E40AF]' />
              Appeal đang chờ xử lý
            </h3>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <Input
                className='sm:w-64'
                placeholder='Tìm user, phòng, lý do'
                value={appealSearch}
                onChange={(event) => setAppealSearch(event.target.value)}
              />
              <Select value={appealType} onValueChange={(value: 'all' | ModerationAppealType) => setAppealType(value)}>
                <SelectTrigger className='w-36'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Mọi loại</SelectItem>
                  <SelectItem value='ban'>Ban</SelectItem>
                  <SelectItem value='message'>Message</SelectItem>
                </SelectContent>
              </Select>
              <Select value={appealStatus} onValueChange={(value: 'all' | 'open' | 'approved' | 'rejected') => setAppealStatus(value)}>
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='open'>Đang mở</SelectItem>
                  <SelectItem value='approved'>Đã chấp nhận</SelectItem>
                  <SelectItem value='rejected'>Đã từ chối</SelectItem>
                  <SelectItem value='all'>Tất cả</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                className='h-10 w-10 border-[#BFDBFE] p-0'
                onClick={loadAppeals}
                title='Làm mới yêu cầu xem xét lại'
                aria-label='Làm mới yêu cầu xem xét lại'
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </div>
          </div>
          {appeals.length === 0 ? (
            <p className='text-sm text-gray-500 py-4'>Không có appeal mở.</p>
          ) : (
            <div className='divide-y divide-blue-50'>
              {appeals.map((appeal) => {
                const userName = `${appeal.user?.firstName || ''} ${appeal.user?.lastName || ''}`.trim()
                return (
                  <div key={appeal._id} className='py-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                    <div className='min-w-0 space-y-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge className='bg-[#E8EDF5] text-[#0A2463]'>{appeal.type}</Badge>
                        <Badge
                          className={
                            appeal.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : appeal.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {appeal.status}
                        </Badge>
                        <p className='text-sm font-semibold text-gray-900'>
                          {userName || appeal.user?.email || appeal.userId}
                        </p>
                        <span className='text-xs text-gray-500'>#{appeal.room?.slug || appeal.roomId}</span>
                      </div>
                      <p className='text-sm text-gray-600'>{appeal.reason}</p>
                      {appeal.message?.content && (
                        <p className='text-xs text-gray-500 line-clamp-2'>Tin nhắn: {moderationPlainText(appeal.message.content)}</p>
                      )}
                      {appeal.decisionNotes && (
                        <p className='text-xs text-gray-500'>Ghi chú xử lý: {appeal.decisionNotes}</p>
                      )}
                    </div>
                    {appeal.status === 'open' && (
                      <div className='flex items-center gap-2 shrink-0'>
                        <Button
                          size='sm'
                          className='bg-green-600 text-white hover:bg-green-700'
                          disabled={isPerforming}
                          onClick={() => handleResolveAppeal(appeal, 'approved')}
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='border-red-200 text-red-600'
                          disabled={isPerforming}
                          onClick={() => handleResolveAppeal(appeal, 'rejected')}
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='bg-white border-[#E8EDF5]'>
        <CardContent className='p-5 space-y-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
              <History className='w-4 h-4 text-[#1E40AF]' />
              Lịch sử xử lý gần đây
            </h3>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <Input
                type='date'
                className='sm:w-40'
                value={actionDateFrom}
                onChange={(event) => setActionDateFrom(event.target.value)}
              />
              <Input
                type='date'
                className='sm:w-40'
                value={actionDateTo}
                onChange={(event) => setActionDateTo(event.target.value)}
              />
              <Input
                className='sm:w-80'
                placeholder='Tìm phòng, thread, người dùng, hành động'
                value={actionSearch}
                onChange={(event) => setActionSearch(event.target.value)}
              />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className='w-44'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả hành động</SelectItem>
                  <SelectItem value='approve'>{actionMeta.approve.label}</SelectItem>
                  <SelectItem value='hide'>{actionMeta.hide.label}</SelectItem>
                  <SelectItem value='delete'>{actionMeta.delete.label}</SelectItem>
                  <SelectItem value='ban_user'>{actionMeta.ban_user.label}</SelectItem>
                  <SelectItem value='unban_user'>{actionMeta.unban_user.label}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                className='h-10 w-10 border-[#BFDBFE] p-0'
                onClick={loadActions}
                title='Làm mới lịch sử'
                aria-label='Làm mới lịch sử'
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </div>
          </div>
          {visibleActionLogs.length === 0 ? (
            <p className='text-sm text-gray-500 py-4'>Chưa có lịch sử xử lý phù hợp.</p>
          ) : (
            <div className='divide-y divide-blue-50'>
              {visibleActionLogs.map((log) => {
                const actor = getPersonName(log.performedByUser, log.performedBy)
                const target = getPersonName(log.targetUser, log.targetUserId)
                const meta = actionMeta[log.action] || {
                  label: log.action,
                  sentence: 'đã thực hiện hành động với',
                  className: 'bg-gray-50 text-gray-700 border-gray-100',
                }
                const previousStatus = log.previousMessageStatus ? statusLabel[log.previousMessageStatus] || log.previousMessageStatus : ''
                return (
                  <div key={log._id} className='py-3 text-sm flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='font-medium text-gray-900 break-words'>
                        {actor} {meta.sentence} {target}
                      </p>
                      {log.thread?.title && (
                        <p className='mt-1 line-clamp-1 text-gray-600'>Thread: {log.thread.title}</p>
                      )}
                      <p className='mt-1 text-gray-500'>
                        {formatActionTime(log.createdAt)}{previousStatus ? ` · Trước đó: ${previousStatus}` : ''}
                      </p>
                      {log.notes && <p className='text-gray-600 mt-1'>{log.notes}</p>}
                    </div>
                    <Badge variant='outline' className={`shrink-0 ${meta.className}`}>
                      {meta.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminModerationPage
