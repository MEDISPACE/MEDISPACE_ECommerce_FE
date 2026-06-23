import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { type Category, type PriceVariant, type Product } from '../../types/product'
import { productService } from '../../services/productService'
import { recommendationService, type RecommendedProduct } from '../../services/recommendationService'

interface UnifiedMegaMenuProps {
  activeCategory: Category | null
  isVisible: boolean
  onClose: () => void
}

type ProductSource = 'trending' | 'newest' | 'empty'

interface MegaMenuProduct {
  id: string
  slug: string
  name: string
  image?: string
  requiresPrescription: boolean
  stockQuantity?: number
  priceVariants?: PriceVariant[]
  algorithm?: string
  attribution?: RecommendedProduct['attribution']
}

const getDefaultPrice = (priceVariants?: PriceVariant[]) => {
  const defaultVariant = priceVariants?.find((variant) => variant.isDefault) || priceVariants?.[0]
  return defaultVariant?.salePrice ?? defaultVariant?.price
}

const formatProductPrice = (product: MegaMenuProduct) => {
  if (product.requiresPrescription) return 'Liên hệ'
  const price = getDefaultPrice(product.priceVariants)
  return price ? `${price.toLocaleString('vi-VN')}đ` : 'Liên hệ'
}

const toMegaMenuProductFromRecommendation = (product: RecommendedProduct, algorithm: string): MegaMenuProduct => ({
  id: product._id,
  slug: product.slug,
  name: product.name,
  image: product.featuredImage,
  requiresPrescription: product.requiresPrescription,
  stockQuantity: product.stockQuantity,
  priceVariants: product.priceVariants,
  algorithm,
  attribution: product.attribution,
})

const toMegaMenuProductFromCatalog = (product: Product): MegaMenuProduct => ({
  id: product._id,
  slug: product.slug,
  name: product.name,
  image: product.featuredImage || product.image || product.images?.[0],
  requiresPrescription: product.requiresPrescription,
  stockQuantity: product.stockQuantity,
  priceVariants: product.priceVariants,
})

