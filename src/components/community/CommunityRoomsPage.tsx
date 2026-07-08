import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe,
  HeartPulse,
  Lock,
  LogIn,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import communityService from '~/services/communityService'
import { UserRole, UserStatus } from '~/types/user'
import type { CommunityRoom, CommunityVideoEvent } from '~/types/community'
import { communityPreviewText, formatRelativeTime, getRoomDescription, getRoomGuidelines, getRoomTopic, roomInitials } from './communityUi'

type AppealType = 'ban' | 'mute'
type HubTab = 'all' | 'mine' | 'active' | 'unread' | 'private'
const ROOMS_PAGE_SIZE = 9

function VisibilityBadge({ room }: { room: CommunityRoom }) {
  const isPrivate = room.visibility === 'private'
  return (
    <Badge variant='outline' className={isPrivate ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-blue-100 bg-blue-50 text-blue-700'}>
      {isPrivate ? <Lock className='h-3 w-3' /> : <Globe className='h-3 w-3' />}
      {isPrivate ? 'Riêng tư' : 'Công khai'}
    </Badge>
  )
}

function formatEventTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function EventPreviewCard({ event }: { event: CommunityVideoEvent }) {
  return (
    <Link
      to={`/community/video-events/${event._id}`}
      className='block rounded-lg border border-[#E2E8F0] bg-white p-4 transition hover:border-blue-200 hover:bg-[#F8FBFF]'
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700'>
          <Video className='h-5 w-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex flex-wrap items-center gap-2'>
            <Badge className='bg-emerald-50 text-emerald-700 hover:bg-emerald-50'>
              Có thể tham gia
            </Badge>
            {event.room?.name && <span className='truncate text-xs text-slate-500'>{event.room.name}</span>}
          </div>
          <p className='line-clamp-2 text-sm font-semibold text-slate-950'>{event.title}</p>
          <p className='mt-2 inline-flex items-center gap-1 text-xs text-slate-500'>
            <CalendarDays className='h-3.5 w-3.5' />
            {formatEventTime(event.scheduledStartAt)}
          </p>
        </div>
      </div>
    </Link>
  )
}

function RoomCard({
  room,
  onJoin,
  onAppeal,
  appealedRoomIds,
  realtimeJoined,
}: {
  room: CommunityRoom
  onJoin: (roomId: string) => void
  onAppeal: (room: CommunityRoom, type: AppealType) => void
  appealedRoomIds: Set<string>
  realtimeJoined: boolean
}) {
  const memberStatus = room.viewerMembership?.status
  const mutedUntil = room.viewerMembership?.mutedUntil ? new Date(room.viewerMembership.mutedUntil) : null
  const isMuted = Boolean(mutedUntil && mutedUntil.getTime() > Date.now())
  const isBanned = memberStatus === 'banned'
  const isPending = memberStatus === 'pending'
  const isActive = memberStatus === 'active'
  const isInvited = memberStatus === 'invited'
  const hasAppeal = appealedRoomIds.has(`${room._id}:${isBanned ? 'ban' : 'mute'}`)
  const cta = isBanned
    ? hasAppeal
      ? 'Đã gửi khiếu nại'
      : 'Khiếu nại hạn chế'
    : isMuted
      ? hasAppeal
        ? 'Đã gửi khiếu nại'
        : 'Khiếu nại mute'
      : isActive
        ? 'Mở phòng'
        : isPending
          ? 'Đang chờ duyệt'
          : isInvited
            ? 'Nhận lời mời'
            : room.visibility === 'private'
              ? 'Gửi yêu cầu'
              : 'Tham gia'

  const button = isBanned || isMuted ? (
    <Button
      variant='outline'
      className={isBanned ? 'w-full border-rose-200 text-rose-600' : 'w-full border-amber-200 text-amber-700'}
      onClick={() => onAppeal(room, isBanned ? 'ban' : 'mute')}
      disabled={hasAppeal}
    >
      <ShieldAlert className='h-4 w-4' />
      {cta}
    </Button>
  ) : isActive ? (
    <Button asChild className='w-full bg-[#0A2463] text-white hover:bg-[#12357D]'>
      <Link to={`/community/${room._id}`}>{cta}</Link>
    </Button>
  ) : (
    <Button className='w-full bg-[#0A2463] text-white hover:bg-[#12357D]' onClick={() => onJoin(room._id)} disabled={isPending}>
      {cta}
    </Button>
  )

  return (
    <Card
      data-testid='community-room-card'
      data-room-id={room._id}
      data-realtime-joined={realtimeJoined ? 'true' : 'false'}
      className='border-[#E2E8F0] bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md'
    >
      <CardContent className='flex h-full flex-col p-5'>
        <div className='flex items-start gap-3'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF] text-sm font-bold text-[#0A2463]'>
            {roomInitials(room)}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <VisibilityBadge room={room} />
              {room.featured && <Badge className='bg-emerald-50 text-emerald-700 hover:bg-emerald-50'><Sparkles className='h-3 w-3' />Đề xuất</Badge>}
              {Boolean(room.unreadCount) && <Badge className='bg-rose-50 text-rose-700 hover:bg-rose-50'>{room.unreadCount} mới</Badge>}
            </div>
            <h3 className='line-clamp-2 text-base font-semibold text-slate-950'>{room.name}</h3>
            <p className='mt-1 text-sm font-medium text-blue-700'>{getRoomTopic(room)}</p>
          </div>
        </div>

        <p className='mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-600'>{getRoomDescription(room)}</p>

        <div className='mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500'>
          <span className='inline-flex items-center gap-1'><Users className='h-3.5 w-3.5' />{room.memberCount || 0}</span>
          <span className='inline-flex items-center gap-1'><MessageCircle className='h-3.5 w-3.5' />{room.messageCount || 0}</span>
          <span className='inline-flex items-center gap-1'><Clock3 className='h-3.5 w-3.5' />{formatRelativeTime(room.lastMessageAt)}</span>
        </div>

        {communityPreviewText(room.lastMessagePreview, '') && isActive && (
          <div className='mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-2'>
            {communityPreviewText(room.lastMessagePreview, '')}
          </div>
        )}

        <div className='mt-auto pt-5'>{button}</div>
      </CardContent>
    </Card>
  )
}

export function CommunityRoomsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const { isConnected, joinCommunityRoom, leaveCommunityRoom, subscribe, unsubscribe } = useSocketContext()
  const [appealRoom, setAppealRoom] = useState<CommunityRoom | null>(null)
  const [appealType, setAppealType] = useState<AppealType>('ban')
  const [appealReason, setAppealReason] = useState('')
  const [appealedRoomIds, setAppealedRoomIds] = useState<Set<string>>(new Set())
  const [realtimeJoinedRoomIds, setRealtimeJoinedRoomIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<HubTab>('all')
  const [topic, setTopic] = useState('all')
  const [visibleRoomCount, setVisibleRoomCount] = useState(ROOMS_PAGE_SIZE)
  const canUseMemberRooms = isAuthenticated && user?.status === UserStatus.Verified

  const roomsQueryKey = useMemo(() => ['community', 'rooms', canUseMemberRooms] as const, [canUseMemberRooms])
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: roomsQueryKey,
    queryFn: () => (canUseMemberRooms ? communityService.listMyRooms({ sort: 'featured' }) : communityService.listRooms({ sort: 'featured' })),
    staleTime: 30_000,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  })

  const eventsQuery = useQuery({
    queryKey: ['community-video-events-preview'],
    queryFn: () => communityService.listVideoEvents({ upcomingOnly: true, page: 1, limit: 3 }),
    staleTime: 60_000,
  })

  const rooms = useMemo(() => data || [], [data])
  const topicOptions = useMemo(() => {
    const values = new Map<string, string>()
    rooms.forEach((room) => values.set(room.diseaseKey || getRoomTopic(room), getRoomTopic(room)))
    return Array.from(values.entries()).map(([value, label]) => ({ value, label }))
  }, [rooms])
  const myRooms = useMemo(() => rooms.filter((room) => room.viewerMembership?.status === 'active'), [rooms])
  const unreadCount = useMemo(() => rooms.reduce((total, room) => total + (room.unreadCount || 0), 0), [rooms])

  const filteredRooms = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rooms.filter((room) => {
      const matchesSearch = !needle || [room.name, room.slug, room.diseaseKey, room.topicLabel, room.description]
        .some((value) => value?.toLowerCase().includes(needle))
      const matchesTopic = topic === 'all' || room.diseaseKey === topic || getRoomTopic(room) === topic
      const matchesTab =
        tab === 'all' ||
        (tab === 'mine' && room.viewerMembership?.status === 'active') ||
        (tab === 'active' && Boolean(room.lastMessageAt || room.messageCount)) ||
        (tab === 'unread' && Boolean(room.unreadCount)) ||
        (tab === 'private' && room.visibility === 'private')
      return matchesSearch && matchesTopic && matchesTab
    })
  }, [rooms, search, tab, topic])

  const visibleRooms = useMemo(() => filteredRooms.slice(0, visibleRoomCount), [filteredRooms, visibleRoomCount])
  const hasMoreRooms = visibleRoomCount < filteredRooms.length

  useEffect(() => {
    setVisibleRoomCount(ROOMS_PAGE_SIZE)
  }, [search, tab, topic])

  const updateRoomList = useCallback((updater: (rooms: CommunityRoom[]) => CommunityRoom[]) => {
    queryClient.setQueryData<CommunityRoom[]>(roomsQueryKey, (current) => (current ? updater(current) : current))
  }, [queryClient, roomsQueryKey])

  useEffect(() => {
    if (!isAuthenticated || !isConnected) return
    const activeRoomIds = rooms.filter((room) => room.viewerMembership?.status === 'active').map((room) => room._id)
    activeRoomIds.forEach((roomId) => joinCommunityRoom(roomId, (ack) => ack.ok && ack.roomId && setRealtimeJoinedRoomIds((prev) => new Set(prev).add(ack.roomId as string))))
    return () => {
      activeRoomIds.forEach((roomId) => leaveCommunityRoom(roomId))
      setRealtimeJoinedRoomIds((prev) => {
        const next = new Set(prev)
        activeRoomIds.forEach((roomId) => next.delete(roomId))
        return next
      })
    }
  }, [isAuthenticated, isConnected, joinCommunityRoom, leaveCommunityRoom, rooms])

  useEffect(() => {
    const subscriberId = 'community-rooms-list'
    subscribe(subscriberId, {
      onCommunityMessageNew: (message) => {
        if (message.videoEventId) return
        updateRoomList((current) => current.map((room) => {
          if (room._id !== message.roomId) return room
          const mine = String(message.senderId) === user?._id
          return { ...room, messageCount: (room.messageCount || 0) + 1, lastMessageAt: message.createdAt, lastMessagePreview: communityPreviewText(message.content, message.imageUrl ? 'Đã gửi ảnh' : ''), unreadCount: mine ? room.unreadCount || 0 : (room.unreadCount || 0) + 1 }
        }))
      },
      onCommunityRoomRead: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || '')
        if (eventUserId !== user?._id) return
        updateRoomList((current) => current.map((room) => room._id === roomId ? { ...room, unreadCount: 0, viewerMembership: room.viewerMembership ? { ...room.viewerMembership, lastReadAt: String(event.lastReadAt || '') } : room.viewerMembership } : room))
      },
      onCommunityMemberJoined: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || '')
        updateRoomList((current) => current.map((room) => room._id === roomId && eventUserId !== user?._id ? { ...room, memberCount: (room.memberCount || 0) + 1 } : room))
      },
      onCommunityMemberLeft: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || '')
        updateRoomList((current) => current.map((room) => room._id === roomId && eventUserId !== user?._id ? { ...room, memberCount: Math.max((room.memberCount || 0) - 1, 0) } : room))
      },
      onCommunityMemberUpdated: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || event.targetUserId || '')
        updateRoomList((current) => current.map((room) => {
          if (room._id !== roomId || eventUserId !== user?._id) return room
          const previousStatus = room.viewerMembership?.status
          const nextStatus = typeof event.status === 'string' ? event.status : previousStatus
          const memberDelta = previousStatus === nextStatus ? 0 : nextStatus === 'active' ? 1 : previousStatus === 'active' ? -1 : 0
          return { ...room, memberCount: Math.max((room.memberCount || 0) + memberDelta, 0), viewerMembership: { ...(room.viewerMembership || { roomId, userId: user?._id || '' }), ...event, roomId, userId: eventUserId, status: nextStatus as any } }
        }))
      },
    })
    return () => unsubscribe(subscriberId)
  }, [subscribe, unsubscribe, updateRoomList, user?._id])

  const joinMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const room = rooms.find((item) => item._id === roomId)
      if (room?.visibility === 'private' && room.viewerMembership?.status !== 'invited') return communityService.requestJoin(roomId)
      return communityService.joinRoom(roomId)
    },
    onSuccess: (result, roomId) => {
      const room = rooms.find((item) => item._id === roomId)
      if (room?.visibility === 'private' && room.viewerMembership?.status !== 'invited') {
        toast.success('Đã gửi yêu cầu tham gia phòng riêng tư')
        updateRoomList((current) => current.map((item) => item._id === roomId ? { ...item, viewerMembership: { ...(item.viewerMembership || { roomId, userId: user?._id || '' }), roomId, userId: user?._id || '', status: result.status } } : item))
        queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
        return
      }
      toast.success('Đã tham gia phòng')
      updateRoomList((current) => current.map((item) => item._id === roomId ? { ...item, memberCount: item.viewerMembership?.status !== 'active' ? (item.memberCount || 0) + 1 : item.memberCount, viewerMembership: { ...(item.viewerMembership || { roomId, userId: user?._id || '' }), roomId, userId: user?._id || '', status: result.status, role: item.viewerMembership?.role || 'member' } } : item))
      queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
      navigate(`/community/${roomId}`)
    },
    onError: (err: any) => {
      if (err?.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để tham gia')
        navigate('/login', { replace: false, state: { from: { pathname: '/community' } } })
        return
      }
      toast.error(err?.response?.data?.message || 'Không thể tham gia phòng')
    },
  })

  const appealMutation = useMutation({
    mutationFn: () => {
      if (!appealRoom) throw new Error('Missing appeal room')
      return communityService.createAppeal({ roomId: appealRoom._id, type: appealType, reason: appealReason.trim() })
    },
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu xem xét')
      if (appealRoom) setAppealedRoomIds((prev) => new Set(prev).add(`${appealRoom._id}:${appealType}`))
      setAppealRoom(null)
      setAppealReason('')
      queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
    },
    onError: (err: any) => toast.error(err?.response?.status === 409 ? 'Bạn đã có yêu cầu đang chờ xử lý' : 'Không thể gửi yêu cầu'),
  })

  const handleJoin = (roomId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia')
      navigate('/login', { state: { from: { pathname: '/community' } } })
      return
    }
    if (user?.role !== undefined && user.role !== UserRole.Customer) toast.info('Bạn đang dùng tài khoản không phải khách hàng')
    joinMutation.mutate(roomId)
  }

  const handleOpenAppeal = (room: CommunityRoom, type: AppealType) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi yêu cầu')
      navigate('/login', { state: { from: { pathname: '/community' } } })
      return
    }
    setAppealRoom(room)
    setAppealType(type)
    setAppealReason('')
  }

  const handleSubmitAppeal = () => {
    if (appealReason.trim().length < 10) {
      toast.error('Vui lòng nhập lý do ít nhất 10 ký tự')
      return
    }
    appealMutation.mutate()
  }

  return (
    <main className='bg-[#F7FAFC]'>
      <div className='mx-auto max-w-7xl px-4 py-8 space-y-6'>
        <UniversalBreadcrumb items={[{ label: 'Cộng đồng' }]} />

        <Dialog open={Boolean(appealRoom)} onOpenChange={(open) => !open && setAppealRoom(null)}>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Gửi yêu cầu xem xét</DialogTitle>
              <DialogDescription>Yêu cầu sẽ được chuyển đến đội ngũ điều phối để kiểm tra lại trạng thái của bạn trong phòng này.</DialogDescription>
            </DialogHeader>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-slate-700'>{appealRoom?.name}</p>
              <Textarea value={appealReason} onChange={(event) => setAppealReason(event.target.value)} rows={5} placeholder='Nhập lý do bạn muốn được xem xét lại' />
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setAppealRoom(null)} disabled={appealMutation.isPending}>Hủy</Button>
              <Button onClick={handleSubmitAppeal} disabled={appealMutation.isPending}>Gửi yêu cầu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className='rounded-lg border border-[#DDE7F3] bg-white p-5 shadow-sm md:p-6'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-3xl'>
              <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'>
                <ShieldCheck className='h-3.5 w-3.5' />
                Cộng đồng được điều phối bởi MediSpace
              </div>
              <h1 className='font-display text-3xl font-bold text-[#0A2463] md:text-4xl'>Cộng đồng sức khỏe MediSpace</h1>
              <p className='mt-2 text-sm leading-6 text-slate-600 md:text-base'>Tìm nhóm phù hợp, chia sẻ kinh nghiệm chăm sóc sức khỏe và tham gia các buổi hội thảo trong môi trường an toàn.</p>
            </div>
            <div className='grid grid-cols-3 gap-3 text-center lg:w-[360px]'>
              <div className='rounded-lg border border-slate-100 bg-[#F8FBFF] p-3'><p className='text-xl font-bold text-slate-950'>{rooms.length}</p><p className='text-xs text-slate-500'>nhóm</p></div>
              <div className='rounded-lg border border-slate-100 bg-[#F8FBFF] p-3'><p className='text-xl font-bold text-slate-950'>{myRooms.length}</p><p className='text-xs text-slate-500'>của tôi</p></div>
              <div className='rounded-lg border border-slate-100 bg-[#F8FBFF] p-3'><p className='text-xl font-bold text-slate-950'>{unreadCount}</p><p className='text-xs text-slate-500'>tin mới</p></div>
            </div>
          </div>
        </section>

        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
          <section className='space-y-4'>
            <div className='rounded-lg border border-[#DDE7F3] bg-white p-4 shadow-sm'>
              <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                  <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm theo bệnh lý, chủ đề hoặc tên nhóm' />
                </div>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger><SelectValue placeholder='Chủ đề' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả chủ đề</SelectItem>
                    {topicOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant='outline' className='border-blue-100' onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
              <Tabs value={tab} onValueChange={(value) => setTab(value as HubTab)} className='mt-4'>
                <TabsList className='flex h-auto flex-wrap justify-start bg-slate-100 p-1'>
                  <TabsTrigger value='all'>Tất cả</TabsTrigger>
                  <TabsTrigger value='mine'>Nhóm của tôi</TabsTrigger>
                  <TabsTrigger value='active'>Đang hoạt động</TabsTrigger>
                  <TabsTrigger value='unread'>Tin mới</TabsTrigger>
                  <TabsTrigger value='private'>Riêng tư</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className='h-72 rounded-lg' />)}
              </div>
            ) : filteredRooms.length ? (
              <>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                  {visibleRooms.map((room) => <RoomCard key={room._id} room={room} onJoin={handleJoin} onAppeal={handleOpenAppeal} appealedRoomIds={appealedRoomIds} realtimeJoined={realtimeJoinedRoomIds.has(room._id)} />)}
                </div>

                {hasMoreRooms ? (
                  <div className='mt-8 flex justify-center py-6'>
                    <Button
                      variant='outline'
                      onClick={() => setVisibleRoomCount((count) => Math.min(count + ROOMS_PAGE_SIZE, filteredRooms.length))}
                      className='border-[#BFDBFE] text-[#1E40AF] hover:bg-[#F0F6FF]'
                    >
                      Xem thêm nhóm cộng đồng
                    </Button>
                  </div>
                ) : (
                  <div className='mt-8 text-center text-sm text-slate-500'>
                    Đã hiển thị tất cả {filteredRooms.length} nhóm cộng đồng
                  </div>
                )}
              </>
            ) : (
              <div className='rounded-lg border border-[#DDE7F3] bg-white p-10 text-center shadow-sm'>
                <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-700'><HeartPulse className='h-7 w-7' /></div>
                <h3 className='text-lg font-semibold text-slate-950'>Chưa có nhóm phù hợp</h3>
                <p className='mt-1 text-sm text-slate-600'>Thử đổi từ khóa, chủ đề hoặc tải lại danh sách cộng đồng.</p>
              </div>
            )}
          </section>

          <aside className='space-y-4'>
            {!isAuthenticated && (
              <div className='rounded-lg border border-blue-100 bg-white p-4 shadow-sm'>
                <h2 className='font-semibold text-slate-950'>Đăng nhập để theo dõi nhóm</h2>
                <p className='mt-1 text-sm text-slate-600'>Bạn có thể xem nhóm công khai, nhưng cần đăng nhập để tham gia, nhận thông báo và đăng ký hội thảo.</p>
                <Button className='mt-4 w-full bg-[#0A2463] text-white hover:bg-[#12357D]' onClick={() => navigate('/login')}><LogIn className='h-4 w-4' />Đăng nhập</Button>
              </div>
            )}

            <div className='rounded-lg border border-[#DDE7F3] bg-white p-4 shadow-sm'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <h2 className='font-semibold text-slate-950'>Hội thảo sắp diễn ra</h2>
                <Button asChild variant='ghost' size='sm' className='text-blue-700'><Link to='/community/video-events'>Xem tất cả</Link></Button>
              </div>
              <div className='space-y-3'>
                {eventsQuery.isLoading ? <Skeleton className='h-24 rounded-lg' /> : eventsQuery.data?.items?.length ? eventsQuery.data.items.map((event) => <EventPreviewCard key={event._id} event={event} />) : <p className='rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500'>Chưa có hội thảo phù hợp.</p>}
              </div>
            </div>

            <div className='rounded-lg border border-[#DDE7F3] bg-white p-4 shadow-sm'>
              <h2 className='mb-3 flex items-center gap-2 font-semibold text-slate-950'><ShieldCheck className='h-4 w-4 text-emerald-600' />Nguyên tắc an toàn</h2>
              <ul className='space-y-3 text-sm text-slate-600'>
                {getRoomGuidelines().map((item) => <li key={item} className='flex gap-2'><CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />{item}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CommunityRoomsPage
