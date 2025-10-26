import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { Search, Grid, List, SlidersHorizontal, Pill, Shield, User, Stethoscope, Droplets } from 'lucide-react'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { CategoryQuickActions } from './CategoryNavigation'
import { ProductCard } from '../products/ProductCard'
import { PaginationComponent } from '../shared/PaginationComponent'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { type ProductFilter, type Product, type Category } from '../../types/product'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { useCart } from '../../contexts/CartContext'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [filters, setFilters] = useState<ProductFilter>({
    categories: [],
    priceRange: [0, 5000000],
    brands: [],
    rating: 0,
    inStock: false,
    isPrescription: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData = await categoryService.getCategoryBySlug(slug || '')
        if (!categoryData) {
          console.error('Category not found')
          return
        }

        // Get subcategories for this category
        const subcategoriesData = await categoryService.getCategoryChildren(categoryData._id)
        const allCategoryIds = [categoryData._id, ...subcategoriesData.map((sub: Category) => sub._id)]

        // Fetch products for each category
        const productPromises = allCategoryIds.map(categoryId =>
          productService.getProducts({ categoryId })
        )
        const productResults = await Promise.all(productPromises)

        // Combine all products
        const allProducts = productResults.flat()

        setProducts(allProducts)
        setCurrentCategory(categoryData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [slug])

  const category = currentCategory
  const brands = Array.from(new Set(products.map((p: Product) => p.brand?.name).filter(Boolean) as string[]))

  // Get icon component for this category
  const IconComponent = categoryIcons[slug as keyof typeof categoryIcons] || Pill

  // Create breadcrumb items for MainLayout
  const breadcrumbItems = [
    { label: 'Danh mục', href: '/categories' },
    { label: category?.name || 'Danh mục', count: category?.productCount },
  ]

  // Apply filters and search
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesPrice =
      (product.price ?? 0) >= (filters.priceRange?.[0] ?? 0) &&
      (product.price ?? 0) <= (filters.priceRange?.[1] ?? 5000000)
    const matchesRating = (product.rating ?? 0) >= (filters.rating ?? 0)
    const matchesStock = !filters.inStock || product.stockQuantity > 0
    const matchesBrands =
      (filters.brands?.length ?? 0) === 0 ||
      filters.brands?.some((brand: string) => product.brand?.name?.toLowerCase().includes(brand.toLowerCase())) ||
      false

    return matchesSearch && matchesPrice && matchesRating && matchesStock && matchesBrands
  })

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return (a.price ?? 0) - (b.price ?? 0)
      case 'price_desc':
        return (b.price ?? 0) - (a.price ?? 0)
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case 'bestseller':
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      default:
        return 0
    }
  })

  // Transform products for ProductCard component
  const transformedProducts = sortedProducts.map((product: Product) => ({
    id: product._id,
    name: product.name,
    slug: product.slug,
    brand: product.brand?.name || 'Unknown Brand',
    image: product.images?.[0] || product.featuredImage || '/placeholder-product.jpg',
    originalPrice: product.discountPercentage && product.discountPercentage > 0 ? Math.round((product.price || 0) / (1 - (product.discountPercentage / 100))) : undefined,
    salePrice: product.price || 0,
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    inStock: product.stockQuantity > 0,
    isPrescription: product.requiresPrescription,
    isOnSale: (product.discountPercentage || 0) > 0,
    discountPercentage: product.discountPercentage || 0,
    unit: product.unit,
    packaging: product.packaging,
    needsConsultation: product.needsConsultation,
  }))

  // Pagination
  const itemsPerPage = 20
  const totalPages = Math.ceil(transformedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = transformedProducts.slice(startIndex, startIndex + itemsPerPage)

  if (!category) {
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
      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Category Header */}
        <div
          className='bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 mb-6 border-l-4 border-blue-500'
        >
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-4 mb-2'>
                <div className='w-16 h-16 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg'>
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
                <span>{brands.length} thương hiệu</span>
              </div>
            </div>

            <CategoryQuickActions />
          </div>
        </div>

        {/* Sub-categories Featured Grid */}
        <div className='mb-8'>
          <h2 className='text-xl font-bold text-gray-900 mb-4'>Danh mục phổ biến</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {category.subcategories?.slice(0, 8).map((subCategory) => (
              <Card
                key={subCategory._id}
                className='group hover:shadow-md transition-all duration-300 hover:border-blue-200'
              >
                <CardContent className='p-4 text-center'>
                  <div
                    className='w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold bg-blue-500'
                  >
                    {subCategory.name.charAt(0)}
                  </div>
                  <h3 className='font-medium text-sm group-hover:text-blue-600 transition-colors mb-1'>
                    {subCategory.name}
                  </h3>
                  <p className='text-xs text-gray-500 mb-3'>{subCategory.productCount} sản phẩm</p>
                  <Link to={`/categories/${category.slug}/${subCategory.slug}`}>
                    <Button size='sm' variant='outline' className='w-full text-xs'>
                      Xem ngay
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className='flex gap-6'>
          {/* Sidebar - Desktop */}
          <div className='hidden lg:block w-1/4'>
            <div className='space-y-6'>
              {/* Sub-categories */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Danh mục con</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {category.subcategories?.map((subCategory) => (
                    <Link
                      key={subCategory._id}
                      to={`/categories/${category.slug}/${subCategory.slug}`}
                      className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors group'
                    >
                      <span className='text-sm group-hover:text-blue-600'>{subCategory.name}</span>
                      <Badge variant='secondary' className='text-xs'>
                        {subCategory.productCount}
                      </Badge>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Brands Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Thương hiệu</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {brands.slice(0, 6).map((brand: string) => (
                    <label key={brand} className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300'
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          setFilters((prev) => ({
                            ...prev,
                            brands: isChecked
                              ? [...(prev.brands || []), brand]
                              : (prev.brands || []).filter((b: string) => b !== brand),
                          }))
                        }}
                      />
                      <span className='text-sm'>{brand}</span>
                      <span className='text-xs text-gray-500'>({Math.floor(Math.random() * 50) + 1})</span>
                    </label>
                  ))}
                  {brands.length > 6 && (
                    <Button variant='ghost' className='text-xs p-0 h-auto text-blue-600'>
                      + Xem thêm
                    </Button>
                  )}
                </CardContent>
              </Card>
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
                  className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}
                >
                  {paginatedProducts.map((product) => {
                    // Find original product for addToCart
                    const originalProduct = products.find((p: Product) => p._id === product.id)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant={viewMode}
                        onAddToCart={() => {
                          if (originalProduct) {
                            addToCart(originalProduct, 1)
                          }
                        }}
                      />
                    )
                  })}
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
