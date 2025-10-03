import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { ShoppingCart, Heart, Eye, FileText, Package } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { ImageWithFallback } from '~/components/ui/ImageWithFallback'
import '~/style/Products.css'

interface PharmaceuticalProduct {
  id: string
  name: string // Tên thuốc
  activeIngredient: string // Hoạt chất
  dosage: string // Hàm lượng: "500mg", "10mg/5ml"
  dosageForm: string // Dạng: "Viên nén", "Siro", "Kem bôi"
  packaging: string // "30 viên/hộp", "100ml/chai"
  manufacturer: string // Nhà sản xuất
  price: number
  originalPrice?: number
  image: string
  category: string // Nhóm thuốc: "Kháng sinh", "Giảm đau"
  inStock: boolean
  prescription: boolean // Bắt buộc có toa thuốc
  registrationNumber?: string // Số đăng ký thuốc
  origin?: string // Xuất xứ
  expiryDate?: string // Hạn sử dụng
  discount?: number
}

interface ProductCardProps {
  product: PharmaceuticalProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleProductClick = () => {
    navigate(`/products/${product.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={product.inStock ? { y: -4, scale: 1.015 } : { y: -1, scale: 1.005 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={handleProductClick}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 h-full flex flex-col cursor-pointer ${
        product.inStock
          ? 'product-card-glass'
          : 'bg-gray-50/80 border-2 border-dashed border-gray-300/60 shadow-sm hover:shadow-md hover:shadow-gray-400/10'
      }`}
      role='article'
      aria-label={`${product.name} - ${product.inStock ? 'Còn hàng' : 'Hết hàng'}`}
    >
      {/* Discount Badge - only show for in-stock items */}
      {discountPercentage > 0 && product.inStock && (
        <div className='absolute top-2 left-2 z-10'>
          <Badge className='medispace-gradient text-white shadow-lg text-xs filter-badge'>-{discountPercentage}%</Badge>
        </div>
      )}

      {/* Quick Actions - only show for in-stock items */}
      {product.inStock && (
        <div className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col gap-1 transform translate-x-2 group-hover:translate-x-0'>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              size='sm'
              variant='ghost'
              className='bg-white/95 backdrop-blur-md hover:bg-white shadow-lg rounded-full p-2 h-auto border border-[#0066CC]/20 hover:border-[#0066CC]/40'
            >
              <Heart className='w-3 h-3 text-[#0066CC] hover:text-red-500 transition-colors' />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              size='sm'
              variant='ghost'
              className='bg-white/95 backdrop-blur-md hover:bg-white shadow-lg rounded-full p-2 h-auto border border-[#0066CC]/20 hover:border-[#0066CC]/40'
            >
              <Eye className='w-3 h-3 text-[#0066CC] transition-colors' />
            </Button>
          </motion.div>
        </div>
      )}

      {/* Product Image */}
      <div className='relative aspect-square overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] flex items-center justify-center'>
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            product.inStock ? 'group-hover:scale-115' : 'grayscale-[45%] opacity-70 brightness-90'
          }`}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className='absolute inset-0 flex items-center justify-center z-20'>
            <div className='bg-black/75 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center shadow-xl border-2 border-white/20'>
              <span className='text-white font-bold text-sm text-center leading-tight'>
                Tạm
                <br />
                Hết
              </span>
            </div>
          </div>
        )}

        {/* Fallback placeholder */}
        <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 opacity-0 group-hover:opacity-0'>
          <div className='text-gray-400 text-center'>
            <Package className='w-12 h-12 mx-auto mb-2' />
            <span className='text-sm'>Đang tải...</span>
          </div>
        </div>

        {/* Overlay gradient - only for in-stock items */}
        {product.inStock && (
          <div className='absolute inset-0 bg-gradient-to-t from-[#0066CC]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
        )}

        {/* Corner decoration - only for in-stock items */}
        {product.inStock && (
          <div className='absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-[#0066CC]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
        )}
      </div>

      {/* Product Info */}
      <div className='p-4 flex-1 flex flex-col'>
        {/* Header: Category */}
        <div className='mb-3'>
          <span className='text-sm font-medium text-[#0066CC] uppercase tracking-wide'>{product.category}</span>
        </div>

        {/* Drug Name - Prominent */}
        <div className='mb-2'>
          <h3
            className={`font-semibold line-clamp-2 transition-colors duration-300 leading-snug flex items-start gap-1.5 ${
              product.inStock
                ? 'text-foreground group-hover:text-[#0066CC]'
                : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            <span className='flex-1'>{product.name}</span>
            {product.prescription && <FileText className='w-4 h-4 text-[#0066CC] flex-shrink-0 mt-0.5' />}
          </h3>
        </div>

        {/* Active Ingredient + Dosage */}
        <div className='mb-4'>
          <p className='text-xs text-foreground font-medium leading-relaxed'>
            <span className='text-[#0066CC]'>{product.activeIngredient}</span>
            <span className='text-muted-foreground mx-1'>•</span>
            <span className='font-semibold'>{product.dosage}</span>
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            {product.dosageForm} • {product.packaging}
          </p>
        </div>

        {/* Price Section */}
        <div className='mb-4'>
          <div className='flex items-baseline gap-2 flex-wrap'>
            <span className={`text-lg font-bold ${product.inStock ? 'text-[#0066CC]' : 'text-muted-foreground'}`}>
              {product.price.toLocaleString('vi-VN')}₫
            </span>
            {product.originalPrice && (
              <span className='text-xs text-muted-foreground line-through'>
                {product.originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          {/* Status & Savings Row */}
          <div className='flex items-center justify-between mt-1'>
            {!product.inStock ? (
              <span className='text-xs text-red-500 font-medium'>Tạm hết hàng</span>
            ) : discountPercentage > 0 ? (
              <span className='text-xs text-green-600 font-medium'>Tiết kiệm {discountPercentage}%</span>
            ) : (
              <span className='text-xs text-green-600 font-medium'>Còn hàng</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='mt-auto'>
          <Button
            onClick={(e) => e.stopPropagation()}
            className={`w-full h-10 shadow-lg hover:shadow-xl transition-all duration-500 rounded-lg font-medium text-sm backdrop-blur-sm ${
              product.prescription
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-300/30 hover:border-amber-200/50 shadow-amber-200/25 hover:shadow-amber-300/40'
                : 'bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white border border-blue-300/20 hover:border-blue-200/40 shadow-blue-200/20 hover:shadow-blue-300/30 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 disabled:border-gray-300/20 disabled:shadow-gray-200/20 disabled:hover:shadow-lg disabled:cursor-not-allowed'
            }`}
            disabled={!product.inStock}
          >
            {product.prescription ? (
              <>
                <FileText className='w-4 h-4 mr-2' />
                <span>Tư vấn thuốc</span>
              </>
            ) : (
              <>
                <ShoppingCart className='w-4 h-4 mr-2' />
                <span>Thêm vào giỏ</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
