import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { LogLevel, setLogLevel } from 'livekit-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import { toast } from 'sonner'
import communityService from '~/services/communityService'
import type { CommunityMessage, CommunityVideoEvent, CommunityVideoJoinPayload } from '~/types/community'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Textarea } from '~/components/ui/textarea'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import { getRoomTopic } from './communityUi'

if (typeof window !== 'undefined') {
  setLogLevel(LogLevel.silent)
}

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    scheduled: 'Sắp diễn ra',
    live: 'Đang live',
    ended: 'Đã kết thúc',
    cancelled: 'Đã hủy',
    draft: 'Bản nháp',
  }
  return labels[status || ''] || status
}

function meetingCode(eventId: string) {
  const compact = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(-12) || eventId.slice(-12)
  return (
    compact
      .match(/.{1,4}/g)
      ?.join('-')
      .toLowerCase() || eventId
  )
}

function isValidLiveKitJoinPayload(payload: CommunityVideoJoinPayload) {
  try {
    const url = new URL(payload.wsUrl)
    const host = url.hostname.toLowerCase()
    return ['ws:', 'wss:'].includes(url.protocol) && !host.includes('your-livekit-server.com') && Boolean(payload.token)
  } catch {
    return false
  }
}

function isCommunityVideoEventPayload(payload: unknown): payload is CommunityVideoEvent {
  if (!payload || typeof payload !== 'object') return false
  const event = payload as Partial<CommunityVideoEvent>
  return typeof event._id === 'string' && typeof event.roomId === 'string' && typeof event.title === 'string'
}

function displayNameFromParts(firstName?: string, lastName?: string, email?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || email || ''
}

