import { Star, AlertCircle, Building2, Calendar, Barcode, ShoppingCart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { ScrollArea } from '../ui/scroll-area'

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

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, quantity: number) => void
}

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null

  const getProductTypeInfo = (type: string) => {
    switch (type) {
      case 'rx':
        return { badge: '🔴 Thuốc kê đơn', color: 'bg-red-100 text-red-700', warning: 'Cần có đơn thuốc của bác sĩ' }
      case 'otc':
        return { badge: '💊 OTC', color: 'bg-[#E8EDF5] text-[#0A2463]', warning: 'Không cần đơn thuốc' }
      case 'supplement':
        return { badge: '🌿 TPCN', color: 'bg-green-100 text-green-700', warning: 'Thực phẩm chức năng' }
      case 'cosmetic':
        return { badge: '💄 Mỹ phẩm', color: 'bg-pink-100 text-pink-700', warning: 'Sản phẩm làm đẹp' }
      default:
        return { badge: '💊 OTC', color: 'bg-gray-100 text-gray-700', warning: 'Không cần đơn thuốc' }
    }
  }

  const typeInfo = getProductTypeInfo(product.type)
  const isLowStock = product.stock < 10

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] p-0 overflow-hidden'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle className='text-2xl font-bold text-blue-900'>{product.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(90vh-100px)]'>
          <div className='p-6 pt-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Left Column - Image */}
              <div className='space-y-4'>
                <div className='relative aspect-square rounded-lg overflow-hidden border-2 border-[#E8EDF5] bg-white'>
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className='w-full h-full object-contain p-4'
                  />
                  <Badge className={`absolute top-3 left-3 ${typeInfo.color} text-sm font-semibold`}>
                    {typeInfo.badge}
                  </Badge>
                </div>

                {/* Product Info Cards */}
                <div className='grid grid-cols-2 gap-3'>
                  <Card className='p-3 bg-[#F0F6FF] border-[#E8EDF5]'>
                    <div className='text-xs text-gray-600 mb-1'>Giá bán</div>
                    {product.onSale && product.originalPrice ? (
                      <>
                        <div className='text-xs text-gray-400 line-through'>
                          {product.originalPrice.toLocaleString('vi-VN')}đ
                        </div>
                        <div className='text-lg font-bold text-[#0A2463]'>
                          {(product.salePrice || product.price).toLocaleString('vi-VN')}đ
                        </div>
                        {product.discountPercentage && (
                          <Badge className='bg-red-500 text-white text-xs mt-1'>-{product.discountPercentage}%</Badge>
                        )}
                      </>
                    ) : (
                      <div className='text-lg font-bold text-[#0A2463]'>{product.price.toLocaleString('vi-VN')}đ</div>
                    )}
                    <div className='text-xs text-gray-500'>/{product.unit}</div>
                  </Card>

                  <Card className='p-3 bg-green-50 border-green-100'>
                    <div className='text-xs text-gray-600 mb-1'>Tồn kho</div>
                    <div className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stock} {product.unit}
                    </div>
                    {isLowStock && <div className='text-xs text-red-600'>Sắp hết hàng!</div>}
                    {product.maxOrderQuantity && (
                      <div className='text-xs text-gray-500 mt-1'>Tối đa: {product.maxOrderQuantity}</div>
                    )}
                  </Card>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className='space-y-4'>
                {/* Warning Alert */}
                {product.type === 'rx' && (
                  <div className='flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <div className='font-semibold text-red-900 text-sm'>Lưu ý quan trọng</div>
                      <div className='text-sm text-red-700'>{typeInfo.warning}</div>
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                <div className='space-y-3 bg-gray-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 text-sm mb-2'>ℹ️ Thông tin cơ bản</h4>

                  {product.sku && (
                    <div className='flex items-center gap-2 text-sm'>
                      <span className='text-gray-600'>Mã sản phẩm:</span>
                      <span className='font-mono text-gray-900 font-semibold'>{product.sku}</span>
                    </div>
                  )}

                  {product.category && (
                    <div className='flex items-center gap-2 text-sm'>
                      <span className='text-gray-600'>Danh mục:</span>
                      <span className='font-semibold text-gray-900'>{product.category.name}</span>
                    </div>
                  )}

                  <div className='flex items-center gap-2 text-sm'>
                    <Building2 className='w-4 h-4 text-gray-500' />
                    <span className='text-gray-600'>Thương hiệu:</span>
                    <span className='font-semibold text-gray-900'>{product.brand}</span>
                  </div>

                  {product.origin && (
                    <div className='flex items-center gap-2 text-sm'>
                      <span className='text-gray-600'>Xuất xứ:</span>
                      <span className='font-semibold text-gray-900'>{product.origin}</span>
                    </div>
                  )}

                  {product.packaging && (
                    <div className='flex items-center gap-2 text-sm'>
                      <span className='text-gray-600'>Quy cách:</span>
                      <span className='text-gray-900'>{product.packaging}</span>
                    </div>
                  )}

                  {product.barcode && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Barcode className='w-4 h-4 text-gray-500' />
                      <span className='text-gray-600'>Mã vạch:</span>
                      <span className='font-mono text-gray-900'>{product.barcode}</span>
                    </div>
                  )}

                  <div className='flex items-center gap-2 text-sm'>
                    <Star className='w-4 h-4 text-yellow-500 fill-yellow-400' />
                    <span className='text-gray-600'>Đánh giá:</span>
                    <span className='font-semibold text-gray-900'>
                      {product.rating}/5 {product.reviewCount && `(${product.reviewCount} đánh giá)`}
                    </span>
                  </div>

                  {product.expiryInfo && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='w-4 h-4 text-gray-500' />
                      <span className='text-gray-600'>Hạn sử dụng:</span>
                      <span className='font-semibold text-gray-900'>{product.expiryInfo}</span>
                    </div>
                  )}

                  {product.status && (
                    <div className='flex items-center gap-2 text-sm'>
                      <span className='text-gray-600'>Trạng thái:</span>
                      <Badge
                    className={
                      product.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : product.status === 'discontinued'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                        }
                      >
                        {product.status === 'active'
                          ? 'Đang bán'
                          : product.status === 'discontinued'
                            ? 'Ngừng kinh doanh'
                            : 'Hết hàng'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-gray-900 text-sm'>📝 Mô tả ngắn</h4>
                    <p className='text-sm text-gray-700 leading-relaxed'>{product.shortDescription}</p>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-gray-900 text-sm'>📄 Mô tả chi tiết</h4>
                    <p className='text-sm text-gray-700 leading-relaxed'>{product.description}</p>
                  </div>
                )}

                {/* Uses */}
                {product.uses && product.uses.length > 0 && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-gray-900 text-sm'>✨ Công dụng</h4>
                    <ul className='text-sm text-gray-700 space-y-1 pl-4'>
                      {product.uses.map((use, index) => (
                        <li key={index} className='list-disc'>
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ingredients */}
                {product.ingredients && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-gray-900 text-sm'>🧪 Thành phần</h4>
                    {Array.isArray(product.ingredients) ? (
                      <ul className='text-sm text-gray-700 space-y-1 pl-4'>
                        {product.ingredients.map((ingredient, index) => (
                          <li key={index} className='list-disc'>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='text-sm text-gray-700'>{product.ingredients}</p>
                    )}
                  </div>
                )}

                {/* Instructions */}
                {product.instructions && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-gray-900 text-sm'>📋 Hướng dẫn sử dụng</h4>
                    <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>{product.instructions}</p>
                  </div>
                )}

                {/* Warnings */}
                {product.warnings && product.warnings.length > 0 && (
                  <div className='space-y-2 bg-amber-50 p-3 rounded-lg border border-amber-200'>
                    <h4 className='font-semibold text-amber-900 text-sm flex items-center gap-2'>
                      <AlertCircle className='w-4 h-4' />
                      Cảnh báo & Lưu ý
                    </h4>
                    <ul className='text-sm text-amber-800 space-y-1 pl-4'>
                      {product.warnings.map((warning, index) => (
                        <li key={index} className='list-disc'>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-gray-900 text-sm'>🏷️ Tags</h4>
                    <div className='flex flex-wrap gap-2'>
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant='secondary' className='text-xs'>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4 border-t'>
                  <Button
                    onClick={() => {
                      onAddToCart(product, 1)
                      onClose()
                    }}
                    className='flex-1 bg-[#0A2463] hover:bg-[#071A49] text-white'
                    disabled={product.stock === 0 || product.status !== 'active'}
                  >
                    <ShoppingCart className='w-4 h-4 mr-2' />
                    {product.status === 'discontinued' ? 'Ngừng kinh doanh' : product.stock === 0 || product.status === 'out_of_stock' ? 'Hết hàng' : 'Thêm vào đơn'}
                  </Button>
                  <Button variant='outline' onClick={onClose} className='border-[#BFDBFE] text-[#0A2463]'>
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-white shadow-sm ${className}`}>{children}</div>
}
