import { useState, useMemo, useRef, useEffect } from 'react'
import { Grid, List, Search as SearchIcon, Loader2, PackageX } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
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

export function ProductsListingPage() {
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

  // Debounce search query to prevent API calls on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Infinite query for products with server-side filtering
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = useInfiniteQuery({
    queryKey: ['products', 'infinite', debouncedSearchQuery, filters, sortBy],
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
      if (filters.isPrescription !== undefined) {
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
                <Card className='border-blue-100 bg-white'>
                  <CardContent className='p-4 animate-pulse flex gap-3'>
                    <div className='flex-1 h-10 bg-gray-200 rounded'></div>
                    <div className='w-24 h-10 bg-gray-200 rounded'></div>
                  </CardContent>
                </Card>

                {/* Toolbar Skeleton */}
                <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100 animate-pulse'>
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
  if (!isInitialLoading && allProducts.length === 0) {
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
                <Card className='border-blue-100 bg-white w-full'>
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
                          <Button variant='outline' onClick={resetFilters} className='border-blue-200 text-blue-600'>
                            Xóa bộ lọc
                          </Button>
                          <Button
                            onClick={() => (window.location.href = '/')}
                            className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
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
              <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} resultCount={totalProducts} />
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
                      {searchQuery ? `Tìm kiếm: "${searchQuery}"` : 'Tất cả sản phẩm'}
                    </h1>
                    <p className='text-gray-600 mb-4'>
                      {searchQuery
                        ? 'Kết quả tìm kiếm phù hợp với từ khóa của bạn'
                        : 'Khám phá toàn bộ sản phẩm của MediSpace - từ thuốc kê đơn đến sản phẩm chăm sóc sức khỏe'}
                    </p>
                    <div className='text-sm text-gray-600'>
                      Đang hiển thị <span className='font-medium text-blue-600'>{totalProducts}</span> sản phẩm
                      {hasNextPage && <span className='text-gray-500 ml-1'>(tải thêm khi scroll xuống)</span>}
                    </div>
                  </div>
                </StaggerItem>

                {/* Search Bar */}
                <StaggerItem>
                  <Card className='border-blue-100 mb-6'>
                    <CardContent className='p-4'>
                      <form onSubmit={handleFormSubmit} className='flex gap-3'>
                        <div className='flex-1 relative'>
                          <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                          <Input
                            type='text'
                            placeholder='Tìm kiếm sản phẩm, thương hiệu, hoặc thành phần...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='pl-10 border-blue-200 focus:border-blue-500'
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
                          className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                        >
                          Tìm kiếm
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </StaggerItem>

                {/* Toolbar */}
                <StaggerItem>
                  <div className='flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-blue-100'>
                    <div className='flex items-center gap-4'>
                      {/* Sort */}
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-600'>Sắp xếp:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className='w-40 border-blue-200'>
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
                    <div className='flex items-center border border-blue-200 rounded-lg overflow-hidden'>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('grid')}
                        className={
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
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
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
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
                    <div className='w-full h-0.5 bg-blue-50 overflow-hidden relative mb-4 rounded'>
                      <div className='absolute h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-1/3 rounded animate-[progressLoop_1.5s_infinite_ease-in-out]' />
                    </div>
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
                      {allProducts.map((product) => (
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
                <StaggerItem>
                  <div ref={observerTarget} className='py-8 flex justify-center'>
                    {isFetchingNextPage && (
                      <div className='flex items-center gap-3 text-blue-600'>
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
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </EnhancedPageTransition>
  )
}
