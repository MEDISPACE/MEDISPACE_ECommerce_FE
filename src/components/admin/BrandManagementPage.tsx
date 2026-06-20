import { useState, useMemo, useEffect } from 'react'
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Globe,
  Package,
  ExternalLink,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { EntityFormDialog, EntityDeleteDialog } from '../shared/EntityFormDialog'
import { TextField, FormGrid, FormSection, TextAreaField, SelectField } from '../shared/EntityFormFields'
import { PaginationComponent } from '../shared/PaginationComponent'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import brandService from '../../services/brandService'
import { uploadImage } from '../../services/mediaService'
import { toast } from 'sonner'
import { Link2, Upload, Loader2, X } from 'lucide-react'
import type { Brand } from '../../types/product'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/utils'

// Mapping các tên quốc gia viết thường -> viết đúng tiếng Việt
const countryMapping: Record<string, string> = {
  mỹ: 'Mỹ',
  pháp: 'Pháp',
  đức: 'Đức',
  'nhật bản': 'Nhật Bản',
  nhật: 'Nhật Bản',
  'hàn quốc': 'Hàn Quốc',
  hàn: 'Hàn Quốc',
  'việt nam': 'Việt Nam',
  'ấn độ': 'Ấn Độ',
  úc: 'Úc',
  'thụy sĩ': 'Thụy Sĩ',
  'thụy điển': 'Thụy Điển',
  anh: 'Anh',
  ý: 'Ý',
  'thái lan': 'Thái Lan',
  'trung quốc': 'Trung Quốc',
  'đài loan': 'Đài Loan',
  singapore: 'Singapore',
  malaysia: 'Malaysia',
  indonesia: 'Indonesia',
  taiwan: 'Taiwan',
  campuchia: 'Campuchia',
}

