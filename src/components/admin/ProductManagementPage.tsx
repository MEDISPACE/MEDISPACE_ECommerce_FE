import { useState } from 'react'
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Tag,
  Box,
  Barcode,
  ShoppingCart,
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
import { TextField, SelectField, FormGrid, FormSection, SwitchField, TextAreaField } from '../shared/EntityFormFields'
import { getStatusBadge, getPrescriptionBadge } from '../../utils/badgeUtils'

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  category: string
  manufacturer: string
  price: number
  originalPrice?: number
  stock: number
  status: 'active' | 'inactive' | 'out_of_stock'
  requiresPrescription: boolean
  salesCount: number
  createdAt: string
  image?: string
  description?: string
  featured?: boolean
}

const mockProducts: Product[] = [
  {
    id: 'PRD001',
    name: 'Amoxicillin 500mg',
    slug: 'amoxicillin-500mg',
    sku: 'AMX-500-30',
    category: 'Thuốc kê đơn',
    manufacturer: 'Abbott',
    price: 45000,
    originalPrice: 50000,
    stock: 150,
    status: 'active',
    requiresPrescription: true,
    salesCount: 234,
    createdAt: '2024-01-15',
    description: 'Kháng sinh điều trị nhiễm khuẩn',
  },
  {
    id: 'PRD002',
    name: 'Paracetamol 500mg',
    slug: 'paracetamol-500mg',
    sku: 'PAR-500-100',
    category: 'Thuốc không kê đơn',
    manufacturer: 'Domesco',
    price: 15000,
    stock: 500,
    status: 'active',
    requiresPrescription: false,
    salesCount: 1245,
    createdAt: '2024-01-10',
    description: 'Giảm đau, hạ sốt',
  },
  {
    id: 'PRD003',
    name: 'Vitamin C 1000mg',
    slug: 'vitamin-c-1000mg',
    sku: 'VTC-1000-60',
    category: 'Thực phẩm chức năng',
    manufacturer: 'Blackmores',
    price: 250000,
    originalPrice: 280000,
    stock: 75,
    status: 'active',
    requiresPrescription: false,
    salesCount: 456,
    createdAt: '2024-02-01',
    description: 'Tăng cường sức đề kháng',
  },
  {
    id: 'PRD004',
    name: 'Metformin 850mg',
    slug: 'metformin-850mg',
    sku: 'MET-850-60',
    category: 'Thuốc kê đơn',
    manufacturer: 'Sanofi',
    price: 85000,
    stock: 0,
    status: 'out_of_stock',
    requiresPrescription: true,
    salesCount: 189,
    createdAt: '2024-01-20',
    description: 'Điều trị tiểu đường type 2',
  },
  {
    id: 'PRD005',
    name: 'Kem chống nắng Neutrogena SPF50',
    slug: 'kem-chong-nang-neutrogena',
    sku: 'NEU-SPF50',
    category: 'Chăm sóc cá nhân',
    manufacturer: 'Neutrogena',
    price: 180000,
    originalPrice: 220000,
    stock: 120,
    status: 'active',
    requiresPrescription: false,
    salesCount: 678,
    createdAt: '2024-02-10',
    description: 'Bảo vệ da khỏi tia UV',
  },
  {
    id: 'PRD006',
    name: 'Máy đo huyết áp Omron HEM-7156',
    slug: 'may-do-huyet-ap-omron',
    sku: 'OMR-7156',
    category: 'Thiết bị y tế',
    manufacturer: 'Omron',
    price: 950000,
    originalPrice: 1100000,
    stock: 35,
    status: 'active',
    requiresPrescription: false,
    salesCount: 123,
    createdAt: '2024-01-25',
    description: 'Máy đo huyết áp tự động',
  },
  {
    id: 'PRD007',
    name: 'Viên uống Omega-3 Fish Oil',
    slug: 'omega-3-fish-oil',
    sku: 'OMG-1000-100',
    category: 'Thực phẩm chức năng',
    manufacturer: 'Nature Made',
    price: 320000,
    stock: 90,
    status: 'active',
    requiresPrescription: false,
    salesCount: 345,
    createdAt: '2024-02-05',
    description: 'Hỗ trợ tim mạch',
  },
  {
    id: 'PRD008',
    name: 'Losartan 50mg',
    slug: 'losartan-50mg',
    sku: 'LOS-50-30',
    category: 'Thuốc kê đơn',
    manufacturer: 'Teva',
    price: 120000,
    stock: 200,
    status: 'active',
    requiresPrescription: true,
    salesCount: 267,
    createdAt: '2024-01-18',
    description: 'Điều trị tăng huyết áp',
  },
  {
    id: 'PRD009',
    name: 'Gel rửa tay khô Purell',
    slug: 'gel-rua-tay-purell',
    sku: 'PUR-500ML',
    category: 'Chăm sóc cá nhân',
    manufacturer: 'Purell',
    price: 45000,
    stock: 15,
    status: 'active',
    requiresPrescription: false,
    salesCount: 890,
    createdAt: '2024-02-15',
    description: 'Diệt khuẩn nhanh',
  },
  {
    id: 'PRD010',
    name: 'Thuốc nhỏ mắt Systane',
    slug: 'thuoc-nho-mat-systane',
    sku: 'SYS-10ML',
    category: 'Thuốc không kê đơn',
    manufacturer: 'Alcon',
    price: 85000,
    stock: 180,
    status: 'inactive',
    requiresPrescription: false,
    salesCount: 234,
    createdAt: '2024-01-30',
    description: 'Giảm khô mắt',
  },
]

