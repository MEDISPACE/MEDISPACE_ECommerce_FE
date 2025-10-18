import { useState } from 'react'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  Stethoscope,
  User,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useEntityManagement } from '../../utils/useEntityManagement'
import { EntityFormDialog, EntityDeleteDialog } from '../shared/EntityFormDialog'
import { TextField, SelectField, FormGrid, FormSection } from '../shared/EntityFormFields'
import { getRoleBadge, getStatusBadge, getVerificationBadge } from '../../utils/badgeUtils'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'customer' | 'pharmacist' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  verified: boolean
  joinDate: string
  lastActive: string
  avatar?: string
  totalOrders?: number
  totalSpent?: number
}

const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@example.com',
    phone: '0901234567',
    role: 'customer',
    status: 'active',
    verified: true,
    joinDate: '2024-01-15',
    lastActive: '2025-01-09',
    totalOrders: 12,
    totalSpent: 2450000,
  },
  {
    id: 'U002',
    name: 'Trần Thị Bình',
    email: 'tranthibinh@example.com',
    phone: '0912345678',
    role: 'customer',
    status: 'active',
    verified: true,
    joinDate: '2024-02-20',
    lastActive: '2025-01-08',
    totalOrders: 8,
    totalSpent: 1850000,
  },
  {
    id: 'U003',
    name: 'Lê Văn Cường',
    email: 'levancuong@example.com',
    phone: '0923456789',
    role: 'pharmacist',
    status: 'active',
    verified: true,
    joinDate: '2023-11-10',
    lastActive: '2025-01-09',
  },
  {
    id: 'U004',
    name: 'Phạm Thị Dung',
    email: 'phamthidung@example.com',
    phone: '0934567890',
    role: 'customer',
    status: 'inactive',
    verified: false,
    joinDate: '2024-12-01',
    lastActive: '2024-12-15',
    totalOrders: 1,
    totalSpent: 150000,
  },
  {
    id: 'U005',
    name: 'Hoàng Minh Tú',
    email: 'hoangminhtu@example.com',
    phone: '0945678901',
    role: 'admin',
    status: 'active',
    verified: true,
    joinDate: '2023-06-01',
    lastActive: '2025-01-09',
  },
  {
    id: 'U006',
    name: 'Võ Thị Hoa',
    email: 'vothihoa@example.com',
    phone: '0956789012',
    role: 'customer',
    status: 'suspended',
    verified: true,
    joinDate: '2024-03-15',
    lastActive: '2024-11-20',
    totalOrders: 15,
    totalSpent: 3200000,
  },
  {
    id: 'U007',
    name: 'Đặng Văn Giang',
    email: 'dangvangiang@example.com',
    phone: '0967890123',
    role: 'pharmacist',
    status: 'active',
    verified: true,
    joinDate: '2024-01-05',
    lastActive: '2025-01-09',
  },
  {
    id: 'U008',
    name: 'Bùi Thị Kim',
    email: 'buithikim@example.com',
    phone: '0978901234',
    role: 'customer',
    status: 'active',
    verified: true,
    joinDate: '2024-05-10',
    lastActive: '2025-01-07',
    totalOrders: 6,
    totalSpent: 980000,
  },
]

