import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { type Category } from '../../types/product'
import { useProductsByCategory } from '../../hooks/product/useProductsByCategory'

interface UnifiedMegaMenuProps {
  activeCategory: Category | null
  isVisible: boolean
  onClose: () => void
}

export function UnifiedMegaMenu({ activeCategory, isVisible, onClose }: UnifiedMegaMenuProps) {
  const [activeSubCategory, setActiveSubCategory] = useState<Category | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch products for the active subcategory
  const { products: featuredProducts, loading: productsLoading } = useProductsByCategory(
    activeSubCategory?._id,
    4
  )

  // Simple effect to set first subcategory when category changes
  useEffect(() => {
    if (activeCategory?.subcategories?.[0]) {
      setActiveSubCategory(activeCategory.subcategories[0])
    }
  }, [activeCategory?.id, activeCategory?.subcategories])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150)
  }

  if (!isVisible || !activeCategory) {
    return null
  }

  return (
    <div
      className='absolute top-full bg-white border border-gray-200 shadow-xl z-50 rounded-lg overflow-hidden hidden lg:block'
      style={{
        width: '1200px',
        height: '500px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className='flex h-full'>
        {/* Left sidebar - Subcategories */}
        <div className='w-[30%] bg-gray-50 border-r border-gray-200 p-6'>
          <h3 className='font-medium text-gray-900 mb-4'>{activeCategory.name}</h3>
          <div className='space-y-1'>
            {activeCategory.subcategories?.slice(0, 8).map((subCategory) => (
              <button
                key={subCategory._id}
                onClick={() => setActiveSubCategory(subCategory)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSubCategory?._id === subCategory._id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span>{subCategory.name}</span>
                  <ChevronRight className='w-4 h-4' />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className='w-[70%] p-6'>
          <div className='grid grid-cols-2 gap-6 h-full'>
            {/* Subcategories Level 2 */}
            <div>
              <h4 className='font-medium text-gray-900 mb-4'>{activeCategory.name}</h4>
              <div className='space-y-2'>
                {activeSubCategory?.subcategories && activeSubCategory.subcategories.length > 0 ? (
                  activeSubCategory.subcategories.slice(0, 6).map((subSubCategory) => (
                    <Link
                      key={subSubCategory._id}
                      to={`/categories/${subSubCategory.slug}`}
                      className='flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors'
                    >
                      <span>{subSubCategory.name}</span>
                      <span className='text-xs text-gray-400'>({subSubCategory.productCount || 0})</span>
                    </Link>
                  ))
                ) : (
                  // Show category information when no sub-subcategories
                  <div className='text-sm text-gray-600 space-y-2'>
                    <p className='font-medium'>Khám phá {activeSubCategory?.name || activeCategory.name}</p>
                    <p className='text-xs'>Sản phẩm chất lượng từ các thương hiệu uy tín</p>
                    <Link
                      to={`/categories/${activeSubCategory?.slug || activeCategory.slug}`}
                      className='inline-block text-blue-600 hover:text-blue-800 text-sm font-medium'
                    >
                      Xem tất cả →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Products */}
            <div>
              <h4 className='font-medium text-gray-900 mb-4'>Sản phẩm nổi bật</h4>
              <div className='space-y-3'>
                {productsLoading ? (
                  <div className='text-sm text-gray-500'>Đang tải sản phẩm...</div>
                ) : featuredProducts && featuredProducts.length > 0 ? (
                  featuredProducts.map((product) => (
                    <Link
                      key={product._id}
                      to={`/products/${product.slug}`}
                      className='flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <ImageWithFallback
                        src={product.featuredImage || '/images/product-placeholder.jpg'}
                        alt={product.name}
                        className='w-12 h-12 object-cover rounded-lg'
                      />
                      <div className='flex-1'>
                        <div className='flex items-center space-x-2'>
                          <h5 className='text-sm font-medium text-gray-900 line-clamp-2'>{product.name}</h5>
                          {product.requiresPrescription && (
                            <Badge variant='destructive' className='text-xs'>
                              Kê đơn
                            </Badge>
                          )}
                        </div>
                        <p className='text-sm text-blue-600 font-medium'>
                          {product.price ? product.price.toLocaleString('vi-VN') : 'Liên hệ'}đ
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className='text-sm text-gray-500'>Không có sản phẩm nổi bật</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
