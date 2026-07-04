import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { FileText, Grid, List, Search as SearchIcon, Loader2, PackageX, ShieldCheck } from 'lucide-react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import { useBreadcrumbGeneration, useDebounce } from '../../hooks'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import type { ProductFilter } from '../../types/product'
import {
  getProductId,
  getProductImage,
  getProductRating,
  getProductReviewCount,
  isProductInStock,
  isProductPrescription,
  getProductSalePrice,
  getProductOriginalPrice,
  getProductUnit,
  getDiscountPercentage,
  isProductOnSale,
  getBrandName,
} from '../../utils/productHelpers'

import { FilterSidebar } from './FilterSidebar'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from './ProductCardSkeleton'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { StaggerContainer, StaggerItem } from '../shared/StaggerContainer'
import { ScrollReveal } from '../shared/ScrollReveal'

import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { productService } from '../../services/productService'
import { prescriptionsAPI } from '~/lib/api/prescriptions'

const PRESCRIPTION_CHECKOUT_STORAGE_KEY = 'medispace_checkout_prescription_id'

interface PrescriptionContext {
  _id: string
  prescriptionNumber: string
  doctorName?: string
  status: string
  medications?: Array<{
    productName?: string
    productId?: string
  }>
}

export function ProductsListingPage() {
  const [searchParams] = useSearchParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const observerTarget = useRef<HTMLDivElement>(null)

  // Local UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: [0, 10000000] as [number, number],
    rating: 0,
    inStock: false,
    isPrescription: undefined as boolean | undefined,
  })
  const prescriptionId = searchParams.get('prescriptionId') || ''
  const isPrescriptionRefill = Boolean(prescriptionId && searchParams.get('rx') === 'verified')

  const { data: prescriptionContext, isLoading: isLoadingPrescriptionContext } = useQuery({
    queryKey: ['products', 'prescription-context', prescriptionId],
    queryFn: async () => {
      const response = (await prescriptionsAPI.getPrescription(prescriptionId)) as { result?: PrescriptionContext }
      return response.result || null
    },
    enabled: isPrescriptionRefill,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const mappedProductIds = useMemo(() => {
    return new Set(
      (prescriptionContext?.medications || [])
        .map((medication) => medication.productId)
        .filter((productId): productId is string => Boolean(productId)),
    )
  }, [prescriptionContext])

  const prescriptionMedications = prescriptionContext?.medications || []

  const { data: mappedProducts = [], isLoading: isLoadingMappedProducts } = useQuery({
    queryKey: ['products', 'prescription-mapped-products', prescriptionId, Array.from(mappedProductIds).sort()],
    queryFn: async () => {
      const products = await Promise.all(Array.from(mappedProductIds).map((productId) => productService.getProductById(productId)))
      return products.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof productService.getProductById>>>[]
    },
    enabled: isPrescriptionRefill && mappedProductIds.size > 0,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (!isPrescriptionRefill) return
    setFilters((current) => (current.isPrescription === true ? current : { ...current, isPrescription: true }))
  }, [isPrescriptionRefill])

  // Debounce search query to prevent API calls on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Infinite query for products with server-side filtering
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = useInfiniteQuery({
    queryKey: ['products', 'infinite', debouncedSearchQuery, filters, sortBy, isPrescriptionRefill],
    queryFn: ({ pageParam = 1 }) => {
      // Build query params for server-side filtering
      const params: Record<string, unknown> = {
        page: pageParam,
        limit: 100,
      }

      // Add search - use debounced value
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }

      // Add sorting
      switch (sortBy) {
        case 'newest':
          params.sortBy = 'createdAt'
          params.sortOrder = 'desc'
          break
        case 'price-asc':
          params.sortBy = 'price'
          params.sortOrder = 'asc'
          break
        case 'price-desc':
          params.sortBy = 'price'
          params.sortOrder = 'desc'
          break
        case 'rating':
          params.sortBy = 'rating'
          params.sortOrder = 'desc'
          break
        case 'bestseller':
          params.sortBy = 'reviewCount'
          params.sortOrder = 'desc'
          break
      }

      // Add filters
      if (filters.categories.length > 0) {
        params.categoryId = filters.categories[0] // Backend expects single category
      }
      if (filters.brands.length > 0) {
        params.brandId = filters.brands[0]
      }
      if (isPrescriptionRefill) {
        params.requiresPrescription = true
      } else if (filters.isPrescription !== undefined) {
        params.requiresPrescription = filters.isPrescription
      }
      if (filters.inStock) {
        params.inStock = true
      }
      if (filters.priceRange[0] > 0) {
        params.minPrice = filters.priceRange[0]
      }
      if (filters.priceRange[1] < 10000000) {
        params.maxPrice = filters.priceRange[1]
      }

      return productService.getProducts(params)
    },
    getNextPageParam: (lastPage, allPages) => {
      // Continue if we got full page (100 items)
      return lastPage.length === 100 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })

  // Intersection Observer for infinite scroll
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
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Handle search submit
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Query will auto-refetch due to queryKey change
  }

  // Handle filter changes from FilterSidebar
  const handleFiltersChange = (newFilters: ProductFilter) => {
    setFilters({
      categories: newFilters.categories || [],
      brands: newFilters.brands || [],
      priceRange: newFilters.priceRange || [0, 10000000],
      rating: newFilters.rating || 0,
      inStock: newFilters.inStock || false,
      isPrescription: newFilters.isPrescription,
    })
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 10000000],
      rating: 0,
      inStock: false,
      isPrescription: undefined,
    })
    setSearchQuery('')
  }

  // Total products count from all loaded pages
  const totalProducts = useMemo(() => {
    return data?.pages.reduce((sum, page) => sum + page.length, 0) ?? 0
  }, [data])

  // All products flattened
  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? []
  }, [data])

  const displayedProducts = useMemo(() => {
    if (isPrescriptionRefill && mappedProductIds.size > 0) return mappedProducts
    if (isPrescriptionRefill && mappedProductIds.size === 0 && !debouncedSearchQuery) return []
    return allProducts
  }, [allProducts, debouncedSearchQuery, isPrescriptionRefill, mappedProductIds.size, mappedProducts])

  const shouldShowUnmappedPrescriptionState =
    isPrescriptionRefill && mappedProductIds.size === 0 && !debouncedSearchQuery && !isLoadingPrescriptionContext

  // Breadcrumb generation
  const breadcrumbItems = useBreadcrumbGeneration({ searchQuery })

  // Handle form submit for search
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch(e)
  }

  // Show full loading screen only on initial load (no data yet)
  const isInitialLoading = isLoading && !data

  // Loading state - show skeleton loader on initial load
  if (isInitialLoading) {
    return (
      <EnhancedPageTransition variant='slide' direction='up'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <div className='flex flex-col xl:flex-row gap-6'>
            {/* Sidebar */}
            <ScrollReveal direction='left' delay={0.2}>
              <div className='w-full xl:w-80 lg:w-72 xl:sticky xl:top-4 xl:self-start shrink-0'>
                <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} resultCount={0} />
              </div>
            </ScrollReveal>

            {/* Skeleton Content */}
            <ScrollReveal direction='right' delay={0.3} className='flex-1 w-full'>
              <div className='w-full space-y-6'>
                {/* Header Skeleton */}
                <div className='animate-pulse space-y-2'>
                  <div className='h-8 bg-gray-200 rounded w-48'></div>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-4 bg-gray-200 rounded w-32'></div>
                </div>

                {/* Search Bar Skeleton */}
                <Card className='border-[#E8EDF5] bg-white'>
                  <CardContent className='p-4 animate-pulse flex gap-3'>
                    <div className='flex-1 h-10 bg-gray-200 rounded'></div>
                    <div className='w-24 h-10 bg-gray-200 rounded'></div>
                  </CardContent>
                </Card>

                {/* Toolbar Skeleton */}
                <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-[#E8EDF5] animate-pulse'>
                  <div className='h-8 bg-gray-200 rounded w-48'></div>
                  <div className='h-8 bg-gray-200 rounded w-24'></div>
                </div>

                {/* Products Grid Skeleton */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4 w-full'}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <ProductCardSkeleton key={i} variant={viewMode} />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </EnhancedPageTransition>
    )
  }

  // Empty state (after loading is complete)
  if (
    !isInitialLoading &&
    displayedProducts.length === 0 &&
    !isLoadingMappedProducts &&
    !shouldShowUnmappedPrescriptionState &&
    !(isPrescriptionRefill && isLoadingPrescriptionContext)
  ) {
    return (
      <EnhancedPageTransition variant='slide' direction='up'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <div className='flex flex-col xl:flex-row gap-6'>
            <ScrollReveal direction='left' delay={0.2}>
              <div className='w-full xl:w-80 lg:w-72 xl:sticky xl:top-4 xl:self-start shrink-0'>
                <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} resultCount={0} />
              </div>
            </ScrollReveal>

            <ScrollReveal direction='right' delay={0.3} className='flex-1 w-full'>
              <div className='w-full'>
                <Card className='border-[#E8EDF5] bg-white w-full'>
                  <CardContent className='p-12 text-center flex flex-col items-center justify-center min-h-[400px]'>
                    <StaggerContainer direction='up' staggerDelay={0.2}>
                      <StaggerItem>
                        <PackageX className='w-16 h-16 text-blue-300 mx-auto mb-4' strokeWidth={1.5} />
                      </StaggerItem>
                      <StaggerItem>
                        <h3 className='text-xl font-medium text-gray-900 mb-2'>Không tìm thấy sản phẩm phù hợp</h3>
                      </StaggerItem>
                      <StaggerItem>
                        <p className='text-gray-600 mb-6'>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm khác</p>
                      </StaggerItem>
                      <StaggerItem>
                        <div className='flex justify-center gap-4'>
                          <Button variant='outline' onClick={resetFilters} className='border-[#BFDBFE] text-[#1E40AF]'>
                            Xóa bộ lọc
                          </Button>
                          <Button
                            onClick={() => (window.location.href = '/')}
                            className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white'
                          >
                            Về trang chủ
                          </Button>
                        </div>
                      </StaggerItem>
                    </StaggerContainer>
                  </CardContent>
                </Card>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </EnhancedPageTransition>
    )
  }

  return (
    <EnhancedPageTransition variant='default' duration={0.6}>
      <UniversalBreadcrumb items={breadcrumbItems} />
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <ScrollReveal direction='up'>
          <div></div>
        </ScrollReveal>

        <div className='flex flex-col xl:flex-row gap-6'>
          {/* Sidebar */}
          <ScrollReveal direction='left' delay={0.2}>
            <div className='w-full xl:w-80 lg:w-72 xl:sticky xl:top-4 xl:self-start shrink-0 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin'>
              <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} resultCount={displayedProducts.length} />
            </div>
          </ScrollReveal>

          {/* Main Content */}
          <ScrollReveal direction='right' delay={0.3}>
            <div className='flex-1 min-w-0'>
              <StaggerContainer direction='up' staggerDelay={0.1}>
                {/* Header */}
                <StaggerItem>
                  <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-blue-800 mb-2'>
                      {isPrescriptionRefill
                        ? 'Mua / nạp lại thuốc theo đơn'
                        : searchQuery
                          ? `Tìm kiếm: "${searchQuery}"`
                          : 'Tất cả sản phẩm'}
                    </h1>
                    <p className='text-gray-600 mb-4'>
                      {isPrescriptionRefill
                        ? 'Các sản phẩm kê đơn được lọc theo đơn thuốc đã xác minh. Nếu đơn có thuốc đã khớp kho, hệ thống ưu tiên hiển thị đúng sản phẩm đã khớp.'
                        : searchQuery
                          ? 'Kết quả tìm kiếm phù hợp với từ khóa của bạn'
                          : 'Khám phá toàn bộ sản phẩm của MediSpace - từ thuốc kê đơn đến sản phẩm chăm sóc sức khỏe'}
                    </p>
                    <div className='text-sm text-gray-600'>
                      {shouldShowUnmappedPrescriptionState ? (
                        <span>Chưa có sản phẩm khớp kho tự động, vui lòng tìm theo tên thuốc trong đơn</span>
                      ) : (
                        <>
                          Đang hiển thị <span className='font-medium text-[#1E40AF]'>{displayedProducts.length}</span> sản phẩm
                          {hasNextPage && mappedProductIds.size === 0 && <span className='text-gray-500 ml-1'>(tải thêm khi scroll xuống)</span>}
                        </>
                      )}
                    </div>
                  </div>
                </StaggerItem>

                {isPrescriptionRefill && (
                  <StaggerItem>
                    <Card className='border-[#BFDBFE] bg-[#F0F6FF] mb-6'>
                      <CardContent className='p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#0A2463] shrink-0'>
                            <FileText className='w-5 h-5' />
                          </div>
                          <div>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <p className='font-semibold text-blue-900'>Đang mua theo đơn thuốc đã xác minh</p>
                              <span className='inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 border border-green-200 rounded px-2 py-0.5'>
                                <ShieldCheck className='w-3 h-3' /> Verified
                              </span>
                            </div>
                            <p className='text-sm text-gray-700 mt-1'>
                              {isLoadingPrescriptionContext
                                ? 'Đang tải thông tin đơn thuốc...'
                                : prescriptionContext?.prescriptionNumber
                                  ? `Đơn #${prescriptionContext.prescriptionNumber}${prescriptionContext.doctorName ? ` · BS. ${prescriptionContext.doctorName}` : ''}`
                                  : `Đơn #${prescriptionId}`}
                            </p>
                            <p className='text-xs text-gray-600 mt-1'>
                              {mappedProductIds.size > 0
                                ? `Đã tìm thấy ${mappedProductIds.size} sản phẩm khớp từ đơn thuốc.`
                                : 'Chưa có sản phẩm khớp kho tự động, hãy tìm theo tên thuốc trong đơn để chọn sản phẩm phù hợp.'}
                            </p>
                          </div>
                        </div>
                        <Link to={`/account/prescriptions/${prescriptionId}`} className='shrink-0'>
                          <Button variant='outline' className='border-[#BFDBFE] text-[#0A2463] hover:bg-white'>
                            Xem đơn thuốc
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )}

                {/* Search Bar */}
                <StaggerItem>
                  <Card className='border-[#E8EDF5] mb-6'>
                    <CardContent className='p-4'>
                      <form onSubmit={handleFormSubmit} className='flex gap-3'>
                        <div className='flex-1 relative'>
                          <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                          <Input
                            type='text'
                            placeholder='Tìm kiếm sản phẩm, thương hiệu, hoặc thành phần...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='pl-10 border-[#BFDBFE] focus:border-[#1E40AF]'
                          />
                          {/* Small loading indicator when searching */}
                          {isFetching && !isInitialLoading && (
                            <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                              <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
                            </div>
                          )}
                        </div>
                        <Button
                          type='submit'
                          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'
                        >
                          Tìm kiếm
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </StaggerItem>

                {/* Toolbar */}
                <StaggerItem>
                  <div className='flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-[#E8EDF5]'>
                    <div className='flex items-center gap-4'>
                      {/* Sort */}
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-600'>Sắp xếp:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className='w-40 border-[#BFDBFE]'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='newest'>Mới nhất</SelectItem>
                            <SelectItem value='price-asc'>Giá tăng dần</SelectItem>
                            <SelectItem value='price-desc'>Giá giảm dần</SelectItem>
                            <SelectItem value='bestseller'>Bán chạy</SelectItem>
                            <SelectItem value='rating'>Đánh giá cao</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* View toggle */}
                    <div className='flex items-center border border-[#BFDBFE] rounded-lg overflow-hidden'>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('grid')}
                        className={
                          viewMode === 'grid'
                            ? 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white'
                            : 'text-gray-600'
                        }
                      >
                        <Grid className='w-4 h-4' />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('list')}
                        className={
                          viewMode === 'list'
                            ? 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white'
                            : 'text-gray-600'
                        }
                      >
                        <List className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </StaggerItem>

                {/* Products Grid/List */}
                <StaggerItem>
                  {isFetching && !isInitialLoading && (
                    <div className='w-full h-0.5 bg-[#F0F6FF] overflow-hidden relative mb-4 rounded'>
                      <div className='absolute h-full bg-gradient-to-r from-[#0A2463] to-[#1E40AF] w-1/3 rounded animate-[progressLoop_1.5s_infinite_ease-in-out]' />
                    </div>
                  )}
                  {shouldShowUnmappedPrescriptionState && (
                    <Card className='border-[#E8EDF5] bg-white mb-8'>
                      <CardContent className='p-5'>
                        <h3 className='font-semibold text-blue-900 mb-2'>Thuốc trong đơn cần tìm</h3>
                        <p className='text-sm text-gray-600 mb-4'>
                          Đơn này chưa được khớp trực tiếp với sản phẩm trong kho. Bạn có thể nhập tên thuốc bên dưới để tìm sản phẩm tương ứng.
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {prescriptionMedications.length > 0 ? (
                            prescriptionMedications.map((medication, index) => (
                              <button
                                key={`${medication.productName || 'medication'}-${index}`}
                                type='button'
                                onClick={() => setSearchQuery(medication.productName || '')}
                                className='rounded-lg border border-[#BFDBFE] bg-[#F0F6FF] px-3 py-2 text-left text-sm text-[#0A2463] hover:bg-[#E8EDF5]'
                              >
                                <span className='font-medium'>{medication.productName || `Thuốc ${index + 1}`}</span>
                              </button>
                            ))
                          ) : (
                            <p className='text-sm text-gray-500'>Đơn thuốc chưa có danh sách thuốc OCR.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <StaggerContainer direction='up' staggerDelay={0.05}>
                    <div
                      className={`
                        ${
                          viewMode === 'grid'
                            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                            : 'space-y-4 w-full max-w-5xl'
                        }
                        mb-8
                        transition-all duration-300
                        ${isFetching && !isInitialLoading ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      {displayedProducts.map((product) => (
                        <StaggerItem key={getProductId(product)}>
                          <ProductCard
                            product={{
                              id: getProductId(product),
                              name: product.name,
                              slug: product.slug,
                              brand: getBrandName(product),
                              image: getProductImage(product),
                              originalPrice: getProductOriginalPrice(product),
                              salePrice: getProductSalePrice(product) || 0,
                              discountPercentage: getDiscountPercentage(product),
                              rating: getProductRating(product),
                              reviewCount: getProductReviewCount(product),
                              inStock: isProductInStock(product),
                              isPrescription: isProductPrescription(product),
                              isOnSale: isProductOnSale(product),
                              unit: getProductUnit(product),
                              priceVariants: product.priceVariants,
                            }}
                            variant={viewMode}
                            onAddToCart={(selectedUnit) => {
                              const variant = product.priceVariants?.find((v) => v.unit === selectedUnit)
                              const price = variant?.price || product.priceVariants?.[0]?.price
                              if (isPrescriptionRefill && prescriptionId) {
                                sessionStorage.setItem(PRESCRIPTION_CHECKOUT_STORAGE_KEY, prescriptionId)
                              }
                              addToCart(product, 1, selectedUnit, price)
                            }}
                            onToggleWishlist={() => {
                              toggleWishlist(getProductId(product))
                            }}
                            isInWishlist={isInWishlist(getProductId(product))}
                          />
                        </StaggerItem>
                      ))}
                    </div>
                  </StaggerContainer>
                </StaggerItem>

                {/* Infinite scroll trigger + loading indicator */}
                {mappedProductIds.size === 0 && (
                <StaggerItem>
                  <div ref={observerTarget} className='py-8 flex justify-center'>
                    {isFetchingNextPage && (
                      <div className='flex items-center gap-3 text-[#1E40AF]'>
                        <Loader2 className='w-6 h-6 animate-spin' />
                        <span className='text-sm font-medium'>Đang tải thêm sản phẩm...</span>
                      </div>
                    )}
                    {!hasNextPage && allProducts.length > 0 && (
                      <div className='text-center text-gray-500 text-sm'>
                        <p className='font-medium'>Đã hiển thị tất cả {allProducts.length} sản phẩm</p>
                        <p className='text-xs mt-1'>Không còn sản phẩm nào để tải</p>
                      </div>
                    )}
                  </div>
                </StaggerItem>
                )}
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </EnhancedPageTransition>
  )
}
