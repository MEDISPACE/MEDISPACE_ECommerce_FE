import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Search, Users, Video } from 'lucide-react'
import communityService from '~/services/communityService'
import type { CommunityVideoEvent } from '~/types/community'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { scheduled: 'Sắp diễn ra', live: 'Đang live', ended: 'Đã kết thúc', cancelled: 'Đã hủy', draft: 'Bản nháp' }
  return labels[status] || status
}

function EventCard({ event }: { event: CommunityVideoEvent }) {
  return (
    <article className='rounded-lg border border-gray-200 bg-white p-5 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <Badge className={event.status === 'live' ? 'bg-red-600 text-white' : ''}>{statusLabel(event.status)}</Badge>
            <Badge variant='outline'>{event.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</Badge>
            {event.room?.name && <Badge variant='secondary'>{event.room.name}</Badge>}
          </div>
          <h2 className='text-lg font-semibold text-gray-950'>{event.title}</h2>
          {event.description && <p className='mt-2 line-clamp-2 text-sm text-gray-600'>{event.description}</p>}
        </div>
        <Video className='mt-1 h-5 w-5 text-[#1E40AF]' />
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600'>
        <span className='inline-flex items-center gap-2'><CalendarDays className='h-4 w-4' />{formatDateTime(event.scheduledStartAt)}</span>
        <span data-testid='attendee-count' className='inline-flex items-center gap-2'><Users className='h-4 w-4' />{event.registrationCount || 0}{event.capacity ? `/${event.capacity}` : ''} người tham gia</span>
      </div>

      <div className='mt-5 flex flex-wrap gap-2'>
        <Button asChild variant='outline'>
          <Link to={`/community/video-events/${event._id}`}>{event.status === 'live' ? 'Tham gia' : 'Mở link'}</Link>
        </Button>
      </div>
    </article>
  )
}

export function CommunityVideoEventsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const queryKey = useMemo(() => ['community-video-events', debouncedSearch], [debouncedSearch])
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => communityService.listVideoEvents({ search: debouncedSearch || undefined, page: 1, limit: 30 }),
  })

  return (
    <main data-testid='video-events-list' className='mx-auto w-full max-w-6xl px-4 py-8'>
      <UniversalBreadcrumb
        items={[
          { label: 'Cộng đồng', href: '/community' },
          { label: 'Hội thảo cộng đồng' },
        ]}
      />

      <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1 className='font-display bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-2xl font-bold text-transparent'>Hội thảo cộng đồng</h1>
          <p className='mt-1 text-sm text-gray-600'>Các buổi chia sẻ kiến thức, kỹ năng và kinh nghiệm chăm sóc sức khỏe từ MEDISPACE.</p>
        </div>
        <div className='relative w-full md:w-80'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm hội thảo' />
        </div>
      </div>

      {isError ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700'>Không thể tải lịch hội thảo. <Button variant='outline' className='ml-2' onClick={() => refetch()}>Thử lại</Button></div>
      ) : isLoading ? (
        <div className='rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600'>Đang tải lịch hội thảo...</div>
      ) : data?.items?.length ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {data.items.map((event) => <EventCard key={event._id} event={event} />)}
        </div>
      ) : (
        <div className='rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600'>Chưa có hội thảo phù hợp.</div>
      )}
    </main>
  )
}

export default CommunityVideoEventsPage
