import { useState } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { RxBadge } from './MedicalBadge'

interface PriceVariant {
  unit: string
  price: number
  originalPrice?: number
  salePrice?: number        // Giá sau campaign (từ backend)
  discountPercent?: number  // % giảm từ campaign
  isDefault?: boolean
}

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
    unit?: string
    packaging?: string
    needsConsultation?: boolean
    priceVariants?: PriceVariant[]
    campaign?: {
      _id: string
      name: string
      badgeText: string
      badgeColor: string
      endDate: string
    }
  }
  variant?: 'grid' | 'list'
  onAddToCart?: (selectedUnit?: string) => void
  onToggleWishlist?: () => void
  isInWishlist?: boolean
}

export function ProductCard({
  product,
  variant = 'grid',
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
}: ProductCardProps) {
  // Find default variant or first variant
  const defaultVariant = product.priceVariants?.find((v) => v.isDefault) || product.priceVariants?.[0]
  const [selectedUnit, setSelectedUnit] = useState<string>(defaultVariant?.unit || product.unit || 'Hộp')

  // Get current variant based on selected unit
  const currentVariant = product.priceVariants?.find(v => v.unit === selectedUnit) || defaultVariant
  // Campaign-aware pricing: prefer salePrice if available
  const currentPrice = currentVariant?.salePrice || currentVariant?.price || product.salePrice
  const currentOriginalPrice = currentVariant?.salePrice
    ? currentVariant.price // Giá gốc khi có campaign
    : (currentVariant?.originalPrice || product.originalPrice)
  const hasDiscount = currentOriginalPrice && currentOriginalPrice > currentPrice
  const hasCampaign = !!product.campaign

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(selectedUnit)
    }
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleWishlist) {
      onToggleWishlist()
    }
  }

  const handleUnitSelect = (e: React.MouseEvent, unit: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedUnit(unit)
  }

  const isConsultationRequired = product.needsConsultation || product.isPrescription

  // ==================== LIST VARIANT ====================
  if (variant === 'list') {
    return (
      <Link to={`/products/${product.slug}`} className='block' data-testid='product-card'>
        <Card
            className={`group border bg-white transition-all duration-200 hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(10,36,99,0.12)] ${
              isConsultationRequired ? 'border-2 border-[#BFDBFE]' : 'border-[#E8EDF5]'
            } ${!product.inStock ? 'opacity-75' : ''}`}
          >
            <CardContent className='p-4'>
              <div className='flex gap-4'>
                {/* Image Section */}
                <div className='relative flex-shrink-0'>
                  <div className='w-28 h-36 overflow-hidden bg-[#F8FAFB] rounded-lg flex items-center justify-center p-3 border border-[#E8EDF5]'>
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
                    {product.inStock && product.isPrescription && <RxBadge size='sm' />}
                  </div>

                  {(product.isOnSale || hasCampaign) && product.inStock && (
                    <div className='absolute top-2 right-2'>
                      <Badge
                        className='text-white text-xs px-2 py-0.5 rounded-full'
                        style={{ backgroundColor: product.campaign?.badgeColor || '#f97316' }}
                      >
                        {hasCampaign ? product.campaign!.badgeText : `-${product.discountPercentage}%`}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className='flex-1 min-w-0 flex flex-col'>
                  {/* Title & Brand */}
                  <div className='mb-2'>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-[#8094AE]'>{product.brand}</p>
                    <h3 className='mb-1 line-clamp-2 min-h-[44px] overflow-hidden font-semibold leading-[22px] text-[#1C2B4A] transition-colors group-hover:text-[#0A2463]'>{product.name}</h3>
                  </div>

                  {/* Unit selector - only show when multiple variants */}
                  {product.priceVariants && product.priceVariants.length > 1 && !isConsultationRequired && (
                    <div className='flex border border-gray-300 rounded-md overflow-hidden mb-2 max-w-[200px]'>
                      {product.priceVariants.map((variant, index) => (
                        <button
                          key={variant.unit}
                          onClick={(e) => handleUnitSelect(e, variant.unit)}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all ${
                            selectedUnit === variant.unit
                              ? 'bg-[#0A2463] text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${index > 0 ? 'border-l border-gray-300' : ''}`}
                        >
                          {variant.unit}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Packaging */}
                  {product.packaging && <p className='text-xs text-gray-500 mb-3 line-clamp-1'>{product.packaging}</p>}

                  {/* Price & Actions Row */}
                  <div className='mt-auto flex items-center justify-between gap-4'>
                    {/* Price Section */}
                    <div>
                      {isConsultationRequired ? (
                        <p className='text-sm text-gray-500 italic'>Sản phẩm cần tư vấn từ dược sĩ</p>
                      ) : (
                        <>
                          <div className='flex items-baseline gap-2 mb-1'>
                            <span className={`font-semibold ${!product.inStock ? 'text-gray-400' : 'text-[#1E40AF]'}`}>
                              {currentPrice.toLocaleString('vi-VN')}đ
                            </span>
                            <span className='text-sm text-gray-500'>/ {selectedUnit}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            {hasDiscount && product.inStock && (
                              <span className='text-xs text-gray-400 line-through'>
                                {currentOriginalPrice?.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                            {!product.inStock && <span className='text-xs text-red-500 font-medium'>Tạm hết hàng</span>}
                          </div>
                        </>
                      )}
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
                          className='border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF] h-9 px-4'
                        >
                          Xem chi tiết
                        </Button>
                      ) : (
                        <Button
                          size='sm'
                          onClick={handleAddToCart}
                          className='bg-[#0A2463] hover:bg-[#1E40AF] text-white h-9 px-4 gap-1'
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
    <Link to={`/products/${product.slug}`} className='block h-full' data-testid='product-card'>
      <Card
        className={`group relative h-full overflow-hidden bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,36,99,0.12)] ${
          isConsultationRequired ? 'border-2 border-[#BFDBFE]' : 'border border-[#E8EDF5] hover:border-[#BFDBFE]'
        } ${!product.inStock ? 'opacity-75' : ''}`}
      >
        <CardContent className='p-0 flex flex-col h-full'>
          {/* Image Section */}
          <div className='relative'>
            <div className='aspect-[3/4] overflow-hidden bg-[#F8FAFB] flex items-center justify-center p-4'>
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
              {product.inStock && product.isPrescription && <RxBadge size='sm' />}
            </div>

            {(product.isOnSale || hasCampaign) && product.inStock && (
              <div className='absolute top-3 right-3'>
                <Badge
                  className='text-white text-xs px-2 py-1 rounded-full'
                  style={{ backgroundColor: product.campaign?.badgeColor || '#059669' }}
                >
                  {hasCampaign ? product.campaign!.badgeText : `-${product.discountPercentage}%`}
                </Badge>
              </div>
            )}

            {/* Wishlist button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleToggleWishlist}
              className='absolute bottom-3 right-3 text-gray-400 hover:text-red-500 bg-white/90 backdrop-blur-sm w-8 h-8 p-0 rounded-full shadow-sm transition-all'
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Content Section */}
          <div className='p-4 flex flex-col flex-1'>
            <p className='mb-1 min-h-4 truncate text-xs font-medium uppercase tracking-wide text-[#8094AE]'>{product.brand}</p>
            <h3 className='mb-2 line-clamp-2 h-[40px] overflow-hidden text-sm font-semibold leading-5 text-[#1C2B4A] transition-colors group-hover:text-[#0A2463]'>
              {product.name}
            </h3>

            {/* Unit selector - only show when multiple variants */}
            {product.priceVariants && product.priceVariants.length > 1 && !isConsultationRequired && (
              <div className='flex border border-gray-300 rounded-md overflow-hidden mb-2'>
                {product.priceVariants.map((variant, index) => (
                  <button
                    key={variant.unit}
                    onClick={(e) => handleUnitSelect(e, variant.unit)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all ${
                      selectedUnit === variant.unit
                        ? 'bg-[#0A2463] text-white'
                        : 'bg-white text-[#4B5E7A] hover:bg-[#F0F6FF]'
                    } ${index > 0 ? 'border-l border-gray-300' : ''}`}
                  >
                    {variant.unit}
                  </button>
                ))}
              </div>
            )}

            {/* Price section */}
            <div className='mb-2'>
              {isConsultationRequired ? (
                <p className='text-sm text-gray-500 italic'>Sản phẩm cần tư vấn từ dược sĩ</p>
              ) : (
                <>
                  <div className='flex items-baseline gap-1'>
                    <span className={`text-lg font-bold ${!product.inStock ? 'text-gray-400' : 'text-[#1E40AF]'}`}>
                      {currentPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className='text-sm text-gray-500'>/ {selectedUnit}</span>
                  </div>
                  {hasDiscount && product.inStock && (
                    <span className='text-xs text-gray-400 line-through'>
                      {currentOriginalPrice?.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                  {!product.inStock && <p className='text-xs text-red-500 font-medium mt-1'>Tạm hết hàng</p>}
                </>
              )}
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
                  className='w-full border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF] text-sm h-9'
                >
                  Xem chi tiết
                </Button>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className='w-full text-sm h-9 border border-[#0A2463] bg-white text-[#0A2463] hover:bg-[#0A2463] hover:text-white'
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
