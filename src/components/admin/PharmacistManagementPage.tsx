import { useState } from 'react'
import {
  Stethoscope,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  Award,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Checkbox } from '../ui/checkbox'
import { useEntityManagement } from '../../utils/useEntityManagement'
import { EntityFormDialog, EntityDeleteDialog } from '../shared/EntityFormDialog'
import { TextField, SelectField, FormGrid, FormSection } from '../shared/EntityFormFields'
import { getStatusBadge } from '../../utils/badgeUtils'

interface Pharmacist {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  specialty: string
  status: 'active' | 'inactive' | 'on_leave'
  verified: boolean
  joinDate: string
  location: string
  prescriptionsProcessed: number
  consultationsCompleted: number
  rating: number
  avatar?: string
}

const mockPharmacists: Pharmacist[] = [
  {
    id: 'PH001',
    name: 'DS. Lê Văn Cường',
    email: 'levancuong@medispace.vn',
    phone: '0923456789',
    licenseNumber: 'DS-HCM-12345',
    specialty: 'Dược lâm sàng',
    status: 'active',
    verified: true,
    joinDate: '2023-11-10',
    location: 'TP. Hồ Chí Minh',
    prescriptionsProcessed: 1245,
    consultationsCompleted: 567,
    rating: 4.8,
  },
  {
    id: 'PH002',
    name: 'DS. Đặng Văn Giang',
    email: 'dangvangiang@medispace.vn',
    phone: '0967890123',
    licenseNumber: 'DS-HCM-12346',
    specialty: 'Dược cộng đồng',
    status: 'active',
    verified: true,
    joinDate: '2024-01-05',
    location: 'TP. Hồ Chí Minh',
    prescriptionsProcessed: 892,
    consultationsCompleted: 423,
    rating: 4.7,
  },
  {
    id: 'PH003',
    name: 'DS. Nguyễn Thị Mai',
    email: 'nguyenthimai@medispace.vn',
    phone: '0912345678',
    licenseNumber: 'DS-HN-78901',
    specialty: 'Dược lâm sàng',
    status: 'active',
    verified: true,
    joinDate: '2023-08-15',
    location: 'Hà Nội',
    prescriptionsProcessed: 1567,
    consultationsCompleted: 789,
    rating: 4.9,
  },
  {
    id: 'PH004',
    name: 'DS. Trần Hoàng Phúc',
    email: 'tranhoangphuc@medispace.vn',
    phone: '0934567890',
    licenseNumber: 'DS-HCM-12347',
    specialty: 'Dược cổ truyền',
    status: 'on_leave',
    verified: true,
    joinDate: '2023-12-20',
    location: 'TP. Hồ Chí Minh',
    prescriptionsProcessed: 456,
    consultationsCompleted: 234,
    rating: 4.6,
  },
  {
    id: 'PH005',
    name: 'DS. Phạm Thu Hà',
    email: 'phamthuha@medispace.vn',
    phone: '0945678901',
    licenseNumber: 'DS-DN-45678',
    specialty: 'Dược lâm sàng',
    status: 'active',
    verified: false,
    joinDate: '2024-12-01',
    location: 'Đà Nẵng',
    prescriptionsProcessed: 123,
    consultationsCompleted: 67,
    rating: 4.5,
  },
]

export function PharmacistManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterVerified, setFilterVerified] = useState<string>('all')

  // Use entity management hook
  const {
    entities: pharmacists,
    formState,
    dialogState,
    openAddDialog,
    openDeleteDialog,
    closeDialog,
    handleAdd,
    handleEdit,
    handleDelete,
    updateFormData,
  } = useEntityManagement<Pharmacist>({
    initialEntities: mockPharmacists,
    entityName: 'pharmacist',
    entityNameVi: 'dược sĩ',
    fields: [], // We'll handle form fields manually
    generateId: (): string => `PH${String(mockPharmacists.length + 1).padStart(3, '0')}`,
    validator: (data: Partial<Pharmacist>) => {
      const errors: Record<string, string> = {}
      if (!data.name) errors.name = 'Tên dược sĩ là bắt buộc'
      if (!data.email) errors.email = 'Email là bắt buộc'
      if (!data.phone) errors.phone = 'Số điện thoại là bắt buộc'
      if (!data.licenseNumber) errors.licenseNumber = 'Số giấy phép là bắt buộc'
      return errors
    },
  })

  // Selection state for bulk operations
  const [selectedPharmacists, setSelectedPharmacists] = useState<string[]>([])

  const stats = {
    total: pharmacists.length,
    active: pharmacists.filter((p) => p.status === 'active').length,
    verified: pharmacists.filter((p) => p.verified).length,
    onLeave: pharmacists.filter((p) => p.status === 'on_leave').length,
    totalPrescriptions: pharmacists.reduce((sum, p) => sum + p.prescriptionsProcessed, 0),
    totalConsultations: pharmacists.reduce((sum, p) => sum + p.consultationsCompleted, 0),
    avgRating: (pharmacists.reduce((sum, p) => sum + p.rating, 0) / pharmacists.length).toFixed(1),
  }

  const filteredPharmacists = pharmacists.filter((pharmacist) => {
    const matchesSearch =
      pharmacist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pharmacist.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pharmacist.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || pharmacist.status === filterStatus
    const matchesVerified =
      filterVerified === 'all' ||
      (filterVerified === 'verified' && pharmacist.verified) ||
      (filterVerified === 'unverified' && !pharmacist.verified)
    return matchesSearch && matchesStatus && matchesVerified
  })

  // Form save handlers
  const handleSaveAdd = () => {
    return handleAdd(formState.data)
  }

  const handleSaveEdit = () => {
    return handleEdit(formState.data)
  }

  // Delete handler
  const handlePharmacistDelete = (pharmacist: Pharmacist) => {
    openDeleteDialog(pharmacist)
  }

  const confirmDelete = () => {
    if (dialogState.entity) {
      return handleDelete(dialogState.entity.id)
    }
    return Promise.resolve(false)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPharmacists(filteredPharmacists.map((p) => p.id))
    } else {
      setSelectedPharmacists([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPharmacists([...selectedPharmacists, id])
    } else {
      setSelectedPharmacists(selectedPharmacists.filter((selectedId) => selectedId !== id))
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
            Quản lý dược sĩ
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý đội ngũ dược sĩ tư vấn</p>
        </div>
        <Button
          onClick={openAddDialog}
          className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2'
        >
          <Plus className='w-4 h-4' />
          Thêm dược sĩ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4'>
        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng số</p>
                <p className='text-2xl font-semibold text-blue-600'>{stats.total}</p>
              </div>
              <Stethoscope className='w-8 h-8 text-blue-400' />
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
              <Award className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Đơn xử lý</p>
                <p className='text-xl font-semibold text-[#4A90E2]'>{stats.totalPrescriptions}</p>
              </div>
              <FileText className='w-8 h-8 text-[#4A90E2]' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tư vấn</p>
                <p className='text-xl font-semibold text-blue-600'>{stats.totalConsultations}</p>
              </div>
              <Stethoscope className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
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

      {/* Filters & Search */}
      <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm dược sĩ...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-48 border-2 border-blue-200'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='active'>Hoạt động</SelectItem>
                <SelectItem value='inactive'>Không hoạt động</SelectItem>
                <SelectItem value='on_leave'>Nghỉ phép</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterVerified} onValueChange={setFilterVerified}>
              <SelectTrigger className='w-48 border-2 border-blue-200'>
                <SelectValue placeholder='Xác thực' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='verified'>Đã xác thực</SelectItem>
                <SelectItem value='unverified'>Chưa xác thực</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacists Table */}
      <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Stethoscope className='w-5 h-5 text-blue-600' />
            Danh sách dược sĩ ({filteredPharmacists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={
                        selectedPharmacists.length === filteredPharmacists.length && filteredPharmacists.length > 0
                      }
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                  </TableHead>
                  <TableHead>Dược sĩ</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Chứng chỉ</TableHead>
                  <TableHead>Hiệu suất</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPharmacists.map((pharmacist) => (
                  <TableRow key={pharmacist.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPharmacists.includes(pharmacist.id)}
                        onCheckedChange={(checked) => handleSelectOne(pharmacist.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={pharmacist.avatar} />
                          <AvatarFallback className='bg-blue-100 text-blue-700'>
                            {pharmacist.name.split('.')[1]?.charAt(0) || 'D'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium text-gray-900'>{pharmacist.name}</p>
                          <p className='text-sm text-gray-500'>{pharmacist.specialty}</p>
                          {pharmacist.verified && (
                            <Badge className='bg-blue-100 text-blue-700 text-xs mt-1'>
                              <Award className='w-3 h-3 mr-1' />
                              Xác thực
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Mail className='w-3 h-3' />
                          {pharmacist.email}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Phone className='w-3 h-3' />
                          {pharmacist.phone}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-500'>
                          <MapPin className='w-3 h-3' />
                          {pharmacist.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-medium text-blue-600'>{pharmacist.licenseNumber}</p>
                        <p className='text-xs text-gray-500'>
                          Tham gia: {new Date(pharmacist.joinDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <p className='text-sm'>
                          <span className='text-gray-600'>Đơn thuốc:</span>{' '}
                          <span className='font-semibold text-[#4A90E2]'>{pharmacist.prescriptionsProcessed}</span>
                        </p>
                        <p className='text-sm'>
                          <span className='text-gray-600'>Tư vấn:</span>{' '}
                          <span className='font-semibold text-blue-600'>{pharmacist.consultationsCompleted}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <span className='text-xl'>{pharmacist.rating}</span>
                        <span className='text-yellow-500'>⭐</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(pharmacist.status)}</TableCell>
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
                            Xem hồ sơ
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(pharmacist)}>
                            <Edit className='w-4 h-4 mr-2' />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className='w-4 h-4 mr-2' />
                            Xem báo cáo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePharmacistDelete(pharmacist)} className='text-red-600'>
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

      {/* Add Pharmacist Sheet - Using reusable component */}
      <EntityFormDialog
        open={dialogState.isOpen && dialogState.mode === 'add'}
        onOpenChange={(open) => (open ? openAddDialog() : closeDialog())}
        mode='sheet'
        title='Thêm dược sĩ mới'
        description='Nhập thông tin để tạo tài khoản dược sĩ mới'
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
              placeholder='DS. Nguyễn Văn A'
            />
            <TextField
              label='Số điện thoại'
              type='tel'
              required
              value={formState.data.phone || ''}
              onChange={(v) => updateFormData('phone', v)}
              placeholder='+84 123 456 789'
            />
          </FormGrid>

          <TextField
            label='Email'
            type='email'
            required
            value={formState.data.email || ''}
            onChange={(v) => updateFormData('email', v)}
            placeholder='duocsi@medispace.vn'
          />

          <TextField
            label='Mật khẩu (tự động tạo)'
            type='text'
            value='Sẽ được tự động tạo và gửi qua email'
            onChange={() => {}}
            disabled
            placeholder='••••••••'
          />
        </FormSection>

        <FormSection title='Thông tin chuyên môn'>
          <FormGrid cols={2}>
            <TextField
              label='Số chứng chỉ hành nghề'
              required
              value={formState.data.licenseNumber || ''}
              onChange={(v) => updateFormData('licenseNumber', v)}
              placeholder='DS-HCM-12345'
            />
            <TextField
              label='Chuyên môn'
              value={formState.data.specialty || ''}
              onChange={(v) => updateFormData('specialty', v)}
              placeholder='Dược lâm sàng'
            />
          </FormGrid>

          <FormGrid cols={2}>
            <TextField
              label='Khu vực làm việc'
              value={formState.data.location || ''}
              onChange={(v) => updateFormData('location', v)}
              placeholder='TP. Hồ Chí Minh'
            />
            <SelectField
              label='Trạng thái'
              value={formState.data.status || ''}
              onChange={(v) => updateFormData('status', v)}
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'on_leave', label: 'Nghỉ phép' },
              ]}
            />
          </FormGrid>
        </FormSection>
      </EntityFormDialog>

      {/* Edit Pharmacist Sheet - Using reusable component */}
      <EntityFormDialog
        open={dialogState.isOpen && dialogState.mode === 'edit'}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        mode='sheet'
        title='Chỉnh sửa thông tin dược sĩ'
        description={`Cập nhật thông tin dược sĩ ${dialogState.entity?.name || ''}`}
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
              placeholder='DS. Nguyễn Văn A'
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
            placeholder='duocsi@medispace.vn'
          />
        </FormSection>

        <FormSection title='Thông tin chuyên môn'>
          <FormGrid cols={2}>
            <TextField
              label='Số chứng chỉ hành nghề'
              required
              value={formState.data.licenseNumber || ''}
              onChange={(v) => updateFormData('licenseNumber', v)}
              placeholder='DS-HCM-12345'
            />
            <TextField
              label='Chuyên môn'
              value={formState.data.specialty || ''}
              onChange={(v) => updateFormData('specialty', v)}
              placeholder='Dược lâm sàng'
            />
          </FormGrid>

          <FormGrid cols={2}>
            <TextField
              label='Khu vực làm việc'
              value={formState.data.location || ''}
              onChange={(v) => updateFormData('location', v)}
              placeholder='TP. Hồ Chí Minh'
            />
            <SelectField
              label='Trạng thái'
              value={formState.data.status || ''}
              onChange={(v) => updateFormData('status', v)}
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'on_leave', label: 'Nghỉ phép' },
              ]}
            />
          </FormGrid>
        </FormSection>
      </EntityFormDialog>

      {/* Delete Confirmation Dialog - Using reusable component */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        entityName='dược sĩ'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
        warningMessage='Tất cả dữ liệu liên quan sẽ bị xóa.'
      />
    </div>
  )
}
