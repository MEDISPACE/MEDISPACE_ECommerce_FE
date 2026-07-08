import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Clock3, Search, Users, Video } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import communityService from '~/services/communityService'
import type { CommunityVideoEvent } from '~/types/community'
import { getRoomTopic } from './communityUi'

type EventTab = 'upcoming' | 'registered' | 'past'

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { scheduled: 'Có thể tham gia', live: 'Có thể tham gia', ended: 'Đã kết thúc', cancelled: 'Đã hủy', draft: 'Bản nháp' }
  return labels[status] || status
}

function effectiveEventStatus(event: Pick<CommunityVideoEvent, 'status' | 'scheduledStartAt' | 'scheduledEndAt'>) {
  const startAt = event.scheduledStartAt ? new Date(event.scheduledStartAt).getTime() : Number.NaN
  const endAt = event.scheduledEndAt ? new Date(event.scheduledEndAt).getTime() : Number.NaN
  const now = Date.now()
  if ((event.status === 'scheduled' || event.status === 'live') && !Number.isNaN(endAt) && endAt <= now) return 'ended'
  if (event.status === 'scheduled' && !Number.isNaN(startAt) && startAt <= now) return 'live'
  return event.status
}

function EventCard({ event }: { event: CommunityVideoEvent }) {
  const status = effectiveEventStatus(event)
  const registered = event.viewerRegistration?.status === 'registered' || event.viewerRegistration?.status === 'attended'
  const full = Boolean(event.capacity && (event.registrationCount || 0) >= event.capacity && !registered)
  const cta = status === 'ended' ? 'Xem thông tin' : registered ? 'Mở link' : full ? 'Đã đủ chỗ' : event.registrationRequired ? 'Đăng ký' : 'Vào phòng'

  return (
    <article className='rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md'>
      <div className='flex items-start gap-4'>
        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700'>
          <Video className='h-6 w-6' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <Badge className={status === 'ended' ? 'bg-slate-100 text-slate-700 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'}>{statusLabel(status)}</Badge>
            {registered && <Badge className='bg-blue-50 text-blue-700 hover:bg-blue-50'><CheckCircle2 className='h-3 w-3' />Đã đăng ký</Badge>}
          </div>
          <h2 className='line-clamp-2 text-lg font-semibold text-slate-950'>{event.title}</h2>
          {event.description && <p className='mt-2 line-clamp-2 text-sm leading-6 text-slate-600'>{event.description}</p>}
        </div>
      </div>

      <div className='mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3'>
        <span className='inline-flex items-center gap-2'><CalendarDays className='h-4 w-4 text-blue-600' />{formatDateTime(event.scheduledStartAt)}</span>
        <span className='inline-flex items-center gap-2'><Users className='h-4 w-4 text-blue-600' />{event.registrationCount || 0}{event.capacity ? `/${event.capacity}` : ''} người tham gia</span>
        <span className='inline-flex items-center gap-2'><Clock3 className='h-4 w-4 text-blue-600' />{event.room ? getRoomTopic(event.room) : 'Cộng đồng'}</span>
      </div>

      {event.agenda && <div className='mt-4 line-clamp-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600'>{event.agenda}</div>}

      <div className='mt-5 flex items-center justify-between gap-3'>
        <span className='text-xs text-slate-500'>{event.room?.name || 'MediSpace Community'}</span>
        <Button asChild disabled={full} className='bg-[#0A2463] text-white hover:bg-[#12357D]'>
          <Link to={`/community/video-events/${event._id}`}>{cta}</Link>
        </Button>
      </div>
    </article>
  )
}

export function CommunityVideoEventsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tab, setTab] = useState<EventTab>('upcoming')

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const queryKey = useMemo(() => ['community-video-events', debouncedSearch, tab], [debouncedSearch, tab])
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => communityService.listVideoEvents({
      search: debouncedSearch || undefined,
      status: tab === 'past' ? 'ended' : undefined,
      upcomingOnly: tab === 'upcoming' || tab === 'registered' ? true : undefined,
      page: 1,
      limit: 30,
    }),
  })

  const events = useMemo(() => {
    const items = data?.items || []
    if (tab === 'registered') return items.filter((event) => event.viewerRegistration?.status === 'registered' || event.viewerRegistration?.status === 'attended')
    return items
  }, [data?.items, tab])

  return (
    <main data-testid='video-events-list' className='bg-[#F7FAFC]'>
      <div className='mx-auto w-full max-w-7xl px-4 py-8 space-y-6'>
        <UniversalBreadcrumb items={[{ label: 'Cộng đồng', href: '/community' }, { label: 'Hội thảo cộng đồng' }]} />

        <section className='rounded-lg border border-[#DDE7F3] bg-white p-5 shadow-sm md:p-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div className='max-w-3xl'>
              <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'>
                <Video className='h-3.5 w-3.5' />
                Sự kiện thuộc cộng đồng MediSpace
              </div>
              <h1 className='font-display text-3xl font-bold text-[#0A2463]'>Hội thảo cộng đồng</h1>
              <p className='mt-2 text-sm leading-6 text-slate-600 md:text-base'>Theo dõi các buổi chia sẻ kiến thức, Q&A và nhóm hỗ trợ trực tuyến được tổ chức cho từng cộng đồng sức khỏe.</p>
            </div>
            <div className='relative w-full md:w-96'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
              <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm hội thảo' />
            </div>
          </div>
        </section>

        <section className='space-y-4'>
          <div className='rounded-lg border border-[#DDE7F3] bg-white p-3 shadow-sm'>
            <Tabs value={tab} onValueChange={(value) => setTab(value as EventTab)}>
              <TabsList className='flex h-auto flex-wrap justify-start bg-slate-100 p-1'>
                <TabsTrigger value='upcoming'>Sắp diễn ra</TabsTrigger>
                <TabsTrigger value='registered'>Đã đăng ký</TabsTrigger>
                <TabsTrigger value='past'>Đã kết thúc</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isError ? (
            <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700'>Không thể tải lịch hội thảo. <Button variant='outline' className='ml-2' onClick={() => refetch()}>Thử lại</Button></div>
          ) : isLoading ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className='h-64 rounded-lg' />)}
            </div>
          ) : events.length ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {events.map((event) => <EventCard key={event._id} event={event} />)}
            </div>
          ) : (
            <div className='rounded-lg border border-[#DDE7F3] bg-white p-10 text-center text-slate-600 shadow-sm'>Chưa có hội thảo phù hợp.</div>
          )}
        </section>
      </div>
    </main>
  )
}

export default CommunityVideoEventsPage
