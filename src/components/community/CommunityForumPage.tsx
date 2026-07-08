import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpenText, CalendarDays, CheckCircle2, HeartPulse, Lock, LogIn, MessageSquareText, Search, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import { useAuth } from '~/contexts/AuthContext'
import communityService from '~/services/communityService'
import type { CommunityRoom, CommunityVideoEvent } from '~/types/community'
import { UserStatus } from '~/types/user'
import { communityPreviewText, formatRelativeTime, getRoomDescription, getRoomGuidelines, getRoomTopic, roomInitials } from './communityUi'

type ForumTab = 'all' | 'mine' | 'active' | 'private'

const forumTabTriggerClass =
  'h-9 rounded-md border border-transparent bg-transparent px-3 text-sm font-semibold text-slate-700 outline-none transition hover:bg-white hover:text-[#0A2463] focus:outline-none focus-visible:border-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-[#0A2463] data-[state=active]:shadow-sm'

function ForumRoomCard({ room, onJoin }: { room: CommunityRoom; onJoin: (room: CommunityRoom) => void }) {
  const active = room.viewerMembership?.status === 'active'
  const pending = room.viewerMembership?.status === 'pending'
  const privateRoom = room.visibility === 'private'

  return (
    <div className='grid gap-3 border-b border-slate-100 bg-white px-3 py-3 transition hover:bg-[#F8FBFF] md:grid-cols-[minmax(0,1fr)_86px_86px_220px] md:items-center'>
      <div className='flex min-w-0 gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-[#EEF6FF] text-xs font-bold text-[#0A2463]'>
          {roomInitials(room)}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex flex-wrap items-center gap-1.5'>
            <Badge variant='outline' className={privateRoom ? 'h-6 rounded-full border-[#c9d3df] bg-[#f5f7fa] px-1.5 text-[11px] text-slate-700' : 'h-6 rounded-full border-blue-100 bg-blue-50 px-1.5 text-[11px] text-[#0A2463]'}>
              {privateRoom ? <Lock className='h-3 w-3' /> : <BookOpenText className='h-3 w-3' />}
              {privateRoom ? 'Riêng tư' : 'Công khai'}
            </Badge>
            {room.featured && <Badge className='h-6 rounded-full bg-[#0A2463] px-2 text-[11px] text-white hover:bg-[#0A2463]'>Ghim</Badge>}
          </div>
          <Link to={`/community/${room._id}`} className='line-clamp-1 text-[15px] font-semibold text-[#0A2463] hover:underline'>{room.name}</Link>
          <p className='mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600'>{getRoomDescription(room)}</p>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500'>
            <span>{getRoomTopic(room)}</span>
            {!active && (
              <button type='button' className='font-semibold text-[#0A2463] hover:underline disabled:text-[#8a98a8]' onClick={() => onJoin(room)} disabled={pending}>
                {pending ? 'Đang chờ duyệt' : privateRoom ? 'Gửi yêu cầu' : 'Tham gia'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className='hidden text-center text-xs text-slate-600 md:block'><b className='block text-sm text-slate-950'>{room.messageCount || 0}</b>chủ đề</div>
      <div className='hidden text-center text-xs text-slate-600 md:block'><b className='block text-sm text-slate-950'>{room.memberCount || 0}</b>thành viên</div>
      <div className='rounded-lg border border-slate-100 bg-[#F8FBFF] px-2 py-1.5 text-xs text-slate-600 md:bg-transparent md:border-0 md:p-0'>
        <p className='line-clamp-1 font-medium text-slate-950'>{communityPreviewText(room.lastMessagePreview)}</p>
        <p className='mt-0.5 text-[11px]'>{formatRelativeTime(room.lastMessageAt)}</p>
      </div>
    </div>
  )
}

function EventPreviewCard({ event }: { event: CommunityVideoEvent }) {
  return (
    <Link to={`/community/video-events/${event._id}`} className='block border-b border-slate-100 bg-white px-3 py-3 transition hover:bg-[#F8FBFF]'>
      <p className='line-clamp-2 text-sm font-semibold text-slate-950'>{event.title}</p>
      <p className='mt-2 inline-flex items-center gap-1 text-xs text-slate-500'>
        <CalendarDays className='h-3.5 w-3.5' />
        {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(event.scheduledStartAt))}
      </p>
    </Link>
  )
}

export function CommunityForumPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<ForumTab>('all')
  const canUseMemberRooms = isAuthenticated && user?.status === UserStatus.Verified

  const roomsQuery = useQuery({
    queryKey: ['community', 'forum-rooms', canUseMemberRooms],
    queryFn: () => (canUseMemberRooms ? communityService.listMyRooms({ sort: 'featured' }) : communityService.listRooms({ sort: 'featured' })),
    staleTime: 30_000,
  })

  const eventsQuery = useQuery({
    queryKey: ['community-video-events-preview'],
    queryFn: () => communityService.listVideoEvents({ upcomingOnly: true, page: 1, limit: 3 }),
    staleTime: 60_000,
  })

  const rooms = roomsQuery.data || []
  const filteredRooms = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rooms.filter((room) => {
      const matchesSearch = !needle || [room.name, room.slug, room.diseaseKey, room.topicLabel, room.description].some((value) => value?.toLowerCase().includes(needle))
      const matchesTab = tab === 'all' || (tab === 'mine' && room.viewerMembership?.status === 'active') || (tab === 'active' && Boolean(room.lastMessageAt || room.messageCount)) || (tab === 'private' && room.visibility === 'private')
      return matchesSearch && matchesTab
    })
  }, [rooms, search, tab])

  const joinMutation = useMutation({
    mutationFn: (room: CommunityRoom) => (room.visibility === 'private' && room.viewerMembership?.status !== 'invited' ? communityService.requestJoin(room._id) : communityService.joinRoom(room._id)),
    onSuccess: (result, room) => {
      const active = result.status === 'active'
      toast.success(active ? 'Đã tham gia chuyên mục' : 'Đã gửi yêu cầu tham gia')
      queryClient.setQueriesData<CommunityRoom[]>({ queryKey: ['community', 'forum-rooms'] }, (current) =>
        current?.map((item) =>
          item._id === result.roomId
            ? {
                ...item,
                memberCount: active && item.viewerMembership?.status !== 'active' ? (item.memberCount || 0) + 1 : item.memberCount,
                viewerMembership: {
                  ...(item.viewerMembership || {}),
                  roomId: result.roomId,
                  userId: result.userId,
                  status: result.status,
                  role: item.viewerMembership?.role || 'member',
                },
              }
            : item,
        ),
      )
      queryClient.invalidateQueries({ queryKey: ['community', 'forum-rooms'] })
      if (active && (room.visibility === 'public' || room.viewerMembership?.status === 'invited')) navigate(`/community/${room._id}`)
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể tham gia chuyên mục'),
  })

  const handleJoin = (room: CommunityRoom) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia')
      navigate('/login', { state: { from: { pathname: '/community' } } })
      return
    }
    joinMutation.mutate(room)
  }

  return (
    <main className='min-h-screen bg-[#F7FAFC] text-slate-900'>
      <div className='mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-4'>
        <UniversalBreadcrumb items={[{ label: 'Cộng đồng' }]} />

        <section className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
          <div className='border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-[13px] font-semibold text-[#0A2463]'>MediSpace Community</div>
          <div className='flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-3xl'>
              <div className='mb-2 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-[#0A2463]'>
                <ShieldCheck className='h-3.5 w-3.5' />
                Diễn đàn sức khỏe được điều phối bởi MediSpace
              </div>
              <h1 className='text-2xl font-bold text-[#0A2463] md:text-3xl'>Cộng đồng MediSpace</h1>
              <p className='mt-1 text-sm leading-6 text-slate-600'>Chọn box, mở thread hỏi đáp hoặc chia sẻ kinh nghiệm. Nội dung được xếp theo chuyên mục, reply và bài mới nhất.</p>
            </div>
            <div className='grid grid-cols-3 overflow-hidden rounded-lg border border-slate-100 text-center lg:w-[360px]'>
              <div className='bg-[#F8FBFF] p-2'><p className='text-lg font-bold text-slate-950'>{rooms.length}</p><p className='text-[11px] text-slate-500'>chuyên mục</p></div>
              <div className='border-x border-slate-100 bg-[#F8FBFF] p-2'><p className='text-lg font-bold text-slate-950'>{rooms.filter((room) => room.viewerMembership?.status === 'active').length}</p><p className='text-[11px] text-slate-500'>đã tham gia</p></div>
              <div className='bg-[#F8FBFF] p-2'><p className='text-lg font-bold text-slate-950'>{rooms.reduce((total, room) => total + (room.messageCount || 0), 0)}</p><p className='text-[11px] text-slate-500'>chủ đề</p></div>
            </div>
          </div>
        </section>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <section className='space-y-3'>
            <div className='rounded-lg border border-[#DDE7F3] bg-white shadow-sm p-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm chuyên mục, bệnh lý hoặc chủ đề' />
              </div>
              <Tabs value={tab} onValueChange={(value) => setTab(value as ForumTab)} className='mt-4'>
                <TabsList className='flex h-auto flex-wrap justify-start gap-1 rounded-lg border border-slate-100 bg-[#F7FAFC] p-1'>
                  <TabsTrigger className={forumTabTriggerClass} value='all'>Tất cả</TabsTrigger>
                  <TabsTrigger className={forumTabTriggerClass} value='mine'>Đã tham gia</TabsTrigger>
                  <TabsTrigger className={forumTabTriggerClass} value='active'>Đang hoạt động</TabsTrigger>
                  <TabsTrigger className={forumTabTriggerClass} value='private'>Riêng tư</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {roomsQuery.isLoading ? (
              <div className='space-y-2'>{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className='h-20 rounded-lg' />)}</div>
            ) : filteredRooms.length ? (
              <div className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
                <div className='hidden grid-cols-[minmax(0,1fr)_86px_86px_220px] border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#0A2463] md:grid'>
                  <span>Chuyên mục</span><span className='text-center'>Chủ đề</span><span className='text-center'>Thành viên</span><span>Bài mới</span>
                </div>
                {filteredRooms.map((room) => <ForumRoomCard key={room._id} room={room} onJoin={handleJoin} />)}
              </div>
            ) : (
              <div className='rounded-lg border border-[#DDE7F3] bg-white shadow-sm p-8 text-center'>
                <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-100 bg-[#F8FBFF] text-[#0A2463]'><HeartPulse className='h-6 w-6' /></div>
                <h3 className='text-base font-semibold text-slate-950'>Chưa có chuyên mục phù hợp</h3>
                <p className='mt-1 text-sm text-slate-600'>Thử đổi từ khóa hoặc mở lại danh sách cộng đồng.</p>
              </div>
            )}
          </section>

          <aside className='space-y-3'>
            {!isAuthenticated && (
              <div className='rounded-lg border border-[#DDE7F3] bg-white p-3 shadow-sm'>
                <h2 className='border-b border-slate-100 pb-2 text-sm font-semibold text-[#0A2463]'>Đăng nhập để tạo thread</h2>
                <p className='mt-2 text-sm text-slate-600'>Bạn có thể xem chuyên mục công khai, nhưng cần đăng nhập để tham gia và trả lời.</p>
                <Button className='mt-4 w-full bg-[#0A2463] text-white hover:bg-[#12357D]' onClick={() => navigate('/login')}><LogIn className='h-4 w-4' />Đăng nhập</Button>
              </div>
            )}

            <div className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
              <h2 className='border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-sm font-semibold text-[#0A2463]'>Hội thảo sắp diễn ra</h2>
              <div>
                {eventsQuery.isLoading ? <Skeleton className='h-24 rounded-lg' /> : eventsQuery.data?.items?.length ? eventsQuery.data.items.map((event) => <EventPreviewCard key={event._id} event={event} />) : <p className='p-4 text-sm text-slate-600'>Chưa có hội thảo phù hợp.</p>}
              </div>
            </div>

            <div className='overflow-hidden rounded-lg border border-[#DDE7F3] bg-white shadow-sm'>
              <h2 className='flex items-center gap-2 border-b border-[#DDE7F3] bg-[#F0F6FF] px-3 py-2 text-sm font-semibold text-[#0A2463]'><ShieldCheck className='h-4 w-4 text-[#27623a]' />Nguyên tắc an toàn</h2>
              <ul className='space-y-2 p-3 text-sm text-slate-600'>
                {getRoomGuidelines().map((item) => <li key={item} className='flex gap-2'><CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />{item}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CommunityForumPage