export function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Use entity management hook
  const {
    entities: users,
    formState,
    dialogState,
    openAddDialog,
    openDeleteDialog,
    closeDialog,
    handleAdd,
    handleEdit,
    handleDelete,
    updateFormData,
  } = useEntityManagement<User>({
    initialEntities: mockUsers,
    entityName: 'user',
    entityNameVi: 'người dùng',
    fields: [], // We'll handle form fields manually
    generateId: (): string => `U${String(mockUsers.length + 1).padStart(3, '0')}`,
    validator: (data: Partial<User>) => {
      const errors: Record<string, string> = {}
      if (!data.name) errors.name = 'Tên người dùng là bắt buộc'
      if (!data.email) errors.email = 'Email là bắt buộc'
      if (!data.phone) errors.phone = 'Số điện thoại là bắt buộc'
      return errors
    },
  })

  // Form save handlers
  const handleSaveAdd = () => {
    return handleAdd(formState.data)
  }

  const handleSaveEdit = () => {
    return handleEdit(formState.data)
  }

  const confirmDelete = () => {
    if (dialogState.entity) {
      return handleDelete(dialogState.entity.id)
    }
  }

  const stats = {
    total: users.length,
    customers: users.filter((u) => u.role === 'customer').length,
    pharmacists: users.filter((u) => u.role === 'pharmacist').length,
    admins: users.filter((u) => u.role === 'admin').length,
    active: users.filter((u) => u.status === 'active').length,
    verified: users.filter((u) => u.verified).length,
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
            Quản lý người dùng
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' className='gap-2'>
            <Upload className='w-4 h-4' />
            Import
          </Button>
          <Button variant='outline' className='gap-2'>
            <Download className='w-4 h-4' />
            Export
          </Button>
          <Button
            onClick={openAddDialog}
            className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2'
          >
            <Plus className='w-4 h-4' />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

      {/* Filters & Search */}
      <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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
                <SelectItem value='active'>Hoạt động</SelectItem>
                <SelectItem value='inactive'>Không hoạt động</SelectItem>
                <SelectItem value='suspended'>Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5 text-blue-600' />
            Danh sách người dùng ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Xác thực</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead>Hoạt động cuối</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className='bg-blue-100 text-blue-700'>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium text-gray-900'>{user.name}</p>
                          <p className='text-sm text-gray-500'>{user.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Mail className='w-3 h-3' />
                          {user.email}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Phone className='w-3 h-3' />
                          {user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role, { showIcon: false })}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getVerificationBadge(user.verified)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <Calendar className='w-3 h-3' />
                        {new Date(user.joinDate).toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm text-gray-600'>
                        {new Date(user.lastActive).toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreVertical className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className='w-4 h-4 mr-2' />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className='w-4 h-4 mr-2' />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(user)} className='text-red-600'>
                            <Trash2 className='w-4 h-4 mr-2' />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Sheet - Using reusable component */}
      <EntityFormDialog
        open={dialogState.isOpen && dialogState.mode === 'add'}
        onOpenChange={(open) => (open ? openAddDialog() : closeDialog())}
        mode='sheet'
        title='Thêm người dùng mới'
        description='Nhập thông tin để tạo tài khoản người dùng mới'
        onSave={handleSaveAdd}
        isEdit={false}
      >
        <FormSection title='Thông tin cơ bản'>
          <FormGrid cols={2}>
            <TextField
              label='Họ và tên'
              required
              value={formState.data.name || ''}
              onChange={(v) => updateFormData('name', v)}
              placeholder='Nguyễn Văn A'
            />
            <TextField
              label='Số điện thoại'
              type='tel'
              required
              value={formState.data.phone || ''}
              onChange={(v) => updateFormData('phone', v)}
              placeholder='0901234567'
            />
          </FormGrid>

          <TextField
            label='Email'
            type='email'
            required
            value={formState.data.email || ''}
            onChange={(v) => updateFormData('email', v)}
            placeholder='example@email.com'
          />

          <TextField label='Mật khẩu' type='password' required value='' onChange={() => {}} placeholder='••••••••' />
        </FormSection>

        <FormSection title='Phân quyền'>
          <FormGrid cols={2}>
            <SelectField
              label='Vai trò'
              value={formState.data.role || ''}
              onChange={(v) => updateFormData('role', v)}
              options={[
                { value: 'customer', label: 'Khách hàng' },
                { value: 'pharmacist', label: 'Dược sĩ' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            <SelectField
              label='Trạng thái'
              value={formState.data.status || ''}
              onChange={(v) => updateFormData('status', v)}
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'suspended', label: 'Đã khóa' },
              ]}
            />
          </FormGrid>
        </FormSection>
      </EntityFormDialog>

      {/* Edit User Sheet - Using reusable component */}
      <EntityFormDialog
        open={dialogState.isOpen && dialogState.mode === 'edit'}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        mode='sheet'
        title='Chỉnh sửa người dùng'
        description={`Cập nhật thông tin người dùng ${dialogState.entity?.name || ''}`}
        onSave={handleSaveEdit}
        isEdit={true}
        infoBox={{
          text: '💡 Để đổi mật khẩu, vui lòng sử dụng chức năng "Đặt lại mật khẩu" riêng',
        }}
      >
        <FormSection title='Thông tin cơ bản'>
          <FormGrid cols={2}>
            <TextField
              label='Họ và tên'
              required
              value={formState.data.name || ''}
              onChange={(v) => updateFormData('name', v)}
              placeholder='Nguyễn Văn A'
            />
            <TextField
              label='Số điện thoại'
              type='tel'
              required
              value={formState.data.phone || ''}
              onChange={(v) => updateFormData('phone', v)}
              placeholder='0901234567'
            />
          </FormGrid>

          <TextField
            label='Email'
            type='email'
            required
            value={formState.data.email || ''}
            onChange={(v) => updateFormData('email', v)}
            placeholder='example@email.com'
          />
        </FormSection>

        <FormSection title='Phân quyền'>
          <FormGrid cols={2}>
            <SelectField
              label='Vai trò'
              value={formState.data.role || ''}
              onChange={(v) => updateFormData('role', v)}
              options={[
                { value: 'customer', label: 'Khách hàng' },
                { value: 'pharmacist', label: 'Dược sĩ' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            <SelectField
              label='Trạng thái'
              value={formState.data.status || ''}
              onChange={(v) => updateFormData('status', v)}
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'suspended', label: 'Đã khóa' },
              ]}
            />
          </FormGrid>
        </FormSection>
      </EntityFormDialog>

      {/* Delete Confirmation Dialog - Using reusable component */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        entityName='người dùng'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
