import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, CheckCircle, Edit, ExternalLink, Lock, Plus, RefreshCw, Search, Send, Users, Video } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import { adminCommunityService } from '~/services/communityService'
import type { CommunityMember, CommunityRoom, CommunityThread } from '~/types/community'
import { communityPreviewText } from '~/components/community/communityUi'

const emptyForm = {
  name: '',
  slug: '',
  visibility: 'public' as 'public' | 'private',
  topicLabel: '',
  description: '',
  guidelinesText: '',
  pinnedMessage: '',
  featured: false,
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const emptyMeetingForm = {
  startsAt: '',
  title: '',
  note: '',
}

function displayName(member: CommunityMember) {
  const user = member.user
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  return name || user?.email || member.userId
}

export function AdminCommunityPage() {
  const queryClient = useQueryClient()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<CommunityRoom | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [inviteEmail, setInviteEmail] = useState('')
  const [roomSearch, setRoomSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [threadSearch, setThreadSearch] = useState('')
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [editingThread, setEditingThread] = useState<CommunityThread | null>(null)
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm)

  const { data: rooms = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-community-rooms', visibilityFilter, statusFilter, roomSearch.trim()],
    queryFn: () =>
      adminCommunityService.listRooms({
        visibility: visibilityFilter === 'all' ? undefined : visibilityFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: roomSearch.trim() || undefined,
      }),
  })

  const filteredRooms = useMemo(() => {
    const needle = roomSearch.trim().toLowerCase()
    if (!needle) return rooms
    return rooms.filter((room) =>
      [room.name, room.slug, room.topicLabel, room.description].some((value) => value?.toLowerCase().includes(needle)),
    )
  }, [roomSearch, rooms])

  const selectedRoom = useMemo(
    () => filteredRooms.find((room) => room._id === selectedRoomId) || filteredRooms[0] || null,
    [filteredRooms, selectedRoomId],
  )

  const { data: membersData, refetch: refetchMembers } = useQuery({
    queryKey: ['admin-community-members', selectedRoom?._id],
    queryFn: () => adminCommunityService.listMembers({ roomId: selectedRoom!._id, page: 1, limit: 50 }),
    enabled: Boolean(selectedRoom?._id),
  })

  const { data: threadsData, isFetching: isFetchingThreads } = useQuery({
    queryKey: ['admin-community-room-threads', selectedRoom?._id, threadSearch.trim()],
    queryFn: () => adminCommunityService.listThreads({ roomId: selectedRoom!._id, page: 1, limit: 40, q: threadSearch.trim() || undefined }),
    enabled: Boolean(selectedRoom?._id),
  })

  const saveRoom = useMutation({
    mutationFn: () => {
      const slug = form.slug.trim()
      if (slug && !slugPattern.test(slug)) {
        throw new Error('Slug chỉ dùng chữ thường, số và dấu gạch ngang. Ví dụ: cong-dong-tim-mach')
      }
      const payload = {
        name: form.name.trim(),
        slug: slug || undefined,
        visibility: form.visibility,
        topicLabel: form.topicLabel.trim() || undefined,
        description: form.description.trim() || undefined,
        guidelines: form.guidelinesText.split('\n').map((item) => item.trim()).filter(Boolean),
        pinnedMessage: form.pinnedMessage.trim() || undefined,
        featured: form.featured,
      }
      return editingRoom
        ? adminCommunityService.updateRoom(editingRoom._id, payload)
        : adminCommunityService.createRoom(payload)
    },
    onSuccess: () => {
      toast.success('Đã lưu phòng')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-community-rooms'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Không thể lưu phòng'),
  })

  const archiveRoom = useMutation({
    mutationFn: (room: CommunityRoom) =>
      room.status === 'archived'
        ? adminCommunityService.unarchiveRoom(room._id)
        : adminCommunityService.archiveRoom(room._id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái phòng')
      queryClient.invalidateQueries({ queryKey: ['admin-community-rooms'] })
    },
  })

  const updateMember = useMutation({
    mutationFn: (data: { member: CommunityMember; status?: string; mutedUntil?: string | null }) =>
      adminCommunityService.updateMember(data.member.roomId, data.member.userId, {
        status: data.status,
        mutedUntil: data.mutedUntil,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật thành viên')
      refetchMembers()
    },
  })

  const inviteMember = useMutation({
    mutationFn: () => adminCommunityService.inviteMember(selectedRoom!._id, { email: inviteEmail.trim() }),
    onSuccess: () => {
      toast.success('Đã gửi lời mời')
      setInviteEmail('')
      refetchMembers()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể mời thành viên'),
  })

  const saveThreadMeeting = useMutation({
    mutationFn: async () => {
      if (!editingThread) throw new Error('Chưa chọn thread')
      if (!selectedRoom?._id) throw new Error('Chưa chọn phòng')

      const startDate = meetingForm.startsAt ? new Date(meetingForm.startsAt) : new Date()
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      const title = meetingForm.title.trim() || editingThread.title
      const note = meetingForm.note.trim() || 'Phòng LiveKit nội bộ để cộng đồng trao đổi trực tuyến theo thread. Không chia sẻ thông tin cá nhân nhạy cảm.'
      let eventId = editingThread.videoMeeting?.eventId

      if (!eventId) {
        const event = await adminCommunityService.createVideoEvent({
          roomId: selectedRoom._id,
          title,
          description: note,
          agenda: note,
          scheduledStartAt: startDate.toISOString(),
          scheduledEndAt: endDate.toISOString(),
          registrationRequired: false,
          provider: 'livekit',
          tags: ['thread-video', editingThread._id],
        })
        eventId = event._id
      } else {
        await adminCommunityService.updateVideoEvent(eventId, {
          title,
          description: note,
          agenda: note,
          scheduledStartAt: startDate.toISOString(),
          scheduledEndAt: endDate.toISOString(),
          registrationRequired: false,
          provider: 'livekit',
          meetingUrl: `/community/video-events/${eventId}`,
          tags: ['thread-video', editingThread._id],
        })
      }

      return adminCommunityService.updateThread(editingThread._id, {
        videoMeeting: {
          eventId,
          url: `/community/video-events/${eventId}`,
          provider: 'livekit',
          status: 'scheduled',
          startsAt: startDate.toISOString(),
          title,
          note,
        },
      })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật phòng video cho thread')
      setMeetingDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-community-room-threads'] })
      queryClient.invalidateQueries({ queryKey: ['community'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể cập nhật phòng video'),
  })

  const removeThreadMeeting = useMutation({
    mutationFn: () => {
      if (!editingThread) throw new Error('Chưa chọn thread')
      return adminCommunityService.updateThread(editingThread._id, { videoMeeting: null })
    },
    onSuccess: () => {
      toast.success('Đã gỡ phòng video khỏi thread')
      setMeetingDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-community-room-threads'] })
      queryClient.invalidateQueries({ queryKey: ['community'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể gỡ phòng video'),
  })

  const openCreate = () => {
    setEditingRoom(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (room: CommunityRoom) => {
    setEditingRoom(room)
    setForm({
      name: room.name,
      slug: room.slug,
      visibility: room.visibility,
      topicLabel: room.topicLabel || '',
      description: room.description || '',
      guidelinesText: (room.guidelines || []).join('\n'),
      pinnedMessage: room.pinnedMessage || '',
      featured: Boolean(room.featured),
    })
    setDialogOpen(true)
  }

  const openMeetingDialog = (thread: CommunityThread) => {
    const meeting = thread.videoMeeting
    setEditingThread(thread)
    setMeetingForm({
      startsAt: meeting?.startsAt ? new Date(meeting.startsAt).toISOString().slice(0, 16) : '',
      title: meeting?.title || '',
      note: meeting?.note || '',
    })
    setMeetingDialogOpen(true)
  }

  return (
    <div className='space-y-6'>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Sửa phòng cộng đồng' : 'Tạo phòng cộng đồng'}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='space-y-2'>
              <Label>Tên phòng</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className='space-y-2'>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: normalizeSlug(e.target.value) }))}
                placeholder='vi-du: cong-dong-tim-mach'
              />
              <p className='text-xs text-gray-500'>Chỉ dùng chữ thường, số và dấu gạch ngang.</p>
            </div>
            <div className='space-y-2'>
              <Label>Hiển thị</Label>
              <Select
                value={form.visibility}
                onValueChange={(value: 'public' | 'private') => setForm((prev) => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='public'>Công khai</SelectItem>
                  <SelectItem value='private'>Riêng tư</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Nhãn chủ đề</Label>
              <Input
                value={form.topicLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, topicLabel: e.target.value }))}
                placeholder='Ví dụ: Tim mạch, Mẹ và bé'
              />
            </div>
            <div className='space-y-2'>
              <Label>Mô tả ngắn</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder='Mô tả hiển thị trên card cộng đồng'
              />
            </div>
            <div className='space-y-2'>
              <Label>Thông báo ghim</Label>
              <Input
                value={form.pinnedMessage}
                onChange={(e) => setForm((prev) => ({ ...prev, pinnedMessage: e.target.value }))}
                placeholder='Thông báo ngắn hiển thị trong phòng'
              />
            </div>
            <div className='space-y-2'>
              <Label>Quy tắc phòng</Label>
              <Textarea
                value={form.guidelinesText}
                onChange={(e) => setForm((prev) => ({ ...prev, guidelinesText: e.target.value }))}
                rows={4}
                placeholder='Mỗi dòng là một quy tắc cộng đồng'
              />
            </div>
            <div className='flex items-center justify-between rounded-lg border border-[#E8EDF5] p-3'>
              <div>
                <Label>Đề xuất trên Community Hub</Label>
                <p className='text-xs text-gray-500'>Phòng được ưu tiên khi sắp xếp danh sách.</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, featured: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'
              disabled={!form.name.trim() || saveRoom.isPending}
              onClick={() => saveRoom.mutate()}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Phòng thảo luận trực tuyến</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800'>
              Tạo phòng LiveKit nội bộ gắn trực tiếp vào thread. Người dùng bấm tham gia, không cần đăng ký trước.
            </div>
            <div className='space-y-2'>
              <Label>Thread</Label>
              <p className='rounded-lg border border-[#E8EDF5] bg-[#F8FBFF] px-3 py-2 text-sm font-medium text-gray-900'>{editingThread?.title || '-'}</p>
            </div>
            {editingThread?.videoMeeting?.url && (
              <div className='space-y-2'>
                <Label>Link nội bộ</Label>
                <a href={editingThread.videoMeeting.url} target='_blank' rel='noreferrer' className='block rounded-lg border border-[#E8EDF5] bg-[#F8FBFF] px-3 py-2 text-sm text-blue-700 hover:underline'>
                  {editingThread.videoMeeting.url}
                </a>
              </div>
            )}
            <div className='space-y-2'>
              <Label>Thời gian hiển thị</Label>
              <Input type='datetime-local' value={meetingForm.startsAt} onChange={(e) => setMeetingForm((prev) => ({ ...prev, startsAt: e.target.value }))} />
            </div>
            <div className='space-y-2'>
              <Label>Tiêu đề hiển thị</Label>
              <Input value={meetingForm.title} onChange={(e) => setMeetingForm((prev) => ({ ...prev, title: e.target.value }))} placeholder='Phòng thảo luận trực tuyến' />
            </div>
            <div className='space-y-2'>
              <Label>Ghi chú an toàn</Label>
              <Textarea value={meetingForm.note} onChange={(e) => setMeetingForm((prev) => ({ ...prev, note: e.target.value }))} rows={3} placeholder='Không chia sẻ thông tin cá nhân nhạy cảm...' />
            </div>
          </div>
          <DialogFooter>
            {editingThread?.videoMeeting?.url && <Button variant='outline' className='mr-auto text-rose-600' onClick={() => removeThreadMeeting.mutate()} disabled={removeThreadMeeting.isPending}>Gỡ khỏi thread</Button>}
            <Button variant='outline' onClick={() => setMeetingDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => saveThreadMeeting.mutate()} disabled={saveThreadMeeting.isPending} className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'>Lưu phòng video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{ backgroundImage: 'linear-gradient(to right, #0A2463, #1E40AF)' }}
          >
            Quản lý cộng đồng
          </h1>
          <p className='text-gray-600 mt-1'>Tạo phòng, quản lý thành viên và xử lý yêu cầu tham gia.</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' className='border-[#BFDBFE] gap-2' onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white gap-2' onClick={openCreate}>
            <Plus className='w-4 h-4' />
            Tạo phòng
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start'>
        <Card className='bg-white border-[#E8EDF5] xl:col-span-1 xl:max-h-[calc(100vh-180px)]'>
          <CardContent className='flex min-h-0 flex-col gap-3 p-4 xl:max-h-[calc(100vh-180px)]'>
            <div className='space-y-3'>
              <div className='relative'>
                <Search className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
                <Input
                  className='pl-9'
                  placeholder='Tìm tên, slug, nhãn chủ đề'
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <Select value={visibilityFilter} onValueChange={(value: 'all' | 'public' | 'private') => setVisibilityFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Mọi hiển thị</SelectItem>
                    <SelectItem value='public'>Công khai</SelectItem>
                    <SelectItem value='private'>Riêng tư</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Mọi trạng thái</SelectItem>
                    <SelectItem value='active'>Đang hoạt động</SelectItem>
                    <SelectItem value='archived'>Lưu trữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
              {isLoading ? (
                <div className='text-sm text-gray-500 py-6 text-center'>Đang tải...</div>
              ) : filteredRooms.length === 0 ? (
                <div className='text-sm text-gray-500 py-6 text-center'>Không có phòng phù hợp</div>
              ) : (
                <div className='space-y-3'>
                  {filteredRooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() => setSelectedRoomId(room._id)}
                      className={`w-full text-left rounded-lg border p-4 transition ${
                        selectedRoom?._id === room._id ? 'border-blue-400 bg-[#F0F6FF]' : 'border-[#E8EDF5] hover:bg-[#F0F6FF]'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p className='font-semibold text-gray-900 line-clamp-1'>{room.name}</p>
                          <p className='text-xs text-gray-500'>#{room.slug}</p>
                        </div>
                        <Badge className={room.status === 'archived' ? 'bg-gray-100 text-gray-700' : 'bg-[#E8EDF5] text-[#0A2463]'}>
                          {room.status === 'archived' ? 'archived' : room.visibility}
                        </Badge>
                      </div>
                      <div className='flex flex-wrap gap-3 text-xs text-gray-500 mt-3'>
                        <span>{room.memberCount || 0} thành viên</span>
                        {room.visibility === 'private' && (room.pendingMemberCount || 0) > 0 && (
                          <span className='font-semibold text-amber-700'>{room.pendingMemberCount} chờ duyệt</span>
                        )}
                        <span>{room.messageCount || 0} tin nhắn</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-[#E8EDF5] xl:col-span-2 xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto'>
          <CardContent className='p-5'>
            {!selectedRoom ? (
              <div className='text-center text-gray-500 py-12'>Chọn một phòng để quản lý</div>
            ) : (
              <Tabs defaultValue='info'>
                <div className='flex items-center justify-between gap-3 mb-4'>
                  <TabsList>
                    <TabsTrigger value='info'>Thông tin</TabsTrigger>
                    <TabsTrigger value='members'>Thành viên</TabsTrigger>
                    <TabsTrigger value='threads'>Threads</TabsTrigger>
                  </TabsList>
                  <div className='flex gap-2'>
                    <Button variant='outline' className='border-[#BFDBFE] gap-2' onClick={() => openEdit(selectedRoom)}>
                      <Edit className='w-4 h-4' />
                      Sửa
                    </Button>
                    <Button variant='outline' className='border-orange-200 text-orange-600 gap-2' onClick={() => archiveRoom.mutate(selectedRoom)}>
                      <Archive className='w-4 h-4' />
                      {selectedRoom.status === 'archived' ? 'Mở lại' : 'Lưu trữ'}
                    </Button>
                  </div>
                </div>

                <TabsContent value='info' className='space-y-4'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <div className='rounded-lg bg-[#F0F6FF] p-4'>
                      <p className='text-xs text-gray-500'>Hiển thị</p>
                      <p className='font-semibold flex items-center gap-1'>
                        {selectedRoom.visibility === 'private' && <Lock className='w-4 h-4' />}
                        {selectedRoom.visibility}
                      </p>
                    </div>
                    <div className='rounded-lg bg-[#F0F6FF] p-4'>
                      <p className='text-xs text-gray-500'>Thành viên</p>
                      <p className='font-semibold'>{selectedRoom.memberCount || 0}</p>
                    </div>
                    <div className='rounded-lg bg-[#F0F6FF] p-4'>
                      <p className='text-xs text-gray-500'>Tin nhắn</p>
                      <p className='font-semibold'>{selectedRoom.messageCount || 0}</p>
                    </div>
                    <div className='rounded-lg bg-amber-50 p-4'>
                      <p className='text-xs text-amber-700'>Chờ duyệt</p>
                      <p className='font-semibold text-amber-800'>{selectedRoom.pendingMemberCount || 0}</p>
                    </div>
                  </div>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='rounded-lg border border-[#E8EDF5] p-4'>
                      <p className='text-xs text-gray-500'>Mô tả hiển thị</p>
                      <p className='mt-1 text-sm text-gray-700'>{selectedRoom.description || 'Chưa có mô tả'}</p>
                    </div>
                    <div className='rounded-lg border border-[#E8EDF5] p-4'>
                      <p className='text-xs text-gray-500'>Community Hub</p>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        <Badge className={selectedRoom.featured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                          {selectedRoom.featured ? 'Đang đề xuất' : 'Không đề xuất'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className='rounded-lg border border-[#E8EDF5] p-4'>
                    <p className='text-xs text-gray-500'>Quy tắc phòng</p>
                    {(selectedRoom.guidelines || []).length ? (
                      <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700'>
                        {selectedRoom.guidelines?.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : (
                      <p className='mt-1 text-sm text-gray-500'>Chưa có quy tắc riêng.</p>
                    )}
                  </div>
                  {selectedRoom.pinnedMessage && <p className='rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800'>Ghim: {selectedRoom.pinnedMessage}</p>}
                  <p className='text-sm text-gray-600'>Tin mới nhất: {communityPreviewText(selectedRoom.lastMessagePreview, 'Chưa có')}</p>
                </TabsContent>

                <TabsContent value='members' className='space-y-4'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Email thành viên cần mời'
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button
                      className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white gap-2'
                      disabled={!inviteEmail.trim() || inviteMember.isPending}
                      onClick={() => inviteMember.mutate()}
                    >
                      <Send className='w-4 h-4' />
                      Mời
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thành viên</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead className='text-right'>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(membersData?.items || []).map((member) => (
                        <TableRow key={`${member.roomId}-${member.userId}`}>
                          <TableCell>
                            <div className='font-medium'>{displayName(member)}</div>
                            <div className='text-xs text-gray-500'>{member.user?.email || member.userId}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className='bg-[#E8EDF5] text-[#0A2463]'>{member.status}</Badge>
                          </TableCell>
                          <TableCell>{member.role || 'member'}</TableCell>
                          <TableCell className='text-right space-x-2'>
                            {member.status === 'pending' && (
                              <Button size='sm' variant='outline' onClick={() => updateMember.mutate({ member, status: 'active' })}>
                                <CheckCircle className='w-4 h-4 mr-1' />
                                Duyệt
                              </Button>
                            )}
                            {member.status === 'banned' ? (
                              <Button size='sm' variant='outline' onClick={() => updateMember.mutate({ member, status: 'left' })}>
                                Mở ban
                              </Button>
                            ) : (
                              <Button size='sm' variant='outline' className='text-red-600' onClick={() => updateMember.mutate({ member, status: 'banned' })}>
                                Ban
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                updateMember.mutate({
                                  member,
                                  mutedUntil: member.mutedUntil ? null : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                                })
                              }
                            >
                              {member.mutedUntil ? 'Unmute' : 'Mute'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(membersData?.items || []).length === 0 && (
                    <div className='text-sm text-gray-500 text-center py-8'>
                      <Users className='w-8 h-8 mx-auto mb-2 text-blue-400' />
                      Chưa có thành viên
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='threads' className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='relative flex-1'>
                      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                      <Input className='pl-9' placeholder='Tìm thread để gắn phòng video' value={threadSearch} onChange={(e) => setThreadSearch(e.target.value)} />
                    </div>
                    <Badge className='bg-[#E8EDF5] text-[#0A2463]'>{threadsData?.total || 0} thread</Badge>
                  </div>
                  <div className='overflow-hidden rounded-lg border border-[#E8EDF5]'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thread</TableHead>
                          <TableHead>Video</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className='text-right'>Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(threadsData?.items || []).map((thread) => (
                          <TableRow key={thread._id}>
                            <TableCell>
                              <div className='font-medium text-gray-900'>{thread.title}</div>
                              <div className='text-xs text-gray-500'>{thread.replyCount || 0} reply · {thread.viewCount || 0} lượt xem</div>
                            </TableCell>
                            <TableCell>
                              {thread.videoMeeting?.url ? (
                                <div className='space-y-1'>
                                  <Badge className='bg-blue-100 text-[#0A2463]'>
                                    <Video className='mr-1 h-3 w-3' />
                                    Có phòng video
                                  </Badge>
                                  <a href={thread.videoMeeting.url} target='_blank' rel='noreferrer' className='flex items-center gap-1 text-xs text-blue-700 hover:underline'>
                                    Mở link <ExternalLink className='h-3 w-3' />
                                  </a>
                                </div>
                              ) : (
                                <span className='text-sm text-gray-500'>Chưa gắn</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant='outline'>{thread.status}</Badge>
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button size='sm' variant='outline' className='border-[#BFDBFE]' onClick={() => openMeetingDialog(thread)}>
                                <Video className='mr-1 h-4 w-4' />
                                Quản lý video
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {isFetchingThreads && <div className='border-t border-[#E8EDF5] p-3 text-center text-sm text-gray-500'>Đang tải threads...</div>}
                    {!isFetchingThreads && (threadsData?.items || []).length === 0 && <div className='p-8 text-center text-sm text-gray-500'>Chưa có thread phù hợp</div>}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminCommunityPage
