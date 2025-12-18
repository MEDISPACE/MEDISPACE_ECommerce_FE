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
  }, [activeCategory?._id, activeCategory?.subcategories])


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
        {/* Column 1: Level 1 Subcategories (25%) */}
        <div className='w-[25%] bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto'>
          <h3 className='font-semibold text-gray-900 mb-3 text-sm'>{activeCategory.name}</h3>
          <div className='space-y-0.5'>
            {activeCategory.subcategories?.map((subCategory) => (
              <Link
                key={subCategory._id}
                to={`/categories/${subCategory.slug}`}
                onMouseEnter={() => setActiveSubCategory(subCategory)}
                className={`block w-full text-left px-3 py-2.5 rounded-md text-sm transition-all ${activeSubCategory?._id === subCategory._id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                onClick={onClose}
              >
                <div className='flex items-center justify-between'>
                  <span className='line-clamp-1'>{subCategory.name}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeSubCategory?._id === subCategory._id ? 'translate-x-0.5' : ''
                      }`}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Column 2: Level 2 Sub-subcategories (40%) */}
        <div className='w-[40%] bg-white border-r border-gray-200 p-5 overflow-y-auto'>
          <h4 className='font-semibold text-gray-900 mb-3 text-sm'>
            {activeSubCategory?.name || 'Chọn danh mục'}
          </h4>
          <div className='space-y-1.5'>
            {activeSubCategory?.subcategories && activeSubCategory.subcategories.length > 0 ? (
              activeSubCategory.subcategories.map((subSubCategory) => (
                <Link
                  key={subSubCategory._id}
                  to={`/categories/${subSubCategory.slug}`}
                  className='flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all group'
                  onClick={onClose}
                >
                  <span className='line-clamp-1 group-hover:font-medium'>{subSubCategory.name}</span>
                  <span className='text-xs text-gray-400 ml-2 flex-shrink-0'>
                    ({subSubCategory.productCount || 0})
                  </span>
                </Link>
              ))
            ) : (
              <div className='text-sm text-gray-500 space-y-3 py-4'>
                <p className='font-medium text-gray-700'>
                  {activeSubCategory?.name ? `Khám phá ${activeSubCategory.name}` : 'Di chuột vào danh mục bên trái'}
                </p>
                {activeSubCategory && (
                  <>
                    <p className='text-xs text-gray-500'>Sản phẩm chất lượng từ các thương hiệu uy tín</p>
                    <Link
                      to={`/categories/${activeSubCategory.slug}`}
                      className='inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium group'
                      onClick={onClose}
                    >
                      Xem tất cả sản phẩm
                      <ChevronRight className='w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform' />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Featured Products (35%) */}
        <div className='w-[35%] bg-gradient-to-br from-blue-50/30 to-cyan-50/30 p-5 overflow-y-auto'>
          <h4 className='font-semibold text-gray-900 mb-4 text-sm flex items-center'>
            <span className='bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
              Sản phẩm nổi bật
            </span>
          </h4>
          <div className='space-y-3'>
            {productsLoading ? (
              <div className='text-sm text-gray-500 text-center py-8'>
                <div className='animate-pulse'>Đang tải sản phẩm...</div>
              </div>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product.slug}`}
                  className='flex items-start space-x-3 p-3 rounded-lg bg-white hover:shadow-md transition-all border border-gray-100 hover:border-blue-200 group'
                  onClick={onClose}
                >
                  <ImageWithFallback
                    src={product.featuredImage || '/images/product-placeholder.jpg'}
                    alt={product.name}
                    className='w-16 h-16 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform'
                  />
                  <div className='flex-1 min-w-0'>
                    <h5 className='text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors'>
                      {product.name}
                    </h5>
                    {product.requiresPrescription && (
                      <Badge variant='destructive' className='text-xs mb-1'>
                        Kê đơn
                      </Badge>
                    )}
                    <p className='text-sm text-blue-600 font-semibold'>
                      {product.price ? product.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className='text-sm text-gray-500 text-center py-8'>
                Không có sản phẩm nổi bật
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
