import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, CheckCircle, Edit, Lock, Plus, RefreshCw, Search, Send, Users } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { adminCommunityService } from '~/services/communityService'
import type { CommunityMember, CommunityRoom } from '~/types/community'

const emptyForm = { name: '', slug: '', visibility: 'public' as 'public' | 'private', diseaseKey: '' }

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

  const { data: rooms = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-community-rooms', visibilityFilter, statusFilter],
    queryFn: () =>
      adminCommunityService.listRooms({
        visibility: visibilityFilter === 'all' ? undefined : visibilityFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  const filteredRooms = useMemo(() => {
    const needle = roomSearch.trim().toLowerCase()
    if (!needle) return rooms
    return rooms.filter((room) =>
      [room.name, room.slug, room.diseaseKey].some((value) => value?.toLowerCase().includes(needle)),
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

  const saveRoom = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        visibility: form.visibility,
        diseaseKey: form.diseaseKey.trim() || undefined,
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
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể lưu phòng'),
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
      diseaseKey: room.diseaseKey || '',
    })
    setDialogOpen(true)
  }

  return (
    <div className='space-y-6'>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
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
              <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
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
                <Label>Nhóm bệnh</Label>
                <Input
                  value={form.diseaseKey}
                  onChange={(e) => setForm((prev) => ({ ...prev, diseaseKey: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
              disabled={!form.name.trim() || saveRoom.isPending}
              onClick={() => saveRoom.mutate()}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{ backgroundImage: 'linear-gradient(to right, #0066CC, #4A90E2)' }}
          >
            Quản lý cộng đồng
          </h1>
          <p className='text-gray-600 mt-1'>Tạo phòng, quản lý thành viên và xử lý yêu cầu tham gia.</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' className='border-blue-200 gap-2' onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white gap-2' onClick={openCreate}>
            <Plus className='w-4 h-4' />
            Tạo phòng
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <Card className='xl:col-span-1 bg-white border-blue-100'>
          <CardContent className='p-4 space-y-3'>
            <div className='space-y-3'>
              <div className='relative'>
                <Search className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
                <Input
                  className='pl-9'
                  placeholder='Tìm tên, slug, nhóm bệnh'
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
            {isLoading ? (
              <div className='text-sm text-gray-500 py-6 text-center'>Đang tải...</div>
            ) : filteredRooms.length === 0 ? (
              <div className='text-sm text-gray-500 py-6 text-center'>Không có phòng phù hợp</div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => setSelectedRoomId(room._id)}
                  className={`w-full text-left rounded-lg border p-4 transition ${
                    selectedRoom?._id === room._id ? 'border-blue-400 bg-blue-50' : 'border-blue-100 hover:bg-blue-50'
                  }`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='font-semibold text-gray-900 line-clamp-1'>{room.name}</p>
                      <p className='text-xs text-gray-500'>#{room.slug}</p>
                    </div>
                    <Badge className={room.status === 'archived' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}>
                      {room.status === 'archived' ? 'archived' : room.visibility}
                    </Badge>
                  </div>
                  <div className='flex gap-3 text-xs text-gray-500 mt-3'>
                    <span>{room.memberCount || 0} thành viên</span>
                    <span>{room.messageCount || 0} tin nhắn</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className='xl:col-span-2 bg-white border-blue-100'>
          <CardContent className='p-5'>
            {!selectedRoom ? (
              <div className='text-center text-gray-500 py-12'>Chọn một phòng để quản lý</div>
            ) : (
              <Tabs defaultValue='info'>
                <div className='flex items-center justify-between gap-3 mb-4'>
                  <TabsList>
                    <TabsTrigger value='info'>Thông tin</TabsTrigger>
                    <TabsTrigger value='members'>Thành viên</TabsTrigger>
                  </TabsList>
                  <div className='flex gap-2'>
                    <Button variant='outline' className='border-blue-200 gap-2' onClick={() => openEdit(selectedRoom)}>
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
                    <div className='rounded-lg bg-blue-50 p-4'>
                      <p className='text-xs text-gray-500'>Hiển thị</p>
                      <p className='font-semibold flex items-center gap-1'>
                        {selectedRoom.visibility === 'private' && <Lock className='w-4 h-4' />}
                        {selectedRoom.visibility}
                      </p>
                    </div>
                    <div className='rounded-lg bg-blue-50 p-4'>
                      <p className='text-xs text-gray-500'>Thành viên</p>
                      <p className='font-semibold'>{selectedRoom.memberCount || 0}</p>
                    </div>
                    <div className='rounded-lg bg-blue-50 p-4'>
                      <p className='text-xs text-gray-500'>Tin nhắn</p>
                      <p className='font-semibold'>{selectedRoom.messageCount || 0}</p>
                    </div>
                    <div className='rounded-lg bg-blue-50 p-4'>
                      <p className='text-xs text-gray-500'>Nhóm bệnh</p>
                      <p className='font-semibold'>{selectedRoom.diseaseKey || '-'}</p>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600'>Tin mới nhất: {selectedRoom.lastMessagePreview || 'Chưa có'}</p>
                </TabsContent>

                <TabsContent value='members' className='space-y-4'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Email thành viên cần mời'
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button
                      className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white gap-2'
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
                            <Badge className='bg-blue-100 text-blue-700'>{member.status}</Badge>
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
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminCommunityPage
