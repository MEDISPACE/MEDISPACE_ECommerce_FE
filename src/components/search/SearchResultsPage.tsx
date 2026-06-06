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
import { searchService } from '../../services/searchService'
import { categoryService } from '../../services/categoryService'
import { brandService } from '../../services/brandService'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import type { Category, Brand, Product } from '../../types/product'
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
  const appliedBrandSlugRef = useRef<string | null>(null)

  // Trending fallback khi 0 kết quả
  const { products: trendingProducts, loading: trendingLoading } = useTrending(8)

  // Related khi 1–5 kết quả — firstResultId cập nhật sau khi query resolve
  const [firstResultId, setFirstResultId] = useState('')
  const { products: relatedProducts, loading: relatedLoading } = useRelated(firstResultId, 8)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Collapse states for filters
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true)
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true)

  // Search filters state
  const searchQuery = searchParams.get('q') || ''
  const brandSlug = searchParams.get('brandSlug') || ''
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

  useEffect(() => {
    if (!brandSlug || brands.length === 0 || appliedBrandSlugRef.current === brandSlug) return
    const brand = brands.find((item) => item.slug === brandSlug)
    if (brand) {
      setSelectedBrands([brand._id])
      appliedBrandSlugRef.current = brandSlug
    }
  }, [brandSlug, brands])

  const mapSearchHitToProduct = (hit: {
    document?: Partial<Product> & {
      mongoId?: string
      categoryName?: string
      brandName?: string
      price?: number
      originalPrice?: number
      salePrice?: number
      discountPercentage?: number
      defaultUnit?: string
      priceVariantsJson?: string
      campaignId?: string
      campaignName?: string
      campaignBadgeText?: string
      campaignBadgeColor?: string
      campaignEndDate?: number
      inStock?: boolean
      createdBy?: string
    }
  }): Product => {
    const document = hit.document || {}
    const id = document.mongoId || document._id || ''
    const price = document.originalPrice || document.price || 0
    let indexedPriceVariants: Product['priceVariants'] = []
    try {
      indexedPriceVariants = document.priceVariantsJson ? JSON.parse(document.priceVariantsJson) : []
    } catch {
      indexedPriceVariants = []
    }
    const priceVariants =
      document.priceVariants && document.priceVariants.length > 0
        ? document.priceVariants
        : indexedPriceVariants.length > 0
          ? indexedPriceVariants
          : [{
            unit: document.defaultUnit || 'Sản phẩm',
            price,
            salePrice: document.salePrice,
            originalPrice: document.salePrice && document.salePrice < price ? price : undefined,
            discountPercent: document.discountPercentage,
            isDefault: true,
            quantityPerUnit: 1,
          }]

    return {
      ...document,
      _id: id,
      id,
      name: document.name || '',
      slug: document.slug || '',
      sku: document.sku || '',
      shortDescription: document.shortDescription || '',
      categoryId: document.categoryId || '',
      brandId: document.brandId || '',
      priceVariants,
      stockQuantity: document.stockQuantity ?? (document.inStock ? 1 : 0),
      maxOrderQuantity: document.maxOrderQuantity || 10,
      status: document.isActive === false ? 'discontinued' : document.inStock === false ? 'out_of_stock' : 'active',
      isActive: document.isActive !== false,
      requiresPrescription: Boolean(document.requiresPrescription),
      featuredImage: document.featuredImage,
      createdAt: document.createdAt ? new Date(document.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: document.updatedAt ? new Date(document.updatedAt).toISOString() : new Date().toISOString(),
      createdBy: document.createdBy || '',
      brand: document.brandName ? { _id: document.brandId || '', name: document.brandName, slug: '', isActive: true, productCount: 0, createdAt: '' } : undefined,
      category: document.categoryName ? { _id: document.categoryId || '', name: document.categoryName, slug: '', level: 0, path: '', productCount: 0, sortOrder: 0, isActive: true, createdAt: '', updatedAt: '' } : undefined,
      price,
      originalPrice: price,
      salePrice: document.salePrice,
      discountPercentage: document.discountPercentage,
      onSale: Boolean(document.salePrice && document.salePrice < price),
      campaign: document.campaignName ? {
        _id: document.campaignId || '',
        name: document.campaignName,
        badgeText: document.campaignBadgeText || `-${document.discountPercentage || 0}%`,
        badgeColor: document.campaignBadgeColor || '#FF5722',
        endDate: document.campaignEndDate ? new Date(document.campaignEndDate).toISOString() : '',
      } : undefined,
      inStock: document.inStock,
      rating: document.rating || 0,
      reviewCount: document.reviewCount || 0,
    } as Product
  }

  // Infinite query for products with server-side filtering
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
      const params: Parameters<typeof searchService.searchProducts>[0] = {
        page: pageParam,
        limit: 100,
        q: searchQuery || '*',
      }

      // Add sorting
      switch (sortBy) {
        case 'price_asc':
          params.sortBy = 'price_asc'
          break
        case 'price_desc':
          params.sortBy = 'price_desc'
          break
        case 'rating':
          params.sortBy = 'rating'
          break
        case 'newest':
          params.sortBy = 'newest'
          break
        case 'bestseller':
          params.sortBy = 'rating'
          break
        default: // relevance
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

      const result = await searchService.searchProducts(params)
      return {
        products: (result.hits || []).map(mapSearchHitToProduct),
        found: result.found || 0,
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.products.length === 100 ? allPages.length + 1 : undefined
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

  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) ?? []
  }, [data])

  // Cập nhật firstResultId khi kết quả thay đổi
  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      setFirstResultId('')
      return
    }
    const id = getProductId(allProducts[0]) || ''
    setFirstResultId(id)
  }, [allProducts])

  const totalResults = data?.pages[0]?.found ?? allProducts.length

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
      <Button variant='outline' onClick={clearFilters} className='w-full border-blue-200 text-blue-600'>
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
          <p className='text-gray-600' data-testid='search-result-count'>
            Tìm thấy {totalResults} sản phẩm
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Desktop Filters */}
        <div className='hidden lg:block'>
          <Card className='border-blue-100 sticky top-6 bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl'>
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
                      <Badge key={categorySlug} variant='outline' className='border-blue-200 text-blue-600'>
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
                    <Badge key={brand} variant='outline' className='border-blue-200 text-blue-600'>
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
                <SelectTrigger
                  aria-label='Sắp xếp kết quả'
                  className='w-[180px] border-blue-200 border rounded-lg border-blue-300'
                >
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
              <div className='flex items-center border border-blue-200 rounded-lg overflow-hidden'>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('grid')}
                  className={
                    viewMode === 'grid' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-gray-600'
                  }
                >
                  <Grid className='w-4 h-4' />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('list')}
                  className={
                    viewMode === 'list' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-gray-600'
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
              <Loader2 className='w-12 h-12 animate-spin text-blue-600 mb-4' />
              <p className='text-gray-600'>Đang tìm kiếm sản phẩm...</p>
            </div>
          ) : allProducts.length > 0 ? (
            <>
              <div
                data-testid='search-results'
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
                      const variant = product.priceVariants?.find((v) => v.unit === selectedUnit)
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

              {/* Related carousel khi kết quả ít (1–5) — liên quan đến sp đầu tiên tìm được */}
              {!isLoading && allProducts.length < 6 && allProducts.length > 0 && (
                <div className='mt-4'>
                  <RecommendationCarousel
                    title='Sản phẩm liên quan'
                    subtitle={`Dựa trên kết quả tìm kiếm "${searchQuery}"`}
                    badge='related'
                    products={relatedProducts}
                    loading={relatedLoading}
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
