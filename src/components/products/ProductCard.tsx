import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { RxBadge, OTCBadge } from './MedicalBadge'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    brand: string
    image: string
    originalPrice?: number
    salePrice: number
    rating: number
    reviewCount: number
    inStock: boolean
    isPrescription?: boolean
    isOnSale?: boolean
    discountPercentage?: number
    unit?: string // Đơn vị: Hộp, Gói, Lọ, Viên
    packaging?: string // Thông tin đóng gói: "Hộp 10 vi x 10 viên"
    needsConsultation?: boolean // Cần tư vấn dược sĩ
  }
  variant?: 'grid' | 'list'
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
  isInWishlist?: boolean
}

export function ProductCard({
  product,
  variant = 'grid',
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
}: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(product.id)
    }
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleWishlist) {
      onToggleWishlist(product.id)
    }
  }

  const isConsultationRequired = product.needsConsultation || product.isPrescription

  // ==================== LIST VARIANT ====================
  if (variant === 'list') {
    return (
      <Link to={`/products/${product.slug}`} className='block'>
        <Card
          className={`group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border hover:border-blue-300 ${
            isConsultationRequired ? 'border-2 border-blue-300' : 'border-blue-100'
          } ${!product.inStock ? 'opacity-75' : ''}`}
        >
          <CardContent className='p-4'>
            <div className='flex gap-4'>
              {/* Image Section */}
              <div className='relative flex-shrink-0'>
                <div className='w-32 h-32 overflow-hidden bg-gray-50 rounded-xl flex items-center justify-center p-3 border border-gray-100'>
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      !product.inStock ? 'grayscale' : 'group-hover:scale-110'
                    }`}
                  />
                  {/* Out of stock overlay */}
                  {!product.inStock && (
                    <div className='absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl'>
                      <div className='bg-gray-600 text-white px-3 py-1.5 rounded-full text-xs'>Hết hàng</div>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className='absolute top-2 left-2'>
                  {!product.inStock ? null : product.isPrescription ? <RxBadge size='sm' /> : <OTCBadge size='sm' />}
                </div>

                {product.isOnSale && product.inStock && (
                  <div className='absolute top-2 right-2'>
                    <Badge className='bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full'>
                      -{product.discountPercentage}%
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className='flex-1 min-w-0 flex flex-col'>
                {/* Title & Brand */}
                <div className='mb-2'>
                  <h3 className='line-clamp-2 group-hover:text-blue-600 transition-colors mb-1'>{product.name}</h3>
                  <p className='text-sm text-gray-500'>{product.brand}</p>
                </div>

                {/* Packaging */}
                {product.packaging && <p className='text-xs text-gray-500 mb-3 line-clamp-1'>{product.packaging}</p>}

                {/* Price & Actions Row */}
                <div className='mt-auto flex items-center justify-between gap-4'>
                  {/* Price Section */}
                  <div>
                    <div className='flex items-baseline gap-2 mb-1'>
                      <span className={`font-semibold ${!product.inStock ? 'text-gray-400' : 'text-blue-600'}`}>
                        {product.salePrice.toLocaleString('vi-VN')}đ
                      </span>
                      <span className='text-xs text-gray-500'>/ {product.unit?.split(',')[0] || 'Hộp'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {product.originalPrice && product.originalPrice > product.salePrice && product.inStock && (
                        <span className='text-xs text-gray-400 line-through'>
                          {product.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                      {!product.inStock && <span className='text-xs text-red-500 font-medium'>Tạm hết hàng</span>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleToggleWishlist}
                      className='text-gray-400 hover:text-red-500 bg-white/80 backdrop-blur-sm w-9 h-9 p-0 rounded-full shadow-md hover:shadow-lg transition-all'
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>

                    {!product.inStock ? (
                      <Button size='sm' disabled className='bg-gray-300 text-gray-500 cursor-not-allowed h-9 px-4'>
                        Hết hàng
                      </Button>
                    ) : isConsultationRequired ? (
                      <Button
                        size='sm'
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = `/products/${product.slug}`
                        }}
                        variant='outline'
                        className='border-blue-500 text-blue-600 hover:bg-blue-50 h-9 px-4'
                      >
                        Xem chi tiết
                      </Button>
                    ) : (
                      <Button
                        size='sm'
                        onClick={handleAddToCart}
                        className='bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 gap-1'
                      >
                        <ShoppingCart className='w-4 h-4' />
                        <span>Chọn mua</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  // ==================== GRID VARIANT ====================
  return (
    <Link to={`/products/${product.slug}`} className='block h-full'>
      <Card
        className={`group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm relative overflow-hidden h-full ${
          isConsultationRequired ? 'border-2 border-blue-300' : 'border border-blue-100 hover:border-blue-300'
        } ${!product.inStock ? 'opacity-75' : ''}`}
      >
        <CardContent className='p-0 flex flex-col h-full'>
          {/* Image Section */}
          <div className='relative'>
            <div className='aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-4'>
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-contain transition-transform duration-300 ${
                  !product.inStock ? 'grayscale' : 'group-hover:scale-105'
                }`}
              />
              {/* Out of stock overlay */}
              {!product.inStock && (
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
                  <div className='bg-gray-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-xs'>
                    Hết hàng
                  </div>
                </div>
              )}
            </div>

            {/* Top badges */}
            <div className='absolute top-3 left-3'>
              {!product.inStock ? null : product.isPrescription ? <RxBadge size='sm' /> : <OTCBadge size='sm' />}
            </div>

            {product.isOnSale && product.inStock && (
              <div className='absolute top-3 right-3'>
                <Badge className='bg-orange-500 text-white text-xs px-2 py-1 rounded-full'>
                  -{product.discountPercentage}%
                </Badge>
              </div>
            )}

            {/* Wishlist button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleToggleWishlist}
              className='absolute bottom-3 right-3 text-gray-400 hover:text-red-500 bg-white/80 backdrop-blur-sm w-8 h-8 p-0 rounded-full shadow-md hover:shadow-lg transition-all'
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Content Section */}
          <div className='p-3 flex flex-col flex-1'>
            {/* Product title */}
            <h3 className='mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-tight'>
              {product.name}
            </h3>

            {/* Price section */}
            <div className='mb-2'>
              <div className='flex items-baseline gap-1'>
                <span className={`font-semibold ${!product.inStock ? 'text-gray-400' : 'text-blue-600'}`}>
                  {product.salePrice.toLocaleString('vi-VN')}đ
                </span>
                <span className='text-xs text-gray-500'>/ {product.unit?.split(',')[0] || 'Hộp'}</span>
              </div>
              {product.originalPrice && product.originalPrice > product.salePrice && product.inStock && (
                <span className='text-xs text-gray-400 line-through'>
                  {product.originalPrice.toLocaleString('vi-VN')}đ
                </span>
              )}
              {!product.inStock && <p className='text-xs text-red-500 font-medium mt-1'>Tạm hết hàng</p>}
            </div>

            {/* Packaging info */}
            {product.packaging && <p className='text-xs text-gray-500 line-clamp-1 mb-3'>{product.packaging}</p>}

            {/* Action button */}
            <div className='mt-auto'>
              {!product.inStock ? (
                <Button disabled className='w-full text-sm h-8 bg-gray-300 text-gray-500 cursor-not-allowed'>
                  Hết hàng
                </Button>
              ) : isConsultationRequired ? (
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `/products/${product.slug}`
                  }}
                  variant='outline'
                  className='w-full border-blue-500 text-blue-600 hover:bg-blue-50 text-sm h-8'
                >
                  Xem chi tiết
                </Button>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className='w-full text-sm h-8 bg-blue-600 hover:bg-blue-700 text-white'
                >
                  Chọn mua
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
