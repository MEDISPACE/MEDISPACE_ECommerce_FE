import { useState, useRef } from 'react'
import { Search, Star, Package, Heart, Plus, Info, ClipboardList, Folders, X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { searchService } from '../../services/searchService'
import { ProductDetailModal } from './ProductDetailModal'
import { useWishlist } from '../../hooks/product/useWishlist'

interface Product {
  id: string
  name: string
  image: string
  price: number
  originalPrice?: number
  salePrice?: number
  discountPercentage?: number
  onSale?: boolean
  unit: string
  stock: number
  maxOrderQuantity?: number
  rating: number
  reviewCount?: number
  type: 'rx' | 'otc' | 'supplement' | 'cosmetic'
  brand: string
  barcode?: string
  sku?: string
  category?: { name: string }
  shortDescription?: string
  description?: string
  origin?: string
  packaging?: string
  expiryInfo?: string
  ingredients?: string | string[]
  uses?: string[]
  instructions?: string
  warnings?: string[]
  status?: 'active' | 'discontinued' | 'out_of_stock'
  requiresPrescription?: boolean
  tags?: string[]
}

interface ProductSearchWidgetProps {
  onProductAdd: (product: Product, quantity: number) => void
  onProductInfo: (product: Product) => void
  className?: string
}

const categoryFilters = [
  { id: 'all', label: 'Tất cả', icon: '📋', color: 'text-gray-700' },
  { id: 'rx', label: 'Thuốc kê đơn', icon: '💊', color: 'text-red-600' },
  { id: 'otc', label: 'OTC', icon: '🏥', color: 'text-blue-600' },
  { id: 'supplement', label: 'TPCN', icon: '🌿', color: 'text-green-600' },
  { id: 'medical_device', label: 'Thiết bị y tế', icon: '🩺', color: 'text-purple-600' },
  { id: 'cosmetic', label: 'Mỹ phẩm', icon: '💄', color: 'text-pink-600' },
]

export function ProductSearchWidget({ onProductAdd, onProductInfo, className = '' }: ProductSearchWidgetProps) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const mapHitToProduct = (hit: any): Product => {
    const p = hit.document as any
    const defaultVariant = p.priceVariants?.find((v: any) => v.isDefault) || p.priceVariants?.[0]
    const price = p.price ?? defaultVariant?.price ?? 0
    const unit = defaultVariant?.unit ?? 'Hộp'

    return {
      id: p.mongoId || p._id || '',
      name: p.name || '',
      image: p.featuredImage || '/images/product-placeholder.jpg',
      price: price,
      originalPrice: p.originalPrice || defaultVariant?.originalPrice || price,
      unit: unit,
      stock: p.stockQuantity || 0,
      rating: p.rating || 4.5,
      type: p.requiresPrescription ? 'rx' : 'otc',
      brand: p.brandName || p.brand?.name || 'Unknown',
      sku: p.sku || '',
      category: { name: p.categoryName || p.category?.name || '' },
      shortDescription: p.shortDescription || p.description || '',
      status: p.isActive === false ? 'discontinued' : 'active',
      requiresPrescription: p.requiresPrescription,
    } as Product
  }

  const handleSearch = async (term: string) => {
    setSearchTerm(term)

    try {
      setLoading(true)
      if (!term.trim()) {
        setSearchResults([])
        return
      }

      const result = await searchService.searchProducts({ q: term, limit: 20 })
      const transformedProducts = result.hits.map(mapHitToProduct)
      setSearchResults(transformedProducts)
    } catch {
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryFilter = async (categoryId: string) => {
    if (categoryId === 'all' || selectedCategory === categoryId) {
      setSelectedCategory(null)
      // Reset to search results without category filter
      if (searchTerm.trim()) {
        await handleSearch(searchTerm)
      } else {
        setSearchResults([])
      }
    } else {
      setSelectedCategory(categoryId)
      try {
        setLoading(true)

        let searchQuery = searchTerm.trim() || ''
        const searchParams: any = { q: searchQuery, limit: 30 }

        if (categoryId === 'rx') {
          searchParams.requiresPrescription = true
        } else if (categoryId === 'otc') {
          searchParams.requiresPrescription = false
        } else if (categoryId === 'supplement') {
          searchQuery = searchQuery ? `${searchQuery} Thực phẩm chức năng` : 'Thực phẩm chức năng'
          searchParams.q = searchQuery
        } else if (categoryId === 'medical_device') {
          searchQuery = searchQuery ? `${searchQuery} Trang thiết bị y tế` : 'Trang thiết bị y tế'
          searchParams.q = searchQuery
        } else if (categoryId === 'cosmetic') {
          searchQuery = searchQuery ? `${searchQuery} Mỹ phẩm` : 'Mỹ phẩm'
          searchParams.q = searchQuery
        }

        const result = await searchService.searchProducts(searchParams)
        const transformedProducts = result.hits.map(mapHitToProduct)

        setSearchResults(transformedProducts)
      } catch {
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }
  }

  const getProductTypeInfo = (type: string) => {
    switch (type) {
      case 'rx':
        return { badge: '🔴 Rx', color: 'bg-red-100 text-red-700' }
      case 'otc':
        return { badge: '💊 OTC', color: 'bg-blue-100 text-blue-700' }
      case 'supplement':
        return { badge: '🌿 TPCN', color: 'bg-green-100 text-green-700' }
      case 'cosmetic':
        return { badge: '💄 Mỹ phẩm', color: 'bg-pink-100 text-pink-700' }
      default:
        return { badge: '💊 OTC', color: 'bg-gray-100 text-gray-700' }
    }
  }

  const handleProductInfoClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
    onProductInfo(product) // Keep the parent callback
  }

  return (
    <>
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduct(null)
        }}
        onAddToCart={onProductAdd}
      />
      <div className={`space-y-4 ${className} w-full`}>
        <div className='relative w-full flex items-center bg-white rounded-xl border border-gray-200 px-4 hover:border-blue-300 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 shadow-sm'>
          <Search className='text-blue-400 w-4 h-4 flex-shrink-0 mr-2' />
          <Input
            ref={searchInputRef}
            type='text'
            placeholder='Tìm thuốc, barcode, tên, thành phần...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='flex-1 h-11 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm px-0 shadow-none text-gray-900 placeholder:text-gray-400'
          />
        </div>

        {/* Category Filters */}
        <div className='flex flex-nowrap overflow-x-auto hide-scrollbar gap-2 pb-2'>
          {categoryFilters.map((category) => {
            const isSelected = category.id === 'all' ? selectedCategory === null : selectedCategory === category.id
            return (
              <Button
                key={category.id}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter(category.id)}
                className={`whitespace-nowrap flex-shrink-0 rounded-full border px-4 h-9 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                    : `bg-white border-gray-200 ${category.color} hover:bg-gray-50 hover:border-blue-300`
                }`}
              >
                <span className='mr-1.5 text-sm opacity-80'>{category.icon}</span>
                {category.label}
              </Button>
            )
          })}
        </div>

        {/* Search Results */}
        <Card className='border-blue-100'>
          <div className='p-3 border-b border-blue-100 flex items-center justify-between'>
            <h4 className='font-medium text-blue-900 flex items-center gap-2'>
              <ClipboardList className='w-4 h-4' />
              KẾT QUẢ TÌM KIẾM
            </h4>
            {(searchResults.length > 0 || searchTerm || selectedCategory) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory(null)
                  setSearchResults([])
                  searchInputRef.current?.focus()
                }}
                className='h-7 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50'
              >
                <X className='w-4 h-4 mr-1' />
                Xoá
              </Button>
            )}
          </div>

          <ScrollArea className='h-80'>
            <div className='p-3 space-y-3'>
              {loading ? (
                <div className='text-center py-8 text-gray-500'>
                  <div className='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2'></div>
                  <p>Đang tìm kiếm...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Package className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                  <p>Không tìm thấy sản phẩm</p>
                  {searchTerm && <p className='text-sm'>Thử tìm với từ khóa khác</p>}
                </div>
              ) : (
                searchResults.map((product) => {
                  const typeInfo = getProductTypeInfo(product.type)
                  return (
                    <Card
                      key={product.id}
                      className='p-3 border border-transparent hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white relative overflow-hidden group cursor-pointer'
                    >
                      {/* Decorative gradient blur on hover */}
                      <div className='absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />

                      <div className='flex space-x-3 relative z-10'>
                        <div className='flex-shrink-0'>
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className='w-16 h-16 object-cover rounded-md border border-gray-100 shadow-sm'
                          />
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-1'>
                            <h5 className='font-medium text-sm line-clamp-1'>{product.name}</h5>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='p-1 h-auto text-gray-400 hover:text-red-500'
                              onClick={() => toggleWishlist(product.id)}
                            >
                              <Heart
                                className={`w-3 h-3 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                              />
                            </Button>
                          </div>

                          <div className='text-xs text-gray-600 mb-2'>
                            {product.unit} | {product.price.toLocaleString('vi-VN')}đ
                          </div>

                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center space-x-2'>
                              <div className='flex items-center space-x-1'>
                                <span className='text-xs'>📦 Tồn: {product.stock}</span>
                              </div>

                              <Badge variant='secondary' className={`text-xs ${typeInfo.color}`}>
                                {typeInfo.badge}
                              </Badge>

                              <div className='flex items-center space-x-1'>
                                <Star className='w-3 h-3 fill-yellow-400 text-yellow-400' />
                                <span className='text-xs text-gray-600'>{product.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className='flex space-x-2'>
                            <Button
                              size='sm'
                              onClick={() => onProductAdd(product, 1)}
                              className='bg-blue-600 hover:bg-blue-700 text-white h-7 px-3 text-xs'
                            >
                              <Plus className='w-3 h-3 mr-1' />
                              Thêm
                            </Button>

                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleProductInfoClick(product)}
                              className='border-blue-200 text-blue-700 hover:bg-blue-50 h-7 px-3 text-xs'
                            >
                              <Info className='w-3 h-3 mr-1' />
                              Chi tiết
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </>
  )
}
