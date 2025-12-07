import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { Search, Grid, List, SlidersHorizontal } from 'lucide-react'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { CategoryNavigation, CategoryQuickActions } from './CategoryNavigation'
import { ProductCard } from '../products/ProductCard'
import { PaginationComponent } from '../shared/PaginationComponent'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { categoryService } from '../../services/categoryService'
import { productService } from '../../services/productService'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import {
  getProductId,
  getProductImage,
  getProductRating,
  getProductReviewCount,
  isProductInStock,
  isProductPrescription,
  getBrandName,
} from '../../utils/productHelpers'
import type { Category, Product } from '../../types/product'

export function SubCategoryPage() {
  const { categorySlug, subCategorySlug } = useParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [priceRange, setPriceRange] = useState([0, 2000000])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({})

  const [category, setCategory] = useState<Category | null>(null)
  const [subCategory, setSubCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!categorySlug) return

      try {
        setLoading(true)
        setError(null)

        // Fetch category
        const categoryData = await categoryService.getCategoryBySlug(categorySlug)
        if (!categoryData) {
          setError('Danh mục không tồn tại')
          return
        }
        setCategory(categoryData)

        // Find subcategory
        let foundSubCategory = null
        if (subCategorySlug) {
          foundSubCategory = categoryData.subcategories?.find(sub => sub.slug === subCategorySlug) || null
          setSubCategory(foundSubCategory)
        }

        // Fetch products for this category/subcategory
        const categoryId = foundSubCategory ? foundSubCategory._id : categoryData._id
        const productsData = await productService.getProducts({ categories: [categoryId] })
        setProducts(productsData)

      } catch (error) {
        setError('Không thể tải dữ liệu danh mục')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categorySlug, subCategorySlug])

  const brands = Array.from(new Set(products.map((p: Product) => p.brand?.name).filter(Boolean) as string[]))

  const navigationItems = [
    { label: category?.name || 'Danh mục', href: `/categories/${categorySlug}`, count: category?.productCount },
    { label: subCategory?.name || 'Danh mục con', count: subCategory?.productCount },
  ]

  // Breadcrumb items for MainLayout
  const breadcrumbItems = [
    { label: 'Danh mục', href: '/categories' },
    { label: category?.name || 'Danh mục', href: `/categories/${categorySlug}` },
    { label: subCategory?.name || 'Danh mục con', count: subCategory?.productCount },
  ]

  // Apply filters and search
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrice =
      (product.price ?? 0) >= priceRange[0] &&
      (product.price ?? 0) <= priceRange[1]
    const matchesBrands =
      selectedBrands.length === 0 ||
      selectedBrands.some((brand: string) => product.brand?.name?.toLowerCase().includes(brand.toLowerCase()))

    return matchesSearch && matchesPrice && matchesBrands
  })

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return (a.salePrice ?? a.originalPrice ?? 0) - (b.salePrice ?? b.originalPrice ?? 0)
      case 'price_desc':
        return (b.salePrice ?? b.originalPrice ?? 0) - (a.salePrice ?? a.originalPrice ?? 0)
      case 'rating':
        return getProductRating(b) - getProductRating(a)
      case 'newest':
        return parseInt(getProductId(b)) - parseInt(getProductId(a))
      case 'bestseller':
        return getProductReviewCount(b) - getProductReviewCount(a)
      default:
        return 0
    }
  })

  // Pagination
  const itemsPerPage = 20
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage)

  const handleBrandToggle = (brandName: string) => {
    setSelectedBrands((prev: string[]) => (prev.includes(brandName) ? prev.filter((b: string) => b !== brandName) : [...prev, brandName]))
  }

  // const handleFilterToggle = (filterId: string, optionId: string) => {
  //   setSelectedFilters((prev: { [key: string]: string[] }) => ({
  //     ...prev,
  //     [filterId]: prev[filterId]?.includes(optionId)
  //       ? prev[filterId].filter((o: string) => o !== optionId)
  //       : [...(prev[filterId] || []), optionId],
  //   }))
  // }

  const clearAllFilters = () => {
    setSearchQuery('')
    setPriceRange([0, 2000000])
    setSelectedBrands([])
    setSelectedFilters({})
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải danh mục sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 mb-4'>⚠️ {error}</div>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (!category || !subCategory) {
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
    <div>
      <CategoryNavigation items={navigationItems} />
      <EnhancedPageTransition>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          {/* Sub-category Header */}
          <div
            className='bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 mb-6 border-l-4 border-blue-500'
          >
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-4 mb-2'>
                  <div
                    className='w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl bg-blue-500'
                  >
                    {subCategory.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold text-gray-900'>{subCategory.name}</h1>
                    <p className='text-gray-600 mt-1'>{subCategory.description}</p>
                  </div>
                </div>

                <div className='flex items-center gap-4 text-sm text-gray-500'>
                  <span>{subCategory.productCount.toLocaleString()} sản phẩm</span>
                  <span>•</span>
                  <span>
                    Giá từ{' '}
                    {Math.min(...sortedProducts.map((p) => p.salePrice ?? p.originalPrice ?? 0)).toLocaleString()}đ
                  </span>
                </div>
              </div>

              <CategoryQuickActions />
            </div>
          </div>

          <div className='flex gap-6'>
            {/* Sidebar - Desktop */}
            <div className='hidden lg:block w-1/4'>
              <div className='space-y-6'>
                {/* Specialized Filters - TODO: Implement when backend supports category filters */}
                {/* {subCategory.filters &&
                  subCategory.filters.map((filter: any) => (
                    <Card key={filter.id}>
                      <CardHeader>
                        <CardTitle className='text-lg'>{filter.name}</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-2'>
                        {filter.options?.map((option: any) => (
                          <div key={option.id} className='flex items-center space-x-2'>
                            <Checkbox
                              id={option.id}
                              checked={selectedFilters[filter.id]?.includes(option.id) || false}
                              onCheckedChange={() => handleFilterToggle(filter.id, option.id)}
                            />
                            <Label htmlFor={option.id} className='text-sm cursor-pointer flex-1'>
                              {option.label}
                            </Label>
                            <span className='text-xs text-gray-500'>({option.count})</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))} */}

                {/* Brands Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Thương hiệu</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {brands.slice(0, 6).map((brand: string) => (
                      <div key={brand} className='flex items-center space-x-2'>
                        <Checkbox
                          id={brand}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => handleBrandToggle(brand)}
                        />
                        <Label htmlFor={brand} className='text-sm cursor-pointer flex-1'>
                          {brand}
                        </Label>
                        <span className='text-xs text-gray-500'>({Math.floor(Math.random() * 50) + 1})</span>
                      </div>
                    ))}
                    {brands.length > 6 && (
                      <Button variant='ghost' className='text-xs p-0 h-auto text-blue-600'>
                        + Xem thêm
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Price Range */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Khoảng giá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={2000000}
                      min={0}
                      step={50000}
                      className='mb-4'
                    />
                    <div className='flex justify-between text-sm text-gray-600'>
                      <span>{priceRange[0].toLocaleString()}đ</span>
                      <span>{priceRange[1].toLocaleString()}đ</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Clear Filters */}
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={clearAllFilters}
                  disabled={
                    searchQuery === '' &&
                    priceRange[0] === 0 &&
                    priceRange[1] === 2000000 &&
                    selectedBrands.length === 0 &&
                    Object.keys(selectedFilters).length === 0
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
                  <h2 className='font-medium'>{sortedProducts.length} sản phẩm</h2>

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
                        <h3 className='font-medium mb-4'>Bộ lọc chuyên biệt</h3>
                        {/* Mobile filters - same as desktop but in sheet */}
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
                      <SelectItem value='price_asc'>Giá thấp đến cao</SelectItem>
                      <SelectItem value='price_desc'>Giá cao đến thấp</SelectItem>
                      <SelectItem value='rating'>Đánh giá cao</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className='flex items-center border rounded-lg'>
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
                </div>
              </div>

              {/* Products Grid */}
              {paginatedProducts.length > 0 ? (
                <>
                  <div
                    className={
                      viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'
                    }
                  >
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={getProductId(product)}
                        product={{
                          id: getProductId(product),
                          name: product.name,
                          slug: product.slug,
                          brand: getBrandName(product),
                          image: getProductImage(product),
                          originalPrice: product.originalPrice,
                          salePrice: product.salePrice ?? product.originalPrice ?? 0,
                          rating: getProductRating(product),
                          reviewCount: getProductReviewCount(product),
                          inStock: isProductInStock(product),
                          isPrescription: isProductPrescription(product),
                          isOnSale: product.isOnSale,
                          discountPercentage: product.discountPercentage,
                          needsConsultation: product.needsConsultation,
                        }}
                        variant={viewMode}
                        onAddToCart={() => {
                          addToCart(product, 1)
                        }}
                        onToggleWishlist={() => {
                          toggleWishlist(getProductId(product))
                        }}
                        isInWishlist={isInWishlist(getProductId(product))}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className='mt-8'>
                    <PaginationComponent
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <Card className='text-center py-12'>
                  <CardContent>
                    <div className='text-gray-500 mb-4'>
                      <Search className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                      <h3 className='text-lg font-medium'>Không tìm thấy sản phẩm</h3>
                      <p className='text-sm'>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                    <Button variant='outline' onClick={clearAllFilters}>
                      Xóa bộ lọc
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </EnhancedPageTransition>
    </div>
  )
}
