import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Flag, Link2, Loader2, MessageCircle, Paperclip, Pencil, Plus, Reply, ShieldCheck, Smile, Trash2, Video, X } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { PaginationComponent } from '~/components/shared/PaginationComponent'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import { RichTextEditor } from '~/components/ui/rich-text-editor'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import communityService from '~/services/communityService'
import type { CommunityMessage, CommunityReactionType, CommunityThread } from '~/types/community'
import { formatRelativeTime } from './communityUi'
import { ThreadMetric, ThreadPrefixBadge, ThreadStateBadges, authorInitials, authorName } from './forumUi'

const REPLIES_PER_PAGE = 20

const REPORT_REASONS = [
  { value: 'medical_misinformation', label: 'Thông tin y tế sai lệch' },
  { value: 'unsafe_advice', label: 'Khuyến nghị dùng thuốc/nguy hiểm' },
  { value: 'privacy', label: 'Lộ thông tin cá nhân' },
  { value: 'harassment', label: 'Công kích hoặc xúc phạm' },
  { value: 'spam', label: 'Spam/quảng cáo' },
  { value: 'other', label: 'Khác' },
]

const MESSAGE_REACTIONS: Array<{ type: CommunityReactionType; icon: string; label: string }> = [
  { type: 'love', icon: '❤️', label: 'Yêu thích' },
  { type: 'haha', icon: '😆', label: 'Haha' },
  { type: 'wow', icon: '😮', label: 'Wow' },
  { type: 'sad', icon: '😢', label: 'Buồn' },
  { type: 'angry', icon: '😠', label: 'Giận' },
  { type: 'like', icon: '👍', label: 'Thích' }
]

const EXTRA_MESSAGE_REACTIONS: Array<{ type: CommunityReactionType; icon: string; label: string }> = [
  { type: 'helpful', icon: '💡', label: 'Hữu ích' },
  { type: 'thanks', icon: '🙏', label: 'Cảm ơn' },
  { type: 'care', icon: '💙', label: 'Đồng cảm' },
  { type: 'dislike', icon: '👎', label: 'Không đồng ý' }
]

const ALL_MESSAGE_REACTIONS = [...MESSAGE_REACTIONS, ...EXTRA_MESSAGE_REACTIONS]

const ALLOWED_COMMUNITY_HTML_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'SPAN'])
const ALLOWED_COMMUNITY_HTML_ATTRS = new Set(['href', 'target', 'rel'])

function isEmptyRichText(value?: string) {
  if (!value) return true
  const text = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return text.length === 0
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function plainTextToHtml(value: string) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function richTextToPlainText(value?: string) {
  if (!value) return ''
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(value, 'text/html').body.textContent?.trim() || ''
  }
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function sanitizeCommunityHtml(value?: string) {
  if (!value) return ''
  const source = /<\/?[a-z][\s\S]*>/i.test(value) ? value : plainTextToHtml(value)
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return plainTextToHtml(source.replace(/<[^>]*>/g, ''))
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement
        if (!ALLOWED_COMMUNITY_HTML_TAGS.has(element.tagName)) {
          element.replaceWith(...Array.from(element.childNodes))
          return
        }
        Array.from(element.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase()
          if (!ALLOWED_COMMUNITY_HTML_ATTRS.has(name) && !name.startsWith('data-')) element.removeAttribute(attr.name)
        })
        if (element.tagName === 'A') {
          const href = element.getAttribute('href') || ''
          if (!/^https?:\/\//i.test(href) && !href.startsWith('/')) element.removeAttribute('href')
          element.setAttribute('target', '_blank')
          element.setAttribute('rel', 'noreferrer')
        }
      }
      walk(child)
    })
  }
  walk(doc.body)
  return doc.body.innerHTML
}

function CommunityHtmlContent({ value, className = '' }: { value?: string; className?: string }) {
  return <div className={`community-rich-content ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeCommunityHtml(value) }} />
}

function formatMeetingTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function ThreadVideoMeetingPanel({ thread }: { thread: CommunityThread }) {
  const meeting = thread.videoMeeting
  if (!meeting?.url || meeting.status === 'ended') return null

  const live = meeting.status === 'live'
  const isInternalLiveKitRoom = meeting.url.startsWith('/community/video-events/')
  const buttonContent = (
    <>
      <Video className='h-4 w-4' />
      Tham gia phòng
    </>
  )
  return (
    <div className={`border-b px-4 py-4 ${live ? 'border-rose-100 bg-rose-50' : 'border-blue-100 bg-[#F4F8FF]'}`}>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${live ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-[#0A2463]'}`}>
              <Video className='h-4 w-4' />
            </span>
            <div>
              <p className={`text-sm font-semibold ${live ? 'text-rose-800' : 'text-[#0A2463]'}`}>{live ? 'Đang thảo luận trực tuyến' : 'Phòng thảo luận trực tuyến'}</p>
              <p className='text-xs text-slate-600'>{meeting.title || 'Chủ đề này có phòng video để mọi người trao đổi nhanh hơn.'}</p>
            </div>
          </div>
          <p className='mt-2 text-xs leading-5 text-slate-600'>
            {meeting.startsAt ? `${live ? 'Bắt đầu' : 'Dự kiến'}: ${formatMeetingTime(meeting.startsAt)}. ` : ''}
            {meeting.note || 'Không chia sẻ thông tin cá nhân nhạy cảm. Nội dung trao đổi chỉ mang tính tham khảo.'}
          </p>
        </div>
        <Button asChild className={`${live ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0A2463] hover:bg-[#12357D]'} shrink-0 text-white`}>
          {isInternalLiveKitRoom ? <Link to={meeting.url}>{buttonContent}</Link> : <a href={meeting.url}>{buttonContent}</a>}
        </Button>
      </div>
    </div>
  )
}

