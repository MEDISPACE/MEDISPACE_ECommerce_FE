import { useState, useMemo, useEffect } from 'react'
import {
  Package,
  Search,
  Plus,
  Minus,
  Edit,
  Edit3,
  Trash2,
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Tag,
  Box,
  Barcode,
  X,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { EntityFormDialog, EntityDeleteDialog } from '../shared/EntityFormDialog'
import {
  TextField,
  SelectField,
  FormGrid,
  FormSection,
  SwitchField,
  TextAreaField,
  ImageUploadField,
  MultipleImageUploadField,
} from '../shared/EntityFormFields'
import { getStatusBadge, getPrescriptionBadge } from '../../utils/badgeUtils'
import productService from '../../services/productService'
import adminService from '../../services/adminService'
import brandService from '../../services/brandService'
import { PaginationComponent } from '../shared/PaginationComponent'
import { toast } from 'sonner'
import { HybridPriceEditor, type PriceVariant } from './HybridPriceEditor'
import { useDebounce } from '../../hooks/useDebounce'

// Use Product type from types/product.ts
import type { Product } from '../../types/product'

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ'
}

export function ProductManagementPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPrescription, setFilterPrescription] = useState<string>('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit' | 'delete'
    entity: Product | null
  }>({ isOpen: false, mode: 'add', entity: null })

  const [formState, setFormState] = useState<{
    data: Partial<Product>
    errors: Record<string, string>
  }>({ data: {}, errors: {} })

  // Stock adjustment dialog
  type AdjustmentMode = 'add' | 'subtract' | 'set'
  const [stockDialog, setStockDialog] = useState<{
    isOpen: boolean
    product: Product | null
    adjustmentMode: AdjustmentMode
    selectedUnit: string
    inputQuantity: string
    newAbsoluteQuantity: number
    note: string
  }>({ isOpen: false, product: null, adjustmentMode: 'add', selectedUnit: '', inputQuantity: '', newAbsoluteQuantity: 0, note: '' })

  // Helper: get base unit (quantityPerUnit === 1)
  const getBaseUnit = (product: Product | null): string => {
    if (!product) return 'Đơn vị'
    const base = product.priceVariants?.find((v) => v.quantityPerUnit === 1)
    return base?.unit || product.priceVariants?.[0]?.unit || 'Đơn vị'
  }

  // Fetch products with server-side pagination
  const {
    data: productsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'admin',
      'products',
      currentPage,
      itemsPerPage,
      debouncedSearchQuery,
      filterCategory,
      filterStatus,
      filterPrescription,
    ],
    queryFn: async () => {
      const result = await productService.getProductsPaginated({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: debouncedSearchQuery || undefined,
        categoryId: filterCategory !== 'all' ? filterCategory : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        requiresPrescription: filterPrescription === 'rx' ? true : filterPrescription === 'otc' ? false : undefined,
        bypassTypesense: 'true',
      })
      return result
    },
    staleTime: 60000,
    retry: 2,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  })

  const allProducts = useMemo(() => productsResponse?.products || [], [productsResponse])
  const paginationInfo = productsResponse?.pagination

  // No need for client-side filtering - server handles it

  // Fetch product stats from dashboard API
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: adminService.getDashboardStats,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    select: (data) => data.products, // Only get products stats
  })

  // Fetch categories for dropdown
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['admin', 'categories', 'tree'],
    queryFn: adminService.getCategoryTree,
    staleTime: 60000,
  })

  // Fetch brands for dropdown
  const { data: brandsData = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getBrands({ limit: 450 }), // Fetch all brands
    staleTime: 60000,
  })

  // Debug brands data
  // useEffect(() => {
  //   if (brandsData.length > 0) {
  //     console.log(`✅ Loaded ${brandsData.length} brands:`, brandsData.slice(0, 5))
  //   }
  // }, [brandsData])

  // Flatten categories for dropdown
  const categories = useMemo(() => {
    interface CategoryNode {
      _id: string
      name: string
      children?: CategoryNode[]
    }
    const flatten = (cats: CategoryNode[], result: CategoryNode[] = []): CategoryNode[] => {
      cats.forEach((cat) => {
        result.push(cat)
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, result)
        }
      })
      return result
    }
    return flatten(categoriesData as CategoryNode[])
  }, [categoriesData])

  // Mutations
  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Tạo sản phẩm thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Tạo sản phẩm thất bại')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Cập nhật sản phẩm thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Cập nhật sản phẩm thất bại')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Xóa sản phẩm thành công')
      closeDialog()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Xóa sản phẩm thất bại')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productService.toggleProductStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
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
        status: 'active',
        requiresPrescription: false,
        stockQuantity: 0,
        priceVariants: [],
        maxOrderQuantity: 10,
      },
      errors: {},
    })
  }

  const openStockDialog = (product: Product) => {
    const baseUnit = getBaseUnit(product)
    setStockDialog({
      isOpen: true,
      product,
      adjustmentMode: 'add',
      selectedUnit: baseUnit,
      inputQuantity: '',
      newAbsoluteQuantity: product.stockQuantity || 0,
      note: '',
    })
  }

  const closeStockDialog = () => setStockDialog({
    isOpen: false, product: null, adjustmentMode: 'add',
    selectedUnit: '', inputQuantity: '', newAbsoluteQuantity: 0, note: ''
  })

  // Compute newAbsoluteQuantity whenever dialog inputs change
  const computeNewStock = (mode: string, unit: string, inputQty: string, product: Product | null): number => {
    const qty = parseFloat(inputQty)
    if (isNaN(qty) || qty < 0 || !product) return product?.stockQuantity || 0
    const variant = product.priceVariants?.find((v) => v.unit === unit)
    const qpu = variant?.quantityPerUnit || 1
    const base = Math.round(qty * qpu)
    const current = product.stockQuantity || 0
    if (mode === 'add') return current + base
    if (mode === 'subtract') return Math.max(0, current - base)
    return base // 'set'
  }

  const handleStockAdjustment = async () => {
    if (!stockDialog.product) return
    const qty = parseFloat(stockDialog.inputQuantity)
    if (isNaN(qty) || qty < 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ (≥ 0)')
      return
    }
    if (stockDialog.newAbsoluteQuantity < 0) {
      toast.error('Tồn kho không thể âm')
      return
    }
    try {
      await productService.updateStock(stockDialog.product._id, stockDialog.newAbsoluteQuantity)
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success(
        stockDialog.adjustmentMode === 'add'
          ? `✅ Nhập kho thành công — tồn kho mới: ${stockDialog.newAbsoluteQuantity} ${getBaseUnit(stockDialog.product)}`
          : stockDialog.adjustmentMode === 'subtract'
          ? `📤 Xuất kho thành công — tồn kho mới: ${stockDialog.newAbsoluteQuantity} ${getBaseUnit(stockDialog.product)}`
          : `✏️ Cập nhật tồn kho: ${stockDialog.newAbsoluteQuantity} ${getBaseUnit(stockDialog.product)}`
      )
      closeStockDialog()
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Cập nhật tồn kho thất bại')
    }
  }

  const openEditDialog = (entity: Product) => {
    setDialogState({ isOpen: true, mode: 'edit', entity })

    // Normalize data: ensure brandId and categoryId are strings, not objects
    const normalizedData = {
      ...entity,
      // Handle brandId: can be entity.brand._id or entity.brandId (if string)
      brandId:
        entity.brand?._id ||
        (typeof entity.brandId === 'object' && entity.brandId !== null
          ? (entity.brandId as { _id: string })._id
          : entity.brandId),
      // Handle categoryId: can be entity.category._id or entity.categoryId (if string)
      categoryId:
        entity.category?._id ||
        (typeof entity.categoryId === 'object' && entity.categoryId !== null
          ? (entity.categoryId as { _id: string })._id
          : entity.categoryId),
    }

    // console.log('📝 Edit dialog normalized data:', {
    //   brandId: normalizedData.brandId,
    //   categoryId: normalizedData.categoryId,
    //   originalBrand: entity.brand,
    //   originalCategory: entity.category,
    // })

    // Check if brandId exists in brandsData
    // const brandExists = brandsData.find((b) => b._id === normalizedData.brandId)
    // console.log('🔍 Brand lookup:', {
    //   brandId: normalizedData.brandId,
    //   brandExists: brandExists,
    //   totalBrands: brandsData.length,
    // })

    setFormState({ data: normalizedData, errors: {} })
  }

  const openDeleteDialog = (entity: Product) => {
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
    if (!data.name) errors.name = 'Tên sản phẩm là bắt buộc'
    if (!data.shortDescription) errors.shortDescription = 'Mô tả là bắt buộc'
    else if (data.shortDescription.length < 10) errors.shortDescription = 'Mô tả phải có ít nhất 10 ký tự'
    else if (data.shortDescription.length > 500) errors.shortDescription = 'Mô tả không được quá 500 ký tự'
    if (!data.sku) errors.sku = 'SKU là bắt buộc'
    else if (!/^[A-Z0-9-]+$/.test(data.sku)) errors.sku = 'SKU chỉ được chứa chữ HOA, số và dấu gạch ngang'
    if (!data.categoryId) errors.categoryId = 'Danh mục là bắt buộc'
    if (data.price !== undefined && data.price < 0) errors.price = 'Giá phải lớn hơn hoặc bằng 0'
    if (data.stockQuantity !== undefined && data.stockQuantity < 0) errors.stockQuantity = 'Tồn kho không thể âm'
    if (data.barcode && (data.barcode.length < 8 || data.barcode.length > 50))
      errors.barcode = 'Mã vạch phải từ 8-50 ký tự'
    if (data.maxOrderQuantity !== undefined && data.maxOrderQuantity < 1)
      errors.maxOrderQuantity = 'Số lượng tối đa phải lớn hơn 0'

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors }))
      return Promise.resolve(false)
    }

    // Clean data: remove immutable fields and empty values
    const cleanData = { ...data }
    delete cleanData._id
    delete cleanData.createdAt
    delete cleanData.updatedAt
    delete cleanData.createdBy
    delete cleanData.lastModifiedBy
    delete cleanData.category
    delete cleanData.brand

    // Remove empty brandId
    if (cleanData.brandId === '') {
      delete cleanData.brandId
    }

    if (dialogState.mode === 'edit' && dialogState.entity) {
      updateMutation.mutate({ id: dialogState.entity._id, data: cleanData })
    } else {
      createMutation.mutate(cleanData)
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

  // Stats calculation - use global stats from dashboard API
  const stats = useMemo(() => {
    if (dashboardStats) {
      return {
        total: dashboardStats.total,
        active: dashboardStats.active,
        outOfStock: dashboardStats.outOfStock,
        lowStock: dashboardStats.lowStock,
        totalValue: dashboardStats.totalValue,
        rxProducts: allProducts.filter((p) => p.requiresPrescription).length, // Per-page count
        otcProducts: allProducts.filter((p) => !p.requiresPrescription).length, // Per-page count
      }
    }
    // Fallback to per-page calculation if dashboard stats not loaded
    return {
      total: allProducts.length,
      active: allProducts.filter((p) => p.status === 'active').length,
      outOfStock: allProducts.filter((p) => p.status === 'out_of_stock').length,
      lowStock: allProducts.filter((p) => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 20).length,
      totalValue: allProducts.reduce((sum, p) => {
        const defaultVariant = p.priceVariants?.find((v) => v.isDefault) || p.priceVariants?.[0]
        const price = defaultVariant?.price || 0
        return sum + price * (p.stockQuantity || 0)
      }, 0),
      rxProducts: allProducts.filter((p) => p.requiresPrescription).length,
      otcProducts: allProducts.filter((p) => !p.requiresPrescription).length,
    }
  }, [dashboardStats, allProducts])

  // Server-side pagination - use products directly (no client-side slicing)
  const paginatedProducts = allProducts

  // Calculate total pages from server pagination response (accurate for filtered results)
  const totalPages = paginationInfo?.totalPages ?? (dashboardStats ? Math.ceil(dashboardStats.total / itemsPerPage) : 1)
  const filteredTotalCount = paginationInfo?.totalCount ?? dashboardStats?.total ?? 0

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, filterCategory, filterStatus, filterPrescription])

  // Show error state
  if (error) {
    console.error('Product management error:', error)
    return (
      <div className='space-y-6'>
        <h1
          className='text-3xl font-bold bg-clip-text text-transparent'
          style={{
            backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
          }}
        >
          Quản lý sản phẩm
        </h1>
        <Card className='bg-red-50 border-red-200'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <AlertTriangle className='w-8 h-8 text-red-500' />
              <div>
                <h3 className='text-lg font-semibold text-red-800'>Không thể tải danh sách sản phẩm</h3>
                <p className='text-red-600 mt-1'>
                  {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            Quản lý sản phẩm
          </h1>
          <p className='text-gray-600 mt-2'>
            Quản lý danh mục sản phẩm và tồn kho
            {(paginationInfo || dashboardStats) && (
              <span className='ml-2 text-sm font-medium text-[#1E40AF]'>
                (Trang {currentPage}/{totalPages} - Tổng: {filteredTotalCount} sản phẩm)
              </span>
            )}
          </p>
        </div>
        <div className='flex gap-2'>
          {/* <Button variant='outline' className='gap-2'>
            <Download className='w-4 h-4' />
            Export
          </Button> */}
          {/* <Button variant='outline' className='gap-2'>
            <Upload className='w-4 h-4' />
            Import
          </Button> */}
          <Button
            onClick={openAddDialog}
            className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] gap-2 text-white'
          >
            <Plus className='w-4 h-4' />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng Sản Phẩm</p>
                <p className='text-2xl font-semibold text-[#1E40AF]'>{stats.total}</p>
              </div>
              <Package className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Đang bán</p>
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
                <p className='text-xs text-gray-600'>Hết hàng</p>
                <p className='text-2xl font-semibold text-red-600'>{stats.outOfStock}</p>
              </div>
              <AlertTriangle className='w-8 h-8 text-red-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Sắp hết</p>
                <p className='text-2xl font-semibold text-yellow-600'>{stats.lowStock}</p>
              </div>
              <Box className='w-8 h-8 text-yellow-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Giá trị kho</p>
                <p className='text-lg font-semibold text-[#1E40AF]'>{formatCurrency(stats.totalValue)}</p>
              </div>
              <DollarSign className='w-8 h-8 text-[#1E40AF]' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Thuốc Rx</p>
                <p className='text-2xl font-semibold text-red-600'>{stats.rxProducts}</p>
              </div>
              <Tag className='w-8 h-8 text-red-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Thuốc OTC</p>
                <p className='text-2xl font-semibold text-green-600'>{stats.otcProducts}</p>
              </div>
              <Tag className='w-8 h-8 text-green-400' />
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
                placeholder='Tìm kiếm sản phẩm, SKU...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className='w-48 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Danh mục' />
              </SelectTrigger>
              <SelectContent className='max-h-64 overflow-y-auto'>
                <SelectItem value='all'>Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {'—'.repeat((cat as { level?: number }).level || 0)} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-40 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='active'>Đang bán</SelectItem>
                <SelectItem value='discontinued'>Ngừng kinh doanh</SelectItem>
                <SelectItem value='out_of_stock'>Hết hàng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrescription} onValueChange={setFilterPrescription}>
              <SelectTrigger className='w-32 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Loại' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='rx'>Rx</SelectItem>
                <SelectItem value='otc'>OTC</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-40 border-2 border-[#BFDBFE]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='5'>5 / trang</SelectItem>
                <SelectItem value='10'>10 / trang</SelectItem>
                <SelectItem value='20'>20 / trang</SelectItem>
                <SelectItem value='50'>50 / trang</SelectItem>
              </SelectContent>
            </Select>
            {/* Clear filters button */}
            {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || filterPrescription !== 'all') && (
              <Button
                variant='outline'
                size='default'
                className='!h-9 !px-4 !border-2 !border-red-200 !text-red-600 hover:!bg-red-50 hover:!border-red-300 transition-all flex items-center gap-2'
                onClick={() => {
                  setSearchQuery('')
                  setFilterCategory('all')
                  setFilterStatus('all')
                  setFilterPrescription('all')
                  setCurrentPage(1)
                }}
              >
                <X className='w-4 h-4' />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5 text-[#1E40AF]' />
            Danh sách sản phẩm ({allProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='!border-b-2 !border-[#BFDBFE]'>
                  <TableHead className='w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80'>Sản phẩm</TableHead>
                  <TableHead className='hidden sm:table-cell w-24 sm:w-28 lg:w-32'>SKU</TableHead>
                  <TableHead className='hidden md:table-cell'>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead className='hidden lg:table-cell'>Tồn kho</TableHead>
                  <TableHead className='hidden xl:table-cell'>Loại</TableHead>
                  <TableHead className='hidden xl:table-cell'>Kích hoạt</TableHead>
                  <TableHead className='hidden lg:table-cell'>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className='text-center py-8'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF] mx-auto'></div>
                    </TableCell>
                  </TableRow>
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className='text-center py-8 text-gray-500'>
                      Không tìm thấy sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product._id} className='border-b-2 border-[#BFDBFE] hover:bg-[#F0F6FF]/30'>
                      <TableCell>
                        <div className='w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80'>
                          <p className='font-medium text-gray-900 truncate' title={product.name}>
                            {product.name}
                          </p>
                          <p className='text-sm text-gray-500 truncate'>{product.brand?.name || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>
                        <div className='flex items-center gap-1 w-24 sm:w-28 lg:w-32 overflow-hidden'>
                          <Barcode className='w-4 h-4 text-gray-400 flex-shrink-0' />
                          <span className='font-mono text-sm truncate block' title={product.sku}>
                            {product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Badge className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5]'>
                          {product.category?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className='font-semibold text-[#1E40AF]'>
                          {(() => {
                            const defaultVariant =
                              product.priceVariants?.find((v) => v.isDefault) || product.priceVariants?.[0]
                            const price = defaultVariant?.price || 0
                            return price.toLocaleString('vi-VN') + 'đ'
                          })()}
                        </p>
                        {product.priceVariants && product.priceVariants.length > 1 && (
                          <span className='text-xs text-gray-500'>{product.priceVariants.length} đơn vị</span>
                        )}
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <div className='flex flex-col'>
                          <div className='flex items-center gap-1'>
                            <Box className='w-4 h-4 text-gray-400 flex-shrink-0' />
                            <span className={
                              (product.stockQuantity || 0) <= 0
                                ? 'text-red-600 font-bold'
                                : (product.stockQuantity || 0) < 10
                                ? 'text-yellow-600 font-semibold'
                                : 'text-gray-900'
                            }>
                              {(product.stockQuantity || 0).toLocaleString('vi-VN')}
                            </span>
                            <span className='text-xs text-gray-400'>
                              {getBaseUnit(product)}
                            </span>
                          </div>
                          {(product.priceVariants?.length || 0) > 1 && (
                            <span className='text-xs text-blue-500 mt-0.5'>
                              {product.priceVariants?.length} đơn vị
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='hidden xl:table-cell'>
                        {getPrescriptionBadge(product.requiresPrescription)}
                      </TableCell>
                      <TableCell className='hidden xl:table-cell'>
                        <div
                          className='cursor-pointer inline-block'
                          onClick={() => toggleStatusMutation.mutate({ id: product._id, isActive: !product.isActive })}
                        >
                          {product.isActive ? (
                            <Badge className='bg-green-100 text-green-700 hover:bg-green-200'>
                              <CheckCircle className='w-3 h-3 mr-1' />
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-200'>Không hoạt động</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <div
                          className='cursor-pointer'
                          onClick={() => toggleStatusMutation.mutate({ id: product._id, isActive: !product.isActive })}
                        >
                          {getStatusBadge(product.status)}
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
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit className='w-4 h-4 mr-2 hover:!text-[#1E40AF]' />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='hover:!bg-[#E8EDF5] hover:!border-[#E8EDF5] hover:!text-[#0A2463]'
                              onClick={() => openStockDialog(product)}
                            >
                              <Package className='w-4 h-4 mr-2' />
                              Nhập/Xuất hàng
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(product)}
                              className='text-red-600 hover:!bg-red-100 hover:!border-red-100 hover:!text-red-700'
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
          {allProducts.length > 0 && totalPages > 1 && (
            <div className='mt-6 flex items-center justify-between border-t border-blue-400 pt-4'>
              <div className='text-sm text-gray-600'>
                Trang {currentPage}/{totalPages} - Hiển thị {allProducts.length} sản phẩm
                {filteredTotalCount > 0 && <span> (Tổng: {filteredTotalCount} sản phẩm)</span>}
              </div>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Sheet */}
      <EntityFormDialog
        open={dialogState.isOpen && dialogState.mode !== 'delete'}
        onOpenChange={(open) => (open ? null : closeDialog())}
        mode='sheet'
        title={dialogState.mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        description={
          dialogState.mode === 'edit'
            ? `Cập nhật thông tin sản phẩm ${dialogState.entity?.name || ''}`
            : 'Nhập thông tin để tạo sản phẩm mới'
        }
        onSave={handleSave}
        isEdit={dialogState.mode === 'edit'}
      >
        <FormSection title='Thông tin cơ bản'>
          <TextField
            label='Tên sản phẩm'
            required
            value={formState.data.name || ''}
            onChange={handleNameChange}
            placeholder='VD: Paracetamol 500mg'
            error={formState.errors.name}
          />

          <FormGrid cols={3}>
            <TextField
              label='SKU'
              required
              value={formState.data.sku || ''}
              onChange={(v) => updateFormData('sku', v.toUpperCase())}
              placeholder='VD: PAR-500-100'
              error={formState.errors.sku}
            />
            <TextField
              label='Mã vạch (Barcode)'
              value={formState.data.barcode || ''}
              onChange={(v) => updateFormData('barcode', v)}
              placeholder='VD: 8934567890123'
              error={formState.errors.barcode}
            />
          </FormGrid>
        </FormSection>

        <FormSection title='Phân loại'>
          <FormGrid cols={2}>
            <SelectField
              label='Danh mục'
              required
              value={formState.data.categoryId || ''}
              onChange={(v) => updateFormData('categoryId', v)}
              options={categories.map((cat) => ({
                value: cat._id,
                label: '—'.repeat((cat as { level?: number }).level || 0) + ' ' + cat.name,
              }))}
              error={formState.errors.categoryId}
            />
            <SelectField
              label='Thương hiệu'
              value={formState.data.brandId || ''}
              onChange={(v) => updateFormData('brandId', v || undefined)}
              options={brandsData.map((brand: { _id: string; name: string }) => ({
                value: brand._id,
                label: brand.name,
              }))}
            />
          </FormGrid>
        </FormSection>

        <FormSection title='Đơn vị & Giá bán'>
          <HybridPriceEditor
            variants={(formState.data.priceVariants as PriceVariant[]) || []}
            onChange={(variants) => updateFormData('priceVariants', variants)}
          />
        </FormSection>

        <FormSection title='Kho hàng'>
          <FormGrid cols={2}>
            <TextField
              label='Tồn kho (đơn vị nhỏ nhất)'
              type='number'
              required
              value={formState.data.stockQuantity?.toString() || ''}
              onChange={(v) => updateFormData('stockQuantity', Number(v) || 0)}
              placeholder='0'
              error={formState.errors.stockQuantity}
            />
            <TextField
              label='Số lượng tối đa/đơn'
              type='number'
              value={formState.data.maxOrderQuantity?.toString() || ''}
              onChange={(v) => updateFormData('maxOrderQuantity', Number(v) || 10)}
              placeholder='10'
              error={formState.errors.maxOrderQuantity}
            />
          </FormGrid>

          {/* Stock breakdown by unit */}
          {formState.data.priceVariants &&
            (formState.data.priceVariants as PriceVariant[]).length > 0 &&
            formState.data.stockQuantity !== undefined &&
            formState.data.stockQuantity > 0 && (
              <div className='p-3 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg mt-3'>
                <p className='text-xs font-medium text-gray-600 mb-2'>📦 Quy đổi tồn kho theo đơn vị:</p>
                <div className='flex flex-wrap gap-2'>
                  {(formState.data.priceVariants as PriceVariant[]).map((variant, idx) => {
                    const stockByUnit = Math.floor((formState.data.stockQuantity || 0) / (variant.quantityPerUnit || 1))
                    return (
                      <div
                        key={idx}
                        className='flex items-center gap-1 px-2 py-1 bg-white rounded border border-[#E8EDF5]'
                      >
                        <span className='text-xs text-gray-600'>{variant.unit}:</span>
                        <span className='text-sm font-semibold text-[#1E40AF]'>
                          {stockByUnit.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
        </FormSection>

        <FormSection title='Trạng thái'>
          <FormGrid cols={2}>
            <SelectField
              label='Trạng thái sản phẩm'
              value={formState.data.status || 'active'}
              onChange={(v) => updateFormData('status', v)}
              options={[
                { value: 'active', label: 'Đang bán' },
                { value: 'discontinued', label: 'Ngừng kinh doanh' },
                { value: 'out_of_stock', label: 'Hết hàng' },
              ]}
            />
            <div className='space-y-4'>
              <SwitchField
                label='Kích hoạt'
                description='Hiển thị sản phẩm trên website'
                checked={formState.data.isActive !== false}
                onCheckedChange={(v) => updateFormData('isActive', v)}
              />
              <SwitchField
                label='Thuốc kê đơn'
                description='Yêu cầu đơn thuốc từ bác sĩ'
                checked={formState.data.requiresPrescription || false}
                onCheckedChange={(v) => updateFormData('requiresPrescription', v)}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title='Hình ảnh & Mô tả'>
          <TextField
            label='URL hình ảnh đại diện'
            value={formState.data.featuredImage || ''}
            onChange={(v) => updateFormData('featuredImage', v)}
            placeholder='https://example.com/image.jpg'
          />
        </FormSection>

        <FormSection title='Hình ảnh sản phẩm (Legacy)'>
          <ImageUploadField
            label='Ảnh đại diện'
            value={formState.data.image || ''}
            onChange={(url) => updateFormData('image', url)}
            description='Ảnh chính hiển thị trên danh sách sản phẩm'
            maxSizeMB={2}
          />

          <MultipleImageUploadField
            label='Thư viện ảnh'
            value={formState.data.images || []}
            onChange={(urls) => updateFormData('images', urls)}
            maxFiles={4}
            maxSizeMB={2}
            description='Tối đa 4 ảnh bổ sung cho sản phẩm'
          />
        </FormSection>

        <FormSection title='Mô tả'>
          <TextAreaField
            label='Mô tả sản phẩm'
            required
            value={formState.data.shortDescription || ''}
            onChange={(v) => updateFormData('shortDescription', v)}
            placeholder='Nhập mô tả chi tiết về sản phẩm (tối thiểu 10 ký tự, tối đa 500 ký tự)...'
            rows={5}
            error={formState.errors.shortDescription}
          />
        </FormSection>
      </EntityFormDialog>

      {/* Delete Confirmation Dialog */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={() => closeDialog()}
        entityName='sản phẩm'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
        warningMessage='Sản phẩm sẽ bị xóa khỏi hệ thống và không thể khôi phục.'
      />

      {/* Stock Adjustment Dialog — Smart Multi-Unit */}
      <Dialog open={stockDialog.isOpen} onOpenChange={(open) => !open && closeStockDialog()}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Box className='w-5 h-5 text-[#1E40AF]' />
              Điều chỉnh tồn kho
            </DialogTitle>
            <DialogDescription>
              <span className='font-semibold text-gray-900'>{stockDialog.product?.name}</span>
              <br />
              <span className='text-xs'>SKU: {stockDialog.product?.sku}</span>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-5 py-2'>
            {/* Current stock */}
            <div className='bg-gray-50 rounded-lg p-3'>
              <p className='text-xs text-gray-500 mb-1'>Tồn kho hiện tại</p>
              <p className='text-2xl font-bold text-gray-900'>
                {(stockDialog.product?.stockQuantity || 0).toLocaleString('vi-VN')}{' '}
                <span className='text-base font-medium text-gray-500'>{getBaseUnit(stockDialog.product)}</span>
              </p>
              {stockDialog.product?.priceVariants && stockDialog.product.priceVariants.length > 1 && (
                <div className='flex flex-wrap gap-1.5 mt-2'>
                  {(stockDialog.product.priceVariants as PriceVariant[]).filter(v => (v.quantityPerUnit ?? 1) > 1).map((v) => (
                    <span key={v.unit} className='text-xs bg-[#E8EDF5] text-[#0A2463] px-2 py-0.5 rounded'>
                      {Math.floor((stockDialog.product?.stockQuantity || 0) / (v.quantityPerUnit ?? 1))} {v.unit}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mode selector */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Loại điều chỉnh</Label>
              <div className='flex gap-2'>
                {([{ mode: 'add', label: 'Nhập kho', icon: Plus, c: 'emerald' }, { mode: 'subtract', label: 'Xuất kho', icon: Minus, c: 'amber' }, { mode: 'set', label: 'Đặt lại', icon: Edit3, c: 'blue' }] as const).map(({ mode, label, icon: Icon, c }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      const newAbs = computeNewStock(mode, stockDialog.selectedUnit, stockDialog.inputQuantity, stockDialog.product)
                      setStockDialog(prev => ({ ...prev, adjustmentMode: mode, newAbsoluteQuantity: newAbs }))
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      stockDialog.adjustmentMode === mode
                        ? c === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : c === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-[#1E40AF] bg-[#F0F6FF] text-[#0A2463]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit + Quantity */}
            <div className='flex gap-3'>
              {stockDialog.product?.priceVariants && stockDialog.product.priceVariants.length > 1 && (
                <div className='w-36'>
                  <Label className='text-sm font-medium text-gray-700 mb-1.5 block'>Đơn vị</Label>
                  <Select
                    value={stockDialog.selectedUnit}
                    onValueChange={(val) => {
                      const newAbs = computeNewStock(stockDialog.adjustmentMode, val, stockDialog.inputQuantity, stockDialog.product)
                      setStockDialog(prev => ({ ...prev, selectedUnit: val, newAbsoluteQuantity: newAbs }))
                    }}
                  >
                    <SelectTrigger className='border-2 border-[#BFDBFE]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(stockDialog.product.priceVariants as PriceVariant[]).map((v) => (
                        <SelectItem key={v.unit} value={v.unit}>
                          {v.unit}{(v.quantityPerUnit ?? 1) > 1 ? ` (${v.quantityPerUnit} ${getBaseUnit(stockDialog.product)})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className='flex-1'>
                <Label htmlFor='adjQty' className='text-sm font-medium text-gray-700 mb-1.5 block'>
                  Số lượng ({stockDialog.selectedUnit || getBaseUnit(stockDialog.product)})
                </Label>
                <Input
                  id='adjQty'
                  type='number'
                  min='0'
                  value={stockDialog.inputQuantity}
                  onChange={(e) => {
                    const newAbs = computeNewStock(stockDialog.adjustmentMode, stockDialog.selectedUnit, e.target.value, stockDialog.product)
                    setStockDialog(prev => ({ ...prev, inputQuantity: e.target.value, newAbsoluteQuantity: newAbs }))
                  }}
                  className='text-lg font-bold border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                  placeholder='0'
                  autoFocus
                />
              </div>
            </div>

            {/* Preview */}
            {stockDialog.inputQuantity && parseFloat(stockDialog.inputQuantity) > 0 && (
              <div className={`p-3 rounded-lg border ${
                stockDialog.adjustmentMode === 'add' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : stockDialog.adjustmentMode === 'subtract' ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-[#F0F6FF] border-[#BFDBFE] text-[#0A2463]'
              }`}>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    {stockDialog.adjustmentMode === 'add' ? '📦 Sau khi nhập kho'
                    : stockDialog.adjustmentMode === 'subtract' ? '📤 Sau khi xuất kho'
                    : '✏️ Sau khi đặt lại'}
                  </span>
                  <span className='text-base font-bold'>
                    {stockDialog.newAbsoluteQuantity.toLocaleString('vi-VN')} {getBaseUnit(stockDialog.product)}
                  </span>
                </div>
                <div className='text-xs mt-1 opacity-75'>
                  {stockDialog.adjustmentMode !== 'set' && (
                    <>{stockDialog.product?.stockQuantity?.toLocaleString('vi-VN')}
                    {stockDialog.adjustmentMode === 'add' ? ' + ' : ' − '}
                    {Math.round(parseFloat(stockDialog.inputQuantity || '0') * ((stockDialog.product?.priceVariants as PriceVariant[] | undefined)?.find(v => v.unit === stockDialog.selectedUnit)?.quantityPerUnit || 1)).toLocaleString('vi-VN')}
                    {' = '}{stockDialog.newAbsoluteQuantity.toLocaleString('vi-VN')} {getBaseUnit(stockDialog.product)}</>
                  )}
                </div>
              </div>
            )}

            {/* Note */}
            <div className='space-y-2'>
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                value={stockDialog.note}
                onChange={(e) => setStockDialog(prev => ({ ...prev, note: e.target.value }))}
                placeholder='Lý do nhập/xuất hàng...'
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeStockDialog}>Hủy</Button>
            <Button
              onClick={handleStockAdjustment}
              disabled={!stockDialog.inputQuantity || parseFloat(stockDialog.inputQuantity) <= 0}
              className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