const categories = [
  { id: 'thuoc-ke-don', name: 'Thuốc kê đơn' },
  { id: 'thuoc-khong-ke-don', name: 'Thuốc không kê đơn' },
  { id: 'thuc-pham-chuc-nang', name: 'Thực phẩm chức năng' },
  { id: 'cham-soc-ca-nhan', name: 'Chăm sóc cá nhân' },
  { id: 'thiet-bi-y-te', name: 'Thiết bị y tế' },
]

const manufacturers = [
  'Abbott',
  'Domesco',
  'Blackmores',
  'Sanofi',
  'Neutrogena',
  'Omron',
  'Nature Made',
  'Teva',
  'Purell',
  'Alcon',
]

export function ProductManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPrescription, setFilterPrescription] = useState<string>('all')

  // Use entity management hook
  const {
    entities: products,
    formState,
    dialogState,
    openAddDialog,
    openDeleteDialog,
    closeDialog,
    handleAdd,
    handleEdit,
    handleDelete,
    updateFormData,
  } = useEntityManagement<Product>({
    initialEntities: mockProducts,
    entityName: 'product',
    entityNameVi: 'sản phẩm',
    fields: [], // We'll handle form fields manually
    generateId: (): string => `PRD${String(mockProducts.length + 1).padStart(3, '0')}`,
    validator: (data: Partial<Product>) => {
      const errors: Record<string, string> = {}
      if (!data.name) errors.name = 'Tên sản phẩm là bắt buộc'
      if (!data.sku) errors.sku = 'SKU là bắt buộc'
      if (!data.category) errors.category = 'Danh mục là bắt buộc'
      if (data.price !== undefined && data.price <= 0) errors.price = 'Giá phải lớn hơn 0'
      if (data.stock !== undefined && data.stock < 0) errors.stock = 'Tồn kho không thể âm'
      return errors
    },
  })

  // Auto-generate slug when name changes (only for new products)
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

  const confirmDelete = () => {
    if (dialogState.entity) {
      return handleDelete(dialogState.entity.id)
    }
  }

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    outOfStock: products.filter((p) => p.status === 'out_of_stock').length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock < 20).length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalSales: products.reduce((sum, p) => sum + p.salesCount, 0),
    rxProducts: products.filter((p) => p.requiresPrescription).length,
    otcProducts: products.filter((p) => !p.requiresPrescription).length,
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    const matchesPrescription =
      filterPrescription === 'all' ||
      (filterPrescription === 'rx' && product.requiresPrescription) ||
      (filterPrescription === 'otc' && !product.requiresPrescription)
    return matchesSearch && matchesCategory && matchesStatus && matchesPrescription
  })

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
            Quản lý sản phẩm
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý danh mục sản phẩm và tồn kho</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' className='gap-2'>
            <Download className='w-4 h-4' />
            Export
          </Button>
          <Button variant='outline' className='gap-2'>
            <Upload className='w-4 h-4' />
            Import
          </Button>
          <Button
            onClick={openAddDialog}
            className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2'
          >
            <Plus className='w-4 h-4' />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng SP</p>
                <p className='text-2xl font-semibold text-blue-600'>{stats.total}</p>
              </div>
              <Package className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Giá trị kho</p>
                <p className='text-lg font-semibold text-[#4A90E2]'>{(stats.totalValue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className='w-8 h-8 text-[#4A90E2]' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Đã bán</p>
                <p className='text-xl font-semibold text-blue-600'>{stats.totalSales}</p>
              </div>
              <ShoppingCart className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
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
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardContent className='p-6'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm sản phẩm, SKU, nhà sản xuất...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className='w-48 border-2 border-blue-200'>
                <SelectValue placeholder='Danh mục' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-40 border-2 border-blue-200'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='active'>Đang bán</SelectItem>
                <SelectItem value='inactive'>Ngừng bán</SelectItem>
                <SelectItem value='out_of_stock'>Hết hàng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrescription} onValueChange={setFilterPrescription}>
              <SelectTrigger className='w-32 border-2 border-blue-200'>
                <SelectValue placeholder='Loại' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='rx'>Rx</SelectItem>
                <SelectItem value='otc'>OTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5 text-blue-600' />
            Danh sách sản phẩm ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Đã bán</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className='font-medium text-gray-900'>{product.name}</p>
                        <p className='text-sm text-gray-500'>{product.manufacturer}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Barcode className='w-4 h-4 text-gray-400' />
                        <span className='font-mono text-sm'>{product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-semibold text-blue-600'>{product.price.toLocaleString('vi-VN')}đ</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className='text-xs text-gray-400 line-through'>
                            {product.originalPrice.toLocaleString('vi-VN')}đ
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Box className='w-4 h-4 text-gray-400' />
                        <span className={product.stock < 20 ? 'text-yellow-600 font-semibold' : ''}>
                          {product.stock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <TrendingUp className='w-4 h-4 text-green-500' />
                        {product.salesCount}
                      </div>
                    </TableCell>
                    <TableCell>{getPrescriptionBadge(product.requiresPrescription)}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className='w-4 h-4 mr-2' />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(product)} className='text-red-600'>
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

      {/* Product Form Sheet - Using reusable component */}
      <EntityFormDialog
        open={dialogState.isOpen}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        mode='sheet'
        title={dialogState.mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        description={
          dialogState.mode === 'edit'
            ? `Cập nhật thông tin sản phẩm ${dialogState.entity?.name || ''}`
            : 'Nhập thông tin để tạo sản phẩm mới'
        }
        onSave={dialogState.mode === 'edit' ? handleSaveEdit : handleSaveAdd}
        isEdit={dialogState.mode === 'edit'}
      >
        <FormSection title='Thông tin cơ bản'>
          <TextField
            label='Tên sản phẩm'
            required
            value={formState.data.name || ''}
            onChange={handleNameChange}
            placeholder='VD: Paracetamol 500mg'
          />

          <FormGrid cols={2}>
            <TextField
              label='SKU'
              required
              value={formState.data.sku || ''}
              onChange={(v) => updateFormData('sku', v)}
              placeholder='VD: PAR-500-100'
            />
            <TextField
              label='Slug'
              value={formState.data.slug || ''}
              onChange={(v) => updateFormData('slug', v)}
              placeholder='VD: paracetamol-500mg'
            />
          </FormGrid>
        </FormSection>

        <FormSection title='Phân loại'>
          <FormGrid cols={2}>
            <SelectField
              label='Danh mục'
              required
              value={formState.data.category || ''}
              onChange={(v) => updateFormData('category', v)}
              options={categories.map((cat) => ({ value: cat.name, label: cat.name }))}
            />
            <SelectField
              label='Nhà sản xuất'
              value={formState.data.manufacturer || ''}
              onChange={(v) => updateFormData('manufacturer', v)}
              options={manufacturers.map((m) => ({ value: m, label: m }))}
            />
          </FormGrid>
        </FormSection>

        <FormSection title='Giá và kho'>
          <FormGrid cols={3}>
            <TextField
              label='Giá bán (VNĐ)'
              type='number'
              required
              value={formState.data.price?.toString() || ''}
              onChange={(v) => updateFormData('price', Number(v) || 0)}
              placeholder='0'
            />
            <TextField
              label='Giá gốc (VNĐ)'
              type='number'
              value={formState.data.originalPrice?.toString() || ''}
              onChange={(v) => updateFormData('originalPrice', Number(v) || 0)}
              placeholder='0'
            />
            <TextField
              label='Tồn kho'
              type='number'
              required
              value={formState.data.stock?.toString() || ''}
              onChange={(v) => updateFormData('stock', Number(v) || 0)}
              placeholder='0'
            />
          </FormGrid>
        </FormSection>

        <FormSection title='Trạng thái'>
          <SelectField
            label='Trạng thái sản phẩm'
            value={formState.data.status || ''}
            onChange={(v) => updateFormData('status', v)}
            options={[
              { value: 'active', label: 'Đang bán' },
              { value: 'inactive', label: 'Ngừng bán' },
              { value: 'out_of_stock', label: 'Hết hàng' },
            ]}
          />

          <SwitchField
            label='Thuốc kê đơn'
            description='Sản phẩm này yêu cầu đơn thuốc từ bác sĩ'
            checked={formState.data.requiresPrescription || false}
            onCheckedChange={(v) => updateFormData('requiresPrescription', v)}
          />

          <SwitchField
            label='Sản phẩm nổi bật'
            description='Hiển thị ở trang chủ và danh sách nổi bật'
            checked={formState.data.featured || false}
            onCheckedChange={(v) => updateFormData('featured', v)}
          />
        </FormSection>

        <FormSection title='Mô tả'>
          <TextAreaField
            label='Mô tả sản phẩm'
            value={formState.data.description || ''}
            onChange={(v) => updateFormData('description', v)}
            placeholder='Nhập mô tả chi tiết về sản phẩm...'
            rows={6}
          />
        </FormSection>
      </EntityFormDialog>

      {/* Delete Confirmation Dialog - Using reusable component */}
      <EntityDeleteDialog
        open={dialogState.isOpen && dialogState.mode === 'delete'}
        onOpenChange={(open) => (open ? {} : closeDialog())}
        entityName='sản phẩm'
        entityDisplayName={dialogState.entity?.name}
        onConfirm={confirmDelete}
        warningMessage='Sản phẩm sẽ bị xóa khỏi hệ thống và không thể khôi phục.'
      />
    </div>
  )
}
