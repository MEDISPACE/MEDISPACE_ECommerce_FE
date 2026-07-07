import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router'
import { Search, Grid, List, SlidersHorizontal, Pill, Shield, User, Stethoscope, Droplets, Loader2, PackageX } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { ProductCard } from '../products/ProductCard'
import { ProductCardSkeleton } from '../products/ProductCardSkeleton'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { Slider } from '../ui/slider'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { RatingStars } from '../shared/RatingStars'
import { type ProductFilter, type Product, type Category } from '../../types/product'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { categoryService } from '../../services/categoryService'
import { brandService } from '../../services/brandService'
import { searchService } from '../../services/searchService'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { useTrending } from '../../hooks/product/useRecommendations'
import {
  getProductSalePrice,
  getProductOriginalPrice,
  getProductUnit,
  getDiscountPercentage,
  isProductOnSale,
  getProductPrice,
} from '../../utils/productHelpers'
import { getProductPrice as getPriceFromVariants } from '../../utils/priceUtils'
import { getCategoryIcon } from '../../utils/categoryIcons'

// Category icon mapping cho hệ thống MediSpace
const categoryIcons = {
  thuoc: Pill, // 💊 Thuốc - Icon viên thuốc hoàn hảo
  'thuc-pham-chuc-nang': Shield, // 🛡️ Thực phẩm chức năng - Bảo vệ sức khỏe
  'cham-soc-ca-nhan': User, // 👤 Chăm sóc cá nhân - Icon người dùng
  'thiet-bi-y-te': Stethoscope, // 🩺 Thiết bị y tế - Ống nghe y tế
  'duoc-my-pham': Droplets, // 💧 Dược mỹ phẩm - Serum/kem dưỡng
}

export function CategoryPage() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { ref: loadMoreRef, inView } = useInView()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [showAllSubcategories, setShowAllSubcategories] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [isLoadingCategory, setIsLoadingCategory] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [brandOptions, setBrandOptions] = useState<Array<{ id: string; name: string; count: number }>>([])
  const [showAllBrands, setShowAllBrands] = useState(false)

  // Trending trong danh mục này
  const { products: trendingProducts, loading: trendingLoading, algorithm: trendingAlgorithm } = useTrending(8, currentCategory?._id)

  const [filters, setFilters] = useState<ProductFilter>({
    categories: [],
    priceRange: [0, 10000000],
    brands: [],
    rating: 0,
    inStock: false,
    isPrescription: false,
  })

  // Fetch category info
  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoadingCategory(true)
      setNotFound(false)
      try {
        const categoryData = await categoryService.getCategoryBySlug(slug || '')
        if (!categoryData) {
          setNotFound(true)
          setIsLoadingCategory(false)
          return
        }

        // Get subcategories for this category
        const subcategoriesData = await categoryService.getCategoryChildren(categoryData._id)

        setSubcategories(subcategoriesData)
        setCurrentCategory(categoryData)
      } catch (error) {
        console.error('Error fetching category data:', error)
        setNotFound(true)
      } finally {
        setIsLoadingCategory(false)
      }
    }

    fetchCategory()
  }, [slug])

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Use infinite query for products
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingProducts,
    isError,
    isFetching,
  } = useInfiniteProducts({
    categoryId: currentCategory?._id,
    enabled: !!currentCategory?._id,
    search: debouncedSearchQuery,
    filters,
    sortBy,
  })

  // Trigger load more when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten all pages into single array
  const allProducts = useMemo(() => productsData?.pages.flatMap((page) => page.products) || [], [productsData?.pages])
  const totalCount = productsData?.pages[0]?.pagination.totalCount || 0
  const visibleBrandOptions = showAllBrands ? brandOptions : brandOptions.slice(0, 6)

  const category = currentCategory

  useEffect(() => {
    if (!currentCategory?._id) return

    let cancelled = false

    const fallbackToLoadedProducts = () => {
      if ((filters.brands || []).length > 0 && brandOptions.length > 0) return

      const nextBrands = new Map<string, { id: string; name: string; count: number }>()
      allProducts.forEach((product: Product) => {
        const brandId = product.brand?._id || product.brandId
        const brandName = product.brand?.name
        if (!brandId || !brandName) return

        const existing = nextBrands.get(brandId)
        nextBrands.set(brandId, {
          id: brandId,
          name: brandName,
          count: (existing?.count || 0) + 1,
        })
      })
      setBrandOptions(Array.from(nextBrands.values()))
    }

    const fetchBrandFacets = async () => {
      try {
        const priceRange = filters.priceRange || [0, 10000000]
        const rating = filters.rating || 0
        const [facetResult, allBrands] = await Promise.all([
          searchService.searchProducts({
            q: debouncedSearchQuery || '*',
            categoryId: currentCategory._id,
            includeSubcategories: true,
            limit: 1,
            requiresPrescription: filters.isPrescription === true ? true : undefined,
            inStock: filters.inStock || undefined,
            priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
            priceMax: priceRange[1] < 10000000 ? priceRange[1] : undefined,
            ratingMin: rating > 0 ? rating : undefined,
          }),
          brandService.getBrands({ limit: 1000, isActive: 'true' }),
        ])
        if (cancelled) return

        const brandNameById = new Map(allBrands.map((brand) => [brand._id || brand.id, brand.name]))
        const brandIdFacet = facetResult.facet_counts?.find((facet) => facet.fieldName === 'brandId')
        const nextBrands = (brandIdFacet?.counts || [])
          .map((item) => ({
            id: item.value,
            name: brandNameById.get(item.value) || item.value,
            count: item.count,
          }))
          .filter((brand) => brand.name !== brand.id)
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'))

        if (nextBrands.length > 0) {
          setBrandOptions((previousBrands) => {
            const selectedOrPreviousBrands = previousBrands.filter((brand) => (filters.brands || []).includes(brand.id))
            const mergedBrands = new Map(nextBrands.map((brand) => [brand.id, brand]))
            selectedOrPreviousBrands.forEach((brand) => {
              if (!mergedBrands.has(brand.id)) mergedBrands.set(brand.id, brand)
            })
            return Array.from(mergedBrands.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'))
          })
        } else {
          fallbackToLoadedProducts()
        }
      } catch {
        if (!cancelled) fallbackToLoadedProducts()
      }
    }

    fetchBrandFacets()

    return () => {
      cancelled = true
    }
  }, [allProducts, brandOptions.length, currentCategory?._id, debouncedSearchQuery, filters.brands, filters.inStock, filters.isPrescription, filters.priceRange, filters.rating])

  // Get icon component for this category
  const IconComponent = getCategoryIcon(category || { slug })

  // Fetch all categories for breadcrumb name lookup
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<Category[]>([])

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const data = await categoryService.getCategories()
        setAllCategoriesFlat(data)
      } catch (error) {
        console.error('Failed to fetch categories for breadcrumb:', error)
      }
    }
    fetchAllCategories()
  }, [])

  // Lookup category name from slug using fetched categories
  const getCategoryNameBySlug = (slugStr: string): string => {
    const foundCategory = allCategoriesFlat.find((cat) => cat.slug === slugStr)
    if (foundCategory) {
      return foundCategory.name // Vietnamese name with diacritics
    }
    // Fallback: capitalize slug
    return slugStr
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const buildCategoryBreadcrumb = () => {
    if (!category) return []

    const categoryPath = category.path // e.g., "/thuoc/thuoc-bo-vitamin"
    if (!categoryPath) {
      // Fallback: just show current category
      return [{ label: category.name }]
    }

    // Parse path into slugs (remove leading slash and split)
    const slugs = categoryPath.split('/').filter(Boolean)

    if (slugs.length === 0) {
      return [{ label: category.name }]
    }

    // Build breadcrumb items from slugs
    const items = slugs.map((slugItem, index) => {
      const isLast = index === slugs.length - 1
      return {
        label: isLast ? category.name : getCategoryNameBySlug(slugItem),
        href: isLast ? undefined : `/categories/${slugItem}`, // No link for current category
      }
    })

    return items
  }

  const breadcrumbItems = buildCategoryBreadcrumb()

  const sortedProducts = allProducts

  // Transform products for ProductCard component
  const transformedProducts = sortedProducts.map((product: Product) => ({
    id: product._id,
    name: product.name,
    slug: product.slug,
    brand: product.brand?.name || 'Unknown Brand',
    image: product.images?.[0] || product.featuredImage || '/placeholder-product.jpg',
    originalPrice: getProductOriginalPrice(product),
    salePrice: getProductSalePrice(product) || 0,
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    inStock: product.stockQuantity > 0,
    isPrescription: product.requiresPrescription,
    isOnSale: isProductOnSale(product),
    discountPercentage: getDiscountPercentage(product),
    unit: getProductUnit(product),
    packaging: product.packaging,
    needsConsultation: product.needsConsultation,
    priceVariants: product.priceVariants,
  }))

  // Loading state - show skeleton
  const isLoading = isLoadingCategory || isLoadingProducts

  if (isLoading && !productsData) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Breadcrumb skeleton */}
        <div className='h-5 bg-gray-200 rounded w-64 mb-6 animate-pulse'></div>

        {/* Category header skeleton */}
        <div className='bg-gray-50 rounded-2xl p-6 mb-6 animate-pulse'>
          <div className='flex items-center gap-4'>
            <div className='w-16 h-16 bg-gray-200 rounded-xl'></div>
            <div>
              <div className='h-8 bg-gray-200 rounded w-48 mb-2'></div>
              <div className='h-4 bg-gray-200 rounded w-32'></div>
            </div>
          </div>
        </div>

        {/* Subcategories skeleton */}
        <div className='mb-8 animate-pulse'>
          <div className='h-6 bg-gray-200 rounded w-40 mb-4'></div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='bg-white rounded-lg p-4 border border-gray-100 shadow-sm'>
                <div className='w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-3'></div>
                <div className='h-4 bg-gray-200 rounded w-24 mx-auto mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-16 mx-auto'></div>
              </div>
            ))}
          </div>
        </div>

        {/* Products layout skeleton with ProductCardSkeleton */}
        <div className='flex gap-6'>
          {/* Sidebar skeleton */}
          <div className='hidden lg:block w-1/4 animate-pulse space-y-6'>
            <div className='h-48 bg-gray-100 rounded-lg border border-gray-100'></div>
            <div className='h-48 bg-gray-100 rounded-lg border border-gray-100'></div>
          </div>
          {/* Grid skeleton */}
          <div className='flex-1'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <ProductCardSkeleton key={i} variant={viewMode} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not found state - show error
  if (notFound || !category) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Danh mục không tồn tại</h1>
          <Link to='/categories'>
            <Button className='mt-4'>Quay lại danh mục</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <EnhancedPageTransition>
      <UniversalBreadcrumb items={breadcrumbItems} />
      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Category Header */}
        <div className='bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 mb-6 border-l-4 border-[#1E40AF]'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-4 mb-2'>
                <div className='w-16 h-16 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-[#0A2463] to-[#1E40AF] shadow-lg'>
                  <IconComponent className='w-8 h-8' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>{category.name}</h1>
                  <p className='text-gray-600 mt-1'>{category.description}</p>
                </div>
              </div>

              <div className='flex items-center gap-4 text-sm text-gray-500'>
                <span>{category.productCount.toLocaleString()} sản phẩm</span>
                <span>•</span>
                <span>{brandOptions.length} thương hiệu</span>
              </div>
            </div>

          </div>
        </div>

        {/* Sub-categories Featured Grid - Only show if has subcategories */}
        {subcategories.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>Danh mục phổ biến</h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {subcategories.slice(0, 8).map((subCategory) => (
                <Card
                  key={subCategory._id}
                  className='group bg-white border-[#E8EDF5] hover:shadow-md transition-all duration-300 hover:border-[#BFDBFE]'
                >
                  <CardContent className='p-4 text-center'>
                    <div className='w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center text-white bg-[#1E40AF]'>
                      <IconComponent className='w-6 h-6' />
                    </div>
                    <h3 className='font-medium text-sm group-hover:text-[#1E40AF] transition-colors mb-1'>
                      {subCategory.name}
                    </h3>
                    <p className='text-xs text-gray-500 mb-3'>{subCategory.productCount} sản phẩm</p>
                    <Link to={`/categories/${category.slug}/${subCategory.slug}`}>
                      <Button
                        size='sm'
                        variant='outline'
                        className='w-full text-xs border-[#BFDBFE] text-[#1E40AF] hover:!bg-[#eff6ff] hover:border-[#1E40AF] transition-all duration-300'
                      >
                        Xem ngay
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Trending trong danh mục — hiện trước product grid để user thấy ngay */}
        {(trendingLoading || trendingProducts.length > 0) && (
          <div className='mb-6'>
            <RecommendationCarousel
              title={`Đang Được Mua Nhiều Trong "${category.name}"`}
              subtitle='Các sản phẩm nổi bật trong danh mục này'
              badge='trending'
              products={trendingProducts}
              loading={trendingLoading}
              algorithm={trendingAlgorithm}
              viewAllLink={`/categories/${slug}`}
            />
          </div>
        )}

        {/* Products Section */}
        <div className='flex gap-6'>
          {/* Sidebar - Desktop */}
          <div className='hidden lg:block w-1/4'>
            <div className='space-y-6'>
              {/* Sub-categories - Only show if has subcategories */}
              {subcategories.length > 0 && (
                <Card className='bg-white border-[#BFDBFE] shadow-sm'>
                  <CardHeader>
                    <CardTitle className='text-lg'>Danh mục con</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {(showAllSubcategories ? subcategories : subcategories.slice(0, 6)).map((subCategory) => (
                      <Link
                        key={subCategory._id}
                        to={`/categories/${category.slug}/${subCategory.slug}`}
                        className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#F0F6FF] transition-colors group'
                      >
                        <span className='text-sm group-hover:text-[#1E40AF]'>{subCategory.name}</span>
                        <Badge variant='secondary' className='text-xs'>
                          {subCategory.productCount}
                        </Badge>
                      </Link>
                    ))}
                    {subcategories.length > 6 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowAllSubcategories(!showAllSubcategories)}
                        className='w-full text-[#1E40AF] hover:text-[#0A2463] hover:bg-[#F0F6FF] mt-2'
                      >
                        {showAllSubcategories ? 'Thu gọn' : `+ Xem thêm ${subcategories.length - 6} danh mục`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Brands Filter */}
              <Card className='bg-white border-[#BFDBFE] shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-lg'>Thương hiệu</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {visibleBrandOptions.map((brand) => {
                    return (
                      <label key={brand.id} className='flex items-center space-x-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          className='rounded border-gray-300'
                          checked={(filters.brands || []).includes(brand.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked
                            setFilters((prev) => ({
                              ...prev,
                              brands: isChecked
                                ? Array.from(new Set([...(prev.brands || []), brand.id]))
                                : (prev.brands || []).filter((brandId: string) => brandId !== brand.id),
                            }))
                          }}
                        />
                        <span className='text-sm'>{brand.name}</span>
                        <span className='text-xs text-gray-500'>({brand.count})</span>
                      </label>
                    )
                  })}
                  {brandOptions.length > 6 && (
                    <Button
                      variant='ghost'
                      className='text-xs p-0 h-auto text-[#1E40AF]'
                      onClick={() => setShowAllBrands((current) => !current)}
                    >
                      {showAllBrands ? 'Thu gọn' : `+ Xem thêm ${brandOptions.length - 6} thương hiệu`}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Price Range Filter */}
              <Card className='bg-white border-[#BFDBFE] shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-lg'>Khoảng giá</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, priceRange: [value[0], value[1]] }))}
                    max={5000000}
                    min={0}
                    step={50000}
                    className='w-full'
                  />
                  <div className='grid grid-cols-2 gap-2'>
                    <Input
                      type='text'
                      value={new Intl.NumberFormat('vi-VN').format(filters.priceRange?.[0] || 0)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/\./g, '')) || 0
                        setFilters((prev) => ({ ...prev, priceRange: [value, prev.priceRange?.[1] || 5000000] }))
                      }}
                      placeholder='Từ'
                      className='h-8 text-xs border-[#BFDBFE]'
                    />
                    <Input
                      type='text'
                      value={new Intl.NumberFormat('vi-VN').format(filters.priceRange?.[1] || 5000000)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/\./g, '')) || 0
                        setFilters((prev) => ({ ...prev, priceRange: [prev.priceRange?.[0] || 0, value] }))
                      }}
                      placeholder='Đến'
                      className='h-8 text-xs border-[#BFDBFE]'
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Rating Filter */}
              <Card className='bg-white border-[#BFDBFE] shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-lg'>Đánh giá</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={filters.rating === rating}
                        onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, rating: checked ? rating : 0 }))}
                      />
                      <Label htmlFor={`rating-${rating}`} className='text-sm cursor-pointer flex items-center gap-1'>
                        <RatingStars rating={rating} size='sm' showRating={false} />
                        <span className='text-xs'>từ {rating} sao</span>
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Stock & Prescription Filter */}
              <Card className='bg-white border-[#BFDBFE] shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-lg'>Tình trạng</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='in-stock'
                      checked={filters.inStock === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, inStock: checked ? true : false }))
                      }
                    />
                    <Label htmlFor='in-stock' className='text-sm cursor-pointer'>
                      Còn hàng
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='prescription'
                      checked={filters.isPrescription === true}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, isPrescription: checked ? true : false }))
                      }
                    />
                    <Label htmlFor='prescription' className='text-sm cursor-pointer'>
                      Thuốc kê đơn
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Clear Filters Button */}
              <Button
                variant='outline'
                className='w-full border-[#BFDBFE] text-[#1E40AF] hover:bg-[#F0F6FF]'
                onClick={() =>
                  setFilters({
                    categories: [],
                    priceRange: [0, 5000000],
                    brands: [],
                    rating: 0,
                    inStock: false,
                    isPrescription: false,
                  })
                }
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1'>
            {/* Toolbar */}
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-4'>
                <h2 className='font-medium text-lg text-[#1E40AF]'>
                  {sortedProducts.length} / {totalCount} sản phẩm
                </h2>

                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' size='sm' className='lg:hidden'>
                      <SlidersHorizontal className='w-4 h-4 mr-2' />
                      Bộ lọc
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='left' className='w-80'>
                    <div className='py-6'>
                      {/* Mobile filters content */}
                      <h3 className='font-medium mb-4'>Bộ lọc sản phẩm</h3>
                      {/* Add filter components here */}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className='flex items-center gap-4'>
                {/* Search */}
                <div className='relative w-64'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    placeholder='Tìm trong danh mục...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10 text-sm'
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='relevance'>Liên quan</SelectItem>
                    <SelectItem value='newest'>Mới nhất</SelectItem>
                    <SelectItem value='bestseller'>Bán chạy</SelectItem>
                    <SelectItem value='price-asc'>Giá thấp đến cao</SelectItem>
                    <SelectItem value='price-desc'>Giá cao đến thấp</SelectItem>
                    <SelectItem value='rating'>Đánh giá cao</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className='flex items-center border border-[#BFDBFE] rounded-lg overflow-hidden'>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setViewMode('grid')}
                    className={
                      viewMode === 'grid'
                        ? 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white rounded-r-none'
                        : 'text-gray-600 rounded-r-none'
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
                        ? 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white rounded-l-none'
                        : 'text-gray-600 rounded-l-none'
                    }
                  >
                    <List className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isFetching && !isLoading && (
              <div className='w-full h-0.5 bg-[#F0F6FF] overflow-hidden relative mb-4 rounded'>
                <div className='absolute h-full bg-gradient-to-r from-[#0A2463] to-[#1E40AF] w-1/3 rounded animate-[progressLoop_1.5s_infinite_ease-in-out]' />
              </div>
            )}
            {transformedProducts.length > 0 ? (
              <>
                <div
                  className={`
                    ${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}
                    transition-all duration-300
                    ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  {transformedProducts.map((product) => {
                    // Find original product for addToCart
                    const originalProduct = allProducts.find((p: Product) => p._id === product.id)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant={viewMode}
                        onAddToCart={(selectedUnit) => {
                          if (originalProduct) {
                            // Find the price for the selected unit from priceVariants
                            const variant = originalProduct.priceVariants?.find((v) => v.unit === selectedUnit)
                            const price = variant?.price || originalProduct.priceVariants?.[0]?.price
                            addToCart(originalProduct, 1, selectedUnit, price)
                          }
                        }}
                        onToggleWishlist={() => {
                          toggleWishlist(product.id)
                        }}
                        isInWishlist={isInWishlist(product.id)}
                      />
                    )
                  })}
                </div>

                {/* Infinite Scroll Trigger & Loading Indicator */}
                {hasNextPage && (
                  <div ref={loadMoreRef} className='mt-8 flex justify-center py-8'>
                    {isFetchingNextPage ? (
                      <div className='flex items-center gap-2 text-[#1E40AF]'>
                        <Loader2 className='w-5 h-5 animate-spin' />
                        <span>Đang tải thêm sản phẩm...</span>
                      </div>
                    ) : (
                      <Button
                        variant='outline'
                        onClick={() => fetchNextPage()}
                        className='border-[#BFDBFE] text-[#1E40AF] hover:bg-[#F0F6FF]'
                      >
                        Xem thêm sản phẩm
                      </Button>
                    )}
                  </div>
                )}

                {/* Show total loaded */}
                {!hasNextPage && allProducts.length > 0 && (
                  <div className='mt-8 text-center text-sm text-gray-500'>
                    Đã hiển thị tất cả {allProducts.length} sản phẩm
                  </div>
                )}
              </>
            ) : (
              <Card className='text-center py-12 border-[#BFDBFE] bg-white'>
                <CardContent>
                  <div className='text-gray-500 mb-4'>
                    <PackageX className='w-16 h-16 mx-auto mb-4 text-gray-300' strokeWidth={1.5} />
                    <h3 className='text-lg font-medium'>Không tìm thấy sản phẩm</h3>
                    <p className='text-sm'>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSearchQuery('')
                      setFilters({
                        categories: [],
                        priceRange: [0, 5000000],
                        brands: [],
                        rating: 0,
                        inStock: false,
                        isPrescription: false,
                      })
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </EnhancedPageTransition>
  )
}
