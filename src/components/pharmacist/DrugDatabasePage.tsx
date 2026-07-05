import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { AlertTriangle, Info, Loader2, Package, Pill, RotateCcw, Search, X } from 'lucide-react'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { categoryService } from '../../services/categoryService'
import {
  pharmacistDrugDatabaseService,
  type DrugDatabaseProduct,
  type DrugDatabaseQuery,
  type DrugDatabaseResponse,
} from '../../services/pharmacistDrugDatabaseService'
import type { Category } from '../../types/product'
import {
  formatCurrency,
  formatLastUpdated,
  formatStockDisplay,
  getDisplayPrice,
  getRxBadgeConfig,
  getStockStatus,
} from '../../utils/drugDatabaseUtils'

const PAGE_SIZE = 100

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debouncedValue
}

function formatMissingField(field: string) {
  const labels: Record<string, string> = {
    activeIngredients: 'hoạt chất',
    dosageForm: 'dạng bào chế',
    packSize: 'quy cách',
    manufacturer: 'nhà sản xuất',
    indications: 'chỉ định',
    dosageInstructions: 'cách dùng',
    storageInstructions: 'bảo quản',
  }
  return labels[field] || field
}

export function DrugDatabasePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const observerTarget = useRef<HTMLDivElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryId') || 'all')
  const [typeFilter, setTypeFilter] = useState<DrugDatabaseQuery['type']>((searchParams.get('type') as DrugDatabaseQuery['type']) || 'all')
  const [stockFilter, setStockFilter] = useState<DrugDatabaseQuery['stock']>((searchParams.get('stock') as DrugDatabaseQuery['stock']) || 'all')
  const [activeStatus, setActiveStatus] = useState<DrugDatabaseQuery['activeStatus']>((searchParams.get('activeStatus') as DrugDatabaseQuery['activeStatus']) || 'active')
  const [selectedProduct, setSelectedProduct] = useState<DrugDatabaseProduct | null>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, 350)

  const queryBase = useMemo<Omit<DrugDatabaseQuery, 'page' | 'limit'>>(
    () => ({
      search: debouncedSearch,
      categoryId: categoryFilter,
      type: typeFilter,
      stock: stockFilter,
      activeStatus,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
    [activeStatus, categoryFilter, debouncedSearch, stockFilter, typeFilter],
  )

  const syncUrl = (next: Omit<DrugDatabaseQuery, 'page' | 'limit'>) => {
    const params = new URLSearchParams()
    if (next.search) params.set('search', next.search)
    if (next.categoryId && next.categoryId !== 'all') params.set('categoryId', next.categoryId)
    if (next.type && next.type !== 'all') params.set('type', next.type)
    if (next.stock && next.stock !== 'all') params.set('stock', next.stock)
    if (next.activeStatus && next.activeStatus !== 'active') params.set('activeStatus', next.activeStatus)
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    syncUrl(queryBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryBase])

  useEffect(() => {
    let active = true
    const loadCategories = async () => {
      if (categories.length) return
      try {
        const categoryData = await categoryService.getCategories()
        if (active) setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (err) {
        console.error('Error fetching drug categories:', err)
      }
    }

    loadCategories()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useInfiniteQuery<DrugDatabaseResponse, Error>({
    queryKey: ['pharmacist', 'drug-database', queryBase],
    queryFn: ({ pageParam = 1 }) => {
      return pharmacistDrugDatabaseService.getProducts({
        ...queryBase,
        page: pageParam as number,
        limit: PAGE_SIZE,
      })
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.products.length === PAGE_SIZE ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    const currentTarget = observerTarget.current
    if (currentTarget) observer.observe(currentTarget)

    return () => {
      if (currentTarget) observer.unobserve(currentTarget)
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const products = useMemo(() => data?.pages.flatMap((pageData) => pageData.products || []) ?? [], [data])
  const firstPage = data?.pages[0]
  const loadedCount = products.length
  const hasMoreProducts = Boolean(hasNextPage)
  const lowStockThreshold = firstPage?.lowStockThreshold || 30

  const retryProducts = () => {
    refetch()
  }

  const loadDetail = async (product: DrugDatabaseProduct) => {
    try {
      const freshProduct = await pharmacistDrugDatabaseService.getProduct(product._id)
      setSelectedProduct(freshProduct)
    } catch (err) {
      console.error('Error fetching drug detail:', err)
      setDetailError('Không thể tải dữ liệu chi tiết mới nhất.')
    }
  }

  const resetPage = (change: () => void) => {
    change()
  }

  const clearSearch = () => resetPage(() => setSearchQuery(''))

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setTypeFilter('all')
    setStockFilter('all')
    setActiveStatus('active')
  }

  const openDetail = async (product: DrugDatabaseProduct) => {
    setSelectedProduct(product)
    setDetailLoading(true)
    setDetailError(null)
    loadDetail(product).finally(() => {
      setDetailLoading(false)
    })
  }

  const activeChips = [
    searchQuery ? `Từ khóa: ${searchQuery}` : null,
    categoryFilter !== 'all' ? `Danh mục: ${categories.find((cat) => cat._id === categoryFilter)?.name || categoryFilter}` : null,
    typeFilter !== 'all' ? `Loại: ${typeFilter}` : null,
    stockFilter !== 'all' ? `Tồn kho: ${stockFilter}` : null,
    activeStatus !== 'active' ? `Trạng thái: ${activeStatus}` : null,
  ].filter(Boolean)

  const selectedPrice = selectedProduct ? getDisplayPrice(selectedProduct) : null
  const selectedBadge = selectedProduct ? getRxBadgeConfig(selectedProduct) : null
  const selectedStockStatus = selectedProduct ? getStockStatus(selectedProduct.stockQuantity, lowStockThreshold) : null

  return (
    <div className='space-y-6' data-testid='drug-database-page'>
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0A2463]'>Cơ sở dữ liệu thuốc</h1>
            <p className='text-gray-600 mt-1' data-testid='total-count'>
              Đã tải {loadedCount.toLocaleString('vi-VN')} sản phẩm tham chiếu{hasMoreProducts ? '+' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-4' data-testid='filter-bar'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col md:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                autoFocus
                data-testid='search-input'
                type='text'
                value={searchQuery}
                onChange={(event) => resetPage(() => setSearchQuery(event.target.value))}
                placeholder='Tìm theo tên thuốc, hoạt chất, thương hiệu...'
                className='pl-10 pr-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
              {searchQuery && (
                <button
                  type='button'
                  data-testid='clear-search-btn'
                  aria-label='Xóa tìm kiếm'
                  onClick={clearSearch}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>

            <Select value={categoryFilter} onValueChange={(value) => resetPage(() => setCategoryFilter(value))}>
              <SelectTrigger data-testid='category-filter' className='md:w-56 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Danh mục' />
              </SelectTrigger>
              <SelectContent data-testid='category-filter-options'>
                <SelectItem value='all'>Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={(value) => resetPage(() => setStockFilter(value as DrugDatabaseQuery['stock']))}>
              <SelectTrigger data-testid='stock-filter' className='md:w-44 border-2 border-[#BFDBFE]'>
                <SelectValue placeholder='Tồn kho' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả tồn kho</SelectItem>
                <SelectItem value='inStock'>Còn hàng</SelectItem>
                <SelectItem value='lowStock'>Sắp hết hàng</SelectItem>
                <SelectItem value='outOfStock'>Hết hàng</SelectItem>
              </SelectContent>
            </Select>

            <Button data-testid='clear-filters-btn' variant='outline' onClick={clearFilters} className='gap-2'>
              <RotateCcw className='h-4 w-4' />
              Xóa lọc
            </Button>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {(['all', 'Rx', 'OTC'] as const).map((type) => (
              <Button
                key={type}
                type='button'
                data-testid={type === 'Rx' ? 'rxtype-filter-rx' : type === 'OTC' ? 'rxtype-filter-otc' : 'rxtype-filter-all'}
                variant={typeFilter === type ? 'default' : 'outline'}
                size='sm'
                onClick={() => resetPage(() => setTypeFilter(type))}
              >
                {type === 'all' ? 'Tất cả' : type === 'Rx' ? 'Rx' : 'OTC'}
              </Button>
            ))}

            <Select value={activeStatus} onValueChange={(value) => resetPage(() => setActiveStatus(value as DrugDatabaseQuery['activeStatus']))}>
              <SelectTrigger data-testid='active-status-filter' className='h-9 w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Đang hoạt động</SelectItem>
                <SelectItem value='inactive'>Ngưng hoạt động</SelectItem>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              </SelectContent>
            </Select>

            <div className='flex flex-wrap gap-2' data-testid='active-filter-chips'>
              {activeChips.map((chip) => (
                <Badge key={chip} variant='secondary'>
                  {chip}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isError ? (
        <Card data-testid='error-state' className='border-red-200 bg-red-50'>
          <CardContent className='p-8 text-center'>
            <AlertTriangle className='mx-auto h-10 w-10 text-red-500 mb-3' />
            <p className='font-medium text-red-900'>Không thể tải dữ liệu thuốc. Vui lòng thử lại.</p>
            <Button data-testid='retry-btn' className='mt-4' onClick={retryProducts}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : isLoading && !data ? (
        <div data-testid='loading-state' className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} data-testid='skeleton-card' className='bg-white/80 border border-[#E8EDF5]'>
              <CardContent className='p-4 space-y-3'>
                <div className='h-24 rounded-lg bg-gray-100 animate-pulse' />
                <div className='h-4 rounded bg-gray-100 animate-pulse' />
                <div className='h-4 w-2/3 rounded bg-gray-100 animate-pulse' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card data-testid='empty-state' className='bg-white/80 border border-[#E8EDF5]'>
          <CardContent className='p-12 text-center'>
            <Pill className='w-16 h-16 mx-auto text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy thuốc phù hợp</h3>
            <p className='text-gray-500 mb-4'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            <Button data-testid='empty-clear-btn' variant='outline' onClick={clearFilters}>Xóa điều kiện lọc</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {isFetching && !isFetchingNextPage && (
            <div className='w-full h-0.5 bg-[#F0F6FF] overflow-hidden relative rounded'>
              <div className='absolute h-full bg-gradient-to-r from-[#0A2463] to-[#1E40AF] w-1/3 rounded animate-[progressLoop_1.5s_infinite_ease-in-out]' />
            </div>
          )}
          <div data-testid='product-list' className={`grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-300 ${isFetching && !isFetchingNextPage ? 'opacity-60 pointer-events-none' : ''}`}>
            {products.map((product) => {
              const price = getDisplayPrice(product)
              const badge = getRxBadgeConfig(product)
              const stockStatus = getStockStatus(product.stockQuantity, lowStockThreshold)
              return (
                <Card
                  key={product._id}
                  data-testid='product-card'
                  data-product-name={product.name}
                  data-category-id={product.categoryId}
                  data-rx={String(product.requiresPrescription)}
                  className='bg-white/80 shadow-lg rounded-xl border border-[#E8EDF5] hover:shadow-xl transition-all cursor-pointer focus-within:ring-2 focus-within:ring-[#1E40AF]'
                  onClick={() => openDetail(product)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between mb-2 gap-2'>
                      <div className='flex flex-wrap gap-1'>
                        <Badge data-testid='rx-badge' className={`${badge.className} text-xs`}>{product.requiresPrescription ? 'Rx' : 'OTC'}</Badge>
                        {!product.isActive && <Badge data-testid='inactive-badge' className='bg-gray-800 text-white text-xs'>Ngưng</Badge>}
                        {product.status === 'discontinued' && <Badge data-testid='discontinued-badge' className='bg-gray-600 text-white text-xs'>Ngừng KD</Badge>}
                      </div>
                      {stockStatus === 'low_stock' && <Badge data-testid='low-stock-badge' className='bg-yellow-500 text-white text-xs'>Sắp hết</Badge>}
                      {stockStatus === 'out_of_stock' && <Badge data-testid='out-stock-badge' className='bg-gray-500 text-white text-xs'>Hết hàng</Badge>}
                    </div>

                    <div className='w-full h-24 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden'>
                      <ImageWithFallback src={product.featuredImage} alt={product.name} className='w-full h-full object-contain' />
                    </div>

                    <h3 data-testid='product-name' className='font-medium text-gray-900 text-sm line-clamp-2 mb-1'>{product.name}</h3>
                    <p data-testid='product-brand' className='text-xs text-gray-500 mb-2'>{product.brand?.name || 'Không có thương hiệu'}</p>
                    {product.details?.activeIngredients && <p className='text-xs text-[#1E40AF] mb-2 line-clamp-1'>{product.details.activeIngredients}</p>}

                    <Separator className='my-2' />
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p data-testid='product-price' className='text-[#1E40AF] font-semibold text-sm'>{formatCurrency(price.price)}</p>
                        <p data-testid='product-unit' className='text-xs text-gray-500'>/ {price.unit}</p>
                      </div>
                      <div className='flex items-center gap-1 text-xs'>
                        <Package className='w-3 h-3 text-gray-400' />
                        <span data-testid='stock-status' className={stockStatus === 'out_of_stock' ? 'text-red-500' : stockStatus === 'low_stock' ? 'text-yellow-700' : 'text-green-600'}>
                          {formatStockDisplay(product.stockQuantity, price.unit, lowStockThreshold)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!isError && !isLoading && products.length > 0 && (
        <div ref={observerTarget} data-testid='load-more' className='py-8 flex justify-center'>
          {isFetchingNextPage && (
            <div className='flex items-center gap-3 text-[#1E40AF]' data-testid='load-more-spinner'>
              <Loader2 className='w-6 h-6 animate-spin' />
              <span className='text-sm font-medium'>Đang tải thêm thuốc...</span>
            </div>
          )}
          {!hasNextPage && products.length > 0 && (
            <div className='text-center text-gray-500 text-sm' data-testid='all-products-loaded'>
              <p className='font-medium'>Đã hiển thị tất cả {products.length.toLocaleString('vi-VN')} thuốc</p>
              <p className='text-xs mt-1'>Không còn thuốc nào để tải</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent data-testid='product-detail' className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className='flex flex-wrap items-center gap-3'>
                  <span>{selectedProduct.name}</span>
                  {selectedBadge && <Badge className={selectedBadge.className}>{selectedBadge.label}</Badge>}
                  {selectedStockStatus === 'out_of_stock' && <Badge className='bg-gray-500 text-white'>Hết hàng</Badge>}
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct.brand?.name || 'Không có thương hiệu'} · {selectedProduct.lastCheckedAt ? `Kiểm tra ${formatLastUpdated(selectedProduct.lastCheckedAt)}` : 'Đang kiểm tra'}
                </DialogDescription>
              </DialogHeader>

              {detailLoading && <p data-testid='detail-loading' className='text-sm text-gray-500 flex items-center gap-2'><Loader2 className='h-4 w-4 animate-spin' />Đang tải dữ liệu mới nhất...</p>}
              {detailError && <div data-testid='detail-error-state' className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800'>{detailError}</div>}

              {selectedProduct.requiresPrescription && (
                <div data-testid='rx-warning' className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex gap-2'>
                  <AlertTriangle className='h-5 w-5 shrink-0' />
                  Thuốc kê đơn. Cần kiểm tra đơn thuốc và tư vấn theo chỉ định bác sĩ trước khi tạo đơn.
                </div>
              )}

              {selectedProduct.dataQuality && !selectedProduct.dataQuality.clinicalReferenceReady && (
                <div data-testid='data-quality-warning' className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900'>
                  Dữ liệu lâm sàng chưa đầy đủ: {selectedProduct.dataQuality.missingClinicalFields.map(formatMissingField).join(', ')}.
                </div>
              )}

              <Tabs defaultValue='info' className='space-y-4'>
                <TabsList className='grid w-full grid-cols-4 bg-[#F0F6FF]'>
                  <TabsTrigger data-testid='tab-medical-info' value='info'>Thông tin</TabsTrigger>
                  <TabsTrigger data-testid='tab-warnings' value='usage'>Cách dùng</TabsTrigger>
                  <TabsTrigger data-testid='tab-stock' value='stock'>Tồn kho</TabsTrigger>
                  <TabsTrigger data-testid='tab-pricing' value='pricing'>Giá bán</TabsTrigger>
                </TabsList>

                <TabsContent value='info' data-testid='medical-info-section' className='space-y-4'>
                  <div className='flex gap-4'>
                    <div className='w-32 h-32 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                      <ImageWithFallback src={selectedProduct.featuredImage} alt={selectedProduct.name} className='w-full h-full object-contain' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg text-gray-900 mb-2'>{selectedProduct.name}</h3>
                      <p className='text-gray-600 text-sm'>{selectedProduct.shortDescription || 'Chưa có thông tin'}</p>
                      <p data-testid='last-updated' className='mt-2 text-xs text-gray-500'>Cập nhật: {formatLastUpdated(selectedProduct.updatedAt || selectedProduct.lastCheckedAt)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className='grid md:grid-cols-2 gap-4 text-sm'>
                    <div><span className='text-gray-500'>Hoạt chất</span><p className='font-medium'>{selectedProduct.details?.activeIngredients || 'Chưa có thông tin'}</p></div>
                    <div><span className='text-gray-500'>Dạng bào chế</span><p>{selectedProduct.details?.dosageForm || 'Chưa có thông tin'}</p></div>
                    <div><span className='text-gray-500'>Quy cách</span><p>{selectedProduct.details?.packSize || selectedProduct.packaging || 'Chưa có thông tin'}</p></div>
                    <div><span className='text-gray-500'>Nhà sản xuất</span><p>{selectedProduct.details?.manufacturer || selectedProduct.brand?.name || 'Chưa có thông tin'}</p></div>
                    <div><span className='text-gray-500'>SKU</span><p className='font-mono'>{selectedProduct.sku}</p></div>
                    <div><span className='text-gray-500'>Danh mục</span><p>{selectedProduct.category?.name || 'Chưa có thông tin'}</p></div>
                  </div>
                  <div className='rounded-lg border border-[#BFDBFE] bg-[#F0F6FF] p-4'>
                    <span className='text-sm font-medium text-blue-800'>Chỉ định</span>
                    <p>{selectedProduct.details?.indications || 'Chưa có thông tin'}</p>
                  </div>
                </TabsContent>

                <TabsContent value='usage' data-testid='warnings-section' className='space-y-4'>
                  <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                    <span className='text-sm font-medium text-green-800'>Liều dùng & Cách dùng</span>
                    <p className='whitespace-pre-line'>{selectedProduct.details?.dosageInstructions || 'Chưa có thông tin'}</p>
                  </div>
                  <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                    <span className='text-sm font-medium text-yellow-800 flex items-center gap-2'><AlertTriangle className='h-4 w-4' />Cảnh báo</span>
                    {selectedProduct.warnings?.length ? selectedProduct.warnings.map((warning, index) => <p key={index}>{warning}</p>) : <p>Chưa có thông tin</p>}
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <span className='text-sm font-medium text-gray-700'>Bảo quản</span>
                    <p>{selectedProduct.details?.storageInstructions || 'Chưa có thông tin'}</p>
                  </div>
                </TabsContent>

                <TabsContent value='stock' data-testid='stock-section' className='space-y-4'>
                  <div className='grid md:grid-cols-3 gap-4'>
                    <div className='p-4 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg text-center'><Package className='w-8 h-8 mx-auto mb-2 text-[#1E40AF]' /><p className='text-2xl font-bold text-[#1E40AF]'>{selectedProduct.stockQuantity.toLocaleString('vi-VN')}</p><p className='text-sm text-gray-600'>Tồn kho</p></div>
                    <div className='p-4 bg-green-50 border border-green-200 rounded-lg text-center'><Info className='w-8 h-8 mx-auto mb-2 text-green-600' /><p className='text-2xl font-bold text-green-600'>{selectedProduct.maxOrderQuantity}</p><p className='text-sm text-gray-600'>Tối đa/đơn</p></div>
                    <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg text-center'><Info className='w-8 h-8 mx-auto mb-2 text-gray-600' /><p className='text-lg font-bold text-gray-700'>{selectedProduct.status}</p><p className='text-sm text-gray-600'>Trạng thái</p></div>
                  </div>
                </TabsContent>

                <TabsContent value='pricing' data-testid='pricing-section' className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    {(selectedProduct.priceVariants?.length ? selectedProduct.priceVariants : [{ unit: selectedPrice?.unit || 'Sản phẩm', price: selectedPrice?.price || 0, isDefault: true, quantityPerUnit: 1 }]).map((variant, index) => (
                      <div key={`${variant.unit}-${index}`} data-testid='price-variant' className={`p-4 rounded-lg border ${variant.isDefault ? 'bg-[#F0F6FF] border-[#BFDBFE]' : 'bg-gray-50 border-gray-200'}`}>
                        <div className='flex justify-between mb-2'><span className='font-medium'>{variant.unit}</span>{variant.isDefault && <Badge>Mặc định</Badge>}</div>
                        <p className='text-xl font-bold text-[#1E40AF]'>{formatCurrency(variant.price)}</p>
                        <p className='text-xs text-gray-500'>Quy đổi: {variant.quantityPerUnit || 1} đơn vị nhỏ nhất</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <Button data-testid='close-detail-btn' variant='outline' onClick={() => setSelectedProduct(null)}>Đóng</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
