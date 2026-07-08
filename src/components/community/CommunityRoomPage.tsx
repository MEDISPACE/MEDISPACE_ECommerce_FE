import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Flag,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Users,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { ChatTextarea } from '~/components/chat/ChatTextarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Skeleton } from '~/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import communityService from '~/services/communityService'
import type { CommunityMessage, CommunityRoom, CommunityVideoEvent } from '~/types/community'
import { communityPreviewText, getRoomDescription, getRoomGuidelines, getRoomTopic, roomInitials } from './communityUi'

const PAGE_SIZE = 20

function formatTime(ts?: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(d)
}

function getSenderName(message?: Pick<CommunityMessage, 'sender'> | null) {
  if (!message?.sender) return 'Thành viên'
  return (
    `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email || 'Thành viên'
  )
}

function MessageBubble({
  message,
  isMine,
  onReport,
  onAppeal,
  onReply,
  appealSent,
}: {
  message: CommunityMessage
  isMine: boolean
  onReport?: (message: CommunityMessage) => void
  onAppeal?: (message: CommunityMessage) => void
  onReply?: (message: CommunityMessage) => void
  appealSent?: boolean
}) {
  const isHidden = message.status === 'hidden'
  const senderName = getSenderName(message)
  const initials = `${message.sender?.firstName?.charAt(0) || message.sender?.email?.charAt(0) || 'U'}${message.sender?.lastName?.charAt(0) || ''}`
  const replyPreview = message.replyTo
  const replyPreviewText = replyPreview?.content || (replyPreview?.imageUrl ? 'Đã gửi ảnh' : 'Tin nhắn')

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isMine && (
        <Avatar className='w-8 h-8 mt-1'>
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isMine && <span className='text-xs font-medium text-gray-500'>{senderName}</span>}
        <div
          className={`rounded-2xl px-4 py-2 text-sm shadow-sm border ${
            isMine
              ? 'bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white border-transparent'
              : 'bg-white text-gray-900 border-gray-200'
          } ${isHidden ? 'bg-amber-50 text-amber-800 border-amber-200' : ''}`}
        >
          {isHidden ? (
            <div className='flex items-center gap-2'>
              <ShieldAlert className='w-4 h-4' />
              <span>Tin nhắn của bạn đã bị ẩn do vi phạm.</span>
            </div>
          ) : (
            <div className='space-y-2'>
              {replyPreview && (
                <div
                  className={`rounded-xl border-l-4 px-3 py-2 text-xs ${isMine ? 'border-white/60 bg-white/10 text-blue-50' : 'border-blue-300 bg-blue-50 text-blue-900'}`}
                >
                  <p className='font-semibold'>{getSenderName(replyPreview)}</p>
                  <p className='mt-0.5 line-clamp-2 break-words opacity-90'>{replyPreviewText}</p>
                </div>
              )}
              {message.imageUrl && (
                <a
                  href={message.imageUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='block overflow-hidden rounded-xl'
                >
                  <img
                    src={message.imageUrl}
                    alt='Ảnh trong tin nhắn'
                    className='max-h-80 w-full object-cover'
                    loading='lazy'
                  />
                </a>
              )}
              {message.content && <p className='whitespace-pre-wrap break-words'>{message.content}</p>}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2 text-xs text-gray-400'>
          <span>{formatTime(message.createdAt)}</span>
          {onReply && !isHidden && (
            <button
              className='inline-flex items-center gap-1 text-blue-500 hover:text-blue-600'
              onClick={() => onReply(message)}
            >
              <Reply className='h-3 w-3' />
              Reply
            </button>
          )}
          {!isMine && onReport && !isHidden && (
            <button
              className='text-rose-500 hover:text-rose-600 inline-flex items-center gap-1'
              onClick={() => onReport(message)}
            >
              <Flag className='w-3 h-3' />
              Báo cáo
            </button>
          )}
          {isMine && isHidden && onAppeal && (
            <button
              className='text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 disabled:opacity-60'
              disabled={appealSent}
              onClick={() => onAppeal(message)}
            >
              <ShieldAlert className='w-3 h-3' />
              {appealSent ? 'Đã gửi appeal' : 'Appeal tin nhắn'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatEventTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function roomPreview(room: CommunityRoom) {
  const preview = communityPreviewText(room.lastMessagePreview, '')
  if (preview) return preview
  if (room.messageCount) return `${room.messageCount} tin nhắn trong phòng`
  return getRoomDescription(room)
}

function MeetingCard({ event }: { event: CommunityVideoEvent }) {
  return (
    <div className='mx-auto w-full max-w-[620px] rounded-[18px] border border-[#dbe7ff] bg-white p-4 shadow-sm'>
      <div className='flex items-start gap-3'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600'>
          <Video className='h-5 w-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex flex-wrap items-center gap-2'>
            <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700'>
              Có thể tham gia
            </span>
            <span className='inline-flex items-center gap-1 text-xs text-gray-500'>
              <CalendarDays className='h-3.5 w-3.5' />
              {formatEventTime(event.scheduledStartAt)}
            </span>
          </div>
          <h3 className='truncate text-sm font-semibold text-gray-950'>{event.title}</h3>
          {event.description && <p className='mt-1 line-clamp-2 text-sm text-gray-600'>{event.description}</p>}
          <Button asChild size='sm' className='mt-3 rounded-full bg-blue-600 text-white hover:bg-blue-700'>
            <Link to={`/community/video-events/${event._id}`}>
              <ExternalLink className='h-4 w-4' />
              Tham gia ngay
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CommunityRoomPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams()
  const roomId = params.roomId as string
  const { isAuthenticated, user } = useAuth()
  const { isConnected, joinCommunityRoom, leaveCommunityRoom, subscribe, unsubscribe } = useSocketContext()
  const countedMessageIdsRef = useRef<Set<string>>(new Set())

  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [needsJoin, setNeedsJoin] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [replyTarget, setReplyTarget] = useState<CommunityMessage | null>(null)
  const [messageSearchInput, setMessageSearchInput] = useState('')
  const [messageSearch, setMessageSearch] = useState('')

  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportTarget, setReportTarget] = useState<CommunityMessage | null>(null)
  const [reporting, setReporting] = useState(false)
  const [appealTarget, setAppealTarget] = useState<CommunityMessage | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [appealing, setAppealing] = useState(false)
  const [appealedMessageIds, setAppealedMessageIds] = useState<Set<string>>(new Set())

  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['community', 'rooms', isAuthenticated],
    queryFn: () =>
      isAuthenticated ? communityService.listMyRooms() : communityService.listRooms({ visibility: 'public' }),
    staleTime: 60_000,
  })

  const roomEventsQuery = useQuery({
    queryKey: ['community-room-video-events', roomId],
    queryFn: () => communityService.listVideoEvents({ roomId, upcomingOnly: true, page: 1, limit: 3 }),
    enabled: Boolean(roomId) && isAuthenticated && !needsJoin,
    staleTime: 30_000,
  })

  const room = useMemo(() => rooms?.find((r) => r._id === roomId), [rooms, roomId])
  const sortedRooms = useMemo(
    () =>
      [...(rooms || [])].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return bTime - aTime
      }),
    [rooms],
  )
  const memberStatus = room?.viewerMembership?.status
  const mutedUntil = room?.viewerMembership?.mutedUntil ? new Date(room.viewerMembership.mutedUntil) : null
  const isMuted = Boolean(mutedUntil && mutedUntil.getTime() > Date.now())
  const isPending = memberStatus === 'pending'
  const isBanned = memberStatus === 'banned'
  const isInvited = memberStatus === 'invited'
  const canSend = isAuthenticated && !needsJoin && !isPending && !isBanned && !isMuted

  const updateRoomCaches = useCallback(
    (updater: (rooms: CommunityRoom[]) => CommunityRoom[]) => {
      queryClient.setQueriesData<CommunityRoom[]>({ queryKey: ['community', 'rooms'] }, (current) => {
        if (!Array.isArray(current)) return current
        return updater(current)
      })
    },
    [queryClient],
  )

  const markCurrentRoomRead = useCallback(() => {
    communityService
      .markRoomRead(roomId)
      .then((read) => {
        updateRoomCaches((current) =>
          current.map((item) =>
            item._id === roomId
              ? {
                  ...item,
                  unreadCount: 0,
                  viewerMembership: item.viewerMembership
                    ? { ...item.viewerMembership, lastReadAt: read.lastReadAt }
                    : item.viewerMembership,
                }
              : item,
          ),
        )
      })
      .catch(() => undefined)
  }, [roomId, updateRoomCaches])

  const applyMessageMetric = useCallback(
    (message: CommunityMessage, unreadIncrement: number) => {
      if (!message?._id || countedMessageIdsRef.current.has(message._id)) return
      countedMessageIdsRef.current.add(message._id)
      updateRoomCaches((current) =>
        current.map((item) =>
          item._id === message.roomId
            ? {
                ...item,
                messageCount: (item.messageCount || 0) + 1,
                lastMessageAt: message.createdAt,
                lastMessagePreview: communityPreviewText(message.content, message.imageUrl ? 'Đã gửi ảnh' : ''),
                unreadCount: Math.max((item.unreadCount || 0) + unreadIncrement, 0),
              }
            : item,
        ),
      )
    },
    [updateRoomCaches],
  )

  const loadMessages = useCallback(
    async (pageNum = 1) => {
      if (!roomId) return
      try {
        setLoadingMessages(true)
        const res = await communityService.listMessages({
          roomId,
          page: pageNum,
          limit: PAGE_SIZE,
          q: messageSearch || undefined,
        })
        const ordered = [...res.items].reverse()
        setHasMore(pageNum * res.limit < res.total)
        setPage(pageNum)
        setNeedsJoin(false)
        markCurrentRoomRead()
        if (pageNum === 1) {
          setMessages(ordered)
        } else {
          setMessages((prev) => [...ordered, ...prev])
        }
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401) {
          setNeedsJoin(true)
        } else if (status === 403) {
          setNeedsJoin(true)
        } else {
          toast.error('Không thể tải tin nhắn')
        }
      } finally {
        setLoadingMessages(false)
      }
    },
    [markCurrentRoomRead, messageSearch, roomId],
  )

  useEffect(() => {
    setReplyTarget(null)
    setMessageSearchInput('')
    setMessageSearch('')
  }, [roomId])

  useEffect(() => {
    const timer = window.setTimeout(() => setMessageSearch(messageSearchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [messageSearchInput])

  useEffect(() => {
    if (!roomId) return
    if (isAuthenticated) {
      loadMessages(1)
    } else {
      setNeedsJoin(true)
      setLoadingMessages(false)
    }
  }, [isAuthenticated, loadMessages, messageSearch, roomId])

  useEffect(() => {
    if (!roomId || !isAuthenticated || !isConnected || needsJoin) return
    joinCommunityRoom(roomId)
    return () => leaveCommunityRoom(roomId)
  }, [isAuthenticated, isConnected, joinCommunityRoom, leaveCommunityRoom, needsJoin, roomId])

  useEffect(() => {
    const id = `community-room-${roomId}`
    subscribe(id, {
      onCommunityMessageNew: (message) => {
        if (message.videoEventId) return
        if (message.roomId !== roomId) return
        setMessages((prev) => {
          if (prev.some((item) => item._id === message._id)) return prev
          return [...prev, message]
        })
        applyMessageMetric(message, 0)
        markCurrentRoomRead()
      },
      onCommunityMessageHidden: (message) => {
        if (message.roomId !== roomId) return
        setMessages((prev) => prev.filter((item) => item._id !== message._id))
        updateRoomCaches((current) =>
          current.map((item) =>
            item._id === roomId ? { ...item, messageCount: Math.max((item.messageCount || 0) - 1, 0) } : item,
          ),
        )
      },
      onCommunityMessageDeleted: (message) => {
        if (message.roomId !== roomId) return
        setMessages((prev) => prev.filter((item) => item._id !== message._id))
        updateRoomCaches((current) =>
          current.map((item) =>
            item._id === roomId ? { ...item, messageCount: Math.max((item.messageCount || 0) - 1, 0) } : item,
          ),
        )
      },
      onCommunityMemberUpdated: (data) => {
        const eventUserId = String(data.userId || data.targetUserId || '')
        if (String(data.roomId) === roomId && eventUserId === user?._id) {
          loadMessages(1)
        }
      },
    })
    return () => unsubscribe(id)
  }, [
    applyMessageMetric,
    loadMessages,
    markCurrentRoomRead,
    roomId,
    subscribe,
    unsubscribe,
    updateRoomCaches,
    user?._id,
  ])

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia')
      navigate('/login', { state: { from: { pathname: `/community/${roomId}` } } })
      return
    }
    try {
      const shouldRequest = room?.visibility === 'private' && !isInvited
      const result = shouldRequest
        ? await communityService.requestJoin(roomId)
        : await communityService.joinRoom(roomId)
      if (result.status === 'pending') {
        toast.success('Đã gửi yêu cầu tham gia, vui lòng chờ admin duyệt')
        setNeedsJoin(true)
        updateRoomCaches((current) => current.map((item) => item._id === roomId ? { ...item, viewerMembership: { ...(item.viewerMembership || { roomId, userId: user?._id || '' }), roomId, userId: user?._id || '', status: result.status } } : item))
        queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
        return
      }
      toast.success('Đã tham gia phòng')
      setNeedsJoin(false)
      updateRoomCaches((current) => current.map((item) => item._id === roomId ? { ...item, memberCount: item.viewerMembership?.status !== 'active' ? (item.memberCount || 0) + 1 : item.memberCount, viewerMembership: { ...(item.viewerMembership || { roomId, userId: user?._id || '' }), roomId, userId: user?._id || '', status: result.status, role: item.viewerMembership?.role || 'member' } } : item))
      queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
      await loadMessages(1)
    } catch (err: any) {
      if (err?.response?.status === 403 && !room) {
        try {
          const result = await communityService.requestJoin(roomId)
          if (result.status === 'pending') {
            toast.success('Đã gửi yêu cầu tham gia, vui lòng chờ admin duyệt')
            setNeedsJoin(true)
            queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
            return
          }
        } catch {
          // Fall through to the original error message.
        }
      }
      toast.error(err?.response?.data?.message || 'Không thể tham gia phòng')
    }
  }

  const handleLoadMore = () => {
    if (!hasMore || loadingMessages) return
    loadMessages(page + 1)
  }

  const handleSend = async () => {
    const trimmed = messageText.trim()
    if ((!trimmed && imageUrls.length === 0) || sending) return
    setSending(true)
    try {
      if (imageUrls.length > 0) {
        const res1 = await communityService.sendMessage({
          roomId,
          content: trimmed,
          imageUrl: imageUrls[0],
          replyToMessageId: replyTarget?._id,
        })
        handleNewMessageResponse(res1)

        for (let i = 1; i < imageUrls.length; i++) {
          const res = await communityService.sendMessage({ roomId, content: '', imageUrl: imageUrls[i] })
          handleNewMessageResponse(res)
        }
      } else if (trimmed) {
        const res = await communityService.sendMessage({ roomId, content: trimmed, replyToMessageId: replyTarget?._id })
        handleNewMessageResponse(res)
      }

      setMessageText('')
      setImageUrls([])
      setReplyTarget(null)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) {
        toast.error(err?.response?.data?.message || 'Bạn chưa tham gia phòng hoặc đang bị hạn chế')
      } else {
        toast.error('Không thể gửi tin nhắn')
      }
    } finally {
      setSending(false)
    }
  }

  const handleNewMessageResponse = (res: any) => {
    const next = res.message
    if (next) {
      if (next.status === 'hidden') {
        toast.info('Tin nhắn của bạn có thể vi phạm và đã bị ẩn.')
      }
      setMessages((prev) => {
        if (prev.some((item) => item._id === next._id)) return prev
        return [...prev, next]
      })
      if (next.status === 'visible') {
        applyMessageMetric(next, 0)
      }
    }
  }

  const handleFilesUpload = async (filesToUpload: File[]) => {
    if (!filesToUpload || filesToUpload.length === 0) return
    const maxSize = 2 * 1024 * 1024

    const validFiles = filesToUpload.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là ảnh`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`Ảnh ${file.name} quá lớn. Vui lòng chọn nhỏ hơn 2MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    try {
      const { uploadImage } = await import('~/services/mediaService')
      const uploadPromises = validFiles.map((file) => uploadImage(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      setImageUrls((prev) => [...prev, ...uploadedUrls])
      if (validFiles.length > 1) {
        toast.success(`Tải lên thành công ${uploadedUrls.length} ảnh`)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Không thể tải ảnh lên')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesUpload(Array.from(e.target.files))
    }
    e.target.value = ''
  }
  const openReportDialog = (message: CommunityMessage) => {
    setReportTarget(message)
    setReportReason('')
    setReportOpen(true)
  }

  const handleReport = async () => {
    if (!reportTarget) return
    try {
      setReporting(true)
      await communityService.reportMessage({ messageId: reportTarget._id, reason: reportReason.trim() || undefined })
      toast.success('Đã báo cáo tin nhắn')
      setReportOpen(false)
    } catch {
      toast.error('Không thể báo cáo tin nhắn')
    } finally {
      setReporting(false)
    }
  }

  const openAppealDialog = (message: CommunityMessage) => {
    setAppealTarget(message)
    setAppealReason('')
  }

  const handleMessageAppeal = async () => {
    if (!appealTarget) return
    if (appealReason.trim().length < 10) {
      toast.error('Vui lòng nhập lý do ít nhất 10 ký tự')
      return
    }
    try {
      setAppealing(true)
      await communityService.createAppeal({
        roomId,
        type: 'message',
        messageId: appealTarget._id,
        reason: appealReason.trim(),
      })
      toast.success('Đã gửi appeal tin nhắn')
      setAppealedMessageIds((prev) => new Set(prev).add(appealTarget._id))
      setAppealTarget(null)
      setAppealReason('')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Bạn đã gửi appeal và đang chờ xử lý')
        setAppealedMessageIds((prev) => new Set(prev).add(appealTarget._id))
        setAppealTarget(null)
        return
      }
      toast.error('Không thể gửi appeal tin nhắn')
    } finally {
      setAppealing(false)
    }
  }

  const isMine = (message: CommunityMessage) => message.senderId === user?._id

  return (
    <div className='mx-auto flex h-[calc(100dvh-128px)] max-h-[calc(100dvh-128px)] min-h-0 max-w-[1440px] gap-0 overflow-hidden border border-gray-200 bg-white shadow-sm md:h-[calc(100dvh-224px)] md:max-h-[calc(100dvh-224px)] lg:my-4 lg:h-[calc(100dvh-264px)] lg:max-h-[calc(100dvh-264px)] lg:rounded-[18px]'>
      <aside className='hidden min-h-0 w-[330px] shrink-0 overflow-hidden border-r border-gray-200 bg-white md:flex md:flex-col'>
        <div className='border-b border-gray-100 px-4 py-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h1 className='text-xl font-bold text-gray-950'>Cộng đồng</h1>
              <p className='text-xs text-gray-500'>Nhóm sức khỏe MediSpace</p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='rounded-full'
              onClick={() => navigate('/community')}
              aria-label='Quay lại cộng đồng'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>
          <div className='mt-4 flex h-10 items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm text-gray-500'>
            <Search className='h-4 w-4' />
            <span>Tìm nhóm cộng đồng</span>
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto px-2 py-3'>
          {loadingRooms ? (
            <div className='space-y-2 px-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-16 rounded-2xl' />
              ))}
            </div>
          ) : (
            sortedRooms.map((item) => {
              const active = item._id === roomId
              return (
                <button
                  key={item._id}
                  type='button'
                  onClick={() => navigate(`/community/${item._id}`)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {roomInitials(item)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-semibold text-gray-950'>{item.name}</span>
                      {Boolean(item.unreadCount) && (
                        <span className='rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white'>
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className='mt-0.5 truncate text-xs text-gray-500'>{roomPreview(item)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <main className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f5f7fb]'>
        <header className='flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-5'>
          <div className='flex min-w-0 items-center gap-3'>
            <Button
              variant='ghost'
              size='icon'
              className='rounded-full md:hidden'
              onClick={() => navigate('/community')}
              aria-label='Quay lại cộng đồng'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div className='relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white'>
              {roomInitials(room)}
              <span className='absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
            </div>
            <div className='min-w-0'>
              <h2 className='truncate text-base font-semibold text-gray-950'>{room?.name || 'Phòng cộng đồng'}</h2>
              <div className='mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500'>
                {room && <span>{getRoomTopic(room)}</span>}
                {room?.visibility && (
                  <Badge className='h-5 bg-blue-100 px-2 text-[11px] text-blue-700 hover:bg-blue-100'>
                    {room.visibility === 'private' ? 'Riêng tư' : 'Công khai'}
                  </Badge>
                )}
                {isPending && (
                  <Badge className='h-5 bg-yellow-100 px-2 text-[11px] text-yellow-700 hover:bg-yellow-100'>
                    Chờ duyệt
                  </Badge>
                )}
                {isBanned && (
                  <Badge className='h-5 bg-red-100 px-2 text-[11px] text-red-700 hover:bg-red-100'>Đã bị ban</Badge>
                )}
                {isMuted && (
                  <Badge className='h-5 bg-orange-100 px-2 text-[11px] text-orange-700 hover:bg-orange-100'>
                    Đang mute
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full text-gray-600'
            onClick={() => loadMessages(1)}
            aria-label='Làm mới chat'
          >
            <RefreshCw className='h-4 w-4' />
          </Button>
        </header>

        <div className='shrink-0 border-b border-gray-200 bg-white px-4 py-2 md:px-5'>
          <div className='mx-auto flex max-w-3xl items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                value={messageSearchInput}
                onChange={(event) => setMessageSearchInput(event.target.value)}
                placeholder='Tìm trong tin nhắn'
                className='h-9 rounded-full border-gray-200 bg-gray-50 pl-9 pr-9 text-sm'
                disabled={!isAuthenticated || needsJoin}
              />
              {messageSearchInput && (
                <button
                  type='button'
                  className='absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                  onClick={() => setMessageSearchInput('')}
                  aria-label='Xóa tìm kiếm tin nhắn'
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              )}
            </div>
            {messageSearch && <span className='hidden text-xs text-gray-500 sm:inline'>Đang lọc</span>}
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-6'>
          <div className='mx-auto flex max-w-3xl flex-col gap-4'>
            {loadingMessages ? (
              <div className='space-y-3'>
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className={`h-12 rounded-2xl ${index % 2 ? 'ml-auto w-2/3' : 'w-3/4'}`} />
                ))}
              </div>
            ) : needsJoin ? (
              <div className='mx-auto flex max-w-md flex-col items-center justify-center rounded-[18px] bg-white p-6 text-center shadow-sm'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50'>
                  <Info className='h-6 w-6 text-blue-500' />
                </div>
                <h3 className='text-base font-semibold text-gray-950'>
                  {isPending ? 'Yêu cầu tham gia đang chờ duyệt' : 'Bạn chưa tham gia phòng này'}
                </h3>
                <p className='mt-2 text-sm text-gray-600'>
                  {isPending
                    ? 'Admin cần duyệt trước khi bạn có thể xem và gửi tin nhắn.'
                    : 'Tham gia để xem và gửi tin nhắn trong phòng.'}
                </p>
                <Button
                  className='mt-4 rounded-full bg-blue-600 text-white hover:bg-blue-700'
                  onClick={handleJoin}
                  disabled={isPending}
                >
                  {isPending
                    ? 'Đã gửi yêu cầu'
                    : room?.visibility === 'private' && !isInvited
                      ? 'Gửi yêu cầu tham gia'
                      : 'Tham gia phòng'}
                </Button>
                {!isAuthenticated && (
                  <Button variant='outline' className='mt-2 rounded-full' asChild>
                    <Link to='/login'>Đăng nhập</Link>
                  </Button>
                )}
              </div>
            ) : messages.length === 0 && (messageSearch || !(roomEventsQuery.data?.items || []).length) ? (
              <div className='mx-auto flex max-w-md flex-col items-center justify-center rounded-[18px] bg-white p-6 text-center shadow-sm'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50'>
                  {messageSearch ? (
                    <Search className='h-6 w-6 text-blue-500' />
                  ) : (
                    <Users className='h-6 w-6 text-blue-500' />
                  )}
                </div>
                <h3 className='text-base font-semibold text-gray-950'>
                  {messageSearch ? 'Không tìm thấy tin nhắn' : 'Chưa có tin nhắn'}
                </h3>
                <p className='mt-2 text-sm text-gray-600'>
                  {messageSearch
                    ? 'Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                    : 'Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.'}
                </p>
              </div>
            ) : (
              <>
                {!messageSearch &&
                  (roomEventsQuery.data?.items || []).map((event) => <MeetingCard key={event._id} event={event} />)}
                {hasMore && (
                  <div className='text-center'>
                    <Button
                      variant='outline'
                      className='rounded-full border-gray-200 bg-white'
                      onClick={handleLoadMore}
                    >
                      Tải thêm tin nhắn
                    </Button>
                  </div>
                )}
                {messages.map((message) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isMine={isMine(message)}
                    onReport={isMine(message) ? undefined : openReportDialog}
                    onAppeal={isMine(message) ? openAppealDialog : undefined}
                    onReply={canSend ? setReplyTarget : undefined}
                    appealSent={appealedMessageIds.has(message._id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <footer className='shrink-0 border-t border-gray-200 bg-white px-3 py-3 md:px-5'>
          <div className='mx-auto max-w-3xl'>
            {replyTarget && (
              <div className='mb-3 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-950'>
                <Reply className='mt-0.5 h-4 w-4 shrink-0 text-blue-600' />
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-semibold text-blue-700'>Đang reply {getSenderName(replyTarget)}</p>
                  <p className='mt-0.5 line-clamp-2 break-words text-xs text-blue-900'>
                    {replyTarget.content || (replyTarget.imageUrl ? 'Đã gửi ảnh' : 'Tin nhắn')}
                  </p>
                </div>
                <button
                  type='button'
                  className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-100'
                  onClick={() => setReplyTarget(null)}
                  aria-label='Hủy reply'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            )}
            {imageUrls.length > 0 && (
              <div className='mb-3 flex gap-3 overflow-x-auto pb-1'>
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className='relative shrink-0'>
                    <img
                      src={url}
                      alt='Ảnh chuẩn bị gửi'
                      className='h-20 w-20 rounded-2xl border border-gray-200 object-cover shadow-sm'
                    />
                    <button
                      type='button'
                      className='absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-red-600'
                      onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                      aria-label='Xóa ảnh'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className='flex items-end gap-2'>
              <label
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ${canSend && !isUploading ? 'cursor-pointer hover:bg-blue-100' : 'opacity-50'}`}
                aria-label='Gửi ảnh'
              >
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  className='hidden'
                  disabled={!canSend || isUploading || sending}
                  onChange={handleImageUpload}
                />
                {isUploading ? <Loader2 className='h-4 w-4 animate-spin' /> : <ImageIcon className='h-4 w-4' />}
              </label>
              <ChatTextarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onSend={handleSend}
                onPasteFiles={handleFilesUpload}
                placeholder={
                  isPending
                    ? 'Yêu cầu tham gia đang chờ duyệt'
                    : isBanned
                      ? 'Bạn đang bị ban trong phòng này'
                      : isMuted
                        ? 'Bạn đang bị mute trong phòng này'
                        : needsJoin
                          ? 'Tham gia phòng để gửi tin nhắn'
                          : 'Chia sẻ câu hỏi hoặc kinh nghiệm của bạn...'
                }
                disabled={!canSend || sending}
              />
              <Button
                size='icon'
                className='h-10 w-10 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700'
                onClick={handleSend}
                disabled={!canSend || sending || isUploading || (!messageText.trim() && imageUrls.length === 0)}
                aria-label='Gửi tin nhắn'
              >
                {sending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
              </Button>
            </div>
            <p className='mt-2 text-xs text-gray-500'>
              Không chia sẻ thông tin cá nhân nhạy cảm. Nội dung có thể được điều phối để giữ cộng đồng an toàn.
            </p>
            {!isAuthenticated && (
              <p className='mt-1 text-xs text-gray-500'>Vui lòng đăng nhập để tham gia trò chuyện.</p>
            )}
          </div>
        </footer>
      </main>

      <aside className='hidden min-h-0 w-[300px] shrink-0 overflow-hidden border-l border-gray-200 bg-white xl:flex xl:flex-col'>
        <div className='border-b border-gray-100 px-5 py-5 text-center'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white'>
            {roomInitials(room)}
          </div>
          <h3 className='mt-3 truncate text-base font-semibold text-gray-950'>{room?.name || 'Phòng cộng đồng'}</h3>
          <p className='mt-1 text-xs text-gray-500'>
            {room ? getRoomTopic(room) : 'Nhóm sức khỏe'} · {room?.memberCount || 0} thành viên
          </p>
        </div>
        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 text-sm text-gray-600'>
          {room && (
            <div>
              <h4 className='mb-2 flex items-center gap-2 font-semibold text-gray-950'>
                <Info className='h-4 w-4 text-blue-600' />
                Thông tin nhóm
              </h4>
              <p className='leading-6'>{getRoomDescription(room)}</p>
              {room.pinnedMessage && (
                <p className='mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-800'>
                  {room.pinnedMessage}
                </p>
              )}
            </div>
          )}
          <div>
            <h4 className='mb-2 flex items-center gap-2 font-semibold text-gray-950'>
              <ShieldAlert className='h-4 w-4 text-amber-500' />
              Quy tắc cộng đồng
            </h4>
            <ul className='space-y-2'>
              {getRoomGuidelines(room).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <Button
            variant='outline'
            className='w-full rounded-full'
            onClick={() => {
              const chatButton = document.querySelector(
                'button[aria-label="Chat với dược sĩ"]',
              ) as HTMLButtonElement | null
              chatButton?.click()
            }}
          >
            Chat với dược sĩ
          </Button>
        </div>
      </aside>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Báo cáo tin nhắn</DialogTitle>
            <DialogDescription>Nội dung bị báo cáo sẽ được kiểm duyệt bởi quản trị viên.</DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='rounded-md border border-[#E8EDF5] bg-[#F0F6FF] px-3 py-2 text-sm text-gray-700 break-words max-h-32 overflow-y-auto'>
              {reportTarget?.content}
            </div>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder='Lý do báo cáo (tuỳ chọn)'
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setReportOpen(false)} disabled={reporting}>
              Hủy
            </Button>
            <Button
              className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'
              onClick={handleReport}
              disabled={reporting}
            >
              {reporting ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(appealTarget)} onOpenChange={(open) => !open && setAppealTarget(null)}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Appeal tin nhắn bị ẩn</DialogTitle>
            <DialogDescription>Appeal sẽ được gửi đến admin để xem xét khôi phục tin nhắn.</DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900 break-words max-h-32 overflow-y-auto'>
              {appealTarget?.content}
            </div>
            <Textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder='Nhập lý do bạn muốn admin xem xét lại'
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setAppealTarget(null)} disabled={appealing}>
              Hủy
            </Button>
            <Button
              className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'
              onClick={handleMessageAppeal}
              disabled={appealing}
            >
              {appealing ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
              Gửi appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CommunityRoomPage
