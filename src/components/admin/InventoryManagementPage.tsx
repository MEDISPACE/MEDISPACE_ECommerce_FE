import { useState, useEffect } from 'react'
import {
  Package,
  Search,
  Box,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Warehouse,
  Edit3,
  X,
  RefreshCw,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { PaginationComponent } from '../shared/PaginationComponent'
import { toast } from 'sonner'
import inventoryService, {
  type InventoryStats,
  type InventoryProduct,
  type InventoryProductsResponse,
} from '../../services/admin/inventory.service'

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ'
}

// Stock status badge helper
function getStockBadge(stockQuantity: number, lowStockThreshold: number = 10) {
  if (stockQuantity <= 0) {
    return (
      <Badge className='bg-red-100 text-red-700 hover:bg-red-100 gap-1'>
        <AlertTriangle className='w-3 h-3' />
        Hết hàng
      </Badge>
    )
  }
  if (stockQuantity <= lowStockThreshold) {
    return (
      <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1'>
        <TrendingDown className='w-3 h-3' />
        Sắp hết
      </Badge>
    )
  }
  return (
    <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1'>
      <CheckCircle className='w-3 h-3' />
      Còn hàng
    </Badge>
  )
}

type StockFilterTab = 'all' | 'inStock' | 'lowStock' | 'outOfStock'

