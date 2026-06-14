import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Flag, Image as ImageIcon, Info, Loader2, RefreshCw, Send, ShieldAlert, Users, X } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
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
import type { CommunityMessage, CommunityRoom } from '~/types/community'

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

function MessageBubble({
  message,
  isMine,
  onReport,
  onAppeal,
  appealSent,
}: {
  message: CommunityMessage
  isMine: boolean
  onReport?: (message: CommunityMessage) => void
  onAppeal?: (message: CommunityMessage) => void
  appealSent?: boolean
}) {
  const isHidden = message.status === 'hidden'
  const senderName = `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() || 'Người dùng'
  const initials = `${message.sender?.firstName?.charAt(0) || 'U'}${message.sender?.lastName?.charAt(0) || ''}`

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
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent'
              : 'bg-white text-gray-900 border-gray-200'
          } ${isHidden ? 'bg-amber-50 text-amber-800 border-amber-200' : ''}`}
        >
          {isHidden ? (
            <div className='flex items-center gap-2'>
              <ShieldAlert className='w-4 h-4' />
              <span>Tin nhắn của bạn đã bị ẩn do vi phạm.</span>
            </div>
          ) : (
            <p className='whitespace-pre-wrap break-words'>{message.content}</p>
          )}
        </div>

        <div className='flex items-center gap-2 text-xs text-gray-400'>
          <span>{formatTime(message.createdAt)}</span>
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
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

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
    queryFn: () => (isAuthenticated ? communityService.listMyRooms() : communityService.listRooms({ visibility: 'public' })),
    staleTime: 60_000,
  })

  const room = useMemo(() => rooms?.find((r) => r._id === roomId), [rooms, roomId])
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
                lastMessagePreview: message.content,
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
        const res = await communityService.listMessages({ roomId, page: pageNum, limit: PAGE_SIZE })
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
    [markCurrentRoomRead, roomId],
  )

  useEffect(() => {
    if (!roomId) return
    if (isAuthenticated) {
      loadMessages(1)
    } else {
      setNeedsJoin(true)
      setLoadingMessages(false)
    }
  }, [isAuthenticated, loadMessages, roomId])

  useEffect(() => {
    if (!roomId || !isAuthenticated || !isConnected || needsJoin) return
    joinCommunityRoom(roomId)
    return () => leaveCommunityRoom(roomId)
  }, [isAuthenticated, isConnected, joinCommunityRoom, leaveCommunityRoom, needsJoin, roomId])

  useEffect(() => {
    const id = `community-room-${roomId}`
    subscribe(id, {
      onCommunityMessageNew: (message) => {
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
  }, [applyMessageMetric, loadMessages, markCurrentRoomRead, roomId, subscribe, unsubscribe, updateRoomCaches, user?._id])

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia')
      navigate('/login', { state: { from: { pathname: `/community/${roomId}` } } })
      return
    }
    try {
      const shouldRequest = room?.visibility === 'private' && !isInvited
      const result = shouldRequest ? await communityService.requestJoin(roomId) : await communityService.joinRoom(roomId)
      if (result.status === 'pending') {
        toast.success('Đã gửi yêu cầu tham gia, vui lòng chờ admin duyệt')
        setNeedsJoin(true)
        queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
        return
      }
      toast.success('Đã tham gia phòng')
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
    if ((!trimmed && !imageUrl) || sending) return
    setSending(true)
    try {
      const res = await communityService.sendMessage({ roomId, content: trimmed })
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
      setMessageText('')
      setImageUrl('')
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 2MB')
      return
    }
    setIsUploading(true)
    try {
      const { uploadImage } = await import('~/services/mediaService')
      const uploadedUrl = await uploadImage(file)
      setImageUrl(uploadedUrl)
      toast.success('Tải ảnh lên thành công')
    } catch (error: any) {
      toast.error(error?.message || 'Không thể tải ảnh lên')
    } finally {
      setIsUploading(false)
      // Reset input để có thể chọn lại cùng file
      e.target.value = ''
    }
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
    <div className='max-w-7xl mx-auto px-4 py-6 space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' className='hover:bg-blue-50' onClick={() => navigate('/community')}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Danh sách phòng
          </Button>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{room?.name || 'Phòng cộng đồng'}</h1>
            <div className='flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500'>
              <span>#{room?.slug || roomId}</span>
              {room?.diseaseKey && <Badge className='bg-blue-100 text-blue-700'>{room.diseaseKey}</Badge>}
              {isPending && <Badge className='bg-yellow-100 text-yellow-700'>Chờ duyệt tham gia</Badge>}
              {isBanned && <Badge className='bg-red-100 text-red-700'>Đã bị ban</Badge>}
              {isMuted && <Badge className='bg-orange-100 text-orange-700'>Đang mute</Badge>}
            </div>
          </div>
        </div>

        <Button variant='outline' className='border-blue-200 gap-2' onClick={() => loadMessages(1)}>
          <RefreshCw className='w-4 h-4' />
          Làm mới
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        <Card className='lg:col-span-3 bg-white border-blue-100 shadow-sm flex flex-col min-h-[560px]'>
          <CardContent className='p-0 flex flex-col flex-1 min-h-[560px]'>
            <div className='p-4 border-b border-blue-100 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Users className='w-4 h-4 text-blue-600' />
                <span className='text-sm text-gray-600'>Phòng cộng đồng</span>
              </div>
              {loadingRooms && <Loader2 className='w-4 h-4 animate-spin text-blue-600' />}
            </div>

            <div className='flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4'>
              {loadingMessages ? (
                <div className='space-y-3'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className='h-12 w-3/4' />
                  ))}
                </div>
              ) : needsJoin ? (
                <div className='flex flex-col items-center justify-center text-center h-full p-6'>
                  <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4'>
                    <Info className='w-7 h-7 text-blue-500' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                    {isPending ? 'Yêu cầu tham gia đang chờ duyệt' : 'Bạn chưa tham gia phòng này'}
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    {isPending
                      ? 'Admin cần duyệt trước khi bạn có thể xem và gửi tin nhắn.'
                      : 'Tham gia để xem và gửi tin nhắn trong phòng.'}
                  </p>
                  <Button className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white' onClick={handleJoin} disabled={isPending}>
                    {isPending ? 'Đã gửi yêu cầu' : room?.visibility === 'private' && !isInvited ? 'Gửi yêu cầu tham gia' : 'Tham gia phòng'}
                  </Button>
                  {!isAuthenticated && (
                    <Button variant='outline' className='mt-2 border-blue-200' asChild>
                      <Link to='/login'>Đăng nhập</Link>
                    </Button>
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className='flex flex-col items-center justify-center text-center h-full p-6'>
                  <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4'>
                    <Users className='w-7 h-7 text-blue-500' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-1'>Chưa có tin nhắn</h3>
                  <p className='text-gray-600'>Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.</p>
                </div>
              ) : (
                <>
                  {hasMore && (
                    <div className='text-center'>
                      <Button variant='outline' className='border-blue-200' onClick={handleLoadMore}>
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
                      appealSent={appealedMessageIds.has(message._id)}
                    />
                  ))}
                </>
              )}
            </div>

            <div className='border-t border-blue-100 bg-white'>
              {/* Image preview strip */}
              {imageUrl && (
                <div className='mx-3 mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 animate-in slide-in-from-bottom-2 duration-200'>
                  <img src={imageUrl} alt='Preview' className='h-10 w-10 object-cover rounded-lg border border-blue-200 shadow-sm flex-shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs font-medium text-blue-700'>Ảnh đã chọn</p>
                    <p className='text-[10px] text-blue-500 mt-0.5'>Nhấn gửi để chia sẻ</p>
                  </div>
                  <button
                    onClick={() => setImageUrl('')}
                    className='w-6 h-6 flex items-center justify-center bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-full transition-colors shadow-sm flex-shrink-0'
                  >
                    <X className='w-3 h-3 text-gray-500' />
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className='flex items-end gap-1.5 p-3'>
                {/* Image upload */}
                <label className='cursor-pointer flex-shrink-0 self-end mb-[18px]'>
                  <input type='file' accept='image/*' onChange={handleImageUpload} className='hidden' disabled={!canSend || isUploading} />
                  <div className='p-2 rounded-xl hover:bg-gray-100 transition-colors'>
                    {isUploading ? (
                      <Loader2 className='w-5 h-5 text-gray-400 animate-spin' />
                    ) : (
                      <ImageIcon className='w-5 h-5 text-gray-400 hover:text-blue-600' />
                    )}
                  </div>
                </label>

                <ChatTextarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onSend={handleSend}
                  placeholder={
                    isPending
                      ? 'Yêu cầu tham gia đang chờ duyệt'
                      : isBanned
                        ? 'Bạn đang bị ban trong phòng này'
                        : isMuted
                          ? 'Bạn đang bị mute trong phòng này'
                          : needsJoin
                            ? 'Tham gia phòng để gửi tin nhắn'
                            : 'Nhập tin nhắn...'
                  }
                  disabled={!canSend || sending}
                />

                <Button
                  className={`self-end mb-[18px] h-9 w-9 p-0 flex-shrink-0 rounded-full transition-all duration-200 ${
                    (messageText.trim() || imageUrl) && canSend
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md hover:shadow-blue-300/50 hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleSend}
                  disabled={!canSend || sending || (!messageText.trim() && !imageUrl)}
                >
                  {sending ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
                </Button>
              </div>

              {!isAuthenticated && (
                <p className='text-xs text-gray-500 px-3 pb-2'>Vui lòng đăng nhập để tham gia trò chuyện.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card className='bg-white border-blue-100'>
            <CardContent className='p-5 space-y-3'>
              <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <ShieldAlert className='w-4 h-4 text-amber-500' />
                Quy tắc cộng đồng
              </h3>
              <ul className='text-sm text-gray-600 space-y-2'>
                <li>Không chia sẻ thông tin cá nhân nhạy cảm.</li>
                <li>Không quảng cáo, spam hoặc chia sẻ liên kết độc hại.</li>
                <li>Không tư vấn y khoa nguy hiểm hoặc gây hại.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className='bg-white border-blue-100'>
            <CardContent className='p-5 space-y-2'>
              <h3 className='text-sm font-semibold text-gray-900'>Gợi ý</h3>
              <p className='text-sm text-gray-600'>
                Nếu cần tư vấn chuyên sâu, hãy dùng kênh chat với dược sĩ hoặc bác sĩ.
              </p>
              <Button
                variant='outline'
                className='border-blue-200 w-full'
                onClick={() => {
                  const chatButton = document.querySelector(
                    'button[aria-label="Chat với dược sĩ"]',
                  ) as HTMLButtonElement | null
                  chatButton?.click()
                }}
              >
                Chat với dược sĩ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Báo cáo tin nhắn</DialogTitle>
            <DialogDescription>
              Nội dung bị báo cáo sẽ được kiểm duyệt bởi quản trị viên.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-gray-700 break-words max-h-32 overflow-y-auto'>
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
              className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
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
            <DialogDescription>
              Appeal sẽ được gửi đến admin để xem xét khôi phục tin nhắn.
            </DialogDescription>
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
              className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
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
