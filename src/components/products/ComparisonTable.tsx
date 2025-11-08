import { X, ShoppingCart, Star, Check, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

interface Product {
  id: string
  name: string
  brand: string
  image: string
  price: number
  unit: string
  rating: number
  reviewCount: number
  activeIngredient: string
  uses: string[]
  dosageForm: string
  targetAudience: {
    adults: boolean
    children: boolean
    childrenAge?: string
    pregnancy: boolean
  }
  dosage: string
  contraindications: string[]
  sideEffects: string[]
  origin: string
  shelfLife: string
  storage: string
  stock: number
  shipping: {
    express: boolean
    standard: boolean
  }
  onSale?: boolean
  salePrice?: number
}

interface ComparisonTableProps {
  products: Product[]
  onRemoveProduct: (productId: string) => void
  onAddToCart: (productId: string) => void
  onToggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  className?: string
}

interface ComparisonRow {
  key: string
  label: string
  type: 'image' | 'text' | 'price' | 'rating' | 'stock'
}

const comparisonRows: ComparisonRow[] = [
  { key: 'image', label: 'Hình ảnh', type: 'image' },
  { key: 'name', label: 'Tên sản phẩm', type: 'text' },
  { key: 'price', label: 'Giá bán', type: 'price' },
  { key: 'rating', label: 'Đánh giá', type: 'rating' },
  { key: 'stock', label: 'Tình trạng kho', type: 'stock' },
]

export function ComparisonTable({
  products,
  onRemoveProduct,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  className = '',
}: ComparisonTableProps) {
  const renderCellContent = (product: Product, row: ComparisonRow) => {
    try {
      switch (row.type) {
        case 'image':
          return (
            <div className='space-y-3'>
              <div className='relative'>
                <div className='w-24 h-24 bg-gray-100 rounded-lg mx-auto flex items-center justify-center'>
                  <span className='text-gray-500'>IMG</span>
                </div>
              </div>

              <div className='flex space-x-2 justify-center'>
                <Button
                  size='sm'
                  onClick={() => onAddToCart(product.id)}
                  className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                  <ShoppingCart className='w-4 h-4 mr-1' />
                  Thêm
                </Button>
                <Button
                  size='icon'
                  variant={isInWishlist(product.id) ? 'default' : 'outline'}
                  onClick={() => onToggleWishlist(product.id)}
                  className={
                    isInWishlist(product.id)
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-500'
                  }
                >
                  <Star className='w-4 h-4' />
                </Button>
              </div>

              <Button
                size='sm'
                variant='outline'
                onClick={() => onRemoveProduct(product.id)}
                className='w-full text-red-500 hover:text-red-700'
              >
                <X className='w-3 h-3 mr-1' />
                Xóa
              </Button>
            </div>
          )

        case 'price':
          return (
            <div className='text-center'>
              <div className='font-bold text-blue-600'>{product.price?.toLocaleString('vi-VN') || 0}đ</div>
              <div className='text-sm text-gray-600'>/{product.unit || ''}</div>
            </div>
          )

        case 'rating':
          return (
            <div className='text-center'>
              <div className='flex justify-center space-x-1 mb-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className='text-sm font-medium'>{product.rating || 0}/5</div>
            </div>
          )

        case 'stock':
          return (
            <div className='text-center'>
              {(product.stock || 0) > 50 ? (
                <div className='flex items-center justify-center text-green-600'>
                  <Check className='w-4 h-4 mr-1' />
                  <span className='text-sm'>Còn hàng</span>
                </div>
              ) : (
                <div className='flex items-center justify-center text-amber-600'>
                  <AlertTriangle className='w-4 h-4 mr-1' />
                  <span className='text-sm'>Còn ít</span>
                </div>
              )}
            </div>
          )

        default:
          return <div className='text-sm text-center'>{String(product[row.key as keyof Product] || '')}</div>
      }
    } catch (error) {
      return <div className='text-sm text-center'>-</div>
    }
  }

  return (
    <Card
      className={`overflow-hidden bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 ${className}`}
    >
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-blue-100'>
              <th className='sticky left-0 bg-blue-50 p-4 text-left font-medium text-blue-900 min-w-40'>THÔNG TIN</th>
              {products.map((product) => (
                <th key={product.id} className='p-4 text-center font-medium text-blue-900 min-w-64'>
                  <div>
                    <div className='font-medium'>{product.name}</div>
                    <div className='text-sm text-gray-600 mt-1'>{product.brand}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, index) => (
              <tr
                key={row.key}
                className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
              >
                <td className='sticky left-0 bg-gray-50 p-4 font-medium text-gray-700 border-r border-gray-200'>
                  {row.label}
                </td>
                {products.map((product) => (
                  <td key={product.id} className='p-4 text-center align-top'>
                    {renderCellContent(product, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
