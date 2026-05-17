import { useState, useMemo } from 'react'
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Folder,
  FolderOpen,
  CheckCircle,
  XCircle,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { EntityFormDialog, EntityDeleteDialog } from '../shared/EntityFormDialog'
import { TextField, SelectField, FormGrid, FormSection, TextAreaField } from '../shared/EntityFormFields'
import { getStatusBadge } from '../../utils/badgeUtils'
import adminService from '../../services/adminService'
import { toast } from 'sonner'
import { uploadImage } from '../../services/mediaService'
import { PaginationComponent } from '../shared/PaginationComponent'

interface Category {
  _id: string
  name: string
  slug: string
  parentId?: string
  productCount: number
  isActive: boolean
  sortOrder: number
  icon?: string
  description: string
  thumbnailImage?: string
  level: number
  children?: Category[]
}

export function CategoryManagementPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [isUploading, setIsUploading] = useState(false)

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit' | 'delete'
    entity: Category | null
    parentId?: string // For adding subcategory
  }>({ isOpen: false, mode: 'add', entity: null })

  const [formState, setFormState] = useState<{
    data: Partial<Category>
    errors: Record<string, string>
    isSubmitting: boolean
  }>({ data: {}, errors: {}, isSubmitting: false })

  // Fetch categories tree
  const { data: categoriesTree = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories', 'tree'],
    queryFn: adminService.getCategoryTree,
    staleTime: 30000,
  })

  // Fetch dashboard stats for accurate total products count
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: adminService.getDashboardStats,
    staleTime: 2 * 60 * 1000,
    select: (data) => data.products,
  })

  // Flatten tree for table view (with indentation)
  const flattenCategories = useMemo(() => {
    const flatten = (cats: Category[], result: Category[] = []) => {
      cats.forEach((cat) => {
        result.push(cat)
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, result)
        }
      })
      return result
    }
    return flatten(categoriesTree)
  }, [categoriesTree])

  // Filter categories
  const filteredCategories = useMemo(() => {
    return flattenCategories.filter((category: Category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? category.isActive : !category.isActive)

      return matchesSearch && matchesStatus
    })
  }, [flattenCategories, searchQuery, statusFilter])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCategories.slice(startIndex, endIndex)
  }, [filteredCategories, currentPage, itemsPerPage])

  // Mutations
  const createMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Tạo danh mục thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Tạo danh mục thất bại')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Cập nhật danh mục thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Cập nhật danh mục thất bại')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Xóa danh mục thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Xóa danh mục thất bại')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.toggleCategoryStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại')
    },
  })

  // Form handlers
  const updateFormData = (field: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' },
    }))
  }

  const openAddDialog = (parentId?: string) => {
    setDialogState({ isOpen: true, mode: 'add', entity: null, parentId })
    setFormState({
      data: {
        parentId: parentId || undefined,
        isActive: true,
        sortOrder: 1,
      },
      errors: {},
      isSubmitting: false,
    })
  }

  const openEditDialog = (entity: Category) => {
    setDialogState({ isOpen: true, mode: 'edit', entity })
    setFormState({ data: entity, errors: {}, isSubmitting: false })
  }

  const openDeleteDialog = (entity: Category) => {
    setDialogState({ isOpen: true, mode: 'delete', entity })
  }

  const closeDialog = () => {
    setDialogState({ isOpen: false, mode: 'add', entity: null })
    setFormState({ data: {}, errors: {}, isSubmitting: false })
  }

  const handleSave = () => {
    const { data } = formState
    const errors: Record<string, string> = {}

    if (!data.name) errors.name = 'Tên danh mục là bắt buộc'

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors }))
      return Promise.resolve(false)
    }

    if (dialogState.mode === 'edit' && dialogState.entity) {
      updateMutation.mutate({ id: dialogState.entity._id, data })
    } else {
      createMutation.mutate(data)
    }
    return Promise.resolve(true)
  }

  const confirmDelete = () => {
    if (dialogState.entity) {
      deleteMutation.mutate(dialogState.entity._id)
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  }

  // Auto-generate slug
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

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: flattenCategories.length,
      active: flattenCategories.filter((c) => c.isActive).length,
      inactive: flattenCategories.filter((c) => !c.isActive).length,
      root: flattenCategories.filter((c) => !c.parentId).length,
      subCategories: flattenCategories.filter((c) => c.parentId).length,
      // Use dashboard stats for accurate total products count (no duplicates)
      totalProducts: dashboardStats?.total || 0,
    }
  }, [flattenCategories, dashboardStats])

  // Get parent options for select
  const parentOptions = useMemo(() => {
    return flattenCategories
      .filter((c) => !dialogState.entity || c._id !== dialogState.entity._id) // Prevent selecting self as parent
      .map((c) => ({
        value: c._id,
        label: '—'.repeat(c.level) + ' ' + c.name,
      }))
  }, [flattenCategories, dialogState.entity])

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
            }}
          >
            Quản lý danh mục
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý cấu trúc danh mục sản phẩm</p>
        </div>
        <Button
          onClick={() => openAddDialog()}
          className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2 text-white'
        >
          <Plus className='w-4 h-4' />
          Thêm danh mục gốc
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
                <p className='text-xs text-gray-600'>Không hoạt động</p>
                <p className='text-2xl font-semibold text-gray-600'>{stats.inactive}</p>
              </div>
              <XCircle className='w-8 h-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-40 border-2 border-blue-200'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='5'>5 / trang</SelectItem>
                <SelectItem value='10'>10 / trang</SelectItem>
                <SelectItem value='20'>20 / trang</SelectItem>
                <SelectItem value='50'>50 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
                <TableRow className='!border-b-2 border-blue-300'>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-8'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-8 text-gray-500'>
                      Không tìm thấy danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category: Category) => (
                    <TableRow key={category._id} className='border-b-2 border-blue-200 hover:bg-blue-50/30'>
                      <TableCell>
                        <div className='flex items-center gap-2' style={{ paddingLeft: `${category.level * 24}px` }}>
                          {category.level > 0 && <ChevronUp className='w-4 h-4 text-gray-400 rotate-90' />}

                          {category.thumbnailImage ? (
                            <img
                              src={category.thumbnailImage}
                              alt={category.name}
                              className='w-8 h-8 rounded object-cover border border-gray-200'
                            />
                          ) : (
                            <div className='w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-lg'>
                              {category.icon ||
                                (category.parentId ? (
                                  <FolderOpen className='w-4 h-4 text-blue-500' />
                                ) : (
                                  <Folder className='w-4 h-4 text-blue-600' />
                                ))}
                            </div>
                          )}

                          <div>
                            <p className='font-medium text-gray-900'>{category.name}</p>
                            {category.description && (
                              <p className='text-xs text-gray-500 truncate max-w-[200px]'>{category.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className='text-sm bg-gray-100 px-2 py-1 rounded'>{category.slug}</code>
                      </TableCell>
                      <TableCell>
                        <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100'>
                          {category.productCount || 0} SP
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className='text-gray-600'>{category.sortOrder}</span>
                      </TableCell>
                      <TableCell>
                        <div
                          className='cursor-pointer'
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: category._id, isActive: !category.isActive })
                          }
                        >
                          {getStatusBadge(category.isActive ? 'active' : 'inactive')}
                        </div>
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
                              onClick={() => openAddDialog(category._id)}
                            >
                              <Plus className='w-4 h-4 mr-2' />
                              Thêm danh mục con
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='hover:!bg-blue-100 hover:!border-blue-100 hover:!text-blue-700'
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className='w-4 h-4 mr-2' />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-red-600 hover:!bg-red-100 hover:!border-red-100 hover:!text-red-700'
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash2 className='w-4 h-4 mr-2' />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredCategories.length > 0 && totalPages > 1 && (
            <div className='mt-6 flex items-center justify-between border-t border-blue-400 pt-4'>
              <div className='text-sm text-gray-600'>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredCategories.length)} trong tổng số{' '}
                {filteredCategories.length} danh mục
              </div>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Sheet */}
      <EntityFormDialog
        open={dialogState.isOpen}
        onOpenChange={(open) => (open ? null : closeDialog())}
        mode='sheet'
        title={dialogState.mode === 'edit' ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        description={
          dialogState.mode === 'edit'
            ? `Cập nhật thông tin danh mục ${dialogState.entity?.name || ''}`
            : 'Nhập thông tin danh mục mới'
        }
        onSave={handleSave}
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
            onChange={(v) => updateFormData('parentId', v === 'none' ? undefined : v)}
            options={[{ value: 'none', label: 'Không có (danh mục gốc)' }, ...parentOptions]}
          />
        </FormSection>

        <FormSection title='Hình ảnh & Icon'>
          <div className='space-y-4'>
            <label className='text-sm font-medium text-gray-700'>Ảnh đại diện</label>

            {/* Mode toggle */}
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setImageMode('url')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  imageMode !== 'upload'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Dán URL
              </button>
              <button
                type='button'
                onClick={() => setImageMode('upload')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  imageMode === 'upload'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Tải lên
              </button>
            </div>

            {/* URL mode */}
            {imageMode !== 'upload' && (
              <TextField
                label='URL Ảnh đại diện'
                value={formState.data.thumbnailImage || ''}
                onChange={(v) => updateFormData('thumbnailImage', v)}
                placeholder='https://example.com/image.png'
              />
            )}

            {/* Upload mode */}
            {imageMode === 'upload' && (
              <div className='space-y-3'>
                <label className='text-sm font-medium text-gray-700'>Tải lên ảnh đại diện</label>
                <div className='relative'>
                  <input
                    type='file'
                    accept='image/*'
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      // Validate file size (2MB)
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('Kích thước file không được vượt quá 2MB')
                        return
                      }

                      setIsUploading(true)
                      try {
                        const url = await uploadImage(file)
                        updateFormData('thumbnailImage', url)
                        toast.success('Tải ảnh thành công')
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Tải ảnh thất bại')
                      } finally {
                        setIsUploading(false)
                        e.target.value = '' // Reset input
                      }
                    }}
                    className='block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      file:cursor-pointer file:transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed'
                  />
                  {isUploading && (
                    <div className='absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg'>
                      <Loader2 className='w-5 h-5 animate-spin text-blue-600' />
                      <span className='ml-2 text-sm text-gray-600'>Đang tải...</span>
                    </div>
                  )}
                </div>
                <p className='text-xs text-gray-500'>Hỗ trợ: JPG, PNG, GIF (tối đa 2MB)</p>
              </div>
            )}

            {/* Preview */}
            {formState.data.thumbnailImage && (
              <div className='mt-4'>
                <p className='text-xs text-gray-500 mb-2'>Xem trước:</p>
                <div className='relative inline-block'>
                  <img
                    src={formState.data.thumbnailImage}
                    alt='Ảnh đại diện'
                    className='w-24 h-24 object-contain rounded-lg border bg-white p-2'
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => updateFormData('thumbnailImage', '')}
                    className='absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                    title='Xóa ảnh'
                  >
                    <XCircle className='w-3 h-3' />
                  </button>
                </div>
              </div>
            )}
          </div>

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
              value={formState.data.sortOrder?.toString() || '1'}
              onChange={(v) => updateFormData('sortOrder', Number(v) || 1)}
              placeholder='1'
            />
          </FormGrid>

          <SelectField
            label='Trạng thái'
            value={formState.data.isActive ? 'active' : 'inactive'}
            onChange={(v) => updateFormData('isActive', v === 'active')}
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

      {/* Delete Confirmation Dialog */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={() => closeDialog()}
        entityName='danh mục'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
        warningMessage='Tất cả danh mục con và sản phẩm trong danh mục này sẽ bị ảnh hưởng.'
      />
    </div>
  )
}
