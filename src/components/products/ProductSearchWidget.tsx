import { useState, useRef } from 'react'
import { Search, Star, Package, Heart, Plus, Info, ClipboardList, Folders, X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { productService } from '../../services/productService'
import { ProductDetailModal } from './ProductDetailModal'

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
  { id: 'rx', label: 'Thuốc kê đơn', icon: '💊', color: 'text-red-600' },
  { id: 'otc', label: 'OTC', icon: '🏥', color: 'text-blue-600' },
  { id: 'supplement', label: 'TPCN', icon: '🌿', color: 'text-green-600' },
  { id: 'cosmetic', label: 'Mỹ phẩm', icon: '💄', color: 'text-pink-600' },
]

export function ProductSearchWidget({ onProductAdd, onProductInfo, className = '' }: ProductSearchWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async (term: string) => {
    setSearchTerm(term)

    try {
      setLoading(true)
      if (!term.trim()) {
        setSearchResults([])
        return
      }

      // Use real API to search products
      const products = await productService.searchProducts(term)

      // Transform API products to local Product format
      const transformedProducts: Product[] = products.map((p) => ({
        id: p._id,
        name: p.name,
        image: p.featuredImage || '/images/product-placeholder.jpg',
        price: p.price || p.salePrice || 0,
        originalPrice: p.originalPrice,
        salePrice: p.salePrice,
        discountPercentage: p.discountPercentage,
        onSale: p.onSale || p.isOnSale,
        unit: p.unit || 'Hộp',
        stock: p.stockQuantity,
        maxOrderQuantity: p.maxOrderQuantity,
        rating: p.rating || 4.5,
        reviewCount: p.reviewCount,
        type: p.requiresPrescription ? 'rx' : 'otc',
        brand: p.brand?.name || 'Unknown',
        barcode: p.barcode,
        sku: p.sku,
        category: p.category,
        shortDescription: p.shortDescription,
        description: p.description,
        origin: p.origin,
        packaging: p.packaging,
        expiryInfo: p.expiryInfo,
        ingredients: p.ingredients,
        uses: p.uses,
        instructions: p.instructions,
        warnings: p.warnings,
        status: p.status,
        requiresPrescription: p.requiresPrescription,
        tags: p.tags,
      }))

      setSearchResults(transformedProducts)
    } catch {
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryFilter = async (categoryId: string) => {
    if (selectedCategory === categoryId) {
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
        // Filter by prescription requirement based on category
        const isPrescription = categoryId === 'rx'
        const products = await productService.getProducts({
          isPrescription,
          limit: 50,
        })

        const transformedProducts: Product[] = products.map((p) => ({
          id: p._id,
          name: p.name,
          image: p.featuredImage || '/images/product-placeholder.jpg',
          price: p.price || p.salePrice || 0,
          originalPrice: p.originalPrice,
          salePrice: p.salePrice,
          discountPercentage: p.discountPercentage,
          onSale: p.onSale || p.isOnSale,
          unit: p.unit || 'Hộp',
          stock: p.stockQuantity,
          maxOrderQuantity: p.maxOrderQuantity,
          rating: p.rating || 4.5,
          reviewCount: p.reviewCount,
          type: p.requiresPrescription ? 'rx' : 'otc',
          brand: p.brand?.name || 'Unknown',
          barcode: p.barcode,
          sku: p.sku,
          category: p.category,
          shortDescription: p.shortDescription,
          description: p.description,
          origin: p.origin,
          packaging: p.packaging,
          expiryInfo: p.expiryInfo,
          ingredients: p.ingredients,
          uses: p.uses,
          instructions: p.instructions,
          warnings: p.warnings,
          status: p.status,
          requiresPrescription: p.requiresPrescription,
          tags: p.tags,
        }))

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
      <div className={`space-y-4 ${className}`}>
        {/* Search Input */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            ref={searchInputRef}
            type='text'
            placeholder='Tìm thuốc, barcode, tên...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='pl-10 border-2 border-blue-200 focus:border-blue-500'
          />
        </div>

        {/* Category Filters */}
        <Card className='p-3 border-b border-blue-100'>
          <h4 className='font-medium text-blue-900 flex items-center gap-2'>
            <Folders className='w-4 h-4' />
            DANH MỤC NHANH:
          </h4>
          <div className='grid grid-cols-2 gap-2'>
            {categoryFilters.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleCategoryFilter(category.id)}
                className={`justify-start text-xs ${
                  selectedCategory === category.id
                    ? `bg-blue-600 text-white`
                    : `border-blue-200 ${category.color} hover:bg-blue-50`
                }`}
              >
                <span className='mr-1'>{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </Card>

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
                    <Card key={product.id} className='p-3 hover:shadow-md transition-shadow border-b border-blue-200'>
                      <div className='flex space-x-3'>
                        <div className='flex-shrink-0'>
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className='w-12 h-12 object-cover rounded border border-b border-blue-100'
                          />
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-1'>
                            <h5 className='font-medium text-sm line-clamp-1'>{product.name}</h5>
                            <Button variant='ghost' size='sm' className='p-1 h-auto text-gray-400 hover:text-red-500'>
                              <Heart className='w-3 h-3' />
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