function ReplyBlock({
  message,
  onQuote,
  onReport,
  onCopyLink,
  onReact,
  onEdit,
  onDelete,
  editing,
  editText,
  editPending,
  onEditTextChange,
  onSubmitEdit,
  onCancelEdit,
  reacting,
  currentUserId,
}: {
  message: CommunityMessage
  onQuote: (message: CommunityMessage) => void
  onReport: (message: CommunityMessage) => void
  onCopyLink: (messageId: string) => void
  onReact: (message: CommunityMessage, type: CommunityReactionType) => void
  onEdit: (message: CommunityMessage) => void
  onDelete: (message: CommunityMessage) => void
  editing?: boolean
  editText?: string
  editPending?: boolean
  onEditTextChange: (value: string) => void
  onSubmitEdit: () => void
  onCancelEdit: () => void
  reacting?: boolean
  currentUserId?: string
}) {
  const hidden = message.status === 'hidden'
  const replyText = richTextToPlainText(message.replyTo?.content) || (message.replyTo?.imageUrl ? 'Đã gửi ảnh' : '')
  const isOwner = Boolean(currentUserId && String(message.senderId) === currentUserId)
  return (
    <article id={`post-${message._id}`} className={`scroll-mt-24 overflow-hidden rounded-lg border shadow-sm ${hidden ? 'border-amber-200 bg-amber-50' : 'border-[#DDE7F3] bg-white'}`}>
      <div className='border-b border-slate-100 bg-[#F8FBFF] px-3 py-2 text-xs text-slate-600'>
        <span className='font-semibold text-[#0A2463]'>{authorName(message.sender)}</span> trả lời {formatRelativeTime(message.createdAt)}
      </div>
      <div className='grid md:grid-cols-[170px_minmax(0,1fr)]'>
        <aside className='border-b border-slate-100 bg-[#F8FBFF] p-3 md:border-b-0 md:border-r'>
          <div className='flex items-center gap-3 md:block md:text-center'>
            <Avatar className='h-12 w-12 shrink-0 rounded-lg border border-blue-100 md:mx-auto'>
              <AvatarImage src={message.sender?.avatar} />
              <AvatarFallback>{authorInitials(message.sender)}</AvatarFallback>
            </Avatar>
            <div className='min-w-0 md:mt-2'>
              <p className='truncate text-sm font-semibold text-slate-950'>{authorName(message.sender)}</p>
              <p className='text-[11px] text-slate-500'>Thành viên</p>
            </div>
          </div>
        </aside>
        <div className='min-w-0 p-4'>
          {hidden ? (
            <p className='text-sm text-amber-800'>Reply này đang bị ẩn để chờ điều phối.</p>
          ) : editing ? (
            <div className='space-y-3'>
              <div className='overflow-hidden rounded-lg border border-blue-200 bg-white focus-within:border-[#5B8DEF] focus-within:ring-2 focus-within:ring-blue-50'>
                <RichTextEditor
                  value={editText || ''}
                  onChange={onEditTextChange}
                  placeholder='Nội dung bài viết'
                  height={180}
                />
                {message.imageUrl && (
                  <div className='mx-4 mb-4 w-fit'>
                    <img src={message.imageUrl} alt='Ảnh hiện tại' className='h-24 w-24 rounded-lg border border-blue-100 object-cover shadow-sm' />
                  </div>
                )}
                <div className='flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-[#FBFDFF] px-3 py-3'>
                  <Button type='button' variant='outline' size='sm' className='rounded-lg border-blue-100' disabled={editPending} onClick={onCancelEdit}>Hủy</Button>
                  <Button type='button' size='sm' className='rounded-lg bg-[#0A2463] text-white hover:bg-[#12357D]' disabled={editPending || (isEmptyRichText(editText) && !message.imageUrl)} onClick={onSubmitEdit}>
                    {editPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Pencil className='h-4 w-4' />}
                    Lưu chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-3 text-sm leading-7 text-slate-950'>
              {message.replyTo && (
                <div className='border-l-4 border-blue-100 bg-blue-50 px-3 py-2 text-xs text-[#0A2463]'>
                  <p className='font-semibold'>{authorName(message.replyTo.sender)}</p>
                  <p className='mt-0.5 line-clamp-2 break-words'>{replyText}</p>
                </div>
              )}
              {message.imageUrl && <img src={message.imageUrl} alt='Ảnh trong reply' className='max-h-80 rounded-lg border border-slate-100 object-cover' loading='lazy' />}
              {message.content && <CommunityHtmlContent value={message.content} className='break-words' />}
              {message.editedAt && <p className='text-[11px] text-slate-500'>Đã chỉnh sửa {formatRelativeTime(message.editedAt)}</p>}
            </div>
          )}
          {!hidden && !editing && (
            <div className='mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#edf1f5] pt-3'>
              <div className='flex flex-wrap justify-end gap-2'>
                <ReactionBar message={message} onReact={onReact} disabled={reacting} />
                <Button variant='ghost' size='sm' className='h-8 rounded px-2 text-slate-600 hover:text-[#0A2463]' onClick={() => onCopyLink(message._id)}><Link2 className='h-4 w-4' />Link</Button>
                {isOwner && <Button variant='ghost' size='sm' className='h-8 rounded px-2 text-slate-600 hover:text-[#0A2463]' onClick={() => onEdit(message)}><Pencil className='h-4 w-4' />Sửa</Button>}
                {isOwner && !message.isThreadStarter && <Button variant='ghost' size='sm' className='h-8 rounded px-2 text-rose-600 hover:text-rose-700' onClick={() => onDelete(message)}><Trash2 className='h-4 w-4' />Xóa</Button>}
                <Button variant='ghost' size='sm' className='h-8 rounded px-2 text-[#0A2463]' onClick={() => onQuote(message)}><Reply className='h-4 w-4' />Trích dẫn</Button>
                <Button variant='ghost' size='sm' className='h-8 rounded px-2 text-rose-600 hover:text-rose-700' onClick={() => onReport(message)}><Flag className='h-4 w-4' />Báo cáo</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function ReactionBar({ message, onReact, disabled }: { message: CommunityMessage; onReact: (message: CommunityMessage, type: CommunityReactionType) => void; disabled?: boolean }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showExtraReactions, setShowExtraReactions] = useState(false)
  const reactionRootRef = useRef<HTMLDivElement | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const activeReaction = ALL_MESSAGE_REACTIONS.find((reaction) => reaction.type === message.viewerReaction)
  const totalReactionCount = ALL_MESSAGE_REACTIONS.reduce((total, reaction) => total + (message.reactionCounts?.[reaction.type] || 0), 0)

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const togglePicker = () => {
    if (disabled) return
    setPickerOpen((open) => !open)
  }

  const handlePointerDown = () => {
    if (disabled) return
    longPressTriggeredRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true
      setPickerOpen(true)
    }, 420)
  }

  const handlePointerEnd = () => {
    clearLongPressTimer()
  }

  const handleTogglePicker = () => {
    if (disabled) return
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }
    togglePicker()
  }

  const chooseReaction = (type: CommunityReactionType) => {
    if (disabled) return
    setPickerOpen(false)
    setShowExtraReactions(false)
    longPressTriggeredRef.current = false
    onReact(message, type)
  }

  useEffect(() => {
    if (!pickerOpen) return undefined
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!reactionRootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false)
        setShowExtraReactions(false)
      }
    }
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPickerOpen(false)
        setShowExtraReactions(false)
      }
    }
    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [pickerOpen])

  useEffect(() => () => clearLongPressTimer(), [])

  return (
    <div
      ref={reactionRootRef}
      className='relative flex items-center gap-1.5'
      aria-label='Reaction bài viết'
    >
      {pickerOpen && (
        <div className='absolute bottom-full right-0 z-30 mb-2 flex w-max max-w-[calc(100vw-32px)] flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-[#d8e2f2] bg-white px-2 py-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.18)]'>
          {[...MESSAGE_REACTIONS, ...(showExtraReactions ? EXTRA_MESSAGE_REACTIONS : [])].map((reaction) => {
            const active = message.viewerReaction === reaction.type
            const count = message.reactionCounts?.[reaction.type] || 0
            return (
              <button
                key={reaction.type}
                type='button'
                aria-label={`${reaction.label}${count ? `, ${count} reaction` : ''}`}
                className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[25px] leading-none transition-transform hover:-translate-y-1 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#0A2463]/30 ${active ? 'bg-[#EEF5FF]' : 'hover:bg-[#F4F8FF]'}`}
                disabled={disabled}
                onClick={() => chooseReaction(reaction.type)}
              >
                <span aria-hidden='true'>{reaction.icon}</span>
                <span className='pointer-events-none absolute -top-8 hidden whitespace-nowrap rounded-full bg-[#0f172a] px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block group-focus:block'>
                  {reaction.label}
                </span>
              </button>
            )
          })}
          <button
            type='button'
            aria-label={showExtraReactions ? 'Ẩn reaction phụ' : 'Thêm reaction'}
            aria-expanded={showExtraReactions}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0A2463]/30 ${showExtraReactions ? 'bg-[#E2EEFF] text-[#0A2463]' : 'bg-slate-100 hover:bg-slate-200'}`}
            onClick={() => setShowExtraReactions((value) => !value)}
          >
            <Plus className={`h-5 w-5 transition-transform ${showExtraReactions ? 'rotate-45' : ''}`} />
          </button>
        </div>
      )}

      <Button
        type='button'
        variant='outline'
        size='sm'
        aria-label={activeReaction ? `${activeReaction.label}${totalReactionCount ? `, ${totalReactionCount} reaction` : ''}` : 'Chọn reaction'}
        aria-pressed={Boolean(activeReaction)}
        className={`h-9 min-w-9 rounded-full px-2.5 text-sm font-semibold transition-colors ${activeReaction ? 'border-[#0A2463] bg-[#EEF5FF] text-[#0A2463] hover:bg-[#E2EEFF]' : 'border-[#d8e2f2] text-slate-600 hover:border-[#0A2463] hover:bg-[#F4F8FF] hover:text-[#0A2463]'}`}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onClick={handleTogglePicker}
      >
        {activeReaction ? (
          <span aria-hidden='true' className='text-base leading-none'>{activeReaction.icon}</span>
        ) : (
          <Smile className='h-4 w-4' />
        )}
        {totalReactionCount > 0 && <span className='text-slate-500'>{totalReactionCount}</span>}
      </Button>
    </div>
  )
}

export function CommunityThreadPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const roomId = params.roomId as string
  const threadId = params.threadId as string
  const { isAuthenticated, user } = useAuth()
  const { isConnected, joinCommunityRoom, leaveCommunityRoom, subscribe, unsubscribe } = useSocketContext()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [quoteTarget, setQuoteTarget] = useState<CommunityMessage | null>(null)
  const [reportTarget, setReportTarget] = useState<CommunityMessage | null>(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value)
  const [reportDetail, setReportDetail] = useState('')
  const [editTarget, setEditTarget] = useState<CommunityMessage | null>(null)
  const [editText, setEditText] = useState('')
  const [newReplyCount, setNewReplyCount] = useState(0)
  const replyDraftKey = threadId ? `community-reply-draft:${threadId}` : ''
  const page = Math.max(1, Number(searchParams.get('page') || 1))

  const threadQuery = useQuery({
    queryKey: ['community', 'thread', threadId],
    queryFn: () => communityService.getThread(threadId),
    enabled: Boolean(threadId),
    staleTime: 15_000,
    retry: false,
  })

  const threadReady = Boolean(threadQuery.data?._id)

  const repliesQuery = useQuery({
    queryKey: ['community', 'thread-replies', threadId, page],
    queryFn: () => communityService.listThreadReplies({ threadId, page, limit: REPLIES_PER_PAGE }),
    enabled: Boolean(threadId) && threadReady,
    staleTime: 10_000,
    retry: false,
  })

  const replyMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined
      if (replyImageFile) {
        setUploadingImage(true)
        try {
          const { uploadImage } = await import('~/services/mediaService')
          imageUrl = await uploadImage(replyImageFile)
        } finally {
          setUploadingImage(false)
        }
      }

      return communityService.createThreadReply({
        threadId,
        content: replyText,
        imageUrl,
        replyToMessageId: quoteTarget?._id,
      })
    },
    onSuccess: () => {
      toast.success('Đã gửi reply')
      const nextTotal = (repliesQuery.data?.total || 0) + 1
      const nextPage = Math.max(1, Math.ceil(nextTotal / REPLIES_PER_PAGE))
      setReplyText('')
      setReplyImageFile(null)
      setReplyImagePreview('')
      setQuoteTarget(null)
      if (replyDraftKey) window.localStorage.removeItem(replyDraftKey)
      queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'threads', roomId] })
      updatePage(nextPage)
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể gửi reply'),
  })

  const reportMutation = useMutation({
    mutationFn: () => {
      if (!reportTarget) throw new Error('Missing report target')
      const reasonLabel = REPORT_REASONS.find((item) => item.value === reportReason)?.label || 'Khác'
      const detail = reportDetail.trim()
      return communityService.reportMessage({ messageId: reportTarget._id, reason: detail ? `${reasonLabel}: ${detail}` : reasonLabel })
    },
    onSuccess: () => {
      toast.success('Đã báo cáo nội dung')
      setReportTarget(null)
      setReportReason(REPORT_REASONS[0].value)
      setReportDetail('')
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể báo cáo nội dung'),
  })

  const reactionMutation = useMutation({
    mutationFn: ({ messageId, type }: { messageId: string; type: CommunityReactionType | null }) => communityService.reactToMessage({ messageId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể cập nhật reaction'),
  })

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editTarget) throw new Error('Missing edit target')
      return communityService.updateMessage({ messageId: editTarget._id, content: editText, imageUrl: editTarget.imageUrl })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật bài viết')
      setEditTarget(null)
      setEditText('')
      queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'threads', roomId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể sửa bài viết'),
  })

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => communityService.deleteMessage(messageId),
    onSuccess: () => {
      toast.success('Đã xóa bài viết')
      queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'threads', roomId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể xóa bài viết'),
  })

  const thread = threadQuery.data
  const canReply = isAuthenticated && thread && !thread.locked

  const handleReply = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để reply')
      navigate('/login', { state: { from: { pathname: `/community/${roomId}/t/${threadId}` } } })
      return
    }
    if (isEmptyRichText(replyText) && !replyImageFile) {
      toast.error('Reply cần có nội dung hoặc hình ảnh')
      return
    }
    replyMutation.mutate()
  }

  const handleOpenReport = (message: CommunityMessage) => {
    if (user?._id && String(message.senderId) === user._id) {
      toast.error('Bạn không thể báo cáo bài viết của chính mình')
      return
    }
    setReportTarget(message)
  }

  const handleReact = (message: CommunityMessage, type: CommunityReactionType) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để react')
      navigate('/login', { state: { from: { pathname: `/community/${roomId}/t/${threadId}` } } })
      return
    }
    if (user?._id && String(message.senderId) === user._id) {
      toast.error('Bạn không thể react bài viết của chính mình')
      return
    }
    reactionMutation.mutate({ messageId: message._id, type: message.viewerReaction === type ? null : type })
  }

  const handleOpenEdit = (message: CommunityMessage) => {
    setEditTarget(message)
    setEditText(message.content || '')
  }

  const handleDelete = (message: CommunityMessage) => {
    if (message.isThreadStarter) {
      toast.error('Không thể tự xóa bài mở đầu thread')
      return
    }
    if (!window.confirm('Xóa bài viết này? Nội dung sẽ được ẩn khỏi thread.')) return
    deleteMutation.mutate(message._id)
  }

  const handleSubmitEdit = () => {
    if (!editTarget) return
    if (isEmptyRichText(editText) && !editTarget.imageUrl) {
      toast.error('Bài viết cần có nội dung hoặc ảnh')
      return
    }
    editMutation.mutate()
  }

  const updatePage = (nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextPage <= 1) next.delete('page')
      else next.set('page', String(nextPage))
      return next
    })
  }

  const buildPostUrl = (messageId: string, targetPage = page) => {
    const path = `/community/${roomId}/t/${threadId}`
    const query = targetPage > 1 ? `?page=${targetPage}` : ''
    return `${window.location.origin}${path}${query}#post-${messageId}`
  }

  const handleCopyPostLink = async (messageId: string, targetPage = page) => {
    const url = buildPostUrl(messageId, targetPage)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã copy link bài viết')
    } catch {
      toast.error('Không thể copy link')
    }
  }

  const handleLoadNewReplies = () => {
    const nextTotal = (repliesQuery.data?.total || 0) + newReplyCount
    const nextPage = Math.max(1, Math.ceil(nextTotal / REPLIES_PER_PAGE))
    setNewReplyCount(0)
    updatePage(nextPage)
    queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
    queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
  }

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB')
      return
    }

    setReplyImageFile(file)
    setReplyImagePreview(URL.createObjectURL(file))
    toast.success('Đã chọn ảnh. Ảnh sẽ được tải lên khi gửi reply.')
  }

  useEffect(() => {
    if (!replyDraftKey || typeof window === 'undefined') return
    const rawDraft = window.localStorage.getItem(replyDraftKey)
    if (!rawDraft) return

    try {
      const draft = JSON.parse(rawDraft) as { content?: string }
      setReplyText(draft.content || '')
    } catch {
      window.localStorage.removeItem(replyDraftKey)
    }
  }, [replyDraftKey])

  useEffect(() => {
    if (!replyDraftKey || typeof window === 'undefined') return
    const hasDraft = replyText.trim()
    if (!hasDraft) {
      window.localStorage.removeItem(replyDraftKey)
      return
    }

    window.localStorage.setItem(replyDraftKey, JSON.stringify({ content: replyText }))
  }, [replyDraftKey, replyText])

  useEffect(() => {
    if (!replyImagePreview) return
    return () => URL.revokeObjectURL(replyImagePreview)
  }, [replyImagePreview])

  useEffect(() => {
    if (!roomId || !threadId || !isConnected) return
    joinCommunityRoom(roomId)
    const subscriberId = `community-thread:${threadId}`
    subscribe(subscriberId, {
      onCommunityThreadReply: (data) => {
        if (String(data.threadId) !== threadId) return
        if (user?._id && String(data.message?.senderId) === user._id) return
        setNewReplyCount((count) => count + 1)
        queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
        queryClient.invalidateQueries({ queryKey: ['community', 'threads', roomId] })
      },
      onCommunityMessageReaction: (data) => {
        if (String(data.threadId || '') !== threadId) return
        queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
        queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
      },
      onCommunityMessageUpdated: (message) => {
        if (String(message.threadId || '') !== threadId) return
        queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
        queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
      },
      onCommunityMessageDeleted: (message) => {
        if (String(message.threadId || '') !== threadId) return
        queryClient.invalidateQueries({ queryKey: ['community', 'thread-replies', threadId] })
        queryClient.invalidateQueries({ queryKey: ['community', 'thread', threadId] })
        queryClient.invalidateQueries({ queryKey: ['community', 'threads', roomId] })
      },
    })

    return () => {
      unsubscribe(subscriberId)
      leaveCommunityRoom(roomId)
    }
  }, [isConnected, joinCommunityRoom, leaveCommunityRoom, queryClient, roomId, subscribe, threadId, unsubscribe, user?._id])

  useEffect(() => {
    if (!repliesQuery.data || typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash.startsWith('#post-')) return
    const target = document.getElementById(hash.slice(1))
    if (target) target.scrollIntoView({ block: 'start' })
  }, [repliesQuery.data, page])

  const totalReplyPages = Math.max(1, Math.ceil((repliesQuery.data?.total || 0) / REPLIES_PER_PAGE))

  return (
    <main className='min-h-screen bg-[#F7FAFC] text-slate-900'>
      <div className='relative mx-auto max-w-6xl space-y-4 px-3 py-5 sm:px-4'>
        <UniversalBreadcrumb items={[{ label: 'Cộng đồng', href: '/community' }, { label: thread?.room?.name || 'Chuyên mục', href: `/community/${roomId}` }, { label: 'Thread' }]} />

        <Dialog open={Boolean(reportTarget)} onOpenChange={(open) => !open && setReportTarget(null)}>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Báo cáo nội dung</DialogTitle>
              <DialogDescription>Nội dung sẽ được gửi đến đội ngũ điều phối. Người bị báo cáo không thấy danh tính người báo cáo.</DialogDescription>
            </DialogHeader>
            <div className='space-y-3'>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={reportDetail} onChange={(event) => setReportDetail(event.target.value)} rows={4} placeholder='Mô tả thêm để mod xử lý nhanh hơn (tùy chọn)' />
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setReportTarget(null)} disabled={reportMutation.isPending}>Hủy</Button>
              <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>Gửi báo cáo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant='ghost' className='h-auto px-0 py-0 text-[#0A2463] hover:bg-transparent hover:underline' onClick={() => navigate(`/community/${roomId}`)}><ArrowLeft className='h-4 w-4' />Quay lại chuyên mục</Button>

        {threadQuery.isLoading ? (
          <Skeleton className='h-72 rounded-lg' />
        ) : thread ? (
          <>
          <article id={thread.starterMessageId ? `post-${thread.starterMessageId}` : undefined} className='scroll-mt-24 overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
            <div className='border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2'>
              <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                <ThreadPrefixBadge prefix={thread.prefix} />
                <ThreadStateBadges thread={thread} />
              </div>
              <h1 className='text-xl font-bold text-[#0A2463] md:text-2xl'>{thread.title}</h1>
              <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600'>
                <span>bởi {authorName(thread.author, thread.isAnonymous)}, {formatRelativeTime(thread.createdAt)}</span>
                <ThreadMetric icon={MessageCircle} value={thread.replyCount} label='reply' />
              </div>
            </div>
            <ThreadVideoMeetingPanel thread={thread} />
            <div className='grid md:grid-cols-[180px_minmax(0,1fr)]'>
              <aside className='border-b border-slate-100 bg-[#F8FBFF] p-3 md:border-b-0 md:border-r md:text-center'>
                <Avatar className='h-14 w-14 rounded-lg border border-blue-100 md:mx-auto'>
                  <AvatarImage src={thread.isAnonymous ? undefined : thread.author?.avatar} />
                  <AvatarFallback>{authorInitials(thread.author, thread.isAnonymous)}</AvatarFallback>
                </Avatar>
                <p className='mt-2 truncate text-sm font-semibold text-slate-950'>{authorName(thread.author, thread.isAnonymous)}</p>
                <p className='text-[11px] text-slate-500'>Người tạo chủ đề</p>
              </aside>
              <div className='min-w-0 p-4'>
                <div className='min-w-0'>
                    {editTarget?._id === thread.starterMessageId ? (
                      <div className='overflow-hidden rounded-lg border border-blue-200 bg-white focus-within:border-[#5B8DEF] focus-within:ring-2 focus-within:ring-blue-50'>
                        <RichTextEditor
                          value={editText}
                          onChange={setEditText}
                          placeholder='Nội dung bài viết'
                          height={220}
                        />
                        {thread.imageUrl && (
                          <div className='mx-4 mb-4 w-fit'>
                            <img src={thread.imageUrl} alt='Ảnh hiện tại' className='h-24 w-24 rounded-lg border border-blue-100 object-cover shadow-sm' />
                          </div>
                        )}
                        <div className='flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-[#FBFDFF] px-3 py-3'>
                          <Button type='button' variant='outline' size='sm' className='rounded-lg border-blue-100' disabled={editMutation.isPending} onClick={() => { setEditTarget(null); setEditText('') }}>Hủy</Button>
                          <Button type='button' size='sm' className='rounded-lg bg-[#0A2463] text-white hover:bg-[#12357D]' disabled={editMutation.isPending || (isEmptyRichText(editText) && !thread.imageUrl)} onClick={handleSubmitEdit}>
                            {editMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Pencil className='h-4 w-4' />}
                            Lưu chỉnh sửa
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CommunityHtmlContent value={thread.content} className='break-words text-sm leading-7 text-slate-950' />
                        {thread.starterMessage?.editedAt && <p className='mt-2 text-[11px] text-slate-500'>Đã chỉnh sửa {formatRelativeTime(thread.starterMessage.editedAt)}</p>}
                        {thread.imageUrl && <img src={thread.imageUrl} alt='Ảnh thread' className='mt-4 max-h-96 rounded-lg border border-slate-100 object-cover' loading='lazy' />}
                      </>
                    )}
                </div>

                {editTarget?._id !== thread.starterMessageId && thread.acceptedReply && (
                  <div className='mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800'>
                    <p className='mb-1 flex items-center gap-2 font-semibold'><ShieldCheck className='h-4 w-4' />Câu trả lời được xác nhận</p>
                    <p className='whitespace-pre-wrap break-words'>{thread.acceptedReply.content}</p>
                  </div>
                )}
                {thread.starterMessageId && editTarget?._id !== thread.starterMessageId && (
                  <div className='mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#edf1f5] pt-3'>
                    <div className='flex flex-wrap justify-end gap-2'>
                      {thread.starterMessage && (
                        <ReactionBar message={thread.starterMessage} onReact={handleReact} disabled={reactionMutation.isPending} />
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 rounded px-2 text-slate-600 hover:text-[#0A2463]'
                        onClick={() => handleCopyPostLink(thread.starterMessageId!, 1)}
                      >
                        <Link2 className='h-4 w-4' />
                        Link
                      </Button>
                      {user?._id && String(thread.authorId) === user._id && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 rounded px-2 text-slate-600 hover:text-[#0A2463]'
                          onClick={() =>
                            handleOpenEdit(thread.starterMessage || {
                              _id: thread.starterMessageId!,
                              roomId: thread.roomId,
                              threadId: thread._id,
                              senderId: thread.authorId,
                              content: thread.content,
                              imageUrl: thread.imageUrl,
                              isThreadStarter: true,
                              status: 'visible',
                              createdAt: thread.createdAt,
                              sender: thread.author,
                            })
                          }
                        >
                          <Pencil className='h-4 w-4' />
                          Sửa
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 rounded px-2 text-rose-600 hover:text-rose-700'
                        onClick={() =>
                          handleOpenReport({
                            _id: thread.starterMessageId!,
                            roomId: thread.roomId,
                            threadId: thread._id,
                            senderId: thread.authorId,
                            content: thread.content,
                            imageUrl: thread.imageUrl,
                            status: 'visible',
                            createdAt: thread.createdAt,
                            sender: thread.author,
                          })
                        }
                      >
                        <Flag className='h-4 w-4' />
                        Báo cáo bài viết
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
          </>
        ) : (
          <div className='rounded-lg border border-[#DDE7F3] bg-white p-8 text-center shadow-sm'>
            <h1 className='text-lg font-semibold text-[#0A2463]'>Không tìm thấy thread</h1>
            <p className='mt-2 text-sm text-slate-600'>Thread này có thể đã bị xóa, bị ẩn hoặc dữ liệu demo đã được seed lại.</p>
            <div className='mt-4 flex flex-wrap justify-center gap-2'>
              <Button variant='outline' onClick={() => navigate(`/community/${roomId}`)}>Quay lại chuyên mục</Button>
              <Button className='bg-[#0A2463] text-white hover:bg-[#12357D]' onClick={() => navigate('/community')}>Về cộng đồng</Button>
            </div>
          </div>
        )}

        {thread && <section className='max-w-6xl space-y-3'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='text-base font-semibold text-[#0A2463]'>Trả lời</h2>
          </div>
          {newReplyCount > 0 && (
            <button
              type='button'
              onClick={handleLoadNewReplies}
              className='w-full rounded-lg border border-blue-100 bg-[#F0F6FF] px-3 py-2 text-sm font-semibold text-[#0A2463] transition hover:bg-[#E7F0FF]'
            >
              Có {newReplyCount} trả lời mới. Bấm để tải bài mới nhất.
            </button>
          )}
          {repliesQuery.isLoading ? (
            <div className='space-y-3'>{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className='h-28 rounded-lg' />)}</div>
          ) : repliesQuery.data?.items?.length ? (
            <div className='space-y-3'>
              {repliesQuery.data.items.map((message) => (
                <ReplyBlock
                  key={message._id}
                  message={message}
                  onQuote={setQuoteTarget}
                  onReport={handleOpenReport}
                  onCopyLink={handleCopyPostLink}
                  onReact={handleReact}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  editing={editTarget?._id === message._id}
                  editText={editTarget?._id === message._id ? editText : ''}
                  editPending={editMutation.isPending}
                  onEditTextChange={setEditText}
                  onSubmitEdit={handleSubmitEdit}
                  onCancelEdit={() => {
                    setEditTarget(null)
                    setEditText('')
                  }}
                  reacting={reactionMutation.isPending}
                  currentUserId={user?._id}
                />
              ))}
              {totalReplyPages > 1 && <PaginationComponent currentPage={page} totalPages={totalReplyPages} onPageChange={updatePage} className='rounded-lg border border-[#DDE7F3] bg-white py-4 shadow-sm' />}
            </div>
          ) : (
            <div className='rounded-lg border border-dashed border-[#DDE7F3] bg-white p-8 text-center text-sm text-slate-600'>Chưa có trả lời nào.</div>
          )}
        </section>}

        {thread && isAuthenticated && <section className='max-w-6xl overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
          <div className='grid md:grid-cols-[180px_minmax(0,1fr)]'>
            <aside className='border-b border-slate-100 bg-[#F8FBFF] p-4 md:border-b-0 md:border-r md:text-center'>
              <Avatar className='h-16 w-16 rounded-lg border border-blue-100 md:mx-auto'>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{[user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <p className='mt-2 truncate text-sm font-semibold text-slate-950'>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Bạn'}</p>
              <p className='text-[11px] text-slate-500'>Đang trả lời</p>
            </aside>

            <div className='p-4'>
              {quoteTarget && (
                <div className='mb-3 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-[#0A2463]'>
                  <Reply className='mt-0.5 h-4 w-4 shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-xs font-semibold'>Đang trích dẫn {authorName(quoteTarget.sender)}</p>
                    <p className='mt-0.5 line-clamp-2 break-words text-xs'>{richTextToPlainText(quoteTarget.content) || (quoteTarget.imageUrl ? 'Đã gửi ảnh' : '')}</p>
                  </div>
                  <button type='button' className='flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#0A2463] hover:bg-[#F0F6FF]' onClick={() => setQuoteTarget(null)} aria-label='Hủy trích dẫn'><X className='h-4 w-4' /></button>
                </div>
              )}

              <div className='overflow-hidden rounded-lg border border-blue-200 bg-white focus-within:border-[#5B8DEF] focus-within:ring-2 focus-within:ring-blue-50'>
                <RichTextEditor
                  value={replyText}
                  onChange={setReplyText}
                  placeholder={canReply ? 'Write your reply...' : 'Đăng nhập và tham gia chuyên mục để trả lời'}
                  height={130}
                />

                {replyImagePreview && (
                  <div className='relative mx-4 mb-4 w-fit'>
                    <img src={replyImagePreview} alt='Ảnh đính kèm' className='h-24 w-24 rounded-lg border border-blue-100 object-cover shadow-sm' />
                    <button
                      type='button'
                      className='absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm ring-2 ring-white hover:bg-rose-700'
                      onClick={() => {
                        setReplyImageFile(null)
                        setReplyImagePreview('')
                      }}
                      aria-label='Xóa ảnh đính kèm'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                )}

                <div className='flex flex-col gap-3 border-t border-slate-100 bg-[#FBFDFF] px-3 py-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleImageSelect} />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='rounded-lg border-blue-100 text-[#0A2463] hover:bg-blue-50'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!canReply || uploadingImage || replyMutation.isPending}
                    >
                      {uploadingImage ? <Loader2 className='h-4 w-4 animate-spin' /> : <Paperclip className='h-4 w-4' />}
                      {uploadingImage ? 'Đang tải ảnh' : replyImagePreview ? 'Đổi ảnh' : 'Attach files'}
                    </Button>
                    <span className='text-xs text-slate-500'>JPG, PNG, WebP tối đa 5MB</span>
                  </div>
                  <Button
                    onClick={handleReply}
                    disabled={!canReply || replyMutation.isPending || uploadingImage || (isEmptyRichText(replyText) && !replyImageFile)}
                    className='rounded-lg bg-[#0A2463] text-white hover:bg-[#12357D]'
                  >
                    {replyMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Reply className='h-4 w-4' />}
                    Post reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>}
      </div>
    </main>
  )
}

export default CommunityThreadPage
