import { useState, useRef } from 'react'
import { Search, Camera, Star, Package, Heart, Plus, Info } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { ImageWithFallback } from '../shared/ImageWithFallback'

interface Product {
  id: string
  name: string
  image: string
  price: number
  unit: string
  stock: number
  rating: number
  type: 'rx' | 'otc' | 'supplement' | 'cosmetic'
  brand: string
  barcode?: string
}

interface ProductSearchWidgetProps {
  onProductAdd: (product: Product, quantity: number) => void
  onProductInfo: (product: Product) => void
  className?: string
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    image: '/images/paracetamol.jpg',
    price: 25000,
    unit: 'Hộp 10 viên',
    stock: 150,
    rating: 4.5,
    type: 'otc',
    brand: 'DHG Pharma',
    barcode: '8934563412789',
  },
]

const categoryFilters = [
  { id: 'rx', label: 'Thuốc kê đơn', icon: '💊', color: 'text-red-600' },
  { id: 'otc', label: 'OTC', icon: '🏥', color: 'text-blue-600' },
  { id: 'supplement', label: 'TPCN', icon: '🌿', color: 'text-green-600' },
  { id: 'cosmetic', label: 'Mỹ phẩm', icon: '💄', color: 'text-pink-600' },
]

const orderTemplates = ['Cảm cúm thông thường', 'Đau dạ dày + tiêu hóa', 'Chăm sóc da mặt cơ bản', 'Vitamin tổng hợp']

export function ProductSearchWidget({ onProductAdd, onProductInfo, className = '' }: ProductSearchWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Product[]>(mockProducts)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (term: string) => {
    setSearchTerm(term)

    try {
      if (!term.trim()) {
        setSearchResults(mockProducts)
        return
      }

      const filtered = mockProducts.filter((product) => {
        if (!product) return false
        const name = (product.name || '').toLowerCase()
        const brand = (product.brand || '').toLowerCase()
        const barcode = product.barcode || ''
        const searchTerm = term.toLowerCase()

        return name.includes(searchTerm) || brand.includes(searchTerm) || barcode.includes(term)
      })

      setSearchResults(filtered)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
  }

  const handleCategoryFilter = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null)
      setSearchResults(mockProducts)
    } else {
      setSelectedCategory(categoryId)
      setSearchResults(mockProducts.filter((p) => p.type === categoryId))
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

  const handleScanBarcode = () => {
    // Mock barcode scan
    const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)]
    setSearchTerm(randomProduct.barcode || randomProduct.name)
    handleSearch(randomProduct.barcode || randomProduct.name)
  }

  return (
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

      {/* Quick Actions */}
      <div className='flex space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={handleScanBarcode}
          className='border-blue-200 text-blue-700 hover:bg-blue-50'
        >
          <Camera className='w-4 h-4 mr-1' />
          Scan
        </Button>

        <Button variant='outline' size='sm' className='border-blue-200 text-blue-700 hover:bg-blue-50'>
          🎯 Yêu thích
        </Button>
      </div>

      {/* Category Filters */}
      <Card className='p-3'>
        <h4 className='text-sm font-medium mb-2 text-gray-700'>📂 DANH MỤC NHANH:</h4>
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
        <div className='p-3 border-b border-blue-100'>
          <h4 className='font-medium text-blue-900'>📋 KẾT QUẢ TÌM KIẾM</h4>
        </div>

        <ScrollArea className='h-80'>
          <div className='p-3 space-y-3'>
            {searchResults.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Package className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>Không tìm thấy sản phẩm</p>
              </div>
            ) : (
              searchResults.map((product) => {
                const typeInfo = getProductTypeInfo(product.type)
                return (
                  <Card key={product.id} className='p-3 hover:shadow-md transition-shadow'>
                    <div className='flex space-x-3'>
                      <div className='flex-shrink-0'>
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className='w-12 h-12 object-cover rounded border'
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
                            onClick={() => onProductInfo(product)}
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

      {/* Order Templates */}
      <Card className='border-blue-100'>
        <div className='p-3 border-b border-blue-100'>
          <h4 className='font-medium text-blue-900'>🏷️ TEMPLATE ĐƠN HÀNG</h4>
        </div>

        <div className='p-3 space-y-2'>
          {orderTemplates.map((template, index) => (
            <Button
              key={index}
              variant='outline'
              size='sm'
              className='w-full justify-start text-xs border-blue-200 text-blue-700 hover:bg-blue-50'
            >
              • {template}
            </Button>
          ))}

          <Button
            variant='outline'
            size='sm'
            className='w-full justify-start text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50'
          >
            <Plus className='w-3 h-3 mr-1' />
            Tạo template mới
          </Button>
        </div>
      </Card>
    </div>
  )
}
