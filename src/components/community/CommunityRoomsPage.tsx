import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Lock, Globe, RefreshCw, LogIn, MessageCircle, ShieldAlert, Video } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import { UserRole, UserStatus } from '~/types/user'
import communityService from '~/services/communityService'
import type { CommunityRoom } from '~/types/community'
import { UniversalBreadcrumb } from '~/components/shared/UniversalBreadcrumb'

type AppealType = 'ban' | 'mute'

function VisibilityBadge({ visibility }: { visibility?: string }) {
  if (!visibility) return null
  return (
    <Badge variant='outline' className='border-[#BFDBFE] text-[#0A2463] bg-[#F0F6FF]'>
      {visibility === 'private' ? (
        <span className='inline-flex items-center gap-1'>
          <Lock className='w-3 h-3' /> Riêng tư
        </span>
      ) : (
        <span className='inline-flex items-center gap-1'>
          <Globe className='w-3 h-3' /> Công khai
        </span>
      )}
    </Badge>
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

  return (
    <Card
      data-testid='community-room-card'
      data-room-id={room._id}
      data-realtime-joined={realtimeJoined ? 'true' : 'false'}
      className='bg-white backdrop-blur-lg border-[#E8EDF5] hover:shadow-md transition-shadow'
    >
      <CardContent className='p-6 space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>{room.name}</h3>
            <p className='text-sm text-gray-500 mt-1'>#{room.slug}</p>
          </div>
          <Users className='w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-1' />
        </div>

        <div className='flex flex-wrap gap-2'>
          <VisibilityBadge visibility={room.visibility} />
          {room.diseaseKey && (
            <Badge className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5]'>{room.diseaseKey}</Badge>
          )}
          {Boolean(room.unreadCount) && <Badge className='bg-red-100 text-red-700'>{room.unreadCount} mới</Badge>}
          {isPending && <Badge className='bg-yellow-100 text-yellow-700'>Đang chờ duyệt</Badge>}
          {isBanned && <Badge className='bg-red-100 text-red-700'>Đã bị ban</Badge>}
          {isMuted && <Badge className='bg-orange-100 text-orange-700'>Đang mute</Badge>}
          {hasAppeal && <Badge className='bg-[#E8EDF5] text-[#0A2463]'>Đã gửi appeal</Badge>}
        </div>

        <div className='flex flex-wrap gap-4 text-xs text-gray-500'>
          <span className='inline-flex items-center gap-1'>
            <Users className='w-3 h-3' />
            {room.memberCount || 0} thành viên
          </span>
          <span className='inline-flex items-center gap-1'>
            <MessageCircle className='w-3 h-3' />
            {room.messageCount || 0} tin nhắn
          </span>
        </div>

        <div className='flex items-center gap-2 pt-2'>
          {isBanned ? (
            <Button
              variant='outline'
              className='flex-1 border-red-200 text-red-600'
              onClick={() => onAppeal(room, 'ban')}
              disabled={hasAppeal}
            >
              <ShieldAlert className='w-4 h-4 mr-2' />
              {hasAppeal ? 'Đã gửi appeal' : 'Appeal ban'}
            </Button>
          ) : isMuted ? (
            <Button
              variant='outline'
              className='flex-1 border-orange-200 text-orange-600'
              onClick={() => onAppeal(room, 'mute')}
              disabled={hasAppeal}
            >
              {hasAppeal ? 'Đã gửi appeal' : 'Appeal mute'}
            </Button>
          ) : isActive ? (
            <Button asChild className='flex-1 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'>
              <Link to={`/community/${room._id}`}>Vào phòng</Link>
            </Button>
          ) : (
            <Button
              className='flex-1 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'
              onClick={() => onJoin(room._id)}
              disabled={isPending}
            >
              {isPending ? 'Chờ duyệt' : isInvited ? 'Nhận lời mời' : room.visibility === 'private' ? 'Gửi yêu cầu' : 'Tham gia'}
            </Button>
          )}
          <Button asChild variant='outline' className='border-[#BFDBFE]'>
            <Link to={`/community/${room._id}`}>Xem</Link>
          </Button>
        </div>
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
  const canUseMemberRooms = isAuthenticated && user?.status === UserStatus.Verified

  const roomsQueryKey = useMemo(() => ['community', 'rooms', canUseMemberRooms] as const, [canUseMemberRooms])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: roomsQueryKey,
    queryFn: () => (canUseMemberRooms ? communityService.listMyRooms() : communityService.listRooms()),
    staleTime: 30_000,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  })

  const rooms = useMemo(() => data || [], [data])

  const updateRoomList = useCallback(
    (updater: (rooms: CommunityRoom[]) => CommunityRoom[]) => {
      queryClient.setQueryData<CommunityRoom[]>(roomsQueryKey, (current) => {
        if (!current) return current
        return updater(current)
      })
    },
    [queryClient, roomsQueryKey],
  )

  useEffect(() => {
    if (!isAuthenticated || !isConnected) return
    const activeRoomIds = rooms
      .filter((room) => room.viewerMembership?.status === 'active')
      .map((room) => room._id)

    activeRoomIds.forEach((roomId) =>
      joinCommunityRoom(roomId, (ack) => {
        if (!ack.ok || !ack.roomId) return
        setRealtimeJoinedRoomIds((prev) => new Set(prev).add(ack.roomId as string))
      }),
    )
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
        updateRoomList((current) =>
          current.map((room) => {
            if (room._id !== message.roomId) return room
            const mine = String(message.senderId) === user?._id
            return {
              ...room,
              messageCount: (room.messageCount || 0) + 1,
              lastMessageAt: message.createdAt,
              lastMessagePreview: message.content,
              unreadCount: mine ? room.unreadCount || 0 : (room.unreadCount || 0) + 1,
            }
          }),
        )
      },
      onCommunityMessageHidden: (message) => {
        updateRoomList((current) =>
          current.map((room) =>
            room._id === message.roomId
              ? { ...room, messageCount: Math.max((room.messageCount || 0) - 1, 0) }
              : room,
          ),
        )
      },
      onCommunityMessageDeleted: (message) => {
        updateRoomList((current) =>
          current.map((room) =>
            room._id === message.roomId
              ? { ...room, messageCount: Math.max((room.messageCount || 0) - 1, 0) }
              : room,
          ),
        )
      },
      onCommunityMemberJoined: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || '')
        updateRoomList((current) =>
          current.map((room) =>
            room._id === roomId && eventUserId !== user?._id
              ? { ...room, memberCount: (room.memberCount || 0) + 1 }
              : room,
          ),
        )
      },
      onCommunityMemberLeft: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || '')
        updateRoomList((current) =>
          current.map((room) =>
            room._id === roomId && eventUserId !== user?._id
              ? { ...room, memberCount: Math.max((room.memberCount || 0) - 1, 0) }
              : room,
          ),
        )
      },
      onCommunityRoomRead: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || '')
        if (eventUserId !== user?._id) return
        updateRoomList((current) =>
          current.map((room) =>
            room._id === roomId
              ? {
                  ...room,
                  unreadCount: 0,
                  viewerMembership: room.viewerMembership
                    ? { ...room.viewerMembership, lastReadAt: String(event.lastReadAt || '') }
                    : room.viewerMembership,
                }
              : room,
          ),
        )
      },
      onCommunityMemberUpdated: (event) => {
        const roomId = String(event.roomId || '')
        const eventUserId = String(event.userId || event.targetUserId || '')
        updateRoomList((current) =>
          current.map((room) => {
            if (room._id !== roomId || eventUserId !== user?._id) return room
            const previousStatus = room.viewerMembership?.status
            const nextStatus = typeof event.status === 'string' ? event.status : previousStatus
            const previousActive = previousStatus === 'active'
            const nextActive = nextStatus === 'active'
            const memberDelta = previousActive === nextActive ? 0 : nextActive ? 1 : -1
            return {
              ...room,
              memberCount: Math.max((room.memberCount || 0) + memberDelta, 0),
              viewerMembership: {
                ...(room.viewerMembership || { roomId, userId: user?._id || '' }),
                ...event,
                roomId,
                userId: eventUserId,
                status: nextStatus as any,
              },
            }
          }),
        )
      },
    })
    return () => unsubscribe(subscriberId)
  }, [subscribe, unsubscribe, updateRoomList, user?._id])

  const joinMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const room = rooms.find((item) => item._id === roomId)
      if (room?.visibility === 'private' && room.viewerMembership?.status !== 'invited') {
        return communityService.requestJoin(roomId)
      }
      return communityService.joinRoom(roomId)
    },
    onSuccess: (_res, roomId) => {
      const room = rooms.find((item) => item._id === roomId)
      if (room?.visibility === 'private' && room.viewerMembership?.status !== 'invited') {
        toast.success('Đã gửi yêu cầu tham gia phòng riêng tư')
        updateRoomList((current) =>
          current.map((item) =>
            item._id === roomId
              ? {
                  ...item,
                  viewerMembership: {
                    ...(item.viewerMembership || { roomId, userId: user?._id || '' }),
                    roomId,
                    userId: user?._id || '',
                    status: 'pending',
                  },
                }
              : item,
          ),
        )
        queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
        return
      }
      toast.success('Đã tham gia phòng')
      queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
      navigate(`/community/${roomId}`)
    },
    onError: (err: any) => {
      const status = err?.response?.status
      if (status === 401) {
        toast.error('Vui lòng đăng nhập để tham gia')
        navigate('/login', { replace: false, state: { from: { pathname: '/community' } } })
        return
      }
      if (status === 403) {
        toast.error('Bạn không có quyền tham gia phòng này')
        return
      }
      toast.error('Không thể tham gia phòng')
    },
  })

  const appealMutation = useMutation({
    mutationFn: () => {
      if (!appealRoom) throw new Error('Missing appeal room')
      return communityService.createAppeal({
        roomId: appealRoom._id,
        type: appealType,
        reason: appealReason.trim(),
      })
    },
    onSuccess: () => {
      toast.success('Đã gửi appeal đến admin')
      if (appealRoom) {
        setAppealedRoomIds((prev) => new Set(prev).add(`${appealRoom._id}:${appealType}`))
      }
      setAppealRoom(null)
      setAppealReason('')
      queryClient.invalidateQueries({ queryKey: ['community', 'rooms'] })
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        toast.error('Bạn đã có appeal đang chờ xử lý')
        if (appealRoom) {
          setAppealedRoomIds((prev) => new Set(prev).add(`${appealRoom._id}:${appealType}`))
        }
        return
      }
      toast.error('Không thể gửi appeal')
    },
  })

  const handleJoin = (roomId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia')
      navigate('/login', { state: { from: { pathname: '/community' } } })
      return
    }
    // Community là cho customer; admin/pharmacist vẫn có thể vào để test, nhưng UX customer-first
    if (user?.role !== undefined && user.role !== UserRole.Customer) {
      toast.info('Bạn đang dùng tài khoản không phải khách hàng')
    }
    joinMutation.mutate(roomId)
  }

  const handleOpenAppeal = (room: CommunityRoom, type: AppealType) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi appeal')
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
    <div className='max-w-7xl mx-auto px-4 py-8 space-y-6'>
      <UniversalBreadcrumb items={[{ label: 'Cộng đồng' }]} />

      <Dialog open={Boolean(appealRoom)} onOpenChange={(open) => !open && setAppealRoom(null)}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Gửi appeal {appealType === 'ban' ? 'ban' : 'mute'}</DialogTitle>
            <DialogDescription>
              Appeal sẽ được đưa vào hàng chờ để admin xem xét lại trạng thái của bạn trong phòng này.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <p className='text-sm font-medium text-gray-700'>{appealRoom?.name}</p>
            <Textarea
              value={appealReason}
              onChange={(event) => setAppealReason(event.target.value)}
              rows={5}
              placeholder='Nhập lý do bạn muốn được xem xét lại'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAppealRoom(null)} disabled={appealMutation.isPending}>
              Hủy
            </Button>
            <Button onClick={handleSubmitAppeal} disabled={appealMutation.isPending}>
              Gửi appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='font-display bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-3xl font-bold text-transparent'>
            Cộng đồng
          </h1>
          <p className='text-gray-600 mt-1'>Tham gia phòng theo nhóm bệnh để chia sẻ kinh nghiệm.</p>
        </div>

        <div className='flex items-center gap-2'>
          {!isAuthenticated && (
            <Button variant='outline' className='border-[#BFDBFE]' onClick={() => navigate('/login')}>
              <LogIn className='w-4 h-4 mr-2' />
              Đăng nhập
            </Button>
          )}
          <Button variant='outline' className='border-[#BFDBFE] gap-2' onClick={() => navigate('/community/video-events')}>
            <Video className='w-4 h-4' />
            Hội thảo
          </Button>
          <Button variant='outline' className='border-[#BFDBFE] gap-2' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Tải lại
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className='bg-white border-[#E8EDF5]'>
              <CardContent className='p-6 space-y-3'>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-4 w-1/3' />
                <div className='flex gap-2'>
                  <Skeleton className='h-5 w-20' />
                  <Skeleton className='h-5 w-24' />
                </div>
                <div className='flex gap-2 pt-2'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-24' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className='bg-white border-[#E8EDF5]'>
          <CardContent className='p-10 text-center'>
            <div className='w-14 h-14 bg-[#F0F6FF] rounded-full flex items-center justify-center mx-auto mb-3'>
              <Users className='w-7 h-7 text-blue-500' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-1'>Chưa có phòng phù hợp</h3>
            <p className='text-gray-600 mb-4'>Hãy thử tải lại hoặc quay lại sau.</p>
            <Button variant='outline' className='border-[#BFDBFE]' onClick={() => refetch()}>
              Tải lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onJoin={handleJoin}
              onAppeal={handleOpenAppeal}
              appealedRoomIds={appealedRoomIds}
              realtimeJoined={realtimeJoinedRoomIds.has(room._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommunityRoomsPage
