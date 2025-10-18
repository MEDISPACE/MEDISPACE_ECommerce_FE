import { useState } from 'react'
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Folder,
  FolderOpen,
  CheckCircle,
  XCircle,
  ChevronUp,
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
import { useEntityManagement } from '../../utils/useEntityManagement'
import { EntityFormDialog, EntityDeleteDialog } from '../shared/EntityFormDialog'
import { TextField, SelectField, FormGrid, FormSection, TextAreaField } from '../shared/EntityFormFields'
import { getStatusBadge } from '../../utils/badgeUtils'

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
  productCount: number
  status: 'active' | 'inactive'
  order: number
  icon?: string
  description: string
  imageUrl?: string
}

const mockCategories: Category[] = [
  {
    id: 'CAT001',
    name: 'Thuốc',
    slug: 'thuoc',
    productCount: 450,
    status: 'active',
    order: 1,
    icon: '💊',
    description: 'Các loại thuốc kê đơn và không kê đơn',
  },
  {
    id: 'CAT002',
    name: 'Thuốc kê đơn',
    slug: 'thuoc-ke-don',
    parentId: 'CAT001',
    productCount: 180,
    status: 'active',
    order: 1,
    description: 'Thuốc cần có đơn từ bác sĩ',
  },
  {
    id: 'CAT003',
    name: 'Thuốc không kê đơn',
    slug: 'thuoc-khong-ke-don',
    parentId: 'CAT001',
    productCount: 270,
    status: 'active',
    order: 2,
    description: 'Thuốc OTC mua tự do',
  },
  {
    id: 'CAT004',
    name: 'Thực phẩm chức năng',
    slug: 'thuc-pham-chuc-nang',
    productCount: 320,
    status: 'active',
    order: 2,
    icon: '🌿',
    description: 'Vitamin, khoáng chất và thực phẩm bổ sung',
  },
  {
    id: 'CAT005',
    name: 'Chăm sóc cá nhân',
    slug: 'cham-soc-ca-nhan',
    productCount: 245,
    status: 'active',
    order: 3,
    icon: '✨',
    description: 'Sản phẩm chăm sóc sức khỏe và sắc đẹp',
  },
  {
    id: 'CAT006',
    name: 'Thiết bị y tế',
    slug: 'thiet-bi-y-te',
    productCount: 158,
    status: 'inactive',
    order: 4,
    icon: '🩺',
    description: 'Dụng cụ y tế và thiết bị chăm sóc sức khỏe',
  },
]

export function CategoryManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Use entity management hook
  const {
    entities: categories,
    formState,
    dialogState,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialog,
    handleAdd,
    handleEdit,
    handleDelete,
    updateFormData,
  } = useEntityManagement<Category>({
    initialEntities: mockCategories,
    entityName: 'category',
    entityNameVi: 'danh mục',
    fields: [], // We'll handle form fields manually
    generateId: (): string => `CAT${String(mockCategories.length + 1).padStart(3, '0')}`,
    validator: (data: Partial<Category>) => {
      const errors: Record<string, string> = {}
      if (!data.name) errors.name = 'Tên danh mục là bắt buộc'
      if (!data.slug) errors.slug = 'Slug là bắt buộc'
      return errors
    },
  })

  // Auto-generate slug when name changes (only for new categories)
  const handleNameChange = (value: string) => {
    updateFormData('name', value)
    if (dialogState.mode !== 'edit') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      updateFormData('slug', slug)
    }
  }

  // Form save handlers
  const handleSaveAdd = () => {
    return handleAdd(formState.data)
  }

  const handleSaveEdit = () => {
    return handleEdit(formState.data)
  }

  // Delete handler with proper signature
  const handleCategoryDelete = (category: Category) => {
    openDeleteDialog(category)
  }

  const confirmDelete = () => {
    if (dialogState.entity) {
      return handleDelete(dialogState.entity.id)
    }
    return Promise.resolve(false)
  }

  const stats = {
    total: categories.length,
    active: categories.filter((c: Category) => c.status === 'active').length,
    inactive: categories.filter((c: Category) => c.status === 'inactive').length,
    root: categories.filter((c: Category) => !c.parentId).length,
    subCategories: categories.filter((c: Category) => c.parentId).length,
    totalProducts: categories.reduce((sum: number, c: Category) => sum + c.productCount, 0),
  }

  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get parent categories for dropdown
  const parentCategories = categories.filter((c: Category) => !c.parentId)

  const getCategoryLevel = (categoryId: string): number => {
    const category = categories.find((c: Category) => c.id === categoryId)
    if (!category || !category.parentId) return 0
    return 1 + getCategoryLevel(category.parentId)
  }

  const getParentName = (parentId?: string): string => {
    if (!parentId) return '—'
    const parent = categories.find((c: Category) => c.id === parentId)
    return parent ? parent.name : '—'
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
            Quản lý danh mục
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý cấu trúc danh mục sản phẩm</p>
        </div>
        <Button
          onClick={openAddDialog}
          className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2'
        >
          <Plus className='w-4 h-4' />
          Thêm danh mục
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng danh mục</p>
                <p className='text-2xl font-semibold text-blue-600'>{stats.total}</p>
              </div>
              <Tag className='w-8 h-8 text-blue-400' />
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
                <p className='text-xs text-gray-600'>Không hoạt động</p>
                <p className='text-2xl font-semibold text-gray-600'>{stats.inactive}</p>
              </div>
              <XCircle className='w-8 h-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Danh mục gốc</p>
                <p className='text-2xl font-semibold text-[#4A90E2]'>{stats.root}</p>
              </div>
              <Folder className='w-8 h-8 text-[#4A90E2]' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Danh mục con</p>
                <p className='text-2xl font-semibold text-blue-600'>{stats.subCategories}</p>
              </div>
              <FolderOpen className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng sản phẩm</p>
                <p className='text-2xl font-semibold text-green-600'>{stats.totalProducts}</p>
              </div>
              <Tag className='w-8 h-8 text-green-400' />
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
                placeholder='Tìm kiếm danh mục...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-48 border-2 border-blue-200'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='active'>Hoạt động</SelectItem>
                <SelectItem value='inactive'>Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Tag className='w-5 h-5 text-blue-600' />
            Danh sách danh mục ({filteredCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Danh mục cha</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories
                  .sort((a: Category, b: Category) => {
                    // Sort by parent first, then by order
                    if (!a.parentId && b.parentId) return -1
                    if (a.parentId && !b.parentId) return 1
                    if (a.parentId === b.parentId) return a.order - b.order
                    return 0
                  })
                  .map((category: Category) => {
                    const level = getCategoryLevel(category.id)
                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className='flex items-center gap-2' style={{ paddingLeft: `${level * 24}px` }}>
                            {level > 0 && <ChevronUp className='w-4 h-4 text-gray-400 rotate-90' />}
                            {category.icon && <span className='text-xl'>{category.icon}</span>}
                            {!category.icon &&
                              (category.parentId ? (
                                <FolderOpen className='w-5 h-5 text-blue-400' />
                              ) : (
                                <Folder className='w-5 h-5 text-[#4A90E2]' />
                              ))}
                            <div>
                              <p className='font-medium text-gray-900'>{category.name}</p>
                              <p className='text-xs text-gray-500'>{category.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className='text-sm bg-gray-100 px-2 py-1 rounded'>{category.slug}</code>
                        </TableCell>
                        <TableCell>
                          <span className='text-gray-600'>{getParentName(category.parentId)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>{category.productCount} SP</Badge>
                        </TableCell>
                        <TableCell>
                          <span className='text-gray-600'>{category.order}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(category.status)}</TableCell>
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
                                Xem sản phẩm
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                <Edit className='w-4 h-4 mr-2' />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCategoryDelete(category)} className='text-red-600'>
                                <Trash2 className='w-4 h-4 mr-2' />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Form Sheet - Using reusable component */}
      <EntityFormDialog
        open={dialogState.isOpen}
        onOpenChange={(open) => (open ? openAddDialog() : closeDialog())}
        mode='sheet'
        title={dialogState.mode === 'edit' ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        description={
          dialogState.mode === 'edit'
            ? `Cập nhật thông tin danh mục ${dialogState.entity?.name || ''}`
            : 'Nhập thông tin danh mục mới'
        }
        onSave={dialogState.mode === 'edit' ? handleSaveEdit : handleSaveAdd}
        isEdit={dialogState.mode === 'edit'}
      >
        <FormSection title='Thông tin cơ bản'>
          <TextField
            label='Tên danh mục'
            required
            value={formState.data.name || ''}
            onChange={handleNameChange}
            placeholder='VD: Thuốc kháng sinh'
          />

          <TextField
            label='Slug'
            required
            value={formState.data.slug || ''}
            onChange={(v) => updateFormData('slug', v)}
            placeholder='VD: thuoc-khang-sinh'
          />

          <SelectField
            label='Danh mục cha'
            value={formState.data.parentId || 'none'}
            onChange={(v) => updateFormData('parentId', v)}
            options={[
              { value: 'none', label: 'Không có (danh mục gốc)' },
              ...parentCategories.map((cat: Category) => ({ value: cat.id, label: cat.name })),
            ]}
          />
        </FormSection>

        <FormSection title='Hiển thị'>
          <FormGrid cols={2}>
            <TextField
              label='Icon (Emoji)'
              value={formState.data.icon || ''}
              onChange={(v) => updateFormData('icon', v)}
              placeholder='💊'
            />

            <TextField
              label='Thứ tự hiển thị'
              type='number'
              value={formState.data.order?.toString() || '1'}
              onChange={(v) => updateFormData('order', Number(v) || 1)}
              placeholder='1'
            />
          </FormGrid>

          <SelectField
            label='Trạng thái'
            value={formState.data.status || 'active'}
            onChange={(v) => updateFormData('status', v as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Không hoạt động' },
            ]}
          />
        </FormSection>

        <FormSection title='Mô tả'>
          <TextAreaField
            label='Mô tả danh mục'
            value={formState.data.description || ''}
            onChange={(v) => updateFormData('description', v)}
            placeholder='Nhập mô tả về danh mục...'
            rows={4}
          />
        </FormSection>
      </EntityFormDialog>

      {/* Delete Confirmation Dialog - Using reusable component */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        entityName='danh mục'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
        warningMessage='Tất cả sản phẩm trong danh mục này sẽ bị ảnh hưởng.'
      />
    </div>
  )
}
