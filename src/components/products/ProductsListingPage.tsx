import { useState, useEffect } from 'react'
import { Grid, List, Search as SearchIcon } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useProductListing, useBreadcrumbGeneration } from '../../hooks'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import {
  getProductId,
  getProductImage,
  getProductRating,
  getProductReviewCount,
  isProductInStock,
  isProductPrescription,
  getProductSalePrice,
  getBrandName,
} from '../../utils/productHelpers'

import { FilterSidebar } from './FilterSidebar'
import { ProductCard } from './ProductCard'
import { PaginationComponent } from '../shared/PaginationComponent'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { StaggerContainer, StaggerItem } from '../shared/StaggerContainer'
import { ScrollReveal } from '../shared/ScrollReveal'
import { InteractiveCard } from '../shared/InteractiveCard'

import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { productService } from '../../services/productService'
import type { Product } from '../../types/product'

export function ProductsListingPage() {
  const { addToCart, toggleWishlist } = useCart()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await productService.getProducts()
        setProducts(productsData)
      } catch (error) {
      }
    }

    fetchProducts()
  }, [])
  const {
    // States
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    resultsPerPage,
    setResultsPerPage,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,

    // Computed values
    filteredProducts,
    paginatedProducts,
    totalPages,

    // Actions
    handleSearch,
    resetFilters,
  } = useProductListing({ products })

  // Handle form submit for search
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  // Breadcrumb generation
  const breadcrumbItems = useBreadcrumbGeneration({ searchQuery })

  // Empty state
  if (filteredProducts.length === 0) {
    return (
      <EnhancedPageTransition variant='slide' direction='up'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <ScrollReveal direction='up'>
            <div></div>
          </ScrollReveal>

          <div className='flex gap-6'>
            <ScrollReveal direction='left' delay={0.2}>
              <div className='w-1/4'>
                <FilterSidebar filters={filters} onFiltersChange={setFilters} resultCount={filteredProducts.length} />
              </div>
            </ScrollReveal>

            <ScrollReveal direction='right' delay={0.3}>
              <div className='w-3/4'>
                <InteractiveCard className='p-8 text-center'>
                  <Card>
                    <CardContent>
                      <StaggerContainer direction='up' staggerDelay={0.2}>
                        <StaggerItem>
                          <SearchIcon className='w-16 h-16 text-blue-300 mx-auto mb-4' />
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
                              className='bg-gradient-to-r from-blue-600 to-cyan-500'
                            >
                              Về trang chủ
                            </Button>
                          </div>
                        </StaggerItem>
                      </StaggerContainer>
                    </CardContent>
                  </Card>
                </InteractiveCard>
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
            <div className='w-full xl:w-80 lg:w-72 xl:sticky xl:top-4 xl:self-start shrink-0'>
              <FilterSidebar filters={filters} onFiltersChange={setFilters} resultCount={filteredProducts.length} />
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
                      Tìm thấy <span className='font-medium text-blue-600'>{filteredProducts.length}</span> sản phẩm
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
                        </div>
                        <Button
                          type='submit'
                          className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
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

                      {/* Results per page */}
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-600'>Hiển thị:</span>
                        <Select
                          value={resultsPerPage.toString()}
                          onValueChange={(value) => setResultsPerPage(parseInt(value))}
                        >
                          <SelectTrigger className='w-20 border-blue-200'>
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

                    {/* View toggle */}
                    <div className='flex items-center border border-blue-200 rounded-lg overflow-hidden'>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'}
                      >
                        <Grid className='w-4 h-4' />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}
                      >
                        <List className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </StaggerItem>

                {/* Products Grid/List */}
                <StaggerItem>
                  <StaggerContainer direction='up' staggerDelay={0.05}>
                    <div
                      className={`
                        ${
                          viewMode === 'grid'
                            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                            : 'space-y-4 w-full max-w-5xl'
                        }
                        mb-8
                      `}
                    >
                      {paginatedProducts.map((product) => (
                        <StaggerItem key={getProductId(product)}>
                          <ProductCard
                            product={{
                              id: getProductId(product),
                              name: product.name,
                              slug: product.slug,
                              brand: getBrandName(product),
                              image: getProductImage(product),
                              originalPrice: product.originalPrice,
                              salePrice: getProductSalePrice(product) || 0,
                              discountPercentage: product.discountPercentage,
                              rating: getProductRating(product),
                              reviewCount: getProductReviewCount(product),
                              inStock: isProductInStock(product),
                              isPrescription: isProductPrescription(product),
                              isOnSale: product.isOnSale,
                            }}
                            variant={viewMode}
                            onAddToCart={() => {
                              addToCart(product, 1)
                            }}
                            onToggleWishlist={() => {
                              toggleWishlist(getProductId(product), product.name)
                            }}
                          />
                        </StaggerItem>
                      ))}
                    </div>
                  </StaggerContainer>
                </StaggerItem>

                {/* Pagination */}
                <StaggerItem>
                  {totalPages > 1 && (
                    <ScrollReveal direction='up' delay={0.2}>
                      <PaginationComponent
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className='justify-center'
                      />
                    </ScrollReveal>
                  )}
                </StaggerItem>
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </EnhancedPageTransition>
  )
}
