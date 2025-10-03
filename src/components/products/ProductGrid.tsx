import { useState } from 'react'
import { motion } from 'framer-motion'
import { Grid3X3, List, ShoppingCart, FileText } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import ProductCard from './ProductCard'
import '~/style/Products.css'

interface PharmaceuticalProduct {
  id: string
  name: string
  activeIngredient: string
  dosage: string
  dosageForm: string
  packaging: string
  manufacturer: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
  reviews: number
  description: string
  inStock: boolean
  prescription: boolean
  discount?: number
  registrationNumber?: string
  origin?: string
  expiryDate?: string
}

interface ProductGridProps {
  products: PharmaceuticalProduct[]
  loading?: boolean
  searchQuery: string
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating-desc' | 'newest'
type ViewMode = 'grid' | 'list'

export default function ProductGrid({ products, loading = false, searchQuery }: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  // Different items per page for different view modes
  const getItemsPerPage = () => {
    return viewMode === 'list' ? 8 : 12 // List view shows fewer items due to larger size
  }

  const itemsPerPage = getItemsPerPage()

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'name-asc':
        return a.name.localeCompare(b.name, 'vi')
      case 'name-desc':
        return b.name.localeCompare(a.name, 'vi')
      case 'rating-desc':
        return b.rating - a.rating
      case 'newest':
        return b.id.localeCompare(a.id)
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = sortedProducts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        {/* Loading Header */}
        <div className='flex items-center justify-between'>
          <div className='skeleton-loading h-8 bg-gray-200 rounded w-48 animate-pulse' />
          <div className='flex items-center gap-4'>
            <div className='skeleton-loading h-10 bg-gray-200 rounded w-32 animate-pulse' />
            <div className='skeleton-loading h-10 bg-gray-200 rounded w-20 animate-pulse' />
          </div>
        </div>

        {/* Loading Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className='skeleton-card bg-white/90 rounded-3xl overflow-hidden shadow-xl animate-pulse h-full flex flex-col'
            >
              <div className='skeleton-image aspect-square bg-gradient-to-br from-gray-200 to-gray-300' />
              <div className='p-6 space-y-4 flex-1 flex flex-col'>
                <div className='flex justify-between'>
                  <div className='skeleton-text h-6 bg-gray-200 rounded-full w-20' />
                  <div className='skeleton-text h-4 bg-gray-200 rounded w-16' />
                </div>
                <div className='skeleton-text h-6 bg-gray-200 rounded w-4/5' />
                <div className='skeleton-text h-4 bg-gray-200 rounded w-full flex-1' />
                <div className='skeleton-text h-4 bg-gray-200 rounded w-3/4' />
                <div className='skeleton-text h-8 bg-gray-200 rounded w-2/3' />
                <div className='skeleton-button h-12 bg-gray-200 rounded-xl w-full mt-auto' />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/90 backdrop-blur-md border border-white/40 rounded-3xl p-6 shadow-xl'>
        <div className='flex items-center gap-4'>
          <div className='text-foreground'>
            <span className='font-semibold'>{products.length}</span>
            <span className='text-muted-foreground ml-1'>
              sản phẩm
              {searchQuery && (
                <span className='ml-1'>
                  cho "<span className='font-medium text-[#0066CC]'>{searchQuery}</span>"
                </span>
              )}
            </span>
          </div>

          {searchQuery && (
            <Badge variant='secondary' className='bg-[#0066CC]/10 text-[#0066CC]'>
              Kết quả tìm kiếm
            </Badge>
          )}
        </div>

        <div className='flex items-center gap-4'>
          {/* Sort Options */}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className='w-48 bg-white/90 backdrop-blur-sm'>
              <SelectValue placeholder='Sắp xếp theo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='default'>Mặc định</SelectItem>
              <SelectItem value='price-asc'>Giá: Thấp đến cao</SelectItem>
              <SelectItem value='price-desc'>Giá: Cao đến thấp</SelectItem>
              <SelectItem value='name-asc'>Tên: A-Z</SelectItem>
              <SelectItem value='name-desc'>Tên: Z-A</SelectItem>
              <SelectItem value='rating-desc'>Đánh giá cao nhất</SelectItem>
              <SelectItem value='newest'>Mới nhất</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className='flex bg-gray-100 rounded-lg p-1'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => {
                setViewMode('grid')
                setCurrentPage(1) // Reset to first page when changing view mode
              }}
              className={`${viewMode === 'grid' ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white shadow-sm' : ''}`}
            >
              <Grid3X3 className='w-4 h-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => {
                setViewMode('list')
                setCurrentPage(1) // Reset to first page when changing view mode
              }}
              className={`${viewMode === 'list' ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white shadow-sm' : ''}`}
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {currentProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center py-16 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-lg'
        >
          <div className='w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center'>
            <Grid3X3 className='w-12 h-12 text-muted-foreground' />
          </div>
          <h3 className='text-xl font-semibold text-foreground mb-2'>Không tìm thấy sản phẩm</h3>
          <p className='text-muted-foreground mb-6'>
            {searchQuery
              ? `Không có sản phẩm nào khớp với "${searchQuery}"`
              : 'Hãy thử điều chỉnh bộ lọc để xem thêm sản phẩm'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white'
          >
            Tải lại trang
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Products Display */}
          <motion.div
            layout
            className={`${
              viewMode === 'grid'
                ? 'product-grid-item grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-6'
            }`}
          >
            {currentProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {viewMode === 'grid' ? (
                  <ProductCard product={product} />
                ) : (
                  <div className='bg-white/95 backdrop-blur-md border-2 border-white/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 flex items-start gap-6 group hover:border-[#0066CC]/20'>
                    {/* Product Image */}
                    <div className='w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 shadow-lg'>
                      <img
                        src={product.image}
                        alt={product.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                      />
                    </div>

                    {/* Product Info */}
                    <div className='flex-1 min-w-0 space-y-4'>
                      {/* Header */}
                      <div className='space-y-2'>
                        <div className='flex items-start justify-between'>
                          <h3 className='font-semibold text-foreground text-xl group-hover:text-[#0066CC] transition-colors leading-tight'>
                            {product.name}
                          </h3>
                          {product.prescription && (
                            <div className='flex items-center gap-1.5 ml-3 text-[#0066CC] flex-shrink-0'>
                              <FileText className='w-4 h-4' />
                              <span className='text-xs font-medium'>Kê đơn</span>
                            </div>
                          )}
                        </div>
                        <p className='text-sm text-muted-foreground italic'>{product.manufacturer}</p>
                      </div>

                      {/* Pharmaceutical Details */}
                      <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
                        <div>
                          <span className='text-muted-foreground'>Hoạt chất:</span>
                          <span className='ml-2 font-medium text-foreground'>{product.activeIngredient}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Hàm lượng:</span>
                          <span className='ml-2 font-medium text-foreground'>{product.dosage}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Dạng bào chế:</span>
                          <span className='ml-2 font-medium text-foreground'>{product.dosageForm}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Đóng gói:</span>
                          <span className='ml-2 font-medium text-foreground'>{product.packaging}</span>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div>
                        <Badge
                          variant='outline'
                          className='bg-gradient-to-r from-blue-50 to-cyan-50 border-[#0066CC]/20 text-[#0066CC] font-medium'
                        >
                          {product.category}
                        </Badge>
                      </div>

                      {/* Price & Stock */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <div className='flex items-baseline gap-2'>
                            <span className='text-2xl font-bold text-[#0066CC]'>
                              {product.price.toLocaleString('vi-VN')}₫
                            </span>
                            {product.originalPrice && (
                              <span className='text-base text-muted-foreground line-through'>
                                {product.originalPrice.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </div>
                          {product.discount && (
                            <Badge className='bg-gradient-to-r from-red-500 to-red-600 text-white'>
                              -{product.discount}%
                            </Badge>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}
                          />
                          <span
                            className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className='flex-shrink-0'>
                      <Button
                        size='lg'
                        className={`h-14 px-8 rounded-xl shadow-lg transition-all duration-300 backdrop-blur-sm ${
                          product.prescription
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-300/30 hover:border-amber-200/50 shadow-amber-200/25 hover:shadow-amber-300/40'
                            : 'bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white border border-blue-300/20 hover:border-blue-200/40 shadow-blue-200/20 hover:shadow-blue-300/30'
                        } disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 disabled:border-gray-300/20 disabled:shadow-gray-200/20 disabled:cursor-not-allowed`}
                        disabled={!product.inStock}
                      >
                        {!product.inStock ? (
                          <span className='font-medium'>Hết hàng</span>
                        ) : product.prescription ? (
                          <div className='flex items-center gap-2'>
                            <FileText className='w-5 h-5' />
                            <span className='font-medium'>Tư vấn thuốc</span>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <ShoppingCart className='w-5 h-5' />
                            <span className='font-medium'>Thêm vào giỏ</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center mt-8'>
              <Pagination>
                <PaginationContent className='bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl px-2 py-1 shadow-lg'>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage - 1)
                        }}
                        className='hover:bg-[#0066CC]/10 hover:text-[#0066CC]'
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href='#'
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(pageNum)
                          }}
                          isActive={currentPage === pageNum}
                          className={`${
                            currentPage === pageNum
                              ? 'bg-[#0066CC] text-white hover:bg-[#0066CC]'
                              : 'hover:bg-[#0066CC]/10 hover:text-[#0066CC]'
                          }`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(currentPage + 1)
                        }}
                        className='hover:bg-[#0066CC]/10 hover:text-[#0066CC]'
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}
