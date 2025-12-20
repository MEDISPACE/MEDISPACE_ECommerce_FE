import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { ProductCard } from '../products/ProductCard'
import { EmptyState } from '../shared/EmptyState'
import { PaginationComponent } from '../shared/PaginationComponent'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { brandService } from '../../services/brandService'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import type { Product, Category, Brand } from '../../types/product'
import {
  getProductSalePrice,
  getProductOriginalPrice,
  getProductUnit,
  getDiscountPercentage,
  isProductOnSale,
} from '../../utils/productHelpers'

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Search filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [prescriptionType, setPrescriptionType] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(12)

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, brandsData] = await Promise.all([
          productService.searchProducts(searchQuery),
          categoryService.getCategories(),
          brandService.getBrands(),
        ])
        setProducts(productsData)
        setCategories(categoriesData)
        setBrands(brandsData)
      } catch (error) {
        // Handle error
      }
    }

    fetchData()
  }, [searchQuery])

  // Filter products based on search criteria
  const filterProducts = () => {
    let filtered = products

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.shortDescription && product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
          product.brand?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        const productCategory = categories.find(cat => cat._id === product.categoryId)
        return productCategory && selectedCategories.includes(productCategory.slug)
      })
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) => product.brandId && selectedBrands.includes(product.brandId))
    }

    // Price range filter
    filtered = filtered.filter((product) => {
      const price = getProductSalePrice(product) || 0
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Prescription type filter
    if (prescriptionType !== 'all') {
      const isPrescription = prescriptionType === 'prescription'
      filtered = filtered.filter((product) => product.isPrescription === isPrescription)
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter((product) => (product.rating || 0) >= minRating)
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter((product) => product.inStock)
    }

    // Sale filter
    if (onSaleOnly) {
      filtered = filtered.filter((product) => product.isOnSale)
    }

    // Sort products
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => (getProductSalePrice(a) || 0) - (getProductSalePrice(b) || 0))
        break
      case 'price_desc':
        filtered.sort((a, b) => (getProductSalePrice(b) || 0) - (getProductSalePrice(a) || 0))
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'newest':
        // Sort by createdAt date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'bestseller':
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      default: // relevance
        // Keep original order for relevance
        break
    }

    return filtered
  }

  const filteredProducts = filterProducts()
  const totalResults = filteredProducts.length
  const totalPages = Math.ceil(totalResults / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  // Update URL when search query changes
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ q: searchQuery })
    }
  }, [searchQuery, setSearchParams])

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedBrands([])
    setPriceRange([0, 1000000])
    setPrescriptionType('all')
    setMinRating(0)
    setInStockOnly(false)
    setOnSaleOnly(false)
    setCurrentPage(1)
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
      {/* Search within results */}
      <div>
        <Label className='font-medium mb-2 block'>Tìm trong kết quả</Label>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Lọc kết quả...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 border-blue-200'
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <Label className='font-medium mb-3 block'>Danh mục</Label>
        <div className='space-y-2'>
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
                  setCurrentPage(1)
                }}
              />
              <Label htmlFor={`category-${category._id}`} className='text-sm'>
                {category.name} ({category.productCount})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <Label className='font-medium mb-3 block'>Thương hiệu</Label>
        <div className='space-y-2 max-h-40 overflow-y-auto'>
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
                  setCurrentPage(1)
                }}
              />
              <Label htmlFor={`brand-${brand._id}`} className='text-sm'>
                {brand.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className='font-medium mb-3 block'>Khoảng giá</Label>
        <div className='space-y-3'>
          <Slider value={priceRange} onValueChange={setPriceRange} max={1000000} step={10000} className='w-full' />
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
                  setCurrentPage(1)
                }}
              />
              <Label htmlFor={`prescription-${option.value}`} className='text-sm'>
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <Label className='font-medium mb-3 block'>Đánh giá</Label>
        <div className='space-y-2'>
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className='flex items-center space-x-2'>
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => {
                  setMinRating(minRating === rating ? 0 : rating)
                  setCurrentPage(1)
                }}
              />
              <Label htmlFor={`rating-${rating}`} className='text-sm'>
                {rating}+ sao
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
                setCurrentPage(1)
              }}
            />
            <Label htmlFor='in-stock' className='text-sm'>
              Còn hàng
            </Label>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='on-sale'
              checked={onSaleOnly}
              onCheckedChange={(checked) => {
                setOnSaleOnly(checked as boolean)
                setCurrentPage(1)
              }}
            />
            <Label htmlFor='on-sale' className='text-sm'>
              Có khuyến mãi
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
          <h1 className='text-xl font-medium text-gray-900'>
            {searchQuery ? `Kết quả cho "${searchQuery}"` : 'Tất cả sản phẩm'}
          </h1>
          <p className='text-gray-600'>Tìm thấy {totalResults} sản phẩm</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Desktop Filters */}
        <div className='hidden lg:block'>
          <Card className='border-blue-100 sticky top-6'>
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
                <SelectTrigger className='w-[180px] border-blue-200'>
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
              <div className='flex items-center border border-blue-200 rounded-lg'>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('grid')}
                  className='rounded-r-none'
                >
                  <Grid className='w-4 h-4' />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('list')}
                  className='rounded-l-none'
                >
                  <List className='w-4 h-4' />
                </Button>
              </div>

              {/* Results per page */}
              <Select value={resultsPerPage.toString()} onValueChange={(value) => setResultsPerPage(parseInt(value))}>
                <SelectTrigger className='w-[100px] border-blue-200'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='12'>12</SelectItem>
                  <SelectItem value='24'>24</SelectItem>
                  <SelectItem value='48'>48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {currentProducts.length > 0 ? (
            <>
              <div
                className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
                  }`}
              >
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={{
                      id: product._id,
                      name: product.name,
                      slug: product.slug,
                      brand: product.brand?.name || '',
                      image: product.featuredImage || '',
                      originalPrice: getProductOriginalPrice(product),
                      salePrice: getProductSalePrice(product) || 0,
                      rating: product.rating || 0,
                      reviewCount: product.reviewCount || 0,
                      inStock: product.stockQuantity > 0,
                      isPrescription: product.requiresPrescription,
                      isOnSale: isProductOnSale(product),
                      discountPercentage: getDiscountPercentage(product),
                      unit: getProductUnit(product),
                      priceVariants: product.priceVariants,
                    }}
                    variant={viewMode}
                    onAddToCart={(selectedUnit) => {
                      const variant = product.priceVariants?.find(v => v.unit === selectedUnit)
                      const price = variant?.price || product.priceVariants?.[0]?.price
                      addToCart(product, 1, selectedUnit, price)
                    }}
                    onToggleWishlist={() => {
                      toggleWishlist(product._id)
                    }}
                    isInWishlist={isInWishlist(product._id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex justify-center pt-6'>
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
