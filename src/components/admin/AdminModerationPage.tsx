import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  EyeOff,
  ShieldAlert,
  Trash2,
  UserMinus,
  UserX,
  RefreshCw,
  History,
  RotateCcw,
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
import moderationService from '~/services/moderationService'
import type {
  AiModerationJob,
  AiModerationJobStatus,
  ModerationAction,
  ModerationActionLog,
  ModerationAppeal,
  ModerationAppealType,
  ModerationQueueItem,
} from '~/types/moderation'

const PAGE_SIZE = 20

const severityMeta: Record<string, { label: string; className: string }> = {
  low: { label: 'LOW', className: 'bg-blue-100 text-blue-700' },
  medium: { label: 'MED', className: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'HIGH', className: 'bg-orange-100 text-orange-700' },
  critical: { label: 'CRIT', className: 'bg-red-100 text-red-700' },
}

const triggerLabel: Record<string, string> = {
  auto: 'Auto mod',
  user_report: 'Báo cáo người dùng',
  ai: 'AI review',
}

function getQueueKey(item: ModerationQueueItem) {
  return item.messageId || item.message?._id || item._id
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
  const createdAt = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })
    : ''

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        active ? 'border-blue-400 bg-blue-50/60' : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50/40'
      }`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-gray-900 line-clamp-1'>
            {item.room?.name || 'Phòng cộng đồng'}
          </p>
          <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
            {item.message?.content || 'Nội dung không khả dụng'}
          </p>
        </div>
        <Badge className={severityBadge.className}>{severityBadge.label}</Badge>
      </div>

      <div className='flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500'>
        <span>{triggerLabel[item.trigger || 'auto'] || item.trigger || 'Auto mod'}</span>
        {item.ai ? <span>• AI {item.ai.confidence.toFixed(2)}</span> : null}
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
  const [duration, setDuration] = useState('60')
  const [isPerforming, setIsPerforming] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ModerationAction | null>(null)
  const [confirmTargetKey, setConfirmTargetKey] = useState<string | null>(null)
  const [actionLogs, setActionLogs] = useState<ModerationActionLog[]>([])
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([])
  const [aiJobs, setAiJobs] = useState<AiModerationJob[]>([])
  const [aiJobTotal, setAiJobTotal] = useState(0)
  const [queueSearch, setQueueSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [appealStatus, setAppealStatus] = useState<'all' | 'open' | 'approved' | 'rejected'>('open')
  const [appealType, setAppealType] = useState<'all' | ModerationAppealType>('all')
  const [appealSearch, setAppealSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [actionDateFrom, setActionDateFrom] = useState('')
  const [actionDateTo, setActionDateTo] = useState('')
  const [actionRoomId, setActionRoomId] = useState('')
  const [actionTargetUserId, setActionTargetUserId] = useState('')
  const [aiJobStatus, setAiJobStatus] = useState<'all' | AiModerationJobStatus>('all')
  const [aiJobSearch, setAiJobSearch] = useState('')
  const [aiJobRoomId, setAiJobRoomId] = useState('')
  const [aiJobMessageId, setAiJobMessageId] = useState('')

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
        roomId: actionRoomId.trim() || undefined,
        targetUserId: actionTargetUserId.trim() || undefined,
        dateFrom: actionDateFrom || undefined,
        dateTo: actionDateTo || undefined,
      })
      setActionLogs(res.items)
    } catch {
      // Audit history is secondary; keep queue usable if it fails.
    }
  }, [actionDateFrom, actionDateTo, actionFilter, actionRoomId, actionTargetUserId])

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

  const loadAiJobs = useCallback(async () => {
    try {
      const res = await moderationService.getAiJobs({
        page: 1,
        limit: 20,
        status: aiJobStatus === 'all' ? undefined : aiJobStatus,
        roomId: aiJobRoomId.trim() || undefined,
        messageId: aiJobMessageId.trim() || undefined,
        search: aiJobSearch.trim() || undefined,
      })
      setAiJobs(res.items)
      setAiJobTotal(res.total)
    } catch {
      // AI audit is secondary to moderation actions.
    }
  }, [aiJobMessageId, aiJobRoomId, aiJobSearch, aiJobStatus])

  useEffect(() => {
    loadQueue(1)
    loadActions()
    loadAppeals()
    loadAiJobs()
  }, [loadActions, loadAiJobs, loadAppeals, loadQueue])

  useEffect(() => {
    if (!selectedKey && items.length > 0) {
      setSelectedKey(getQueueKey(items[0]))
    }
  }, [items, selectedKey])

  const selectedItem = useMemo(
    () => items.find((item) => getQueueKey(item) === selectedKey) || null,
    [items, selectedKey],
  )

  const filteredItems = items

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
        durationMinutes: action === 'mute_user' ? Number(duration) : undefined,
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

  const handleAiReview = async () => {
    if (!selectedItem) return
    const messageId = selectedItem.messageId || selectedItem.message?._id
    if (!messageId) {
      toast.error('Không tìm thấy messageId để chạy AI')
      return
    }

    try {
      setIsPerforming(true)
      await moderationService.rerunAiReview(messageId)
      toast.success('Đã đưa tin nhắn vào hàng chờ AI moderation')
      await loadQueue(page)
    } catch {
      toast.error('Không thể chạy AI moderation')
    } finally {
      setIsPerforming(false)
    }
  }

  const handleRetryAiJob = async (job: AiModerationJob) => {
    try {
      setIsPerforming(true)
      await moderationService.retryAiJob(job._id)
      toast.success('Đã đưa AI job vào hàng chờ chạy lại')
      await loadAiJobs()
    } catch {
      toast.error('Không thể chạy lại AI job')
    } finally {
      setIsPerforming(false)
    }
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
            style={{ backgroundImage: 'linear-gradient(to right, #0066CC, #4A90E2)' }}
          >
            Kiểm duyệt cộng đồng
          </h1>
          <p className='text-gray-600 mt-1'>Duyệt nội dung bị báo cáo hoặc bị tự động gắn cờ.</p>
        </div>
        <Button variant='outline' className='border-blue-200 gap-2' onClick={() => loadQueue(page)}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <Card className='lg:col-span-1 bg-white border-blue-100'>
          <CardContent className='p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-gray-900'>Hàng đợi kiểm duyệt</h3>
              <Badge className='bg-blue-100 text-blue-700'>{filteredItems.length}/{total}</Badge>
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
                    <SelectItem value='ai'>AI review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='h-20 rounded-xl bg-blue-50 animate-pulse' />
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

        <Card className='lg:col-span-2 bg-white border-blue-100'>
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
                  <p className='text-sm font-semibold text-gray-700'>Nội dung tin nhắn</p>
                  <div className='rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-800'>
                    {selectedItem.message?.content || 'Nội dung không khả dụng'}
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
                          <Badge key={cat} className='bg-blue-100 text-blue-700'>
                            {cat}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <p className='text-sm font-semibold text-gray-700'>Lý do</p>
                    <ul className='text-sm text-gray-600 space-y-1'>
                      {(selectedItem.reasons || []).length === 0 ? (
                        <li>Không có</li>
                      ) : (
                        selectedItem.reasons?.map((reason) => <li key={reason}>• {reason}</li>)
                      )}
                    </ul>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <p className='text-sm font-semibold text-gray-700'>Độ tin cậy</p>
                    <Badge className='bg-blue-100 text-blue-700'>
                      {typeof selectedItem.confidence === 'number'
                        ? selectedItem.confidence.toFixed(2)
                        : (selectedItem.confidence || 'unknown').toString().toUpperCase()}
                    </Badge>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm font-semibold text-gray-700'>Trigger</p>
                    <Badge variant='outline' className='border-gray-200 text-gray-600'>
                      {triggerLabel[selectedItem.trigger || 'auto'] || selectedItem.trigger || 'Tự động'}
                    </Badge>
                  </div>
                </div>

                <div className='rounded-lg border border-violet-100 bg-violet-50 p-4 space-y-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <p className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                      <Sparkles className='w-4 h-4 text-violet-600' />
                      AI moderation
                    </p>
                    <Button
                      variant='outline'
                      className='border-violet-200 text-violet-700'
                      onClick={handleAiReview}
                      disabled={isPerforming}
                    >
                      <Sparkles className='w-4 h-4 mr-2' />
                      Chạy AI review
                    </Button>
                  </div>
                  {selectedItem.ai ? (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm'>
                      <div>
                        <p className='text-xs text-gray-500'>Đề xuất</p>
                        <Badge className='bg-violet-100 text-violet-700'>{selectedItem.ai.suggestedAction}</Badge>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Confidence</p>
                        <p className='font-medium text-gray-800'>{selectedItem.ai.confidence.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Latency</p>
                        <p className='font-medium text-gray-800'>
                          {selectedItem.ai.latencyMs ? `${selectedItem.ai.latencyMs}ms` : 'n/a'}
                        </p>
                      </div>
                      <div className='md:col-span-3'>
                        <p className='text-xs text-gray-500'>Lý do AI</p>
                        <p className='text-gray-700'>{selectedItem.ai.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-600'>Chưa có kết quả AI cho tin nhắn này.</p>
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
                    className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    onClick={() => handleAction('approve')}
                    disabled={isPerforming}
                  >
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Duyệt hiển thị
                  </Button>
                  <Button variant='outline' className='border-blue-200' onClick={() => handleAction('hide')} disabled={isPerforming}>
                    <EyeOff className='w-4 h-4 mr-2' />
                    Ẩn
                  </Button>
                  <Button variant='outline' className='border-red-200 text-red-600' onClick={() => handleAction('delete')} disabled={isPerforming}>
                    <Trash2 className='w-4 h-4 mr-2' />
                    Xóa
                  </Button>
                  <Button variant='outline' className='border-green-200 text-green-700' onClick={() => handleAction('restore_message')} disabled={isPerforming}>
                    <RotateCcw className='w-4 h-4 mr-2' />
                    Khôi phục
                  </Button>
                </div>

                <div className='flex flex-wrap items-center gap-3 border-t border-blue-100 pt-4'>
                  <div className='w-48'>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder='Thời gian mute' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='60'>Mute 60 phút</SelectItem>
                        <SelectItem value='120'>Mute 2 giờ</SelectItem>
                        <SelectItem value='360'>Mute 6 giờ</SelectItem>
                        <SelectItem value='1440'>Mute 24 giờ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant='outline' className='border-orange-200 text-orange-600' onClick={() => handleAction('mute_user')} disabled={isPerforming}>
                    <UserMinus className='w-4 h-4 mr-2' />
                    Mute user
                  </Button>
                  <Button variant='outline' className='border-red-200 text-red-600' onClick={() => handleAction('ban_user')} disabled={isPerforming}>
                    <UserX className='w-4 h-4 mr-2' />
                    Ban user
                  </Button>
                  <Button variant='outline' className='border-blue-200 text-blue-700' onClick={() => handleAction('unmute_user')} disabled={isPerforming}>
                    Unmute
                  </Button>
                  <Button variant='outline' className='border-blue-200 text-blue-700' onClick={() => handleAction('unban_user')} disabled={isPerforming}>
                    Unban
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='bg-white border-blue-100'>
        <CardContent className='p-5 space-y-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
              <Sparkles className='w-4 h-4 text-violet-600' />
              AI moderation jobs
            </h3>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <Input
                className='sm:w-72'
                placeholder='Tìm phòng, slug, message, lỗi'
                value={aiJobSearch}
                onChange={(event) => setAiJobSearch(event.target.value)}
              />
              <Input
                className='sm:w-48'
                placeholder='roomId'
                value={aiJobRoomId}
                onChange={(event) => setAiJobRoomId(event.target.value)}
              />
              <Input
                className='sm:w-48'
                placeholder='messageId'
                value={aiJobMessageId}
                onChange={(event) => setAiJobMessageId(event.target.value)}
              />
              <Select value={aiJobStatus} onValueChange={(value: 'all' | AiModerationJobStatus) => setAiJobStatus(value)}>
                <SelectTrigger className='sm:w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Mọi trạng thái</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='running'>Running</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='succeeded'>Succeeded</SelectItem>
                </SelectContent>
              </Select>
              <Button variant='outline' className='border-violet-200 text-violet-700' onClick={loadAiJobs}>
                Làm mới AI
              </Button>
            </div>
          </div>
          <div className='text-xs text-gray-500'>{aiJobs.length}/{aiJobTotal} job</div>
          {aiJobs.length === 0 ? (
            <p className='text-sm text-gray-500 py-4'>Chưa có AI moderation job phù hợp.</p>
          ) : (
            <div className='divide-y divide-violet-50'>
              {aiJobs.map((job) => (
                <div key={job._id} className='py-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='min-w-0 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge
                        className={
                          job.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : job.status === 'succeeded'
                              ? 'bg-green-100 text-green-700'
                              : job.status === 'running'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {job.status}
                      </Badge>
                      <span className='text-sm font-semibold text-gray-900'>
                        {job.room?.name || job.roomId}
                      </span>
                      <span className='text-xs text-gray-500'>attempts {job.attempts || 0}</span>
                      {job.latencyMs ? <span className='text-xs text-gray-500'>{job.latencyMs}ms</span> : null}
                    </div>
                    <p className='text-sm text-gray-600 line-clamp-2'>
                      {job.message?.content || job.messageId}
                    </p>
                    {job.aiResult && (
                      <p className='text-xs text-gray-500'>
                        AI: {job.aiResult.severity} / {job.aiResult.confidence.toFixed(2)} / {job.aiResult.suggestedAction}
                      </p>
                    )}
                    {job.lastError && <p className='text-xs text-red-600 line-clamp-2'>Lỗi: {job.lastError}</p>}
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='border-violet-200 text-violet-700'
                      disabled={isPerforming || job.status === 'running'}
                      onClick={() => handleRetryAiJob(job)}
                    >
                      <RotateCcw className='w-4 h-4 mr-1' />
                      Retry
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='bg-white border-blue-100'>
        <CardContent className='p-5 space-y-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
              <ShieldAlert className='w-4 h-4 text-blue-600' />
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
                  <SelectItem value='mute'>Mute</SelectItem>
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
              <Button variant='outline' className='border-blue-200' onClick={loadAppeals}>
                Làm mới appeal
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
                        <Badge className='bg-blue-100 text-blue-700'>{appeal.type}</Badge>
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
                        <p className='text-xs text-gray-500 line-clamp-2'>Tin nhắn: {appeal.message.content}</p>
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

      <Card className='bg-white border-blue-100'>
        <CardContent className='p-5 space-y-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
              <History className='w-4 h-4 text-blue-600' />
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
                className='sm:w-48'
                placeholder='roomId'
                value={actionRoomId}
                onChange={(event) => setActionRoomId(event.target.value)}
              />
              <Input
                className='sm:w-48'
                placeholder='targetUserId'
                value={actionTargetUserId}
                onChange={(event) => setActionTargetUserId(event.target.value)}
              />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className='w-44'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Mọi action</SelectItem>
                  <SelectItem value='approve'>Approve</SelectItem>
                  <SelectItem value='hide'>Hide</SelectItem>
                  <SelectItem value='delete'>Delete</SelectItem>
                  <SelectItem value='mute_user'>Mute</SelectItem>
                  <SelectItem value='ban_user'>Ban</SelectItem>
                  <SelectItem value='unmute_user'>Unmute</SelectItem>
                  <SelectItem value='unban_user'>Unban</SelectItem>
                  <SelectItem value='restore_message'>Restore</SelectItem>
                </SelectContent>
              </Select>
              <Button variant='outline' className='border-blue-200' onClick={loadActions}>
                Làm mới lịch sử
              </Button>
            </div>
          </div>
          {actionLogs.length === 0 ? (
            <p className='text-sm text-gray-500 py-4'>Chưa có action nào.</p>
          ) : (
            <div className='divide-y divide-blue-50'>
              {actionLogs.map((log) => {
                const actor = `${log.performedByUser?.firstName || ''} ${log.performedByUser?.lastName || ''}`.trim()
                const target = `${log.targetUser?.firstName || ''} ${log.targetUser?.lastName || ''}`.trim()
                return (
                  <div key={log._id} className='py-3 text-sm flex items-start justify-between gap-3'>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {log.action} {target ? `- ${target}` : ''}
                      </p>
                      <p className='text-gray-500'>
                        {actor || log.performedBy} · {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                      </p>
                      {log.notes && <p className='text-gray-600 mt-1'>{log.notes}</p>}
                    </div>
                    <Badge variant='outline' className='border-blue-200 text-blue-700'>
                      {log.previousMessageStatus || 'n/a'}
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