export function UnifiedMegaMenu({ activeCategory, isVisible, onClose }: UnifiedMegaMenuProps) {
  const [activeSubCategory, setActiveSubCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<MegaMenuProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSource, setProductSource] = useState<ProductSource>('empty')
  const [productCategoryName, setProductCategoryName] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const productRequestIdRef = useRef(0)
  const subCategories = activeCategory?.subcategories ?? []
  const activeSubCategoryBelongsToCategory = subCategories.some((subCategory) => subCategory._id === activeSubCategory?._id)
  const selectedSubCategory = activeSubCategoryBelongsToCategory ? activeSubCategory : subCategories[0] || null

  // Simple effect to set first subcategory when category changes
  useEffect(() => {
    if (activeCategory?.subcategories?.[0]) {
      setActiveSubCategory(activeCategory.subcategories[0])
    } else {
      setActiveSubCategory(null)
    }
  }, [activeCategory?._id, activeCategory?.subcategories])

  useEffect(() => {
    const requestId = productRequestIdRef.current + 1
    productRequestIdRef.current = requestId

    const fetchMenuProducts = async () => {
      if (!isVisible || !activeCategory) {
        setProducts([])
        setProductsLoading(false)
        setProductSource('empty')
        setProductCategoryName('')
        return
      }

      const primaryCategory = selectedSubCategory || activeCategory
      const fallbackCategory = selectedSubCategory && selectedSubCategory._id !== activeCategory._id ? activeCategory : null

      setProductsLoading(true)
      try {
        const trendingPrimary = await recommendationService.getTrending(4, primaryCategory._id)
        if (productRequestIdRef.current !== requestId) return
        if (trendingPrimary.products.length > 0) {
          setProducts(trendingPrimary.products.map((product) => toMegaMenuProductFromRecommendation(product, trendingPrimary.algorithm)))
          setProductSource('trending')
          setProductCategoryName(primaryCategory.name)
          return
        }

        if (fallbackCategory) {
          const trendingFallback = await recommendationService.getTrending(4, fallbackCategory._id)
          if (productRequestIdRef.current !== requestId) return
          if (trendingFallback.products.length > 0) {
            setProducts(trendingFallback.products.map((product) => toMegaMenuProductFromRecommendation(product, trendingFallback.algorithm)))
            setProductSource('trending')
            setProductCategoryName(fallbackCategory.name)
            return
          }
        }

        const newestPrimary = await productService.getProducts({
          categoryId: primaryCategory._id,
          limit: 4,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          status: 'active',
        })
        if (productRequestIdRef.current !== requestId) return
        if (newestPrimary.length > 0) {
          setProducts(newestPrimary.map(toMegaMenuProductFromCatalog))
          setProductSource('newest')
          setProductCategoryName(primaryCategory.name)
          return
        }

        if (fallbackCategory) {
          const newestFallback = await productService.getProducts({
            categoryId: fallbackCategory._id,
            limit: 4,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            status: 'active',
          })
          if (productRequestIdRef.current !== requestId) return
          if (newestFallback.length > 0) {
            setProducts(newestFallback.map(toMegaMenuProductFromCatalog))
            setProductSource('newest')
            setProductCategoryName(fallbackCategory.name)
            return
          }
        }

        setProducts([])
        setProductSource('empty')
        setProductCategoryName(primaryCategory.name)
      } finally {
        if (productRequestIdRef.current === requestId) setProductsLoading(false)
      }
    }

    void fetchMenuProducts()
  }, [activeCategory, isVisible, selectedSubCategory])

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

  const productSectionTitle = productSource === 'trending' ? 'Đang được quan tâm' : 'Sản phẩm mới'

  const handleProductClick = (product: MegaMenuProduct, position: number) => {
    if (productSource === 'trending' && product.attribution) {
      void recommendationService.trackClick({
        productId: product.id,
        algorithm: product.algorithm || 'trending',
        section: 'header-mega-menu',
        position,
        requestId: product.attribution.requestId,
        attributionToken: product.attribution.attributionToken,
        modelVersion: product.attribution.modelVersion,
        experimentId: product.attribution.experimentId,
        experimentVariant: product.attribution.experimentVariant,
      })
    }
    onClose()
  }

  if (!isVisible || !activeCategory) {
    return null
  }

  return (
    <div
      className='absolute top-full z-[110] hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl lg:block'
      style={{
        width: 'min(1200px, calc(100vw - 32px))',
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
            {activeCategory.subcategories && activeCategory.subcategories.length > 0 ? (
              activeCategory.subcategories.map((subCategory) => (
                <Link
                  key={subCategory._id}
                  to={`/categories/${subCategory.slug}`}
                  onMouseEnter={() => setActiveSubCategory(subCategory)}
                  className={`block w-full text-left px-3 py-2.5 rounded-md text-sm transition-all ${
                    selectedSubCategory?._id === subCategory._id
                      ? 'bg-[#F0F6FF] text-[#0A2463] font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={onClose}
                >
                  <div className='flex items-center justify-between'>
                    <span className='line-clamp-1'>{subCategory.name}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        selectedSubCategory?._id === subCategory._id ? 'translate-x-0.5' : ''
                      }`}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <Link
                to={`/categories/${activeCategory.slug}`}
                className='block rounded-md bg-[#F0F6FF] px-3 py-2.5 text-sm font-medium text-[#0A2463] transition hover:bg-[#E8EDF5]'
                onClick={onClose}
              >
                Xem tất cả {activeCategory.name}
              </Link>
            )}
          </div>
        </div>

        {/* Column 2: Level 2 Sub-subcategories (40%) */}
        <div className='w-[40%] bg-white border-r border-gray-200 p-5 overflow-y-auto'>
          <h4 className='font-semibold text-gray-900 mb-3 text-sm'>{selectedSubCategory?.name || activeCategory.name}</h4>
          <div className='space-y-1.5'>
            {selectedSubCategory?.subcategories && selectedSubCategory.subcategories.length > 0 ? (
              selectedSubCategory.subcategories.map((subSubCategory) => (
                <Link
                  key={subSubCategory._id}
                  to={`/categories/${subSubCategory.slug}`}
                  className='flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:text-[#1E40AF] hover:bg-[#F0F6FF] transition-all group'
                  onClick={onClose}
                >
                  <span className='line-clamp-1 group-hover:font-medium'>{subSubCategory.name}</span>
                  <span className='text-xs text-gray-400 ml-2 flex-shrink-0'>({subSubCategory.productCount || 0})</span>
                </Link>
              ))
            ) : (
              <div className='text-sm text-gray-500 space-y-3 py-4'>
                <p className='font-medium text-gray-700'>
                  Khám phá {selectedSubCategory?.name || activeCategory.name}
                </p>
                <p className='text-xs text-gray-500'>Sản phẩm chất lượng từ các thương hiệu uy tín</p>
                <Link
                  to={`/categories/${(selectedSubCategory || activeCategory).slug}`}
                  className='inline-flex items-center text-[#1E40AF] hover:text-[#0A2463] text-sm font-medium group'
                  onClick={onClose}
                >
                  Xem tất cả sản phẩm
                  <ChevronRight className='w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform' />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Contextual Products (35%) */}
        <div className='w-[35%] bg-gradient-to-br from-[#F8FAFB]/30 to-[#F0F6FF]/30 p-5 overflow-y-auto'>
          <div className='mb-4'>
            <h4 className='font-semibold text-gray-900 text-sm flex items-center'>
              <span className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent'>
                {productSectionTitle}
              </span>
            </h4>
            {productCategoryName && <p className='mt-1 text-xs text-gray-500'>{productCategoryName}</p>}
          </div>
          <div className='space-y-3'>
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className='flex items-start space-x-3 rounded-lg border border-gray-100 bg-white p-3'>
                  <div className='h-16 w-16 flex-shrink-0 animate-pulse rounded-lg bg-[#E8EDF5]' />
                  <div className='flex-1 space-y-2 pt-1'>
                    <div className='h-3 w-full animate-pulse rounded bg-[#E8EDF5]' />
                    <div className='h-3 w-2/3 animate-pulse rounded bg-[#E8EDF5]' />
                    <div className='h-4 w-20 animate-pulse rounded bg-[#E8EDF5]' />
                  </div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className='flex items-start space-x-3 p-3 rounded-lg bg-white hover:shadow-md transition-all border border-gray-100 hover:border-[#BFDBFE] group'
                  onClick={() => handleProductClick(product, index)}
                >
                  <ImageWithFallback
                    src={product.image || '/images/product-placeholder.jpg'}
                    alt={product.name}
                    className='w-16 h-16 object-contain rounded-lg flex-shrink-0 bg-white group-hover:scale-105 transition-transform'
                  />
                  <div className='flex-1 min-w-0'>
                    <h5 className='text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-[#1E40AF] transition-colors'>
                      {product.name}
                    </h5>
                    {product.requiresPrescription && (
                      <Badge variant='destructive' className='text-xs mb-1'>
                        Kê đơn
                      </Badge>
                    )}
                    {product.stockQuantity === 0 && (
                      <Badge variant='secondary' className='mb-1 text-xs'>
                        Tạm hết
                      </Badge>
                    )}
                    <p className='text-sm text-[#1E40AF] font-semibold'>
                      {formatProductPrice(product)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className='rounded-lg border border-dashed border-[#BFDBFE] bg-white p-4 text-center text-sm text-gray-500'>
                Chưa có sản phẩm phù hợp
                <Link
                  to={`/categories/${(selectedSubCategory || activeCategory).slug}`}
                  className='mt-2 inline-flex items-center font-medium text-[#1E40AF] hover:text-[#0A2463]'
                  onClick={onClose}
                >
                  Xem danh mục
                  <ChevronRight className='ml-1 h-4 w-4' />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
