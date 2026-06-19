import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Check, EyeOff, Pin, Play, Search, Square, Video, X } from 'lucide-react'
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
  const questionsQuery = useQuery({
    queryKey: ['admin-community-video-event-questions', selectedEvent?._id],
    queryFn: () => adminCommunityService.listVideoEventQuestions({ eventId: selectedEvent!._id, page: 1, limit: 80 }),
    enabled: Boolean(selectedEvent?._id),
  })

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-community-video-events'] })
    if (selectedEvent?._id) {
      queryClient.invalidateQueries({ queryKey: ['admin-community-video-event-registrations', selectedEvent._id] })
      queryClient.invalidateQueries({ queryKey: ['admin-community-video-event-questions', selectedEvent._id] })
    }
  }

  const buildCreatePayload = () => {
    const scheduledStartAt = new Date(form.scheduledStartAt)
    const scheduledEndAt = new Date(form.scheduledEndAt)
    if (Number.isNaN(scheduledStartAt.getTime())) throw new Error('Thời gian bắt đầu không hợp lệ')
    if (Number.isNaN(scheduledEndAt.getTime())) throw new Error('Thời gian kết thúc không hợp lệ')
    if (scheduledEndAt <= scheduledStartAt) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu')

    return {
      roomId: form.roomId,
      title: form.title.trim(),
      description: form.description.trim(),
      agenda: form.agenda.trim(),
      visibility: form.visibility,
      scheduledStartAt: scheduledStartAt.toISOString(),
      scheduledEndAt: scheduledEndAt.toISOString(),
      capacity: Number(form.capacity) || null,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      registrationRequired: true,
      provider: 'livekit',
    }
  }

  const createMutation = useMutation({
    mutationFn: () => adminCommunityService.createVideoEvent(buildCreatePayload()),
    onSuccess: (event) => {
      toast.success('Đã tạo hội thảo')
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

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: { status?: string; pinned?: boolean; answerSummary?: string } }) =>
      adminCommunityService.updateVideoEventQuestion(selectedEvent!._id, questionId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật câu hỏi')
      invalidateEvents()
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể cập nhật câu hỏi'),
  })

  const events = eventsQuery.data?.items || []

  return (
    <main className='space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-950'>Hội thảo cộng đồng</h1>
          <p className='text-sm text-gray-600'>Tạo lịch, vận hành live session và kiểm duyệt Q&A.</p>
        </div>
        <div className='relative w-full md:w-80'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm hội thảo' />
        </div>
      </div>

      <section className='grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
        <form className='space-y-4 rounded-lg border border-gray-200 bg-white p-5' onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
          <div className='flex items-center gap-2 font-semibold text-gray-950'><CalendarPlus className='h-4 w-4' />Tạo hội thảo</div>
          <div className='space-y-2'>
            <Label>Phòng cộng đồng</Label>
          {roomsQuery.isError && <p className='text-sm text-red-600'>Không thể tải danh sách phòng.</p>}
          <Select value={form.roomId} onValueChange={(roomId) => setForm((current) => ({ ...current, roomId }))}>
              <SelectTrigger><SelectValue placeholder='Chọn phòng' /></SelectTrigger>
              <SelectContent>{(roomsQuery.data || []).map((room: CommunityRoom) => <SelectItem key={room._id} value={room._id}>{room.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className='space-y-2'><Label>Tiêu đề</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
          <div className='space-y-2'><Label>Mô tả</Label><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
          <div className='space-y-2'><Label>Agenda</Label><Textarea value={form.agenda} onChange={(event) => setForm((current) => ({ ...current, agenda: event.target.value }))} /></div>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='space-y-2'><Label>Bắt đầu</Label><Input type='datetime-local' value={form.scheduledStartAt} onChange={(event) => setForm((current) => ({ ...current, scheduledStartAt: event.target.value }))} /></div>
            <div className='space-y-2'><Label>Kết thúc</Label><Input type='datetime-local' value={form.scheduledEndAt} onChange={(event) => setForm((current) => ({ ...current, scheduledEndAt: event.target.value }))} /></div>
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='space-y-2'><Label>Visibility</Label><Select value={form.visibility} onValueChange={(visibility: 'public' | 'private') => setForm((current) => ({ ...current, visibility }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='public'>Công khai</SelectItem><SelectItem value='private'>Riêng tư</SelectItem></SelectContent></Select></div>
            <div className='space-y-2'><Label>Sức chứa</Label><Input type='number' min='1' value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} /></div>
          </div>
          <div className='space-y-2'><Label>Tags</Label><Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder='ho-hap, phong-ngua' /></div>
          <Button className='w-full' disabled={!form.roomId || !form.title.trim() || createMutation.isPending}><CalendarPlus />Tạo hội thảo</Button>
        </form>

        <div className='space-y-4'>
          {eventsQuery.isError ? (
            <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700'>Không thể tải danh sách hội thảo.</div>
          ) : eventsQuery.isLoading ? (
            <div className='rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600'>Đang tải hội thảo...</div>
          ) : (
          <div className='grid gap-3 lg:grid-cols-2'>
            {events.map((event) => (
              <button key={event._id} className={`rounded-lg border bg-white p-4 text-left shadow-sm ${selectedEvent?._id === event._id ? 'border-[#1E40AF]' : 'border-gray-200'}`} onClick={() => setSelectedEvent(event)}>
                <div className='mb-2 flex flex-wrap gap-2'><Badge>{statusLabel(event.status)}</Badge><Badge variant='outline'>{event.visibility}</Badge></div>
                <div className='font-semibold text-gray-950'>{event.title}</div>
                <div className='mt-2 text-sm text-gray-600'>{formatDateTime(event.scheduledStartAt)}</div>
              </button>
            ))}
          </div>
          )}

          {selectedEvent && (
            <section className='rounded-lg border border-gray-200 bg-white p-5'>
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div><h2 className='text-xl font-semibold text-gray-950'>{selectedEvent.title}</h2><p className='text-sm text-gray-600'>{formatDateTime(selectedEvent.scheduledStartAt)} - {formatDateTime(selectedEvent.scheduledEndAt)}</p></div>
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm' disabled={selectedEvent.status === 'live'} onClick={() => actionMutation.mutate({ eventId: selectedEvent._id, action: 'start' })}><Play />Start</Button>
                  <Button size='sm' variant='outline' disabled={selectedEvent.status !== 'live'} onClick={() => actionMutation.mutate({ eventId: selectedEvent._id, action: 'end' })}><Square />End</Button>
                  <Button size='sm' variant='destructive' disabled={selectedEvent.status === 'ended' || selectedEvent.status === 'cancelled'} onClick={() => actionMutation.mutate({ eventId: selectedEvent._id, action: 'cancel' })}><X />Cancel</Button>
                </div>
              </div>

              <div className='mt-5 grid gap-5 lg:grid-cols-2'>
                <div>
                  <div className='mb-3 flex items-center gap-2 font-semibold'><Video className='h-4 w-4' />Người đăng ký</div>
                  <div className='max-h-80 space-y-2 overflow-auto'>
                    {registrationsQuery.isError ? <p className='text-sm text-red-600'>Không thể tải đăng ký.</p> : registrationsQuery.data?.items?.map((item) => <div key={item._id || item.userId} className='rounded-md border border-gray-100 p-3 text-sm'><div className='font-medium'>{item.user?.firstName || item.user?.email || item.userId}</div><Badge variant='outline'>{item.status}</Badge></div>)}
                    {!registrationsQuery.isError && !registrationsQuery.data?.items?.length && <p className='text-sm text-gray-500'>Chưa có đăng ký.</p>}
                  </div>
                </div>
                <div>
                  <div className='mb-3 font-semibold'>Q&A</div>
                  <div className='max-h-96 space-y-2 overflow-auto'>
                    {questionsQuery.isError ? <p className='text-sm text-red-600'>Không thể tải Q&A.</p> : questionsQuery.data?.items?.map((item) => (
                      <div key={item._id} className='rounded-md border border-gray-100 p-3 text-sm'>
                        <div className='mb-2 flex flex-wrap items-center gap-2'><Badge variant='outline'>{item.status}</Badge>{item.pinned && <Badge>Ghim</Badge>}</div>
                        <p className='text-gray-800'>{item.content}</p>
                        {item.moderated?.autoHidden && <p className='mt-2 text-xs text-red-600'>Câu hỏi bị ẩn tự động bởi moderation.</p>}
                        <div className='mt-3 flex flex-wrap gap-2'>
                          <Button size='sm' variant='outline' onClick={() => updateQuestionMutation.mutate({ questionId: item._id, data: { status: 'approved' } })}><Check />Duyệt</Button>
                          <Button size='sm' variant='outline' onClick={() => updateQuestionMutation.mutate({ questionId: item._id, data: { pinned: !item.pinned } })}><Pin />Ghim</Button>
                          <Button size='sm' variant='outline' onClick={() => updateQuestionMutation.mutate({ questionId: item._id, data: { status: 'hidden' } })}><EyeOff />Ẩn</Button>
                          <Button size='sm' onClick={() => updateQuestionMutation.mutate({ questionId: item._id, data: { status: 'answered' } })}>Answered</Button>
                        </div>
                      </div>
                    ))}
                    {!questionsQuery.isError && !questionsQuery.data?.items?.length && <p className='text-sm text-gray-500'>Chưa có câu hỏi.</p>}
                  </div>
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