// Hàm capitalize tên quốc gia theo tiếng Việt
function capitalizeVietnameseCountry(country: string): string {
  if (!country || country.trim() === '') return country

  const lowerStr = country.toLowerCase().trim()

  // Kiểm tra trong mapping trước
  if (countryMapping[lowerStr]) {
    return countryMapping[lowerStr]
  }

  // Nếu không có trong mapping, capitalize từng từ
  return country
    .split(' ')
    .map((word) => {
      if (!word) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

export function BrandManagementPage() {
  const queryClient = useQueryClient()

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit' | 'delete'
    entity: Brand | null
  }>({ isOpen: false, mode: 'add', entity: null })

  const [formState, setFormState] = useState<{
    data: Partial<Brand>
    errors: Record<string, string>
  }>({ data: {}, errors: {} })

  // Logo upload state
  const [logoMode, setLogoMode] = useState<'url' | 'upload'>('url')
  const [isUploading, setIsUploading] = useState(false)
  const [countryComboboxOpen, setCountryComboboxOpen] = useState(false)

  // Fetch brands
  const { data: brandsData = [], isLoading } = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => brandService.getBrands({ limit: 500 }),
    staleTime: 30000,
  })

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brandsData.filter((brand) => {
      const matchesSearch =
        !searchQuery ||
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && brand.isActive) ||
        (filterStatus === 'inactive' && !brand.isActive)
      const matchesCountry = filterCountry === 'all' || brand.country === filterCountry
      return matchesSearch && matchesStatus && matchesCountry
    })
  }, [brandsData, searchQuery, filterStatus, filterCountry])

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countrySet = new Set(brandsData.map((brand) => brand.country).filter(Boolean))
    return Array.from(countrySet).sort()
  }, [brandsData])

  // Mutations
  const createMutation = useMutation({
    mutationFn: brandService.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success('Tạo thương hiệu thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Tạo thương hiệu thất bại')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) => brandService.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success('Cập nhật thương hiệu thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Cập nhật thương hiệu thất bại')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: brandService.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success('Xóa thương hiệu thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Xóa thương hiệu thất bại')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => brandService.toggleBrandStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
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

  const openAddDialog = () => {
    setDialogState({ isOpen: true, mode: 'add', entity: null })
    setFormState({
      data: {
        isActive: true,
      },
      errors: {},
    })
  }

  const openEditDialog = (entity: Brand) => {
    setDialogState({ isOpen: true, mode: 'edit', entity })
    setFormState({ data: entity, errors: {} })
  }

  const openDeleteDialog = (entity: Brand) => {
    setDialogState({ isOpen: true, mode: 'delete', entity })
  }

  const closeDialog = () => {
    setDialogState({ isOpen: false, mode: 'add', entity: null })
    setFormState({ data: {}, errors: {} })
  }

  const handleSave = () => {
    const { data } = formState
    const errors: Record<string, string> = {}

    // Validation
    if (!data.name) errors.name = 'Tên thương hiệu là bắt buộc'

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors }))
      return Promise.resolve(false)
    }

    // Clean data - remove internal fields and empty strings
    const cleanData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      // Skip internal fields
      if (['_id', 'createdAt', 'productCount', 'updatedAt'].includes(key)) continue
      // Skip empty strings for optional URL fields
      if ((key === 'website' || key === 'logo') && value === '') continue
      // Capitalize country name properly
      if (key === 'country' && typeof value === 'string' && value.trim() !== '') {
        cleanData[key] = capitalizeVietnameseCountry(value)
        continue
      }
      // Include the field
      cleanData[key] = value
    }

    if (dialogState.mode === 'edit' && dialogState.entity) {
      updateMutation.mutate({ id: dialogState.entity._id, data: cleanData })
    } else {
      createMutation.mutate(cleanData as { name: string })
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

  // Auto-generate slug and check for duplicate
  const handleNameChange = (value: string) => {
    updateFormData('name', value)
    // Clear duplicate error
    const newErrors = { ...formState.errors }
    delete newErrors.name
    setFormState((prev) => ({ ...prev, errors: newErrors }))

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

      // Check for duplicate brand by slug
      if (slug && brandsData.some((brand) => brand.slug === slug)) {
        setFormState((prev) => ({
          ...prev,
          errors: { ...prev.errors, name: 'Thương hiệu này đã tồn tại' },
        }))
      }
    }
  }

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: brandsData.length,
      active: brandsData.filter((b) => b.isActive).length,
      inactive: brandsData.filter((b) => !b.isActive).length,
      totalProducts: brandsData.reduce((sum, b) => sum + (b.productCount || 0), 0),
    }
  }, [brandsData])

  // Pagination logic
  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredBrands.slice(startIndex, endIndex)
  }, [filteredBrands, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterCountry])

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
            }}
          >
            Quản lý Thương hiệu
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý danh sách thương hiệu/nhà cung cấp</p>
        </div>
        <Button
          onClick={openAddDialog}
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] gap-2 text-white'
        >
          <Plus className='w-4 h-4' />
          Thêm thương hiệu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng thương hiệu</p>
                <p className='text-2xl font-semibold text-[#1E40AF]'>{stats.total}</p>
              </div>
              <Building2 className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Đang hoạt động</p>
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
                <p className='text-xs text-gray-600'>Ngừng hoạt động</p>
                <p className='text-2xl font-semibold text-gray-600'>{stats.inactive}</p>
              </div>
              <XCircle className='w-8 h-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng sản phẩm</p>
                <p className='text-2xl font-semibold text-[#1E40AF]'>{stats.totalProducts.toLocaleString('vi-VN')}</p>
              </div>
              <Package className='w-8 h-8 text-[#1E40AF]' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardContent className='p-6'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm thương hiệu...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-40 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='active'>Đang hoạt động</SelectItem>
                <SelectItem value='inactive'>Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className='w-40 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Quốc gia' />
              </SelectTrigger>
              <SelectContent className='max-h-60'>
                <SelectItem value='all'>Tất cả quốc gia</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country as string}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-32 border-2 border-[#BFDBFE]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10 / trang</SelectItem>
                <SelectItem value='20'>20 / trang</SelectItem>
                <SelectItem value='50'>50 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='w-5 h-5 text-[#1E40AF]' />
            Danh sách thương hiệu ({filteredBrands.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='!border-b-2 !border-[#BFDBFE]'>
                  <TableHead className='w-16'>Logo</TableHead>
                  <TableHead className='w-56'>Tên thương hiệu</TableHead>
                  <TableHead className='hidden md:table-cell'>Mô tả</TableHead>
                  <TableHead className='hidden lg:table-cell w-32'>Quốc gia</TableHead>
                  <TableHead className='w-24 text-center'>Sản phẩm</TableHead>
                  <TableHead className='w-32'>Trạng thái</TableHead>
                  <TableHead className='text-right w-20'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className='border-b-2 border-[#BFDBFE]'>
                    <TableCell colSpan={7} className='text-center py-8'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF] mx-auto'></div>
                    </TableCell>
                  </TableRow>
                ) : paginatedBrands.length === 0 ? (
                  <TableRow className='border-b-2 border-[#BFDBFE]'>
                    <TableCell colSpan={7} className='text-center py-8 text-gray-500'>
                      Không tìm thấy thương hiệu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBrands.map((brand) => (
                    <TableRow key={brand._id} className='border-b-2 border-[#BFDBFE] hover:bg-[#F0F6FF]/30'>
                      <TableCell>
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className='w-12 h-12 object-contain rounded-lg border border-gray-200'
                          />
                        ) : (
                          <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
                            <Building2 className='w-6 h-6 text-gray-400' />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='w-56'>
                          <p className='font-medium text-gray-900'>{brand.name}</p>
                          {brand.website && (
                            <a
                              href={brand.website}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-xs text-blue-500 hover:underline flex items-center gap-1'
                            >
                              <Globe className='w-3 h-3' />
                              Website
                              <ExternalLink className='w-3 h-3' />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <p className='text-sm text-gray-600 line-clamp-2 max-w-md'>
                          {brand.description || 'Chưa có mô tả'}
                        </p>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        {brand.country ? (
                          <Badge className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5]'>{brand.country}</Badge>
                        ) : (
                          <span className='text-gray-400 text-sm'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='text-center'>
                        <span className='font-semibold text-[#1E40AF]'>{brand.productCount || 0}</span>
                      </TableCell>
                      <TableCell>
                        <div
                          className='cursor-pointer inline-block'
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: brand._id,
                              isActive: !brand.isActive,
                            })
                          }
                        >
                          {brand.isActive ? (
                            <Badge className='bg-green-100 text-green-700 hover:bg-green-200'>
                              <CheckCircle className='w-3 h-3 mr-1' />
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge className='bg-red-100 text-red-700 hover:bg-red-200'>
                              <XCircle className='w-3 h-3 mr-1' />
                              Ngừng
                            </Badge>
                          )}
                        </div>
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
                              onClick={() => openEditDialog(brand)}
                            >
                              <Edit className='w-4 h-4 mr-2' />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(brand)}
                              className='text-red-600 hover:!bg-red-100 hover:!border-red-100 hover:!text-red-700'
                              disabled={brand.productCount > 0}
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
          {filteredBrands.length > 0 && totalPages > 1 && (
            <div className='mt-6 flex items-center justify-between border-t border-blue-400 pt-4'>
              <div className='text-sm text-gray-600'>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredBrands.length)} trong tổng số {filteredBrands.length}{' '}
                thương hiệu
              </div>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Form Sheet */}
      <EntityFormDialog
        open={dialogState.isOpen && dialogState.mode !== 'delete'}
        onOpenChange={(open) => (open ? null : closeDialog())}
        mode='sheet'
        title={dialogState.mode === 'edit' ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
        description={
          dialogState.mode === 'edit'
            ? `Cập nhật thông tin thương hiệu ${dialogState.entity?.name || ''}`
            : 'Nhập thông tin để tạo thương hiệu mới'
        }
        onSave={handleSave}
        isEdit={dialogState.mode === 'edit'}
      >
        <FormSection title='Thông tin cơ bản'>
          <FormGrid cols={2}>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Tên thương hiệu <span className='text-red-500'>*</span>
              </label>
              <Input
                value={formState.data.name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder='VD: Sanofi, DHG Pharma...'
                className={`border-2 ${formState.errors.name ? 'border-red-500' : 'border-[#BFDBFE]'} focus:border-[#1E40AF]`}
              />
              {formState.errors.name && <p className='text-sm text-red-500'>{formState.errors.name}</p>}
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>Slug (URL) - Tự động tạo</label>
              <Input
                value={formState.data.slug || ''}
                disabled
                placeholder='tu-dong-tao-tu-ten'
                className='border-2 border-gray-200 bg-gray-50 text-gray-500'
              />
            </div>
          </FormGrid>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Quốc gia</label>
            <Popover open={countryComboboxOpen} onOpenChange={setCountryComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={countryComboboxOpen}
                  className='w-full h-10 justify-between font-normal text-left border-2 !border-[#BFDBFE] hover:!border-[#1E40AF] focus:!border-[#1E40AF] bg-white'
                >
                  <span className={formState.data.country ? 'text-gray-900' : 'text-gray-400'}>
                    {formState.data.country || 'Chọn hoặc nhập quốc gia...'}
                  </span>
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-[608px] p-0 bg-white border-2 border-[#BFDBFE] shadow-lg z-[9999]'
                align='start'
              >
                <Command className='bg-white rounded-md'>
                  <CommandInput
                    placeholder='Tìm hoặc nhập quốc gia...'
                    className='border-none focus:ring-0 focus:outline-none'
                    onValueChange={(value) => {
                      // Allow typing new country
                      if (value && !countries.some((c) => c?.toLowerCase() === value.toLowerCase())) {
                        updateFormData('country', value)
                      }
                    }}
                  />
                  <CommandList className='max-h-[200px] overflow-y-auto'>
                    <CommandEmpty>
                      <div className='p-2 text-sm text-gray-500'>Nhấn Enter để thêm quốc gia mới</div>
                    </CommandEmpty>
                    <CommandGroup heading='Quốc gia có sẵn'>
                      {countries.map((country) => (
                        <CommandItem
                          key={country}
                          value={country as string}
                          onSelect={(currentValue) => {
                            updateFormData('country', currentValue === formState.data.country ? '' : currentValue)
                            setCountryComboboxOpen(false)
                          }}
                          className={cn(
                            'hover:!bg-[#F0F6FF] hover:!text-blue-500',
                            formState.data.country === country ? 'bg-[#F0F6FF] text-[#1E40AF]' : 'bg-white',
                          )}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formState.data.country === country ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <TextField
            label='Website'
            value={formState.data.website || ''}
            onChange={(v: string) => updateFormData('website', v)}
            placeholder='https://www.example.com'
          />
        </FormSection>

        <FormSection title='Mô tả'>
          <TextAreaField
            label='Mô tả thương hiệu'
            value={formState.data.description || ''}
            onChange={(v: string) => updateFormData('description', v)}
            placeholder='Nhập mô tả chi tiết về thương hiệu...'
            rows={6}
          />
        </FormSection>

        <FormSection title='Trạng thái'>
          <SelectField
            label='Trạng thái'
            value={formState.data.isActive ? 'active' : 'inactive'}
            onChange={(v: string) => updateFormData('isActive', v === 'active')}
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Không hoạt động' },
            ]}
          />
        </FormSection>

        <FormSection title='Hình ảnh'>
          {/* Mode toggle */}
          <div className='flex gap-2 mb-4'>
            <button
              type='button'
              onClick={() => setLogoMode('url')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                logoMode === 'url'
                  ? 'bg-[#E8EDF5] text-[#0A2463] border border-[#BFDBFE]'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Link2 className='w-4 h-4' />
              Dán URL
            </button>
            <button
              type='button'
              onClick={() => setLogoMode('upload')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                logoMode === 'upload'
                  ? 'bg-[#E8EDF5] text-[#0A2463] border border-[#BFDBFE]'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Upload className='w-4 h-4' />
              Tải lên
            </button>
          </div>

          {/* URL mode */}
          {logoMode === 'url' && (
            <TextField
              label='URL Logo thương hiệu'
              value={formState.data.logo || ''}
              onChange={(v: string) => updateFormData('logo', v)}
              placeholder='https://example.com/logo.png'
            />
          )}

          {/* Upload mode */}
          {logoMode === 'upload' && (
            <div className='space-y-3'>
              <label className='text-sm font-medium text-gray-700'>Tải lên logo</label>
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
                      updateFormData('logo', url)
                      toast.success('Tải logo thành công')
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Tải logo thất bại')
                    } finally {
                      setIsUploading(false)
                      e.target.value = '' // Reset input
                    }
                  }}
                  className='block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-[#F0F6FF] file:text-[#0A2463]
                                        hover:file:bg-[#E8EDF5]
                                        file:cursor-pointer file:transition-colors
                                        disabled:opacity-50 disabled:cursor-not-allowed'
                />
                {isUploading && (
                  <div className='absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg'>
                    <Loader2 className='w-5 h-5 animate-spin text-[#1E40AF]' />
                    <span className='ml-2 text-sm text-gray-600'>Đang tải...</span>
                  </div>
                )}
              </div>
              <p className='text-xs text-gray-500'>Hỗ trợ: JPG, PNG, GIF (tối đa 2MB)</p>
            </div>
          )}

          {/* Preview */}
          {formState.data.logo && (
            <div className='mt-4 relative inline-block'>
              <p className='text-xs text-gray-500 mb-2'>Xem trước:</p>
              <div className='relative inline-block'>
                <img
                  src={formState.data.logo}
                  alt='Logo preview'
                  className='w-24 h-24 object-contain rounded-lg border bg-white p-2'
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <button
                  type='button'
                  onClick={() => updateFormData('logo', '')}
                  className='absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                  title='Xóa logo'
                >
                  <X className='w-3 h-3' />
                </button>
              </div>
            </div>
          )}
          <p className='text-xs text-gray-500 mt-2'>Khuyến nghị: 340x340px</p>
        </FormSection>
      </EntityFormDialog>

      {/* Delete Confirmation Dialog */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={() => closeDialog()}
        entityName='thương hiệu'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
        warningMessage={
          dialogState.entity?.productCount && dialogState.entity.productCount > 0
            ? `Không thể xóa thương hiệu này vì đang có ${dialogState.entity.productCount} sản phẩm liên kết.`
            : 'Thương hiệu sẽ bị xóa khỏi hệ thống và không thể khôi phục.'
        }
      />
    </div>
  )
}