export function InventoryManagementPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<StockFilterTab>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Stock edit dialog
  const [stockDialog, setStockDialog] = useState<{
    isOpen: boolean
    product: InventoryProduct | null
    newQuantity: string
  }>({ isOpen: false, product: null, newQuantity: '' })

  // Fetch inventory stats
  const { data: stats } = useQuery<InventoryStats>({
    queryKey: ['admin', 'inventory', 'stats'],
    queryFn: inventoryService.getInventoryStats,
    staleTime: 30_000,
  })

  // Fetch inventory products
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery<InventoryProductsResponse>({
    queryKey: ['admin', 'inventory', 'products', currentPage, itemsPerPage, activeTab, searchQuery],
    queryFn: () =>
      inventoryService.getInventoryProducts({
        page: currentPage,
        limit: itemsPerPage,
        stockFilter: activeTab,
        search: searchQuery || undefined,
        sortBy: 'stockQuantity',
        sortOrder: 'asc', // Show lowest stock first
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ productId, stockQuantity }: { productId: string; stockQuantity: number }) =>
      inventoryService.updateProductStock(productId, stockQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
      toast.success('Cập nhật tồn kho thành công')
      setStockDialog({ isOpen: false, product: null, newQuantity: '' })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Cập nhật tồn kho thất bại')
    },
  })

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  const products = productsData?.products || []
  const pagination = productsData?.pagination
  const lowStockThreshold = stats?.lowStockThreshold || 10

  const openStockDialog = (product: InventoryProduct) => {
    setStockDialog({
      isOpen: true,
      product,
      newQuantity: product.stockQuantity.toString(),
    })
  }

  const handleStockUpdate = () => {
    if (!stockDialog.product) return

    const qty = parseInt(stockDialog.newQuantity)
    if (isNaN(qty) || qty < 0) {
      toast.error('Số lượng tồn kho phải là số nguyên ≥ 0')
      return
    }

    updateStockMutation.mutate({
      productId: stockDialog.product._id,
      stockQuantity: qty,
    })
  }

  // Tab config
  const tabs: { key: StockFilterTab; label: string; count?: number; color: string }[] = [
    { key: 'all', label: 'Tất cả', count: stats?.total, color: 'blue' },
    { key: 'inStock', label: 'Còn hàng', count: stats?.active, color: 'emerald' },
    { key: 'lowStock', label: 'Sắp hết', count: stats?.lowStock, color: 'amber' },
    { key: 'outOfStock', label: 'Hết hàng', count: stats?.outOfStock, color: 'red' },
  ]

  if (error) {
    return (
      <div className='space-y-6'>
        <h1
          className='text-3xl font-bold bg-clip-text text-transparent'
          style={{ backgroundImage: 'linear-gradient(to right, #0066CC, #4A90E2)' }}
        >
          Quản lý kho
        </h1>
        <Card className='bg-red-50 border-red-200'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <AlertTriangle className='w-8 h-8 text-red-500' />
              <div>
                <h3 className='text-lg font-semibold text-red-800'>Không thể tải dữ liệu tồn kho</h3>
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
            style={{ backgroundImage: 'linear-gradient(to right, #0066CC, #4A90E2)' }}
          >
            Quản lý kho
          </h1>
          <p className='text-gray-600 mt-2'>
            Theo dõi và quản lý tồn kho sản phẩm
            {pagination && (
              <span className='ml-2 text-sm font-medium text-blue-600'>
                (Trang {pagination.page}/{pagination.totalPages} — Tổng: {pagination.total} sản phẩm)
              </span>
            )}
          </p>
        </div>
        <Button
          variant='outline'
          className='gap-2 border-blue-200 text-blue-600 hover:bg-blue-50'
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
            toast.info('Đang làm mới dữ liệu...')
          }}
        >
          <RefreshCw className='w-4 h-4' />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Tổng sản phẩm</p>
                <p className='text-2xl font-semibold text-blue-600'>{stats?.total ?? '—'}</p>
              </div>
              <Package className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-emerald-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Còn hàng</p>
                <p className='text-2xl font-semibold text-emerald-600'>{stats?.active ?? '—'}</p>
              </div>
              <CheckCircle className='w-8 h-8 text-emerald-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-amber-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Sắp hết (≤ {lowStockThreshold})</p>
                <p className='text-2xl font-semibold text-amber-600'>{stats?.lowStock ?? '—'}</p>
              </div>
              <TrendingDown className='w-8 h-8 text-amber-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-red-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Hết hàng</p>
                <p className='text-2xl font-semibold text-red-600'>{stats?.outOfStock ?? '—'}</p>
              </div>
              <AlertTriangle className='w-8 h-8 text-red-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white backdrop-blur-lg border-blue-100'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-600'>Giá trị tồn kho</p>
                <p className='text-lg font-semibold text-blue-600'>{stats ? formatCurrency(stats.totalValue) : '—'}</p>
              </div>
              <Warehouse className='w-8 h-8 text-blue-400' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs + Search */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardContent className='p-4'>
          <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center'>
            {/* Tabs */}
            <div className='flex gap-1 p-1 bg-gray-100 rounded-lg'>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo tên, SKU, mã vạch...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-blue-200 focus:border-blue-500'
              />
            </div>
            {searchQuery && (
              <Button
                variant='outline'
                size='sm'
                className='gap-1 border-red-200 text-red-600 hover:bg-red-50'
                onClick={() => setSearchQuery('')}
              >
                <X className='w-3 h-3' />
                Xóa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Box className='w-5 h-5 text-blue-600' />
            Danh sách tồn kho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='!border-b-2 !border-blue-300'>
                  <TableHead className='w-80'>Sản phẩm</TableHead>
                  <TableHead className='w-32'>SKU</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className='text-right'>Giá bán</TableHead>
                  <TableHead className='text-center'>Tồn kho</TableHead>
                  <TableHead className='text-center'>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-12'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                      <p className='text-gray-500 mt-2'>Đang tải...</p>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-12 text-gray-500'>
                      <Package className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                      Không tìm thấy sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const defaultVariant =
                      product.priceVariants?.find((v) => v.isDefault) || product.priceVariants?.[0]
                    const price = defaultVariant?.price || 0

                    return (
                      <TableRow key={product._id} className='border-b border-blue-100 hover:bg-blue-50/30'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            {product.featuredImage ? (
                              <img
                                src={product.featuredImage}
                                alt={product.name}
                                className='w-10 h-10 rounded-lg object-cover border border-gray-200'
                              />
                            ) : (
                              <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center'>
                                <Package className='w-5 h-5 text-gray-400' />
                              </div>
                            )}
                            <div className='min-w-0'>
                              <p className='font-medium text-gray-900 truncate max-w-[250px]' title={product.name}>
                                {product.name}
                              </p>
                              {product.brand && (
                                <p className='text-xs text-gray-500'>{product.brand.name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='font-mono text-sm text-gray-600'>{product.sku}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100'>
                            {product.category?.name || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <span className='font-semibold text-blue-600'>{formatCurrency(price)}</span>
                        </TableCell>
                        <TableCell className='text-center'>
                          <span
                            className={`text-lg font-bold ${
                              product.stockQuantity <= 0
                                ? 'text-red-600'
                                : product.stockQuantity <= lowStockThreshold
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            }`}
                          >
                            {product.stockQuantity}
                          </span>
                        </TableCell>
                        <TableCell className='text-center'>
                          {getStockBadge(product.stockQuantity, lowStockThreshold)}
                        </TableCell>
                        <TableCell>
                          <span className='text-xs text-gray-500'>
                            {product.updatedAt
                              ? new Date(product.updatedAt).toLocaleDateString('vi-VN')
                              : '—'}
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='gap-1 text-blue-600 border-blue-200 hover:bg-blue-50'
                            onClick={() => openStockDialog(product)}
                          >
                            <Edit3 className='w-3 h-3' />
                            Sửa
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='mt-6'>
              <PaginationComponent
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Edit Dialog */}
      <Dialog open={stockDialog.isOpen} onOpenChange={(open) => !open && setStockDialog({ isOpen: false, product: null, newQuantity: '' })}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Box className='w-5 h-5 text-blue-600' />
              Cập nhật tồn kho
            </DialogTitle>
            <DialogDescription>
              {stockDialog.product && (
                <span className='block mt-1'>
                  <span className='font-medium text-gray-900'>{stockDialog.product.name}</span>
                  <br />
                  <span className='text-xs text-gray-500'>SKU: {stockDialog.product.sku}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='flex items-center gap-4'>
              <div className='flex-1'>
                <Label htmlFor='currentStock' className='text-sm text-gray-500'>
                  Tồn kho hiện tại
                </Label>
                <p className='text-2xl font-bold text-gray-900 mt-1'>{stockDialog.product?.stockQuantity ?? 0}</p>
              </div>
              <div className='text-3xl text-gray-300'>→</div>
              <div className='flex-1'>
                <Label htmlFor='newStock' className='text-sm text-blue-600 font-medium'>
                  Tồn kho mới
                </Label>
                <Input
                  id='newStock'
                  type='number'
                  min='0'
                  value={stockDialog.newQuantity}
                  onChange={(e) => setStockDialog((prev) => ({ ...prev, newQuantity: e.target.value }))}
                  className='mt-1 text-lg font-bold border-2 border-blue-200 focus:border-blue-500'
                  autoFocus
                />
              </div>
            </div>

            {stockDialog.product && stockDialog.newQuantity && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  parseInt(stockDialog.newQuantity) > stockDialog.product.stockQuantity
                    ? 'bg-emerald-50 text-emerald-700'
                    : parseInt(stockDialog.newQuantity) < stockDialog.product.stockQuantity
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-50 text-gray-600'
                }`}
              >
                {parseInt(stockDialog.newQuantity) > stockDialog.product.stockQuantity
                  ? `📦 Nhập thêm ${parseInt(stockDialog.newQuantity) - stockDialog.product.stockQuantity} đơn vị`
                  : parseInt(stockDialog.newQuantity) < stockDialog.product.stockQuantity
                    ? `📤 Giảm ${stockDialog.product.stockQuantity - parseInt(stockDialog.newQuantity)} đơn vị`
                    : '✓ Không thay đổi'}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setStockDialog({ isOpen: false, product: null, newQuantity: '' })}
            >
              Hủy
            </Button>
            <Button
              onClick={handleStockUpdate}
              disabled={updateStockMutation.isPending}
              className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white'
            >
              {updateStockMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
