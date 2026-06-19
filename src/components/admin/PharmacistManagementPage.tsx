import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope,
  Search,
  CheckCircle,
  Award,
  Calendar,
  FileText,
  RefreshCw,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Ban,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import adminService, { type PharmacistStats } from '~/services/adminService'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { PaginationComponent } from '../shared/PaginationComponent'

// Type definitions
interface UserData {
  _id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role: number
  status: number
  createdAt?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UsersResponse {
  result: {
    users: UserData[]
    pagination: PaginationData
  }
}

interface ResetPasswordResponse {
  newPassword: string
  message: string
}

// Status mapping
const STATUS_MAP: Record<number, string> = {
  0: 'unverified',
  1: 'verified',
  2: 'banned',
}

export function PharmacistManagementPage() {
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPharmacist, setSelectedPharmacist] = useState<UserData | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  })

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive'
  }>({ open: false, title: '', description: '', onConfirm: () => {}, variant: 'default' })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch pharmacists (users with role=1)
  const {
    data: pharmacistsData,
    isLoading,
    error,
    refetch,
  } = useQuery<UsersResponse>({
    queryKey: ['admin', 'pharmacists', page, limit, filterStatus, debouncedSearch],
    queryFn: async () => {
      const response = await adminService.getAllUsers({
        page,
        limit,
        role: '1', // Pharmacist role
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: debouncedSearch || undefined,
      })
      return response as UsersResponse
    },
  })
  const { data: stats } = useQuery<PharmacistStats>({
    queryKey: ['admin', 'pharmacists', 'stats'],
    queryFn: adminService.getPharmacistStats,
  })

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Đã xóa dược sĩ thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'pharmacists'] })
    },
    onError: () => {
      toast.error('Không thể xóa dược sĩ')
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation<ResetPasswordResponse, Error, string>({
    mutationFn: async (userId: string) => {
      const response = await adminService.resetUserPassword(userId)
      return response as ResetPasswordResponse
    },
    onSuccess: (data: ResetPasswordResponse) => {
      toast.success(`Đã reset mật khẩu. Mật khẩu mới: ${data.newPassword}`)
    },
    onError: () => {
      toast.error('Không thể reset mật khẩu')
    },
  })

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (userId: string) => adminService.verifyUserEmail(userId),
    onSuccess: () => {
      toast.success('Đã xác thực email dược sĩ')
      queryClient.invalidateQueries({ queryKey: ['admin', 'pharmacists'] })
    },
    onError: () => {
      toast.error('Không thể xác thực email')
    },
  })

  // Update user mutation (for ban/unban)
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => adminService.updateUser(userId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin dược sĩ')
      queryClient.invalidateQueries({ queryKey: ['admin', 'pharmacists'] })
    },
    onError: () => {
      toast.error('Không thể cập nhật thông tin')
    },
  })

  // Handlers
  const handleDelete = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa dược sĩ',
      description: 'Bạn có chắc chắn muốn xóa dược sĩ này? Hành động này không thể hoàn tác.',
      onConfirm: () => deleteMutation.mutate(userId),
      variant: 'destructive',
    })
  }

  const handleResetPassword = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Reset mật khẩu',
      description: 'Bạn có chắc chắn muốn reset mật khẩu dược sĩ này? Mật khẩu mới sẽ được tạo tự động.',
      onConfirm: () => resetPasswordMutation.mutate(userId),
    })
  }

  const handleVerifyEmail = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xác thực email',
      description: 'Bạn có chắc chắn muốn xác thực email dược sĩ này?',
      onConfirm: () => verifyEmailMutation.mutate(userId),
    })
  }

  const handleViewDetails = (pharmacist: UserData) => {
    setSelectedPharmacist(pharmacist)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (pharmacist: UserData) => {
    setSelectedPharmacist(pharmacist)
    setEditFormData({
      firstName: pharmacist.firstName,
      lastName: pharmacist.lastName,
      email: pharmacist.email,
      phoneNumber: pharmacist.phoneNumber,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedPharmacist) return

    updateMutation.mutate(
      {
        userId: selectedPharmacist._id,
        data: editFormData,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          setSelectedPharmacist(null)
        },
      },
    )
  }

  const handleToggleBan = (pharmacist: UserData) => {
    const newStatus = pharmacist.status === 2 ? 1 : 2 // Toggle between banned (2) and verified (1)
    const action = newStatus === 2 ? 'khóa' : 'mở khóa'

    setConfirmDialog({
      open: true,
      title: newStatus === 2 ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      description: `Bạn có chắc chắn muốn ${action} tài khoản dược sĩ này?`,
      onConfirm: () =>
        updateMutation.mutate({
          userId: pharmacist._id,
          data: { status: newStatus },
        }),
      variant: newStatus === 2 ? 'destructive' : 'default',
    })
  }

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['admin', 'pharmacists', 'stats'] })
  }

  // Helper functions
  const getStatusBadge = (status: number) => {
    const statusStr = STATUS_MAP[status] || 'unknown'
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      unverified: 'bg-yellow-100 text-yellow-700',
      banned: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      verified: 'Hoạt động',
      unverified: 'Chưa xác thực',
      banned: 'Đã khóa',
    }
    return <Badge className={colors[statusStr] || 'bg-gray-100 text-gray-700'}>{labels[statusStr] || statusStr}</Badge>
  }

  const pharmacists = pharmacistsData?.result?.users || []
  const pagination = pharmacistsData?.result?.pagination || { page: 1, totalPages: 1, total: 0 }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0A2463] to-[#1E40AF]'>
            Quản lý dược sĩ
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý đội ngũ dược sĩ tư vấn</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' className='gap-2' onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4'>
          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Tổng số</p>
                  <p className='text-2xl font-semibold text-[#1E40AF]'>{stats.total}</p>
                </div>
                <Stethoscope className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Hoạt động</p>
                  <p className='text-2xl font-semibold text-green-600'>{stats.active}</p>
                </div>
                <CheckCircle className='w-8 h-8 text-green-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đã xác thực</p>
                  <p className='text-2xl font-semibold text-[#1E40AF]'>{stats.verified}</p>
                </div>
                <Award className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Nghỉ phép</p>
                  <p className='text-2xl font-semibold text-yellow-600'>{stats.onLeave}</p>
                </div>
                <Calendar className='w-8 h-8 text-yellow-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đơn xử lý</p>
                  <p className='text-xl font-semibold text-[#1E40AF]'>{stats.totalPrescriptions}</p>
                </div>
                <FileText className='w-8 h-8 text-[#1E40AF]' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Tư vấn</p>
                  <p className='text-xl font-semibold text-[#1E40AF]'>{stats.totalConsultations}</p>
                </div>
                <Stethoscope className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đánh giá TB</p>
                  <p className='text-2xl font-semibold text-yellow-600'>{stats.avgRating}⭐</p>
                </div>
                <Award className='w-8 h-8 text-yellow-400' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm dược sĩ...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-48 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='1'>Hoạt động</SelectItem>
                <SelectItem value='0'>Chưa xác thực</SelectItem>
                <SelectItem value='2'>Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacists Table */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Stethoscope className='w-5 h-5 text-[#1E40AF]' />
            Danh sách dược sĩ ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <RefreshCw className='w-8 h-8 animate-spin text-[#1E40AF]' />
            </div>
          ) : error ? (
            <div className='text-center text-red-600 py-8'>Không thể tải danh sách dược sĩ. Vui lòng thử lại.</div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='!border-b-2 !border-[#BFDBFE]'>
                      <TableHead>Dược sĩ</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      <TableHead className='text-right'>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacists.map((pharmacist: UserData) => (
                      <TableRow key={pharmacist._id} className='border-b-2 border-[#BFDBFE] hover:bg-[#F0F6FF]/30'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarFallback className='bg-[#E8EDF5] text-[#0A2463]'>
                                {pharmacist.firstName?.charAt(0) || 'D'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium text-gray-900'>
                                DS. {pharmacist.firstName} {pharmacist.lastName}
                              </p>
                              <p className='text-sm text-gray-500'>{pharmacist._id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className='text-sm text-gray-900'>{pharmacist.email}</p>
                            <p className='text-sm text-gray-500'>{pharmacist.phoneNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(pharmacist.status)}</TableCell>
                        <TableCell>
                          <p className='text-sm text-gray-900'>
                            {pharmacist.createdAt
                              ? format(new Date(pharmacist.createdAt), 'dd/MM/yyyy', { locale: vi })
                              : 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreVertical className='w-4 h-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='bg-white shadow-lg border-2 border-[#BFDBFE]'>
                              <DropdownMenuLabel className='text-[#0A2463]'>Thao tác</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:!text-[#0A2463]'
                                onClick={() => handleViewDetails(pharmacist)}
                              >
                                <Eye className='w-4 h-4 mr-2' />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:!text-[#0A2463]'
                                onClick={() => handleEdit(pharmacist)}
                              >
                                <Edit className='w-4 h-4 mr-2' />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:!text-[#0A2463]'
                                onClick={() => handleVerifyEmail(pharmacist._id)}
                              >
                                <CheckCircle className='w-4 h-4 mr-2' />
                                Xác thực email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:!text-[#0A2463]'
                                onClick={() => handleResetPassword(pharmacist._id)}
                              >
                                <RefreshCw className='w-4 h-4 mr-2' />
                                Reset mật khẩu
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:!text-[#0A2463]'
                                onClick={() => handleToggleBan(pharmacist)}
                              >
                                <Ban className='w-4 h-4 mr-2' />
                                {pharmacist.status === 2 ? 'Mở khóa' : 'Khóa tài khoản'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-red-600 hover:!bg-red-100 hover:!border-red-100 hover:!text-red-700'
                                onClick={() => handleDelete(pharmacist._id)}
                              >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Xóa dược sĩ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between mt-4 pt-4 border-t border-[#BFDBFE]'>
                  <p className='text-sm text-gray-600'>
                    Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} của{' '}
                    {pagination.total} dược sĩ
                  </p>
                  <PaginationComponent currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Thông tin dược sĩ</DialogTitle>
            <DialogDescription>Chi tiết thông tin dược sĩ trong hệ thống</DialogDescription>
          </DialogHeader>
          {selectedPharmacist && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Họ và tên</p>
                  <p className='text-base font-semibold'>
                    DS. {selectedPharmacist.firstName} {selectedPharmacist.lastName}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Trạng thái</p>
                  {getStatusBadge(selectedPharmacist.status)}
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Email</p>
                  <p className='text-base'>{selectedPharmacist.email}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Số điện thoại</p>
                  <p className='text-base'>{selectedPharmacist.phoneNumber}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Ngày tham gia</p>
                  <p className='text-base'>
                    {selectedPharmacist.createdAt
                      ? format(new Date(selectedPharmacist.createdAt), 'dd/MM/yyyy HH:mm', {
                          locale: vi,
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>ID</p>
                  <p className='text-base font-mono text-sm'>{selectedPharmacist._id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin dược sĩ</DialogTitle>
            <DialogDescription>Cập nhật thông tin dược sĩ trong hệ thống</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Họ</label>
                <Input
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  placeholder='Nhập họ'
                  className='border-2 border-[#BFDBFE]'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tên</label>
                <Input
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  placeholder='Nhập tên'
                  className='border-2 border-[#BFDBFE]'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Email</label>
              <Input
                type='email'
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder='email@example.com'
                className='border-2 border-[#BFDBFE]'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Số điện thoại</label>
              <Input
                type='tel'
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                placeholder='0123456789'
                className='border-2 border-[#BFDBFE]'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveEdit}
                className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF]'
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </div>
  )
}
