import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Send, ShieldCheck, Users, Video } from 'lucide-react'
import { toast } from 'sonner'
import communityService from '~/services/communityService'
import type { CommunityVideoJoinPayload } from '~/types/community'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Textarea } from '~/components/ui/textarea'

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = { scheduled: 'Sắp diễn ra', live: 'Đang live', ended: 'Đã kết thúc', cancelled: 'Đã hủy', draft: 'Bản nháp' }
  return labels[status || ''] || status
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

export function CommunityVideoEventDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const socket = useSocketContext()
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)
  const [joinPayload, setJoinPayload] = useState<CommunityVideoJoinPayload | null>(null)
  const [question, setQuestion] = useState('')

  const eventQuery = useQuery({
    queryKey: ['community-video-event', eventId],
    queryFn: () => communityService.getVideoEvent(eventId),
    enabled: Boolean(eventId) && isAuthenticated,
  })

  const questionsQuery = useQuery({
    queryKey: ['community-video-event-questions', eventId],
    queryFn: () => communityService.listVideoEventQuestions({ eventId, page: 1, limit: 50 }),
    enabled: Boolean(eventId) && isAuthenticated,
  })

  useEffect(() => {
    if (!eventId || !isAuthenticated) return
    socket.joinCommunityVideoEvent(eventId, (payload) => {
      if (!payload.ok && payload.message) toast.error(payload.message)
    })
    const subscriberId = `video-event-${eventId}`
    socket.subscribe(subscriberId, {
      onCommunityVideoEventUpdated: () => queryClient.invalidateQueries({ queryKey: ['community-video-event', eventId] }),
      onCommunityVideoEventQuestionNew: () => queryClient.invalidateQueries({ queryKey: ['community-video-event-questions', eventId] }),
      onCommunityVideoEventQuestionUpdated: () => queryClient.invalidateQueries({ queryKey: ['community-video-event-questions', eventId] }),
    })
    return () => {
      socket.leaveCommunityVideoEvent(eventId)
      socket.unsubscribe(subscriberId)
    }
  }, [eventId, isAuthenticated, queryClient, socket])

  const registerMutation = useMutation({
    mutationFn: () => communityService.registerVideoEvent(eventId),
    onSuccess: () => {
      toast.success('Đã đăng ký hội thảo')
      queryClient.invalidateQueries({ queryKey: ['community-video-event', eventId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể đăng ký'),
  })

  const joinMutation = useMutation({
    mutationFn: () => communityService.joinVideoEvent(eventId),
    onSuccess: (payload) => {
      if (!isValidLiveKitJoinPayload(payload)) {
        setJoinPayload(null)
        toast.error('LiveKit chưa được cấu hình đúng. Vui lòng kiểm tra LIVEKIT_WS_URL trên backend.')
        return
      }
      setJoinPayload(payload)
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tham gia hội thảo'),
  })

  const questionMutation = useMutation({
    mutationFn: () => communityService.submitVideoEventQuestion({ eventId, content: question.trim() }),
    onSuccess: () => {
      setQuestion('')
      toast.success('Đã gửi câu hỏi cho host duyệt')
      queryClient.invalidateQueries({ queryKey: ['community-video-event-questions', eventId] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể gửi câu hỏi'),
  })

  if (!isAuthenticated) {
    return (
      <main className='mx-auto max-w-4xl px-4 py-10'>
        <Button variant='ghost' onClick={() => navigate('/community/video-events')}><ArrowLeft />Quay lại</Button>
        <div className='mt-8 rounded-lg border border-gray-200 bg-white p-8 text-center'>
          <h1 className='text-xl font-semibold'>Bạn cần đăng nhập để xem hội thảo</h1>
          <Button className='mt-4' onClick={() => navigate('/login', { state: { from: { pathname: `/community/video-events/${eventId}` } } })}>Đăng nhập</Button>
        </div>
      </main>
    )
  }

  const event = eventQuery.data
  const registered = ['registered', 'attended'].includes(event?.viewerRegistration?.status || '')

  return (
    <main className='mx-auto w-full max-w-7xl px-4 py-8'>
      <Button variant='ghost' onClick={() => navigate('/community/video-events')}><ArrowLeft />Lịch hội thảo</Button>

      {eventQuery.isError ? (
        <div className='mt-6 rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700'>Không thể tải hội thảo. Vui lòng thử lại.</div>
      ) : eventQuery.isLoading || !event ? (
        <div className='mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600'>Đang tải hội thảo...</div>
      ) : (
        <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]'>
          <section className='min-w-0 space-y-5'>
            <div className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='mb-3 flex flex-wrap gap-2'>
                <Badge className={event.status === 'live' ? 'bg-red-600 text-white' : ''}>{statusLabel(event.status)}</Badge>
                <Badge variant='outline'>{event.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</Badge>
                {event.room?.name && <Badge variant='secondary'>{event.room.name}</Badge>}
              </div>
              <h1 className='text-2xl font-bold text-gray-950'>{event.title}</h1>
              <div className='mt-4 flex flex-wrap gap-4 text-sm text-gray-600'>
                <span className='inline-flex items-center gap-2'><CalendarDays className='h-4 w-4' />{formatDateTime(event.scheduledStartAt)} - {formatDateTime(event.scheduledEndAt)}</span>
                <span className='inline-flex items-center gap-2'><Users className='h-4 w-4' />{event.registrationCount || 0}{event.capacity ? `/${event.capacity}` : ''} đăng ký</span>
              </div>
              {event.description && <p className='mt-4 whitespace-pre-wrap text-gray-700'>{event.description}</p>}
              {event.agenda && <p className='mt-4 whitespace-pre-wrap rounded-md bg-blue-50 p-4 text-sm text-blue-950'>{event.agenda}</p>}
            </div>

            <div className='rounded-lg border border-gray-200 bg-white p-4'>
              {joinPayload ? (
                <div className='overflow-hidden rounded-lg border border-gray-200 bg-black' style={{ minHeight: 520 }}>
                  <LiveKitRoom
                    token={joinPayload.token}
                    serverUrl={joinPayload.wsUrl}
                    connect={true}
                    data-lk-theme='default'
                    onDisconnected={() => setJoinPayload(null)}
                    onError={(error) => toast.error(error?.message || 'Không thể kết nối LiveKit')}
                  >
                    <VideoConference />
                  </LiveKitRoom>
                </div>
              ) : (
                <div className='flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center'>
                  <Video className='mb-3 h-10 w-10 text-blue-600' />
                  <p className='max-w-xl text-sm text-gray-600'>Trước khi tham gia, hãy xác nhận bạn hiểu nội dung hội thảo chỉ mang tính tham khảo, không thay thế chẩn đoán hoặc tư vấn điều trị cá nhân.</p>
                  <label className='mt-4 flex items-center gap-2 text-sm text-gray-700'>
                    <Checkbox checked={acceptedDisclaimer} onCheckedChange={(checked) => setAcceptedDisclaimer(Boolean(checked))} />
                    Tôi đã hiểu và đồng ý với lưu ý y tế này.
                  </label>
                  <div className='mt-4 flex gap-2'>
                    {!registered && event.status !== 'ended' && <Button variant='outline' onClick={() => registerMutation.mutate()}>Đăng ký</Button>}
                    <Button disabled={!acceptedDisclaimer || event.status !== 'live'} onClick={() => joinMutation.mutate()}>
                      {event.status === 'live' ? 'Tham gia hội thảo' : 'Chưa live'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className='space-y-4'>
            <div className='rounded-lg border border-gray-200 bg-white p-4'>
              <div className='mb-3 flex items-center gap-2 font-semibold text-gray-950'><ShieldCheck className='h-4 w-4 text-emerald-600' />Q&A đã kiểm duyệt</div>
              <div className='space-y-3'>
                {questionsQuery.data?.items?.map((item) => (
                  <div key={item._id} className='rounded-md border border-gray-100 bg-gray-50 p-3 text-sm'>
                    <div className='mb-1 flex items-center justify-between gap-2'>
                      <Badge variant='outline'>{item.status}</Badge>
                      {item.pinned && <Badge>Ghim</Badge>}
                    </div>
                    <p className='text-gray-800'>{item.content}</p>
                    {item.answerSummary && <p className='mt-2 rounded bg-white p-2 text-gray-700'>{item.answerSummary}</p>}
                  </div>
                )) || <p className='text-sm text-gray-500'>Chưa có câu hỏi.</p>}
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 bg-white p-4'>
              <div className='mb-2 font-semibold text-gray-950'>Gửi câu hỏi</div>
              <p className='mb-3 text-xs text-gray-500'>Không gửi thông tin cá nhân, đơn thuốc hoặc yêu cầu chẩn đoán riêng trong Q&A công khai.</p>
              <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder='Nhập câu hỏi cho dược sĩ...' />
              <Button className='mt-3 w-full' disabled={question.trim().length < 3 || questionMutation.isPending} onClick={() => questionMutation.mutate()}>
                <Send />Gửi câu hỏi
              </Button>
            </div>

            {event.recordingUrl && <Button asChild variant='outline' className='w-full'><Link to={event.recordingUrl}>Xem recording</Link></Button>}
          </aside>
        </div>
      )}
    </main>
  )
}

export default CommunityVideoEventDetailPage
