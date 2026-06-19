import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Search, Filter, Grid, List, SlidersHorizontal, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { ProductCard } from '../products/ProductCard'
import { EmptyState } from '../shared/EmptyState'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { useTrending, useRelated } from '../../hooks/product/useRecommendations'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { brandService } from '../../services/brandService'
import { searchService } from '../../services/searchService'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import type { Category, Brand, Product, PriceVariant } from '../../types/product'
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

export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const observerTarget = useRef<HTMLDivElement>(null)

  // Trending fallback khi 0 kết quả
  const { products: trendingProducts, loading: trendingLoading, algorithm: trendingAlgorithm } = useTrending(8)

  // Related khi 1–5 kết quả — firstResultId cập nhật sau khi query resolve
  const [firstResultId, setFirstResultId] = useState('')
  const { products: relatedProducts, loading: relatedLoading, algorithm: relatedAlgorithm } = useRelated(firstResultId, 8)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Collapse states for filters
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true)
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true)

  // Search filters state
  const searchQuery = searchParams.get('q') || ''
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 10000000])
  const [prescriptionType, setPrescriptionType] = useState('all')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')

  // Fetch categories and brands for filters
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          categoryService.getCategories(),
          brandService.getBrands(),
        ])
        setCategories(categoriesData)
        setBrands(brandsData)
      } catch {
        // Handle error
      }
    }
    fetchFilters()
  }, [])

  // Infinite query for products with server-side filtering using Typesense Search
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [
      'search',
      searchQuery,
      selectedCategories,
      selectedBrands,
      priceRange,
      prescriptionType,
      inStockOnly,
      sortBy,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = {
        q: searchQuery || '*',
        page: pageParam,
        limit: 100,
      }

      // Add sorting
      if (sortBy === 'price_asc' || sortBy === 'price_desc' || sortBy === 'rating' || sortBy === 'newest' || sortBy === 'relevance') {
        params.sortBy = sortBy
      } else if (sortBy === 'bestseller') {
        params.sortBy = 'rating'
      } else {
        params.sortBy = 'relevance'
      }

      // Add filters
      if (selectedCategories.length > 0) {
        const category = categories.find((c) => c.slug === selectedCategories[0])
        if (category) params.categoryId = category._id
      }
      if (selectedBrands.length > 0) {
        params.brandId = selectedBrands[0]
      }
      if (prescriptionType !== 'all') {
        params.requiresPrescription = prescriptionType === 'prescription'
      }
      if (inStockOnly) {
        params.inStock = true
      }
      if (priceRange[0] > 0 || priceRange[1] < 10000000) {
        params.priceMin = priceRange[0]
        params.priceMax = priceRange[1]
      }

      const res = await searchService.searchProducts(params)
      const products = (res?.hits || []).map((hit) => {
        const doc = hit.document as any
        let priceVariants = []
        if (doc.priceVariantsJson) {
          try {
            priceVariants = JSON.parse(doc.priceVariantsJson)
          } catch {
            // ignore
          }
        }
        return {
          ...doc,
          id: doc.mongoId,
          _id: doc.mongoId,
          brand: doc.brandName || 'Unknown',
          category: { name: doc.categoryName || '' },
          priceVariants,
          image: doc.featuredImage,
          isPrescription: doc.requiresPrescription,
        } as unknown as Product
      })

      return {
        products,
        found: res?.found ?? 0,
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.flatMap((page) => page.products).length
      return totalLoaded < lastPage.found ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
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

  // All products from server — sort OTC before prescription when no explicit filter
  const allProducts = useMemo(() => {
    const products = data?.pages.flatMap((page) => page.products) ?? []
    // Only apply OTC priority when user hasn't filtered by prescription type explicitly
    if (prescriptionType === 'all') {
      // Stable sort: OTC (requiresPrescription=false) trước kê đơn (true)
      return [...products].sort((a, b) => {
        const aRx = a.requiresPrescription ? 1 : 0
        const bRx = b.requiresPrescription ? 1 : 0
        return aRx - bRx
      })
    }
    return products
  }, [data, prescriptionType])

  // Cập nhật firstResultId khi kết quả thay đổi
  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      setFirstResultId('')
      return
    }
    const id = getProductId(allProducts[0]) || ''
    setFirstResultId(id)
  }, [allProducts])

  const totalResults = data?.pages[0]?.found ?? 0

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedBrands([])
    setPriceRange([0, 10000000])
    setPrescriptionType('all')
    setInStockOnly(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  // Create breadcrumb items for MainLayout
  const breadcrumbItems = [
    { label: 'Tìm kiếm', href: '/search' },
    ...(searchQuery ? [{ label: `"${searchQuery}"` }] : []),
  ]

  const FilterContent = () => (
    <div className='space-y-6'>
      {/* Categories - Scrollable checkbox list */}
      <div>
        <button
          onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          className='flex items-center justify-between w-full mb-3 hover:opacity-70 transition-opacity'
        >
          <Label className='font-medium cursor-pointer'>Danh mục</Label>
          {isCategoriesExpanded ? (
            <ChevronUp className='w-4 h-4 text-gray-500' />
          ) : (
            <ChevronDown className='w-4 h-4 text-gray-500' />
          )}
        </button>
        {isCategoriesExpanded && (
          <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
            {categories.map((category) => (
              <div key={category._id} className='flex items-center space-x-2'>
                <Checkbox
                  id={`category-${category._id}`}
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category.slug])
                    } else {
                      setSelectedCategories(selectedCategories.filter((c) => c !== category.slug))
                    }
                  }}
                />
                <Label htmlFor={`category-${category._id}`} className='text-sm cursor-pointer'>
                  {category.name} ({category.productCount || 0})
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      <div>
        <button
          onClick={() => setIsBrandsExpanded(!isBrandsExpanded)}
          className='flex items-center justify-between w-full mb-3 hover:opacity-70 transition-opacity'
        >
          <Label className='font-medium cursor-pointer'>Thương hiệu</Label>
          {isBrandsExpanded ? (
            <ChevronUp className='w-4 h-4 text-gray-500' />
          ) : (
            <ChevronDown className='w-4 h-4 text-gray-500' />
          )}
        </button>
        {isBrandsExpanded && (
          <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
            {brands.map((brand) => (
              <div key={brand._id} className='flex items-center space-x-2'>
                <Checkbox
                  id={`brand-${brand._id}`}
                  checked={selectedBrands.includes(brand._id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBrands([...selectedBrands, brand._id])
                    } else {
                      setSelectedBrands(selectedBrands.filter((b) => b !== brand._id))
                    }
                  }}
                />
                <Label htmlFor={`brand-${brand._id}`} className='text-sm cursor-pointer'>
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div>
        <Label className='font-medium mb-3 block'>Khoảng giá</Label>
        <div className='space-y-3'>
          <Slider value={priceRange} onValueChange={setPriceRange} max={10000000} step={50000} className='w-full' />
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Prescription Type */}
      <div>
        <Label className='font-medium mb-3 block'>Loại thuốc</Label>
        <div className='space-y-2'>
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'otc', label: 'Không kê đơn' },
            { value: 'prescription', label: 'Kê đơn' },
          ].map((option) => (
            <div key={option.value} className='flex items-center space-x-2'>
              <Checkbox
                id={`prescription-${option.value}`}
                checked={prescriptionType === option.value}
                onCheckedChange={() => {
                  setPrescriptionType(option.value)
                }}
              />
              <Label htmlFor={`prescription-${option.value}`} className='text-sm'>
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Filters */}
      <div>
        <Label className='font-medium mb-3 block'>Khác</Label>
        <div className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='in-stock'
              checked={inStockOnly}
              onCheckedChange={(checked) => {
                setInStockOnly(checked as boolean)
              }}
            />
            <Label htmlFor='in-stock' className='text-sm'>
              Còn hàng
            </Label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant='outline' onClick={clearFilters} className='w-full border-[#BFDBFE] text-[#1E40AF]'>
        Xóa bộ lọc
      </Button>
    </div>
  )

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <UniversalBreadcrumb items={breadcrumbItems} />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>
            {searchQuery ? `Kết quả cho "${searchQuery}"` : 'Tất cả sản phẩm'}
          </h1>
          <p className='text-gray-600' data-testid='search-result-count'>Tìm thấy {totalResults} sản phẩm</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Desktop Filters */}
        <div className='hidden lg:block'>
          <Card className='border-[#E8EDF5] sticky top-6 bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl'>
            <CardHeader>
              <CardTitle className='text-blue-800 flex items-center gap-2'>
                <Filter className='w-5 h-5' />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterContent />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className='lg:col-span-3 space-y-6'>
          {/* Toolbar */}
          <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              {/* Mobile Filter Button */}
              <div className='lg:hidden'>
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <SlidersHorizontal className='w-4 h-4 mr-2' />
                      Bộ lọc
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='left' className='w-80 p-0'>
                    <div className='p-6'>
                      <h2 className='text-lg font-medium mb-6'>Bộ lọc tìm kiếm</h2>
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filters */}
              {(selectedCategories.length > 0 || selectedBrands.length > 0 || prescriptionType !== 'all') && (
                <div className='flex flex-wrap items-center gap-2'>
                  {selectedCategories.map((categorySlug) => {
                    const category = categories.find((c) => c.slug === categorySlug)
                    return category ? (
                      <Badge key={categorySlug} variant='outline' className='border-[#BFDBFE] text-[#1E40AF]'>
                        {category.name}
                        <button
                          onClick={() => setSelectedCategories(selectedCategories.filter((c) => c !== categorySlug))}
                          className='ml-1 hover:text-red-600'
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null
                  })}
                  {selectedBrands.map((brand) => (
                    <Badge key={brand} variant='outline' className='border-[#BFDBFE] text-[#1E40AF]'>
                      {brand}
                      <button
                        onClick={() => setSelectedBrands(selectedBrands.filter((b) => b !== brand))}
                        className='ml-1 hover:text-red-600'
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className='flex items-center gap-3'>
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger aria-label='Sắp xếp kết quả' className='w-[180px] border-[#BFDBFE] border rounded-lg border-[#BFDBFE]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='relevance'>Liên quan nhất</SelectItem>
                  <SelectItem value='price_asc'>Giá: Thấp đến cao</SelectItem>
                  <SelectItem value='price_desc'>Giá: Cao đến thấp</SelectItem>
                  <SelectItem value='rating'>Đánh giá cao</SelectItem>
                  <SelectItem value='newest'>Mới nhất</SelectItem>
                  <SelectItem value='bestseller'>Bán chạy</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className='flex items-center border border-[#BFDBFE] rounded-lg overflow-hidden'>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('grid')}
                  className={
                    viewMode === 'grid' ? 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white' : 'text-gray-600'
                  }
                >
                  <Grid className='w-4 h-4' />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('list')}
                  className={
                    viewMode === 'list' ? 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white' : 'text-gray-600'
                  }
                >
                  <List className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='w-12 h-12 animate-spin text-[#1E40AF] mb-4' />
              <p className='text-gray-600'>Đang tìm kiếm sản phẩm...</p>
            </div>
          ) : allProducts.length > 0 ? (
            <>
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
                }`}
              >
                {allProducts.map((product) => (
                  <ProductCard
                    key={getProductId(product)}
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
                      const variant = product.priceVariants?.find((v: PriceVariant) => v.unit === selectedUnit)
                      const price = variant?.price || product.priceVariants?.[0]?.price
                      addToCart(product, 1, selectedUnit, price)
                    }}
                    onToggleWishlist={() => {
                      toggleWishlist(getProductId(product))
                    }}
                    isInWishlist={isInWishlist(getProductId(product))}
                  />
                ))}
              </div>

              {/* Infinite scroll trigger + loading indicator */}
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

              {/* Related carousel khi kết quả ít (1–5) — liên quan đến sp đầu tiên tìm được */}
              {!isLoading && allProducts.length < 6 && allProducts.length > 0 && (
                <div className='mt-4'>
                  <RecommendationCarousel
                    title='Sản phẩm liên quan'
                    subtitle={`Dựa trên kết quả tìm kiếm "${searchQuery}"`}
                    badge='related'
                    products={relatedProducts}
                    loading={relatedLoading}
                    algorithm={relatedAlgorithm}
                    viewAllLink='/products'
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <EmptyState
                icon={<Search className='w-16 h-16' />}
                title='Không tìm thấy sản phẩm'
                description={
                  searchQuery
                    ? `Không có sản phẩm nào phù hợp với từ khóa "${searchQuery}". Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.`
                    : 'Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Thử điều chỉnh bộ lọc hoặc xóa bộ lọc.'
                }
                actionLabel='Xóa bộ lọc'
                onAction={clearFilters}
              />

              {/* Trending fallback khi search không có kết quả */}
              <div className='mt-8'>
                <RecommendationCarousel
                  title='Có thể bạn đang tìm...'
                  subtitle='Những sản phẩm đang được nhiều khách hàng yêu thích'
                  badge='trending'
                  products={trendingProducts}
                  loading={trendingLoading}
                  algorithm={trendingAlgorithm}
                  viewAllLink='/products'
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
