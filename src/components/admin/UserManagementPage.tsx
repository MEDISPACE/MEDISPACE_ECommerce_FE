import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  Shield,
  Stethoscope,
  User,
  RefreshCw,
  Edit,
  Eye,
  Ban,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import adminService from '~/services/adminService'
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

// Role mapping
const ROLE_MAP: Record<number, string> = {
  0: 'customer',
  1: 'pharmacist',
  2: 'admin',
}

const ROLE_REVERSE_MAP: Record<string, number> = {
  customer: 0,
  pharmacist: 1,
  admin: 2,
}

// Status mapping
const STATUS_MAP: Record<number, string> = {
  0: 'unverified',
  1: 'verified',
  2: 'banned',
}

export function UserManagementPage() {
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
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
      setPage(1) // Reset to page 1 when searching
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users with React Query
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery<UsersResponse>({
    queryKey: ['admin', 'users', page, limit, filterRole, filterStatus, debouncedSearch],
    queryFn: async () => {
      const response = await adminService.getAllUsers({
        page,
        limit,
        role: filterRole === 'all' ? undefined : String(ROLE_REVERSE_MAP[filterRole]),
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: debouncedSearch || undefined,
      })
      return response as UsersResponse
    },
  })

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: adminService.getUserStats,
  })

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Đã xóa người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => {
      toast.error('Không thể xóa người dùng')
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
      toast.success('Đã xác thực email người dùng')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => {
      toast.error('Không thể xác thực email')
    },
  })

  // Update user mutation (for ban/unban and edit)
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => adminService.updateUser(userId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin người dùng')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => {
      toast.error('Không thể cập nhật thông tin')
    },
  })

  // Handlers
  const handleDelete = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa người dùng',
      description: 'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.',
      onConfirm: () => deleteMutation.mutate(userId),
      variant: 'destructive',
    })
  }

  const handleResetPassword = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Reset mật khẩu',
      description: 'Bạn có chắc chắn muốn reset mật khẩu người dùng này? Mật khẩu mới sẽ được tạo tự động.',
      onConfirm: () => resetPasswordMutation.mutate(userId),
    })
  }

  const handleVerifyEmail = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xác thực email',
      description: 'Bạn có chắc chắn muốn xác thực email người dùng này?',
      onConfirm: () => verifyEmailMutation.mutate(userId),
    })
  }

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (user: UserData) => {
    setSelectedUser(user)
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedUser) return

    updateMutation.mutate(
      {
        userId: selectedUser._id,
        data: editFormData,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          setSelectedUser(null)
        },
      },
    )
  }

  const handleToggleBan = (user: UserData) => {
    const newStatus = user.status === 2 ? 1 : 2
    const action = newStatus === 2 ? 'khóa' : 'mở khóa'

    setConfirmDialog({
      open: true,
      title: newStatus === 2 ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      description: `Bạn có chắc chắn muốn ${action} tài khoản người dùng này?`,
      onConfirm: () =>
        updateMutation.mutate({
          userId: user._id,
          data: { status: newStatus },
        }),
      variant: newStatus === 2 ? 'destructive' : 'default',
    })
  }

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'stats'] })
  }

  // Helper functions

  const getRoleBadge = (role: number) => {
    const roleStr = ROLE_MAP[role] || 'unknown'
    const colors: Record<string, string> = {
      customer: 'bg-gray-100 text-gray-700',
      pharmacist: 'bg-blue-100 text-blue-700',
      admin: 'bg-purple-100 text-purple-700',
    }
    const labels: Record<string, string> = {
      customer: 'Khách hàng',
      pharmacist: 'Dược sĩ',
      admin: 'Admin',
    }
    return <Badge className={colors[roleStr] || 'bg-gray-100 text-gray-700'}>{labels[roleStr] || roleStr}</Badge>
  }

  const getStatusBadge = (status: number) => {
    const statusStr = STATUS_MAP[status] || 'unknown'
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      unverified: 'bg-yellow-100 text-yellow-700',
      banned: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      verified: 'Đã xác thực',
      unverified: 'Chưa xác thực',
      banned: 'Đã khóa',
    }
    return <Badge className={colors[statusStr] || 'bg-gray-100 text-gray-700'}>{labels[statusStr] || statusStr}</Badge>
  }

  const users = usersData?.result?.users || []
  const pagination = usersData?.result?.pagination || { page: 1, totalPages: 1, total: 0 }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066CC] to-[#4A90E2]'>
            Quản lý người dùng
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            className='!border-blue-300 !text-blue-600 hover:!bg-blue-50 !gap-2'
            onClick={handleRefresh}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          {/* <Button variant='outline' className='gap-2'>
            <Upload className='w-4 h-4' />
            Import
          </Button> */}
          {/* <Button variant='outline' className='gap-2'>
            <Download className='w-4 h-4' />
            Export
          </Button> */}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
          <Card className='bg-white backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Tổng số</p>
                  <p className='text-2xl font-semibold text-blue-600'>{stats.total}</p>
                </div>
                <Users className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Khách hàng</p>
                  <p className='text-2xl font-semibold text-gray-700'>{stats.customers}</p>
                </div>
                <User className='w-8 h-8 text-gray-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Dược sĩ</p>
                  <p className='text-2xl font-semibold text-blue-600'>{stats.pharmacists}</p>
                </div>
                <Stethoscope className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Admin</p>
                  <p className='text-2xl font-semibold text-[#0066CC]'>{stats.admins}</p>
                </div>
                <Shield className='w-8 h-8 text-[#4A90E2]' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

          <Card className='bg-white backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đã xác thực</p>
                  <p className='text-2xl font-semibold text-blue-600'>{stats.verified}</p>
                </div>
                <CheckCircle className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo tên, email, số điện thoại...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className='w-48 border-2 border-blue-200'>
                <SelectValue placeholder='Vai trò' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả vai trò</SelectItem>
                <SelectItem value='customer'>Khách hàng</SelectItem>
                <SelectItem value='pharmacist'>Dược sĩ</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-48 border-2 border-blue-200'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='1'>Đã xác thực</SelectItem>
                <SelectItem value='0'>Chưa xác thực</SelectItem>
                <SelectItem value='2'>Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5 text-blue-600' />
            Danh sách người dùng ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <RefreshCw className='w-8 h-8 animate-spin text-blue-600' />
            </div>
          ) : error ? (
            <div className='text-center text-red-600 py-8'>Không thể tải danh sách người dùng. Vui lòng thử lại.</div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader className='border-b-2 border-blue-300'>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      <TableHead className='text-right'>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: UserData) => (
                      <TableRow key={user._id} className='border-b border-blue-200 hover:bg-blue-50/30'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarFallback className='bg-blue-100 text-blue-700'>
                                {user.firstName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium text-gray-900'>
                                {user.firstName} {user.lastName}
                              </p>
                              <p className='text-sm text-gray-500'>{user._id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className='text-sm text-gray-900'>{user.email}</p>
                            <p className='text-sm text-gray-500'>{user.phoneNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <p className='text-sm text-gray-900'>
                            {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreVertical className='w-4 h-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='bg-white shadow-lg border-2 border-blue-200'>
                              <DropdownMenuLabel className='text-blue-700'>Thao tác</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='hover:!bg-blue-100 hover:!border-blue-100 hover:!text-blue-700'
                                onClick={() => handleViewDetails(user)}
                              >
                                <Eye className='w-4 h-4 mr-2' />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='hover:!bg-blue-100 hover:!border-blue-100 hover:!text-blue-700'
                                onClick={() => handleEdit(user)}
                              >
                                <Edit className='w-4 h-4 mr-2' />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='hover:!bg-blue-100 hover:!border-blue-100 hover:!text-blue-700'
                                onClick={() => handleVerifyEmail(user._id)}
                              >
                                <CheckCircle className='w-4 h-4 mr-2' />
                                Xác thực email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='hover:!bg-blue-100 hover:!border-blue-100 hover:!text-blue-700'
                                onClick={() => handleResetPassword(user._id)}
                              >
                                <RefreshCw className='w-4 h-4 mr-2' />
                                Reset mật khẩu
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className='hover:!bg-blue-100 hover:!border-blue-100 hover:!text-blue-700'
                                onClick={() => handleToggleBan(user)}
                              >
                                <Ban className='w-4 h-4 mr-2' />
                                {user.status === 2 ? 'Mở khóa' : 'Khóa tài khoản'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(user._id)}
                                className='text-red-600 hover:!bg-red-100 hover:!border-red-100 hover:!text-red-700'
                              >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Xóa người dùng
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
                <div className='flex items-center justify-between mt-4 pt-4 border-t border-blue-300'>
                  <p className='text-sm text-gray-600'>
                    Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} của{' '}
                    {pagination.total} người dùng
                  </p>
                  <PaginationComponent currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Thông tin người dùng</DialogTitle>
            <DialogDescription>Chi tiết thông tin người dùng trong hệ thống</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Họ và tên</p>
                  <p className='text-base font-semibold'>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Vai trò</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Trạng thái</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Email</p>
                  <p className='text-base'>{selectedUser.email}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Số điện thoại</p>
                  <p className='text-base'>{selectedUser.phoneNumber}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Ngày tham gia</p>
                  <p className='text-base'>
                    {selectedUser.createdAt
                      ? format(new Date(selectedUser.createdAt), 'dd/MM/yyyy HH:mm', {
                          locale: vi,
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>ID</p>
                  <p className='text-base font-mono text-sm'>{selectedUser._id}</p>
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
            <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
            <DialogDescription>Cập nhật thông tin người dùng trong hệ thống</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Họ</label>
                <Input
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  placeholder='Nhập họ'
                  className='border-2 border-blue-200'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tên</label>
                <Input
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  placeholder='Nhập tên'
                  className='border-2 border-blue-200'
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
                className='border-2 border-blue-200'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Số điện thoại</label>
              <Input
                type='tel'
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                placeholder='0123456789'
                className='border-2 border-blue-200'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveEdit}
                className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2]'
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
