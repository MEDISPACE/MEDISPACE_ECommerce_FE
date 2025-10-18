import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { type Category, type SubCategory } from '../../utils/mockCategoryData'

interface UnifiedMegaMenuProps {
  activeCategory: Category | null
  isVisible: boolean
  onClose: () => void
}

export function UnifiedMegaMenu({ activeCategory, isVisible, onClose }: UnifiedMegaMenuProps) {
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Simple effect to set first subcategory when category changes
  useEffect(() => {
    if (activeCategory?.subCategories?.[0]) {
      setActiveSubCategory(activeCategory.subCategories[0])
    }
  }, [activeCategory?.id, activeCategory?.subCategories])

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

  // Simple mock data to avoid complex calculations
  const mockProducts = [
    { id: 1, name: 'Sản phẩm 1', price: 25000, image: '/placeholder-drug.jpg', badge: 'HOT' },
    { id: 2, name: 'Sản phẩm 2', price: 45000, image: '/placeholder-drug.jpg', badge: 'NEW' },
    { id: 3, name: 'Sản phẩm 3', price: 35000, image: '/placeholder-drug.jpg', badge: '' },
    { id: 4, name: 'Sản phẩm 4', price: 55000, image: '/placeholder-drug.jpg', badge: '' },
  ]

  const mockSubCategories = [
    { name: 'Danh mục con 1', count: 45 },
    { name: 'Danh mục con 2', count: 67 },
    { name: 'Danh mục con 3', count: 89 },
    { name: 'Danh mục con 4', count: 23 },
  ]

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
            {activeCategory.subCategories?.slice(0, 8).map((subCategory, index) => (
              <button
                key={index}
                onClick={() => setActiveSubCategory(subCategory)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSubCategory?.slug === subCategory.slug
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
              <h4 className='font-medium text-gray-900 mb-4'>{activeSubCategory?.name || 'Danh mục'}</h4>
              <div className='space-y-2'>
                {mockSubCategories.map((item, index) => (
                  <Link
                    key={index}
                    to='#'
                    className='flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors'
                  >
                    <span>{item.name}</span>
                    <span className='text-xs text-gray-400'>({item.count})</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Featured Products */}
            <div>
              <h4 className='font-medium text-gray-900 mb-4'>Sản phẩm nổi bật</h4>
              <div className='space-y-3'>
                {mockProducts.map((product) => (
                  <Link
                    key={product.id}
                    to='#'
                    className='flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className='w-12 h-12 object-cover rounded-lg'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <h5 className='text-sm font-medium text-gray-900'>{product.name}</h5>
                        {product.badge && (
                          <Badge variant='secondary' className='text-xs'>
                            {product.badge}
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-blue-600 font-medium'>{product.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
