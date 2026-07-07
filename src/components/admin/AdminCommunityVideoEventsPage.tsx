import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CalendarPlus, ChevronDown, Clock3, Copy, ExternalLink, Link as LinkIcon, MessageSquare, MicOff, Minus, Plus, RefreshCw, Search, UserX, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminCommunityService } from '~/services/communityService'
import type { CommunityRoom, CommunityVideoEvent } from '~/types/community'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Calendar } from '~/components/ui/calendar'

type AdminVideoEventFormState = {
  roomId: string
  title: string
  description: string
  agenda: string
  scheduledStartAt: string
  scheduledEndAt: string
  capacity: string
}

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

function statusBadgeClass(status?: string) {
  const classes: Record<string, string> = {
    scheduled: 'border-blue-200 bg-blue-50 text-blue-700',
    live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ended: 'border-gray-200 bg-gray-100 text-gray-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
    draft: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return classes[status || ''] || 'border-gray-200 bg-gray-50 text-gray-700'
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

function getApiErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data
  const errors = data?.errors
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0]
    const firstError = firstKey ? errors[firstKey] : null
    const message = firstError?.msg || firstError?.message
    if (message) return `${firstKey}: ${message}`
  }
  return data?.message || error?.message || fallback
}

export function buildAdminVideoEventCreatePayload(form: AdminVideoEventFormState) {
  const scheduledStartAt = new Date(form.scheduledStartAt)
  const scheduledEndAt = new Date(form.scheduledEndAt)
  if (Number.isNaN(scheduledStartAt.getTime())) throw new Error('Thời gian bắt đầu không hợp lệ')
  if (Number.isNaN(scheduledEndAt.getTime())) throw new Error('Thời gian kết thúc không hợp lệ')
  if (scheduledEndAt <= scheduledStartAt) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu')

  const description = form.description.trim()
  const agenda = form.agenda.trim()
  return {
    roomId: form.roomId,
    title: form.title.trim(),
    ...(description ? { description } : {}),
    ...(agenda ? { agenda } : {}),
    scheduledStartAt: scheduledStartAt.toISOString(),
    scheduledEndAt: scheduledEndAt.toISOString(),
    capacity: Number(form.capacity) || null,
    registrationRequired: false,
    provider: 'livekit',
  }
}

const QUICK_TIMES = [
  { label: '09:00', hours: 9, minutes: 0 },
  { label: '14:00', hours: 14, minutes: 0 },
  { label: '19:30', hours: 19, minutes: 30 },
]

function parseLocalDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateTimePickerValue(value: string) {
  const date = parseLocalDateTime(value)
  if (!date) return 'Chọn ngày giờ'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function applySelectedDate(currentValue: string, selectedDate: Date) {
  const current = parseLocalDateTime(currentValue) || new Date()
  const next = new Date(selectedDate)
  next.setHours(current.getHours(), current.getMinutes(), 0, 0)
  return toLocalInputValue(next)
}

function applySelectedTime(currentValue: string, hours: number, minutes: number) {
  const next = parseLocalDateTime(currentValue) || new Date()
  next.setHours(hours, minutes, 0, 0)
  return toLocalInputValue(next)
}

function normalizeTimePart(value: string, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return min
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function adjustSelectedTime(currentValue: string, minutesToAdd: number) {
  const next = parseLocalDateTime(currentValue) || new Date()
  next.setMinutes(next.getMinutes() + minutesToAdd)
  return toLocalInputValue(next)
}

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function DateTimePicker({ label, value, onChange, testId, minDate }: { label: string; value: string; onChange: (value: string) => void; testId: string; minDate?: Date | null }) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseLocalDateTime(value)
  const hours = selectedDate?.getHours() ?? 9
  const minutes = selectedDate?.getMinutes() ?? 0
  const startOfMinDate = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            data-testid={testId}
            className='h-auto min-h-10 w-full justify-between border-gray-300 bg-white px-3 py-2 text-left font-normal text-gray-900 hover:bg-[#F8FBFF]'
          >
            <span className='flex min-w-0 items-center gap-2'>
              <CalendarDays className='h-4 w-4 shrink-0 text-blue-600' />
              <span className='truncate'>{formatDateTimePickerValue(value)}</span>
            </span>
            <ChevronDown className='h-4 w-4 shrink-0 text-gray-500' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[320px] overflow-hidden p-0' align='start'>
          <div className='space-y-0'>
            <Calendar
              mode='single'
              selected={selectedDate || undefined}
              defaultMonth={selectedDate || minDate || new Date()}
              onSelect={(date) => {
                if (date) onChange(applySelectedDate(value, date))
              }}
              disabled={(date) => Boolean(startOfMinDate && date < startOfMinDate)}
              initialFocus
            />
            <div className='border-t border-gray-200 p-3'>
              <div className='mb-3 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
                  <Clock3 className='h-4 w-4 text-blue-600' />
                  Thời gian
                </div>
                <div className='rounded-md bg-[#F0F6FF] px-2.5 py-1 text-sm font-semibold text-[#0A2463]'>{padTime(hours)}:{padTime(minutes)}</div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='w-12 text-xs font-medium text-gray-600'>Giờ</div>
                  <div className='flex items-center gap-2'>
                    <Button type='button' variant='outline' size='icon' className='h-9 w-9 bg-white' onClick={() => onChange(adjustSelectedTime(value, -60))}><Minus /></Button>
                    <Input
                      type='number'
                      min='0'
                      max='23'
                      inputMode='numeric'
                      aria-label={`${label} giờ`}
                      className='h-9 w-14 px-2 text-center text-sm font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                      value={padTime(hours)}
                      onChange={(event) => onChange(applySelectedTime(value, normalizeTimePart(event.target.value, 0, 23), minutes))}
                      onBlur={(event) => { event.currentTarget.value = padTime(normalizeTimePart(event.currentTarget.value, 0, 23)) }}
                    />
                    <Button type='button' variant='outline' size='icon' className='h-9 w-9 bg-white' onClick={() => onChange(adjustSelectedTime(value, 60))}><Plus /></Button>
                  </div>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <div className='w-12 text-xs font-medium text-gray-600'>Phút</div>
                  <div className='flex items-center gap-2'>
                    <Button type='button' variant='outline' size='icon' className='h-9 w-9 bg-white' onClick={() => onChange(adjustSelectedTime(value, -5))}><Minus /></Button>
                    <Input
                      type='number'
                      min='0'
                      max='59'
                      step='5'
                      inputMode='numeric'
                      aria-label={`${label} phút`}
                      className='h-9 w-14 px-2 text-center text-sm font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                      value={padTime(minutes)}
                      onChange={(event) => onChange(applySelectedTime(value, hours, normalizeTimePart(event.target.value, 0, 59)))}
                      onBlur={(event) => { event.currentTarget.value = padTime(normalizeTimePart(event.currentTarget.value, 0, 59)) }}
                    />
                    <Button type='button' variant='outline' size='icon' className='h-9 w-9 bg-white' onClick={() => onChange(adjustSelectedTime(value, 5))}><Plus /></Button>
                  </div>
                </div>
              </div>
              <div className='mt-3 grid grid-cols-3 gap-2'>
                {QUICK_TIMES.map((time) => (
                  <Button key={time.label} type='button' variant='outline' size='sm' className='bg-white' onClick={() => onChange(applySelectedTime(value, time.hours, time.minutes))}>
                    {time.label}
                  </Button>
                ))}
              </div>
              <Button type='button' className='mt-3 w-full bg-blue-600 text-white hover:bg-blue-700' onClick={() => setOpen(false)}>
                Xong
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
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
    scheduledStartAt: toLocalInputValue(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    scheduledEndAt: toLocalInputValue(new Date(now.getTime() + 25 * 60 * 60 * 1000)),
    capacity: '300',
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
    enabled: Boolean(selectedEvent?._id),
    refetchInterval: selectedEvent?._id ? 10_000 : false,
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

    const description = form.description.trim()
    const agenda = form.agenda.trim()
    return {
      roomId: form.roomId,
      title: form.title.trim(),
      ...(description ? { description } : {}),
      ...(agenda ? { agenda } : {}),
      scheduledStartAt: scheduledStartAt.toISOString(),
      scheduledEndAt: scheduledEndAt.toISOString(),
      capacity: Number(form.capacity) || null,
      registrationRequired: false,
      provider: 'livekit',
    }
  }

  const createMutation = useMutation({
    mutationFn: () => adminCommunityService.createVideoEvent(buildCreatePayload()),
    onSuccess: (event) => {
      toast.success('Đã tạo link cuộc họp')
      setSelectedEvent(event)
      setForm((current) => ({ ...current, title: '', description: '', agenda: '' }))
      invalidateEvents()
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Không thể tạo hội thảo')),
  })

  const actionMutation = useMutation({
    mutationFn: (eventId: string) => adminCommunityService.cancelVideoEvent(eventId),
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
          <div className='space-y-2'><Label>Nội dung buổi chia sẻ</Label><Textarea data-testid='event-agenda-input' value={form.agenda} onChange={(event) => setForm((current) => ({ ...current, agenda: event.target.value }))} /></div>
          <div className='grid gap-3 md:grid-cols-2'>
            <DateTimePicker
              label='Thời gian diễn ra'
              value={form.scheduledStartAt}
              testId='event-start-input'
              minDate={new Date()}
              onChange={(scheduledStartAt) => setForm((current) => {
                const startDate = parseLocalDateTime(scheduledStartAt)
                const endDate = parseLocalDateTime(current.scheduledEndAt)
                if (startDate && endDate && endDate <= startDate) {
                  return { ...current, scheduledStartAt, scheduledEndAt: toLocalInputValue(new Date(startDate.getTime() + 60 * 60_000)) }
                }
                return { ...current, scheduledStartAt }
              })}
            />
            <DateTimePicker
              label='Dự kiến đến'
              value={form.scheduledEndAt}
              testId='event-end-input'
              minDate={parseLocalDateTime(form.scheduledStartAt) || new Date()}
              onChange={(scheduledEndAt) => setForm((current) => ({ ...current, scheduledEndAt }))}
            />
          </div>
          <div className='space-y-2'><Label>Sức chứa</Label><Input data-testid='event-capacity-input' type='number' min='1' value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} /></div>
          <Button data-testid='create-event-submit' className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white' disabled={!form.roomId || !form.title.trim() || createMutation.isPending}><CalendarPlus />Tạo link Meet</Button>
        </form>

        <div className='min-w-0'>
          {selectedEvent ? (
            <section className='rounded-lg border border-blue-200 bg-white p-5 shadow-sm'>
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div><h2 className='text-xl font-semibold text-gray-950'>{selectedEvent.title}</h2><p className='text-sm text-gray-600'>{formatDateTime(selectedEvent.scheduledStartAt)} - {formatDateTime(selectedEvent.scheduledEndAt)}</p></div>
                <div className='flex flex-wrap gap-2 md:justify-end'>
                  <Button size='sm' variant='outline' onClick={() => copyMeetingLink(selectedEvent)}><Copy />Copy link</Button>
                  <Button size='sm' variant='outline' asChild><a href={getMeetingHref(selectedEvent)} target='_blank' rel='noreferrer'><ExternalLink />Mở link</a></Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={selectedEvent.status === 'ended' || selectedEvent.status === 'cancelled'}
                    className='border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400'
                    onClick={() => actionMutation.mutate(selectedEvent._id)}
                  >
                    <X /> Hủy
                  </Button>
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
                      disabled={liveParticipantsQuery.isFetching}
                      onClick={() => liveParticipantsQuery.refetch()}
                    >
                      <RefreshCw />Làm mới
                    </Button>
                  </div>
                  {liveParticipantsQuery.isError ? (
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
          ) : (
            <section className='flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center'>
              <div className='max-w-sm'>
                <Video className='mx-auto mb-3 h-10 w-10 text-blue-600' />
                <h2 className='text-lg font-semibold text-gray-950'>Chưa có link cuộc họp</h2>
                <p className='mt-2 text-sm leading-6 text-gray-600'>Sau khi tạo, link cuộc họp và người đang trong phòng sẽ hiển thị tại đây để admin copy hoặc mở ngay.</p>
              </div>
            </section>
          )}
        </div>
      </section>

      <section className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
        <div className='mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='font-semibold text-gray-950'>Danh sách meet đã tạo</h2>
            <p className='text-sm text-gray-500'>Chọn một meet để xem lại link và người đang trong phòng.</p>
          </div>
          <Badge variant='outline' className='w-fit'>{eventsQuery.data?.total || 0} meet</Badge>
        </div>

        {eventsQuery.isError ? (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700'>Không thể tải danh sách hội thảo.</div>
        ) : eventsQuery.isLoading ? (
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600'>Đang tải hội thảo...</div>
        ) : events.length > 0 ? (
          <div data-testid='admin-event-list' className='max-h-[360px] divide-y divide-gray-100 overflow-auto rounded-md border border-gray-100'>
            {events.map((event) => (
              <button
                key={event._id}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500/30 ${selectedEvent?._id === event._id ? 'bg-blue-50' : 'bg-white hover:bg-[#F8FBFF]'}`}
                onClick={() => setSelectedEvent(event)}
              >
                <Badge data-testid={`event-status-${event.status}`} variant='outline' className={`${statusBadgeClass(event.status)} shrink-0`}>{statusLabel(event.status)}</Badge>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-semibold text-gray-950'>{event.title}</div>
                  <div className='mt-1 truncate text-xs text-gray-500'>{formatDateTime(event.scheduledStartAt)} · {meetingCode(event)}</div>
                </div>
                <LinkIcon className='h-4 w-4 shrink-0 text-blue-600' />
              </button>
            ))}
          </div>
        ) : (
          <div className='rounded-lg border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500'>Chưa có meet nào.</div>
        )}
      </section>
    </main>
  )
}

export default AdminCommunityVideoEventsPage