export function CommunityVideoEventDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const socket = useSocketContext()
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)
  const [joinPayload, setJoinPayload] = useState<CommunityVideoJoinPayload | null>(null)
  const [chatText, setChatText] = useState('')
  const [chatMessages, setChatMessages] = useState<CommunityMessage[]>([])
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [cameraPreviewError, setCameraPreviewError] = useState<string | null>(null)
  const [cameraPreviewStatus, setCameraPreviewStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle')
  const [cameraRetryKey, setCameraRetryKey] = useState(0)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)

  const attachCameraPreview = useCallback((stream: MediaStream) => {
    const video = previewVideoRef.current
    if (!video) return
    video.muted = true
    video.autoplay = true
    video.playsInline = true
    if (video.srcObject !== stream) video.srcObject = stream
    const playPromise = video.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setCameraPreviewError('Trình duyệt đang chặn tự động phát camera. Bấm thử lại hoặc kiểm tra quyền camera.')
        setCameraPreviewStatus('error')
      })
    }
  }, [])

  const setPreviewVideoNode = useCallback(
    (node: HTMLVideoElement | null) => {
      previewVideoRef.current = node
      if (node && previewStreamRef.current) attachCameraPreview(previewStreamRef.current)
    },
    [attachCameraPreview],
  )

  const stopCameraPreview = useCallback(() => {
    previewStreamRef.current?.getTracks().forEach((track) => track.stop())
    previewStreamRef.current = null
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null
    setCameraPreviewStatus('idle')
  }, [])

  const eventQuery = useQuery({
    queryKey: ['community-video-event', eventId],
    queryFn: () => communityService.getVideoEvent(eventId),
    enabled: Boolean(eventId) && isAuthenticated,
    refetchInterval: isAuthenticated ? 2000 : false,
  })

  const event = eventQuery.data
  const chatQuery = useQuery({
    queryKey: ['community-video-event-chat', event?.roomId],
    queryFn: () => communityService.listMessages({ roomId: event!.roomId, page: 1, limit: 50 }),
    enabled: Boolean(event?.roomId) && isAuthenticated && Boolean(joinPayload),
    retry: false,
  })

  useEffect(() => {
    if (!chatQuery.data?.items) return
    setChatMessages([...chatQuery.data.items].reverse())
  }, [chatQuery.data?.items])

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraPreviewStatus('error')
      setCameraPreviewError('Camera preview cần HTTPS hoặc localhost để trình duyệt cho phép truy cập camera.')
      return
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraPreviewStatus('error')
      setCameraPreviewError('Trình duyệt hiện tại không hỗ trợ truy cập camera.')
      return
    }
    if (joinPayload || !cameraEnabled) {
      stopCameraPreview()
      return
    }

    let cancelled = false
    setCameraPreviewStatus('starting')
    setCameraPreviewError(null)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        stopCameraPreview()
        previewStreamRef.current = stream
        setCameraPreviewStatus('ready')
        attachCameraPreview(stream)
      })
      .catch((error) => {
        if (!cancelled) {
          const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
          setCameraPreviewStatus('error')
          setCameraPreviewError(
            denied
              ? 'Bạn chưa cấp quyền camera cho trình duyệt. Hãy cho phép camera rồi bấm thử lại.'
              : 'Không thể mở camera. Kiểm tra thiết bị camera hoặc quyền truy cập của trình duyệt.',
          )
        }
      })

    return () => {
      cancelled = true
      stopCameraPreview()
    }
  }, [attachCameraPreview, cameraEnabled, cameraRetryKey, joinPayload, stopCameraPreview])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateNetworkState = () => setIsOffline(!window.navigator.onLine)
    updateNetworkState()
    window.addEventListener('online', updateNetworkState)
    window.addEventListener('offline', updateNetworkState)
    return () => {
      window.removeEventListener('online', updateNetworkState)
      window.removeEventListener('offline', updateNetworkState)
    }
  }, [])

  useEffect(() => {
    if (!eventId || !isAuthenticated || !socket.isConnected) return
    socket.joinCommunityVideoEvent(eventId)
    const subscriberId = `video-event-${eventId}`
    socket.subscribe(subscriberId, {
      onCommunityVideoEventUpdated: (updatedEvent) => {
        if (isCommunityVideoEventPayload(updatedEvent) && updatedEvent._id === eventId) {
          queryClient.setQueryData(['community-video-event', eventId], updatedEvent)
        }
        queryClient.invalidateQueries({ queryKey: ['community-video-event', eventId] })
      },
    })
    return () => {
      socket.leaveCommunityVideoEvent(eventId)
      socket.unsubscribe(subscriberId)
    }
  }, [eventId, isAuthenticated, queryClient, socket])

  useEffect(() => {
    if (!event?.roomId || !isAuthenticated || !joinPayload || !socket.isConnected) return
    const subscriberId = `video-event-chat-${event.roomId}`
    socket.joinCommunityRoom(event.roomId)
    socket.subscribe(subscriberId, {
      onCommunityMessageNew: (message) => {
        if (message.roomId !== event.roomId) return
        setChatMessages((current) =>
          current.some((item) => item._id === message._id) ? current : [...current, message],
        )
      },
      onCommunityMessageHidden: (message) => {
        if (message.roomId !== event.roomId) return
        setChatMessages((current) => current.filter((item) => item._id !== message._id))
      },
      onCommunityMessageDeleted: (message) => {
        if (message.roomId !== event.roomId) return
        setChatMessages((current) => current.filter((item) => item._id !== message._id))
      },
    })
    return () => {
      socket.leaveCommunityRoom(event.roomId)
      socket.unsubscribe(subscriberId)
    }
  }, [event?.roomId, isAuthenticated, joinPayload, socket])

  const joinMutation = useMutation({
    mutationFn: () => communityService.joinVideoEvent(eventId),
    onSuccess: async (payload) => {
      if (!isValidLiveKitJoinPayload(payload)) {
        setJoinPayload(null)
        toast.error('LiveKit chưa được cấu hình đúng. Vui lòng kiểm tra LIVEKIT_WS_URL trên backend.')
        return
      }
      stopCameraPreview()
      setJoinPayload(payload)
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tham gia hội thảo'),
  })

  const chatMutation = useMutation({
    mutationFn: async () => {
      if (!event?.roomId) throw new Error('Không tìm thấy phòng chat')
      return communityService.sendMessage({ roomId: event.roomId, content: chatText.trim() })
    },
    onSuccess: () => {
      setChatText('')
      queryClient.invalidateQueries({ queryKey: ['community-video-event-chat', event?.roomId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể gửi tin nhắn'),
  })

  const registerMutation = useMutation({
    mutationFn: () => communityService.registerVideoEvent(eventId),
    onSuccess: () => {
      toast.success('Đã đăng ký hội thảo')
      queryClient.invalidateQueries({ queryKey: ['community-video-event', eventId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể đăng ký hội thảo'),
  })

  const cancelRegistrationMutation = useMutation({
    mutationFn: () => communityService.cancelVideoEventRegistration(eventId),
    onSuccess: () => {
      toast.success('Đã hủy đăng ký')
      queryClient.invalidateQueries({ queryKey: ['community-video-event', eventId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể hủy đăng ký'),
  })

  const sendChatMessage = () => {
    if (chatText.trim().length < 1 || chatMutation.isPending) return
    chatMutation.mutate()
  }

  const showReconnectIndicator = isOffline || (Boolean(joinPayload) && socket.isConnecting)
  const backToCommunityPath = event?.roomId ? `/community/${event.roomId}` : '/community'
  const isRegistered =
    event?.viewerRegistration?.status === 'registered' || event?.viewerRegistration?.status === 'attended'
  const isFull = Boolean(event?.capacity && (event.registrationCount || 0) >= event.capacity && !isRegistered)

  const copyMeetingLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Đã copy link cuộc họp')
  }

  useEffect(() => {
    const status = eventQuery.data?.status
    if (!joinPayload || (status !== 'ended' && status !== 'cancelled')) return
    setJoinPayload(null)
    toast.info(status === 'ended' ? 'Cuộc họp đã kết thúc' : 'Cuộc họp đã bị hủy')
  }, [eventQuery.data?.status, joinPayload])

  if (!isAuthenticated) {
    return (
      <main className='mx-auto max-w-4xl px-4 py-10'>
        <UniversalBreadcrumb items={[{ label: 'Cộng đồng', href: '/community' }, { label: 'Chi tiết hội thảo' }]} />

        <Button variant='ghost' onClick={() => navigate('/community')}>
          <ArrowLeft />
          Quay lại cộng đồng
        </Button>
        <div className='mt-8 rounded-lg border border-gray-200 bg-white p-8 text-center'>
          <h1 className='text-xl font-semibold'>Bạn cần đăng nhập để xem hội thảo</h1>
          <Button
            className='mt-4'
            onClick={() => navigate('/login', { state: { from: { pathname: `/community/video-events/${eventId}` } } })}
          >
            Đăng nhập
          </Button>
        </div>
      </main>
    )
  }

  if (eventQuery.isError) {
    return (
      <main className='min-h-screen bg-[#202124] p-6 text-white'>
        <div className='mx-auto mt-20 max-w-xl text-center'>Không thể tải cuộc họp. Vui lòng thử lại.</div>
      </main>
    )
  }

  if (eventQuery.isLoading || !event) {
    return (
      <main className='min-h-screen bg-[#202124] p-6 text-white'>
        <div className='mx-auto mt-20 max-w-xl text-center'>Đang chuẩn bị cuộc họp...</div>
      </main>
    )
  }

  if (joinPayload) {
    return (
      <main className='flex min-h-screen flex-col bg-[#202124] text-white'>
        <header className='flex h-14 items-center justify-between px-4 md:px-6'>
          <div className='min-w-0'>
            <div className='truncate text-sm font-medium'>MediSpace Meet</div>
            <div className='text-xs text-gray-400'>
              {meetingCode(event._id)} · {event.title}
            </div>
          </div>
          {showReconnectIndicator && (
            <div
              data-testid='reconnection-indicator'
              className='rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-100'
            >
              Đang kết nối lại...
            </div>
          )}
          <Button
            variant='ghost'
            className='rounded-full text-white hover:bg-white/10'
            onClick={() => setShowChat((value) => !value)}
          >
            <MessageSquare className='h-4 w-4' />
          </Button>
        </header>

        <section className='grid min-h-0 flex-1 gap-3 px-3 pb-3 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div
            data-testid='video-room'
            className='relative min-h-[520px] overflow-hidden rounded-[12px] bg-black shadow-2xl'
          >
            <LiveKitRoom
              token={joinPayload.token}
              serverUrl={joinPayload.wsUrl}
              connect={true}
              audio={micEnabled}
              video={cameraEnabled}
              data-lk-theme='default'
              className='medispace-livekit-room'
              onDisconnected={() => setJoinPayload(null)}
              onError={(error) => toast.error(error?.message || 'Không thể kết nối LiveKit')}
            >
              <style>{`.medispace-livekit-room .lk-chat,.medispace-livekit-room .lk-chat-toggle{display:none!important}`}</style>
              <VideoConference />
            </LiveKitRoom>
          </div>

          {showChat && (
            <aside className='flex min-h-0 flex-col rounded-[12px] bg-white text-gray-900 shadow-2xl'>
              <div className='border-b px-4 py-3 font-semibold'>Chat cuộc họp</div>
              <div className='min-h-0 flex-1 space-y-3 overflow-auto p-4'>
                {chatQuery.isLoading ? <p className='text-sm text-gray-500'>Đang tải chat...</p> : null}
                {chatMessages.length
                  ? chatMessages.map((message) => {
                      const mine = message.senderId === user?._id
                      const senderName = mine
                        ? displayNameFromParts(
                            message.sender?.firstName || user?.firstName,
                            message.sender?.lastName || user?.lastName,
                            message.sender?.email || user?.email,
                          ) || 'Bạn'
                        : displayNameFromParts(
                            message.sender?.firstName,
                            message.sender?.lastName,
                            message.sender?.email,
                          ) || 'Thành viên'
                      return (
                        <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                          >
                            <div className={`mb-1 text-xs font-medium ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                              {senderName}
                            </div>
                            <div className='space-y-2'>
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
                                    className='max-h-64 w-full object-cover'
                                    loading='lazy'
                                  />
                                </a>
                              )}
                              {message.content && <p className='whitespace-pre-wrap break-words'>{message.content}</p>}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  : !chatQuery.isLoading && (
                      <p className='text-sm text-gray-500'>Chưa có tin nhắn. Hãy trao đổi trực tiếp trong cuộc họp.</p>
                    )}
              </div>
              <div className='border-t p-3'>
                <div className='flex items-end gap-2'>
                  <Textarea
                    value={chatText}
                    onChange={(event) => setChatText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        sendChatMessage()
                      }
                    }}
                    placeholder='Nhắn tin cho mọi người...'
                    className='min-h-10 resize-none rounded-2xl'
                  />
                  <Button
                    aria-label='Gửi tin nhắn'
                    size='icon'
                    className='h-10 w-10 shrink-0 rounded-full'
                    disabled={!chatText.trim() || chatMutation.isPending}
                    onClick={sendChatMessage}
                  >
                    <Send className='h-4 w-4' />
                  </Button>
                </div>
                {chatMutation.isError && (
                  <p className='mt-2 text-xs text-red-600'>
                    Không thể gửi tin nhắn. Bạn có thể cần tham gia phòng cộng đồng trước.
                  </p>
                )}
              </div>
            </aside>
          )}
        </section>

        <footer className='grid h-14 grid-cols-[1fr_auto] items-center px-4 md:px-6'>
          <div className='hidden min-w-0 text-sm text-gray-300 md:block'>
            <span className='font-medium'>{formatDateTime(new Date().toISOString())}</span>
            <span className='mx-2 text-gray-500'>|</span>
            <span className='truncate'>{event.title}</span>
          </div>
          <div className='justify-self-end'>
            <Button variant='ghost' className='rounded-full text-white hover:bg-white/10' onClick={copyMeetingLink}>
              <Copy />
              Copy link
            </Button>
          </div>
        </footer>
      </main>
    )
  }

  return (
    <main data-testid='event-detail-page' className='min-h-screen bg-white text-[#202124]'>
      <UniversalBreadcrumb
        items={[
          { label: 'Cộng đồng', href: '/community' },
          { label: 'Hội thảo cộng đồng', href: '/community/video-events' },
          { label: event.title || 'Chi tiết hội thảo' },
        ]}
      />

      <header className='flex h-16 items-center justify-between px-4 text-[#5f6368] md:px-8'>
        <button
          type='button'
          className='flex items-center gap-3 text-[22px] font-normal text-[#5f6368]'
          onClick={() => navigate(backToCommunityPath)}
        >
          <span className='flex h-9 w-9 items-center justify-center rounded bg-[#1a73e8] text-white'>
            <Video className='h-5 w-5' />
          </span>
          <span>MediSpace Meet</span>
        </button>
        <div className='flex items-center gap-3 text-sm'>
          <span className='hidden md:inline'>{formatDateTime(new Date().toISOString())}</span>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full text-[#5f6368] hover:bg-gray-100'
            onClick={copyMeetingLink}
          >
            <Copy />
          </Button>
        </div>
      </header>

      <section className='mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 pb-8 md:px-8 lg:grid-cols-[minmax(0,1.25fr)_420px]'>
        <div className='space-y-5'>
          <div className='relative flex aspect-video min-h-[260px] items-center justify-center overflow-hidden rounded-[24px] bg-[#202124] shadow-[0_8px_30px_rgba(0,0,0,0.18)]'>
            <div className='absolute left-5 top-5 z-10 rounded-full bg-black/45 px-3 py-1.5 text-sm text-white'>
              {cameraEnabled ? 'Camera preview' : 'Camera đang tắt'}
            </div>
            {cameraEnabled ? (
              <>
                <video
                  ref={setPreviewVideoNode}
                  data-testid='camera-preview-video'
                  className='h-full w-full object-cover'
                  autoPlay
                  muted
                  playsInline
                />
                {cameraPreviewStatus === 'starting' && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 text-white'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                    <span className='text-sm'>Đang mở camera...</span>
                  </div>
                )}
                {cameraPreviewError && (
                  <div className='absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-[16px] bg-black/70 px-4 py-4 text-center text-sm text-white'>
                    <p>{cameraPreviewError}</p>
                    <Button
                      type='button'
                      size='sm'
                      className='mt-3 rounded-full bg-white text-[#202124] hover:bg-gray-100'
                      onClick={() => setCameraRetryKey((value) => value + 1)}
                    >
                      <RefreshCw className='h-4 w-4' />
                      Thử lại
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className='flex h-32 w-32 items-center justify-center rounded-full bg-[#3c4043] text-white'>
                <VideoOff className='h-14 w-14' />
              </div>
            )}
            <div className='absolute bottom-5 flex gap-4'>
              <Button
                data-testid='mic-toggle-btn'
                aria-label={micEnabled ? 'Tắt micro' : 'Bật micro'}
                size='icon'
                className={`h-12 w-12 rounded-full ${micEnabled ? 'bg-[#3c4043]' : 'bg-[#ea4335]'} text-white hover:bg-[#4b5055]`}
                onClick={() => setMicEnabled((value) => !value)}
              >
                {micEnabled ? <Mic /> : <MicOff />}
              </Button>
              <Button
                data-testid='camera-toggle-btn'
                aria-label={cameraEnabled ? 'Tắt camera' : 'Bật camera'}
                size='icon'
                className={`h-12 w-12 rounded-full ${cameraEnabled ? 'bg-[#3c4043]' : 'bg-[#ea4335]'} text-white hover:bg-[#4b5055]`}
                onClick={() => setCameraEnabled((value) => !value)}
              >
                {cameraEnabled ? <Video /> : <VideoOff />}
              </Button>
            </div>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-4 text-sm text-[#5f6368]'>
            <span className='inline-flex items-center gap-2'>
              <CalendarDays className='h-4 w-4' />
              {formatDateTime(event.scheduledStartAt)}
            </span>
            <span data-testid='attendee-count' className='inline-flex items-center gap-2'>
              <Users className='h-4 w-4' />
              {event.registrationCount || 0}
              {event.capacity ? `/${event.capacity}` : ''} người đã tham gia
            </span>
          </div>
        </div>

        <aside className='mx-auto w-full max-w-[420px] space-y-6 text-center'>
          <div className='space-y-4'>
            <h1 className='text-[32px] font-normal leading-tight text-[#202124] md:text-[36px]'>Sẵn sàng tham gia?</h1>
            <p data-testid='event-title' className='mx-auto max-w-sm text-sm leading-6 text-[#5f6368]'>
              {event.title}
            </p>
            {showReconnectIndicator && (
              <div
                data-testid='reconnection-indicator'
                className='rounded-[12px] bg-[#fef7e0] px-4 py-3 text-sm text-[#8f5b00]'
              >
                Đang kết nối lại...
              </div>
            )}
            <div className='mx-auto flex w-fit items-center gap-2 rounded-full bg-[#f1f3f4] px-4 py-2 text-sm text-[#3c4043]'>
              <span
                className={`h-2.5 w-2.5 rounded-full ${event.status === 'live' ? 'bg-[#ea4335]' : 'bg-[#5f6368]'}`}
              />
              {statusLabel(event.status)} · {meetingCode(event._id)}
            </div>
            {event.status === 'live' && (
              <div
                data-testid='event-live-notification'
                className='rounded-[12px] bg-[#fce8e6] px-4 py-3 text-sm text-[#a50e0e]'
              >
                Cuộc họp đang live, bạn có thể tham gia ngay.
              </div>
            )}
            {(event.status === 'ended' || event.status === 'cancelled') && (
              <div
                data-testid='session-ended-message'
                className='rounded-[12px] bg-[#f1f3f4] px-4 py-3 text-sm text-[#3c4043]'
              >
                {event.status === 'ended' ? 'Cuộc họp đã kết thúc.' : 'Cuộc họp đã bị hủy.'}
              </div>
            )}
          </div>

          <div className='space-y-3 rounded-[14px] border border-[#dadce0] bg-white p-4 text-left shadow-sm'>
            {event.room && (
              <div className='text-xs font-medium text-[#1a73e8]'>
                {event.room.name} · {getRoomTopic(event.room)}
              </div>
            )}
            {event.description && <p className='text-sm leading-6 text-[#3c4043]'>{event.description}</p>}
            {event.agenda && (
              <div>
                <div className='mb-1 text-xs font-medium uppercase tracking-wide text-[#5f6368]'>
                  Nội dung buổi chia sẻ
                </div>
                <p className='whitespace-pre-wrap text-sm leading-6 text-[#3c4043]'>{event.agenda}</p>
              </div>
            )}
            {Array.isArray(event.materials) && event.materials.length > 0 && (
              <p className='text-xs text-[#5f6368]'>
                {event.materials.length} tài liệu sẽ được chia sẻ trong hội thảo.
              </p>
            )}
            {isRegistered && (
              <div className='inline-flex items-center gap-2 rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#174ea6]'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                Bạn đã đăng ký
              </div>
            )}
          </div>

          {event.registrationRequired && event.status === 'scheduled' && (
            <div className='flex flex-col items-center gap-2'>
              {isRegistered ? (
                <Button
                  variant='outline'
                  className='rounded-full border-[#dadce0]'
                  disabled={cancelRegistrationMutation.isPending}
                  onClick={() => cancelRegistrationMutation.mutate()}
                >
                  Hủy đăng ký
                </Button>
              ) : (
                <Button
                  className='rounded-full bg-[#0A2463] text-white hover:bg-[#12357D]'
                  disabled={isFull || registerMutation.isPending}
                  onClick={() => registerMutation.mutate()}
                >
                  {isFull ? 'Đã đủ chỗ' : 'Đăng ký tham gia'}
                </Button>
              )}
            </div>
          )}

          <label className='flex items-start gap-3 rounded-[14px] border border-[#dadce0] bg-white p-4 text-left text-sm text-[#3c4043] shadow-sm'>
            <Checkbox
              data-testid='medical-disclaimer-checkbox'
              checked={acceptedDisclaimer}
              onCheckedChange={(checked) => setAcceptedDisclaimer(Boolean(checked))}
            />
            <span>Tôi hiểu hội thảo chỉ mang tính tham khảo, không thay thế tư vấn điều trị cá nhân.</span>
          </label>

          <div className='flex flex-col items-center gap-3'>
            <Button
              data-testid='join-event-btn'
              className='h-11 rounded-full bg-[#1a73e8] px-7 text-white hover:bg-[#1765cc]'
              disabled={
                !acceptedDisclaimer ||
                event.status !== 'live' ||
                joinMutation.isPending ||
                (event.registrationRequired && !isRegistered)
              }
              onClick={() => joinMutation.mutate()}
            >
              {event.status === 'live' ? 'Tham gia ngay' : 'Cuộc họp chưa bắt đầu'}
            </Button>
            {event.registrationRequired && !isRegistered && event.status === 'live' && (
              <p className='text-xs text-[#5f6368]'>Bạn cần đăng ký trước khi tham gia hội thảo này.</p>
            )}
          </div>

          <div className='rounded-[14px] border border-[#dadce0] bg-white p-3 text-left shadow-sm'>
            <div className='mb-2 text-xs font-medium uppercase tracking-wide text-[#5f6368]'>Link cuộc họp</div>
            <button
              type='button'
              className='flex w-full items-center justify-between gap-3 rounded-lg bg-[#f8fafd] px-3 py-3 text-left text-sm text-[#202124]'
              onClick={copyMeetingLink}
            >
              <span className='truncate'>
                {typeof window === 'undefined' ? event.meetingUrl : window.location.href}
              </span>
              <Copy className='h-4 w-4 shrink-0 text-[#1a73e8]' />
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default CommunityVideoEventDetailPage
