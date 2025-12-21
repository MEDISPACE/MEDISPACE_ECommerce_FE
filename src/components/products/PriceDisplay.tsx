import { Badge } from '../ui/badge'

interface PriceDisplayProps {
  originalPrice?: number
  salePrice: number
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  showDiscount?: boolean
  className?: string
  unit?: string // Optional unit display (e.g., "Viên", "Hộp")
}

export function PriceDisplay({
  originalPrice,
  salePrice,
  currency = 'đ',
  size = 'md',
  showDiscount = true,
  className = '',
  unit,
}: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const discount = originalPrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0
  const hasDiscount = originalPrice && originalPrice > salePrice

  const sizeClasses = {
    sm: {
      sale: 'text-base',
      original: 'text-sm',
      discount: 'text-xs',
    },
    md: {
      sale: 'text-lg',
      original: 'text-base',
      discount: 'text-sm',
    },
    lg: {
      sale: 'text-xl',
      original: 'text-lg',
      discount: 'text-base',
    },
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className='flex flex-col'>
        {/* Sale Price */}
        <div className={`${sizeClasses[size].sale} font-bold text-blue-700`}>
          {formatPrice(salePrice)}
          {currency}
          {unit && <span className='text-gray-500 font-normal text-sm ml-1'>/ {unit}</span>}
        </div>

        {/* Original Price */}
        {hasDiscount && (
          <div className={`${sizeClasses[size].original} !text-gray-500 line-through`}>
            {formatPrice(originalPrice!)}
            {currency}
          </div>
        )}
      </div>

      {/* Discount Badge */}
      {hasDiscount && showDiscount && (
        <Badge variant='destructive' className={`${sizeClasses[size].discount} !bg-red-500 text-white`}>
          -{discount}%
        </Badge>
      )}
    </div>
  )
}
