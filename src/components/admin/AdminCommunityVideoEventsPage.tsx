import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Copy, ExternalLink, Link as LinkIcon, MessageSquare, MicOff, Play, RefreshCw, Search, Square, UserX, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminCommunityService } from '~/services/communityService'
import type { CommunityRoom, CommunityVideoEvent } from '~/types/community'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = { draft: 'Nháp', scheduled: 'Sắp diễn ra', live: 'Live', ended: 'Đã kết thúc', cancelled: 'Đã hủy' }
  return labels[status || ''] || status
}

function getMeetingHref(event?: CommunityVideoEvent | null) {
  if (!event?._id) return ''
  const path = event.meetingUrl || `/community/video-events/${event._id}`
  if (/^https?:\/\//i.test(path)) return path
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).toString()
}

function meetingCode(event?: CommunityVideoEvent | null) {
  if (!event?._id) return '----'
  const compact = event._id.replace(/[^a-zA-Z0-9]/g, '').slice(-12) || event._id.slice(-12)
  return compact.match(/.{1,4}/g)?.join('-').toLowerCase() || event._id
}

export function AdminCommunityVideoEventsPage() {
  const now = useMemo(() => new Date(), [])
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<CommunityVideoEvent | null>(null)
  const [form, setForm] = useState({
    roomId: '',
    title: '',
    description: '',
    agenda: '',
    visibility: 'public' as 'public' | 'private',
    scheduledStartAt: toLocalInputValue(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    scheduledEndAt: toLocalInputValue(new Date(now.getTime() + 25 * 60 * 60 * 1000)),
    capacity: '300',
    tags: '',
  })
  const queryClient = useQueryClient()

  const roomsQuery = useQuery({ queryKey: ['admin-community-rooms-for-video'], queryFn: () => adminCommunityService.listRooms({ status: 'active' }) })
  const eventsQuery = useQuery({
    queryKey: ['admin-community-video-events', search.trim()],
    queryFn: () => adminCommunityService.listVideoEvents({ search: search.trim() || undefined, page: 1, limit: 50 }),
  })
  const registrationsQuery = useQuery({
    queryKey: ['admin-community-video-event-registrations', selectedEvent?._id],
    queryFn: () => adminCommunityService.listVideoEventRegistrations({ eventId: selectedEvent!._id, page: 1, limit: 50 }),
    enabled: Boolean(selectedEvent?._id),
  })
  const liveParticipantsQuery = useQuery({
    queryKey: ['admin-community-video-event-live-participants', selectedEvent?._id],
    queryFn: () => adminCommunityService.listVideoEventParticipants(selectedEvent!._id),
    enabled: Boolean(selectedEvent?._id && selectedEvent.status === 'live'),
    refetchInterval: selectedEvent?.status === 'live' ? 10_000 : false,
  })
  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-community-video-events'] })
    if (selectedEvent?._id) {
      queryClient.invalidateQueries({ queryKey: ['admin-community-video-event-registrations', selectedEvent._id] })
      queryClient.invalidateQueries({ queryKey: ['admin-community-video-event-live-participants', selectedEvent._id] })
    }
  }

  const buildCreatePayload = () => {
    const scheduledStartAt = new Date(form.scheduledStartAt)
    const scheduledEndAt = new Date(form.scheduledEndAt)
    if (Number.isNaN(scheduledStartAt.getTime())) throw new Error('Thời gian bắt đầu không hợp lệ')
    if (Number.isNaN(scheduledEndAt.getTime())) throw new Error('Thời gian kết thúc không hợp lệ')
    if (scheduledEndAt <= scheduledStartAt) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu')

    const agenda = form.agenda.trim()
    const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    return {
      roomId: form.roomId,
      title: form.title.trim(),
      description: form.description.trim(),
      ...(agenda ? { agenda } : {}),
      visibility: form.visibility,
      scheduledStartAt: scheduledStartAt.toISOString(),
      scheduledEndAt: scheduledEndAt.toISOString(),
      capacity: Number(form.capacity) || null,
      ...(tags.length ? { tags } : {}),
      registrationRequired: false,
      provider: 'livekit',
    }
  }

  const createMutation = useMutation({
    mutationFn: () => adminCommunityService.createVideoEvent(buildCreatePayload()),
    onSuccess: (event) => {
      toast.success('Đã tạo link cuộc họp')
      setSelectedEvent(event)
      setForm((current) => ({ ...current, title: '', description: '', agenda: '', tags: '' }))
      invalidateEvents()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Không thể tạo hội thảo'),
  })

  const actionMutation = useMutation({
    mutationFn: async ({ eventId, action }: { eventId: string; action: 'start' | 'end' | 'cancel' }) => {
      if (action === 'start') return adminCommunityService.startVideoEvent(eventId)
      if (action === 'end') return adminCommunityService.endVideoEvent(eventId)
      return adminCommunityService.cancelVideoEvent(eventId)
    },
    onSuccess: (event) => {
      toast.success('Đã cập nhật trạng thái hội thảo')
      setSelectedEvent(event)
      invalidateEvents()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể cập nhật hội thảo'),
  })

  const muteParticipantMutation = useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => adminCommunityService.muteVideoEventParticipant(eventId, userId),
    onSuccess: () => {
      toast.success('Đã tắt micro người tham gia')
      if (selectedEvent?._id) queryClient.invalidateQueries({ queryKey: ['admin-community-video-event-live-participants', selectedEvent._id] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tắt micro người tham gia'),
  })

  const kickParticipantMutation = useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => adminCommunityService.kickVideoEventParticipant(eventId, userId),
    onSuccess: () => {
      toast.success('Đã mời người tham gia khỏi phòng họp')
      if (selectedEvent?._id) queryClient.invalidateQueries({ queryKey: ['admin-community-video-event-live-participants', selectedEvent._id] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể mời người tham gia khỏi phòng họp'),
  })

  const copyMeetingLink = async (event: CommunityVideoEvent) => {
    const href = getMeetingHref(event)
    if (!href) return
    await navigator.clipboard.writeText(href)
    toast.success('Đã copy link cuộc họp')
  }

  const events = eventsQuery.data?.items || []
  const liveParticipants = liveParticipantsQuery.data?.participants || []

  useEffect(() => {
    const firstRoom = roomsQuery.data?.[0]
    if (!form.roomId && firstRoom?._id) {
      setForm((current) => ({ ...current, roomId: firstRoom._id }))
    }
  }, [form.roomId, roomsQuery.data])

  return (
    <main data-testid='admin-video-events-page' className='space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-950'>Hội thảo cộng đồng</h1>
          <p className='text-sm text-gray-600'>Tạo link họp, vận hành live session và để cộng đồng trao đổi ngay bằng chat trong phòng.</p>
        </div>
        <div className='relative w-full md:w-80'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm hội thảo' />
        </div>
      </div>

      <section className='grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
        <form className='space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm' onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
          <div>
            <div className='flex items-center gap-2 font-semibold text-gray-950'><CalendarPlus className='h-4 w-4 text-blue-600' />Tạo link cuộc họp</div>
            <p className='mt-1 text-sm text-gray-600'>Nhập thông tin buổi chia sẻ, bấm tạo là có ngay link phòng giống Google Meet.</p>
          </div>

          {selectedEvent && (
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='mb-2 flex items-center justify-between gap-2'>
                <div>
                  <div className='text-sm font-semibold text-blue-950'>Link cuộc họp đã sẵn sàng</div>
                  <div className='text-xs text-blue-700'>Mã phòng: {meetingCode(selectedEvent)}</div>
                </div>
                <Button type='button' size='sm' onClick={() => copyMeetingLink(selectedEvent)}><Copy />Copy</Button>
              </div>
              <div className='flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700'>
                <LinkIcon className='h-4 w-4 shrink-0 text-blue-600' />
                <span className='truncate font-mono'>{getMeetingHref(selectedEvent)}</span>
              </div>
              <Button type='button' variant='outline' className='mt-3 w-full bg-white' asChild>
                <a href={getMeetingHref(selectedEvent)} target='_blank' rel='noreferrer'><ExternalLink />Mở giao diện phòng họp</a>
              </Button>
            </div>
          )}
          <div className='space-y-2'>
            <Label>Phòng cộng đồng</Label>
          {roomsQuery.isError && <p className='text-sm text-red-600'>Không thể tải danh sách phòng.</p>}
          <Select value={form.roomId} onValueChange={(roomId) => setForm((current) => ({ ...current, roomId }))}>
              <SelectTrigger><SelectValue placeholder='Chọn phòng' /></SelectTrigger>
              <SelectContent>{(roomsQuery.data || []).map((room: CommunityRoom) => <SelectItem key={room._id} value={room._id}>{room.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className='space-y-2'><Label>Tiêu đề</Label><Input data-testid='event-title-input' value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
          <div className='space-y-2'><Label>Mô tả</Label><Textarea data-testid='event-description-input' value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
          <div className='space-y-2'><Label>Agenda</Label><Textarea data-testid='event-agenda-input' value={form.agenda} onChange={(event) => setForm((current) => ({ ...current, agenda: event.target.value }))} /></div>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='space-y-2'><Label>Bắt đầu</Label><Input data-testid='event-start-input' type='datetime-local' value={form.scheduledStartAt} onChange={(event) => setForm((current) => ({ ...current, scheduledStartAt: event.target.value }))} /></div>
            <div className='space-y-2'><Label>Kết thúc</Label><Input data-testid='event-end-input' type='datetime-local' value={form.scheduledEndAt} onChange={(event) => setForm((current) => ({ ...current, scheduledEndAt: event.target.value }))} /></div>
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='space-y-2'><Label>Visibility</Label><Select value={form.visibility} onValueChange={(visibility: 'public' | 'private') => setForm((current) => ({ ...current, visibility }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='public'>Công khai</SelectItem><SelectItem value='private'>Riêng tư</SelectItem></SelectContent></Select></div>
            <div className='space-y-2'><Label>Sức chứa</Label><Input data-testid='event-capacity-input' type='number' min='1' value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} /></div>
          </div>
          <div className='space-y-2'><Label>Tags</Label><Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder='ho-hap, phong-ngua' /></div>
          <Button data-testid='create-event-submit' className='w-full bg-blue-600 hover:bg-blue-700' disabled={!form.roomId || !form.title.trim() || createMutation.isPending}><CalendarPlus />Tạo link Meet</Button>
        </form>

        <div className='space-y-4'>
          {eventsQuery.isError ? (
            <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700'>Không thể tải danh sách hội thảo.</div>
          ) : eventsQuery.isLoading ? (
            <div className='rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600'>Đang tải hội thảo...</div>
          ) : (
          <div data-testid='admin-event-list' className='grid gap-3 lg:grid-cols-2'>
            {events.map((event) => (
              <button key={event._id} className={`rounded-lg border bg-white p-4 text-left shadow-sm ${selectedEvent?._id === event._id ? 'border-[#1E40AF]' : 'border-gray-200'}`} onClick={() => setSelectedEvent(event)}>
                <div className='mb-2 flex flex-wrap gap-2'><Badge data-testid={`event-status-${event.status}`}>{statusLabel(event.status)}</Badge><Badge variant='outline'>{event.visibility}</Badge></div>
                <div className='font-semibold text-gray-950'>{event.title}</div>
                <div className='mt-2 text-sm text-gray-600'>{formatDateTime(event.scheduledStartAt)}</div>
                <div className='mt-3 flex items-center gap-2 rounded-md bg-[#F0F6FF] px-3 py-2 text-xs text-[#0A2463]'>
                  <LinkIcon className='h-3.5 w-3.5' />
                  <span className='truncate'>{getMeetingHref(event)}</span>
                </div>
              </button>
            ))}
          </div>
          )}

          {selectedEvent && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div><h2 className='text-xl font-semibold text-gray-950'>{selectedEvent.title}</h2><p className='text-sm text-gray-600'>{formatDateTime(selectedEvent.scheduledStartAt)} - {formatDateTime(selectedEvent.scheduledEndAt)}</p></div>
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm' variant='outline' onClick={() => copyMeetingLink(selectedEvent)}><Copy />Copy link</Button>
                  <Button size='sm' variant='outline' asChild><a href={getMeetingHref(selectedEvent)} target='_blank' rel='noreferrer'><ExternalLink />Mở link</a></Button>
                  <Button size='sm' disabled={selectedEvent.status === 'live'} onClick={() => actionMutation.mutate({ eventId: selectedEvent._id, action: 'start' })}><Play />Start</Button>
                  <Button size='sm' variant='outline' disabled={selectedEvent.status !== 'live'} onClick={() => actionMutation.mutate({ eventId: selectedEvent._id, action: 'end' })}><Square />End</Button>
                  <Button size='sm' variant='destructive' disabled={selectedEvent.status === 'ended' || selectedEvent.status === 'cancelled'} onClick={() => actionMutation.mutate({ eventId: selectedEvent._id, action: 'cancel' })}><X />Cancel</Button>
                </div>
              </div>

              <div className='mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4'>
                <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-blue-950'><LinkIcon className='h-4 w-4' />Link cuộc họp</div>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Input readOnly value={getMeetingHref(selectedEvent)} className='bg-white font-mono text-sm' />
                  <Button type='button' onClick={() => copyMeetingLink(selectedEvent)}><Copy />Copy</Button>
                </div>
              </div>

              <div className='mt-5 grid gap-5 lg:grid-cols-2'>
                <div>
                  <div className='mb-3 flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2 font-semibold'><Video className='h-4 w-4' />Người đang trong phòng</div>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      disabled={selectedEvent.status !== 'live' || liveParticipantsQuery.isFetching}
                      onClick={() => liveParticipantsQuery.refetch()}
                    >
                      <RefreshCw />Làm mới
                    </Button>
                  </div>
                  {selectedEvent.status !== 'live' ? (
                    <div className='rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600'>Chỉ hiển thị người online khi hội thảo đang live.</div>
                  ) : liveParticipantsQuery.isError ? (
                    <div className='rounded-md border border-red-100 bg-red-50 p-4 text-sm text-red-700'>Không thể tải người đang trong phòng.</div>
                  ) : liveParticipantsQuery.isLoading ? (
                    <div className='rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600'>Đang tải người online...</div>
                  ) : liveParticipants.length > 0 ? (
                    <div className='max-h-80 space-y-2 overflow-auto'>
                      {liveParticipants.map((participant) => {
                        const microphoneTrack = participant.tracks.find((track) => track.source === 'microphone')
                        const displayName = participant.name || String(participant.metadata?.userId || participant.identity)
                        return (
                          <div key={participant.identity} className='rounded-md border border-gray-100 p-3 text-sm'>
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                              <div className='min-w-0'>
                                <div className='truncate font-medium'>{displayName}</div>
                                <div className='mt-1 flex flex-wrap gap-1.5 text-xs text-gray-500'>
                                  <Badge variant='outline'>{participant.metadata?.role === 'host' ? 'Host' : 'Người tham gia'}</Badge>
                                  <Badge variant={microphoneTrack?.muted ? 'secondary' : 'outline'}>{microphoneTrack ? (microphoneTrack.muted ? 'Mic đã tắt' : 'Mic đang bật') : 'Chưa bật mic'}</Badge>
                                </div>
                              </div>
                              <div className='flex shrink-0 gap-2'>
                                <Button
                                  type='button'
                                  size='sm'
                                  variant='outline'
                                  disabled={!microphoneTrack || microphoneTrack.muted || muteParticipantMutation.isPending}
                                  onClick={() => muteParticipantMutation.mutate({ eventId: selectedEvent._id, userId: participant.identity })}
                                >
                                  <MicOff />Mute
                                </Button>
                                <Button
                                  type='button'
                                  size='sm'
                                  variant='destructive'
                                  disabled={kickParticipantMutation.isPending}
                                  onClick={() => kickParticipantMutation.mutate({ eventId: selectedEvent._id, userId: participant.identity })}
                                >
                                  <UserX />Kick
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className='rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600'>Chưa có ai online trong phòng họp.</p>
                  )}
                </div>
                <div>
                  <div className='mb-3 flex items-center gap-2 font-semibold'><MessageSquare className='h-4 w-4' />Chat trực tiếp</div>
                  <div className='rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950'>
                    Người tham gia nhắn tin ngay trong phòng họp bằng chat realtime. Host/dược sĩ phản hồi trực tiếp trong cuộc gọi, không cần quy trình duyệt chờ xử lý.
                  </div>
                </div>
              </div>

              <div className='mt-5'>
                <div className='mb-3 flex items-center gap-2 font-semibold'><Video className='h-4 w-4' />Lịch sử tham gia</div>
                  <div className='max-h-80 space-y-2 overflow-auto'>
                    {registrationsQuery.isError ? <p className='text-sm text-red-600'>Không thể tải đăng ký.</p> : registrationsQuery.data?.items?.map((item) => <div key={item._id || item.userId} className='rounded-md border border-gray-100 p-3 text-sm'><div className='font-medium'>{item.user?.firstName || item.user?.email || item.userId}</div><Badge variant='outline'>{item.status}</Badge></div>)}
                    {!registrationsQuery.isError && !registrationsQuery.data?.items?.length && <p className='text-sm text-gray-500'>Chưa có người tham gia.</p>}
                  </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default AdminCommunityVideoEventsPage
