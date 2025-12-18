import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { PageTransition } from '../shared/PageTransition'
import {
  Heart,
  ShoppingCart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Star,
  ThumbsUp,
  BadgeAlert,
  FileText,
  MessageCircle,
  Info,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { RatingStars } from '../shared/RatingStars'
import { PriceDisplay } from './PriceDisplay'
import { QuantityInput } from './QuantityInput'
import { ProductCard } from './ProductCard'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '../ui/dialog'
import { ImageWithFallback } from '~/components/shared/ImageWithFallback'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { useImageLightbox, useCarousel } from '~/hooks/ui'
import type { Product, Review, Category } from '~/types/product'

import { ReviewList } from '../reviews/ReviewList'
import { ReviewStats } from '../reviews/ReviewStats'
import { WriteReviewDialog } from '../reviews/WriteReviewDialog'
import { useProductReviews, useReviewActions } from '~/hooks/product/useReviews'
import { ProductStructuredData } from '~/components/seo'
import orderService from '~/services/orderService'
import {
  getProductId,
  getProductImage,
  getProductImages,
  getProductRating,
  getProductReviewCount,
  getProductSalePrice,
  isProductInStock,
  isProductPrescription,
  getBrandName,
  getProductDescription,
} from '../../utils/productHelpers'
import productService from '../../services/productService'

export function ProductDetailPage() {
  const { addToCart, buyNow, showPrescriptionWarning } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { slug } = useParams<{ slug: string }>()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('description')

  const thumbnailScrollRef = useRef<HTMLDivElement>(null)

  // Reviews - Use real API (read-only)
  const productId = product?._id || ''
  const { reviews, stats, loading: reviewsLoading, page, totalPages, sortBy, setPage, setSortBy, refetch: refetchReviews } = useProductReviews(productId)
  const { markHelpful } = useReviewActions()

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return

      try {
        setLoading(true)
        setError(null)
        const productData = await productService.getProductBySlug(slug)
        if (productData) {
          setProduct(productData)
        } else {
          setError('Sản phẩm không tồn tại')
        }

        // Fetch related products (same brand)
        if (productData?.brand) {
          const allProducts = await productService.getProducts({ limit: 12 })
          const related = allProducts.filter(
            (p: Product) =>
              getBrandName(p) === getBrandName(productData) && getProductId(p) !== getProductId(productData),
          )
          setRelatedProducts(related)
        }
      } catch (err) {
        setError('Không thể tải thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  // Fetch all categories for breadcrumb name lookup
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<Category[]>([])

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const { categoryService } = await import('../../services/categoryService')
        const data = await categoryService.getCategories()
        setAllCategoriesFlat(data)
      } catch (error) {
        console.error('Failed to fetch categories for breadcrumb:', error)
      }
    }
    fetchAllCategories()
  }, [])

  // Lookup category name from slug using fetched categories
  const getCategoryNameBySlug = (slugStr: string): string => {
    const foundCategory = allCategoriesFlat.find(cat => cat.slug === slugStr)
    if (foundCategory) {
      return foundCategory.name // Vietnamese name with diacritics
    }
    // Fallback: capitalize slug
    return slugStr
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Build breadcrumb from product category path hierarchy
  const buildCategoryBreadcrumb = () => {
    if (!product?.category) return []

    const categoryPath = product.category.path // e.g., "/thuoc/thuoc-bo-vitamin/thuoc-tang-cuong"
    if (!categoryPath) {
      // Fallback: just show current category
      return [{
        label: product.category.name,
        href: `/products?category=${product.category.slug}`
      }]
    }

    // Parse path into slugs (remove leading slash and split)
    const slugs = categoryPath.split('/').filter(Boolean) // ['thuoc', 'thuoc-bo-vitamin', 'thuoc-tang-cuong']

    // Build breadcrumb items from slugs
    const items = slugs.map((slugItem, index) => {
      const isLast = index === slugs.length - 1
      return {
        label: isLast ? product.category!.name : getCategoryNameBySlug(slugItem),
        href: `/categories/${slugItem}`
      }
    })


    return items
  }

  const breadcrumbItems = buildCategoryBreadcrumb()





  const lightbox = useImageLightbox({
    images: product ? getProductImages(product) : [],
    initialIndex: 0,
  })

  const carousel = useCarousel({
    itemsCount: relatedProducts.length,
    autoScroll: false,
  })

  if (loading) {
    return (
      <PageTransition>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <UniversalBreadcrumb items={breadcrumbItems} />
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error || !product) {
    return (
      <PageTransition>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <UniversalBreadcrumb items={breadcrumbItems} />
          <div className='text-center py-12'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Sản phẩm không tồn tại</h2>
            <p className='text-gray-600 mb-6'>{error || 'Sản phẩm bạn đang tìm kiếm không có trong hệ thống.'}</p>
            <Button onClick={() => window.history.back()}>Quay lại</Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  const handleAddToCart = () => {
    if (!product) return
    if (isProductPrescription(product)) {
      showPrescriptionWarning(product.name)
      return
    }
    addToCart(product, quantity)
  }

  const handleBuyNow = () => {
    if (!product) return
    if (isProductPrescription(product)) {
      showPrescriptionWarning(product.name)
      return
    }
    buyNow(product, quantity)
  }

  const handleWishlistToggle = () => {
    if (!product) return
    toggleWishlist(getProductId(product))
  }

  // Image navigation - changes main image and auto-scrolls thumbnails
  const navigateImage = (direction: 'prev' | 'next') => {
    const images = getProductImages(product)
    const totalImages = images.length

    let newIndex: number
    if (direction === 'prev') {
      newIndex = selectedImage === 0 ? totalImages - 1 : selectedImage - 1
    } else {
      newIndex = selectedImage === totalImages - 1 ? 0 : selectedImage + 1
    }

    setSelectedImage(newIndex)

    // Auto-scroll thumbnails to keep selected visible
    if (thumbnailScrollRef.current) {
      const thumbnailWidth = 88 // 80px + 8px gap
      const containerWidth = thumbnailScrollRef.current.clientWidth
      const scrollTarget = newIndex * thumbnailWidth - containerWidth / 2 + thumbnailWidth / 2
      thumbnailScrollRef.current.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth',
      })
    }
  }


  const scrollToSlide = (index: number) => {
    carousel.goToSlide(index)
  }

  // Lightbox handlers
  const handleOpenLightbox = () => {
    lightbox.open()
  }

  const getItemsPerSlide = () => {
    if (typeof window === 'undefined') return 4
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 768) return 2
    if (window.innerWidth < 1024) return 3
    return 4
  }

  const maxSlides = Math.ceil(relatedProducts.length / getItemsPerSlide())

  const handlePrevSlide = () => {
    carousel.prevSlide()
  }

  const handleNextSlide = () => {
    carousel.nextSlide()
  }

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? (getProductImages(product).length || 1) - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === (getProductImages(product).length || 1) - 1 ? 0 : prev + 1))
  }

  return (
    <PageTransition>
      {/* SEO: Structured Data for Google Rich Snippets */}
      {product && (
        <ProductStructuredData
          product={product}
          reviews={reviews}
          stats={stats}
        />
      )}

      {/* Breadcrumb - Must be OUTSIDE container for sticky to work */}
      <UniversalBreadcrumb items={breadcrumbItems} />

      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Product Info Section */}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 mt-4'>
          {/* Product Images */}
          <div>
            <div className='relative mb-4'>
              <div
                className='aspect-square overflow-hidden rounded-xl border border-blue-100 bg-white/80 backdrop-blur-sm cursor-zoom-in'
                onClick={() => lightbox.open()}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    lightbox.open()
                  }
                }}
                aria-label='Click to view full size image'
              >
                <ImageWithFallback
                  key={selectedImage}
                  src={getProductImages(product)[selectedImage] || getProductImage(product)}
                  alt={product.name}
                  className='w-full h-full object-cover hover:scale-105 transition-transform duration-300 animate-fade-in'
                />

              </div>

              {/* Badges - Top Left */}
              <div className='absolute top-4 left-4 flex flex-col gap-2 z-20'>
                {product.isPrescription && (
                  <Badge className='bg-red-600 text-white font-medium shadow-lg'>Rx - Kê đơn</Badge>
                )}
                {product.isOnSale && <Badge className='bg-orange-500 text-white shadow-lg'>Sale</Badge>}
              </div>

              {/* Image counter badge - Bottom Left */}
              {getProductImages(product).length > 1 && (
                <div className='absolute bottom-4 left-4 z-20 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm'>
                  <span className='font-medium text-sm'>
                    {selectedImage + 1}/{getProductImages(product).length}
                  </span>

                </div>
              )}

              {/* Zoom button - Bottom Right - Glassmorphism */}
              <Button
                variant='secondary'
                size='sm'
                onClick={handleOpenLightbox}
                className='absolute bottom-4 right-4 z-20 bg-white/80 backdrop-blur-lg border border-blue-100 shadow-lg hover:shadow-xl transition-all'
              >
                <Eye className='w-4 h-4 mr-2' />
                Xem ảnh lớn
              </Button>
            </div>

            {/* Thumbnail Gallery */}
            <div className='w-full'>
              {/* Centered gallery wrapper with max-width */}
              <div className='relative group mx-auto' style={{ maxWidth: '440px' }}>
                {/* Navigation arrows - show if more than 1 image */}
                {getProductImages(product).length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className='absolute -left-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-lg border border-blue-200 shadow-md hover:shadow-lg rounded-full transition-all hover:bg-blue-50 hover:border-blue-300 p-2'
                      aria-label='Previous image'
                    >
                      <ChevronLeft className='w-4 h-4 text-blue-600' />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className='absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-lg border border-blue-200 shadow-md hover:shadow-lg rounded-full transition-all hover:bg-blue-50 hover:border-blue-300 p-2'
                      aria-label='Next image'
                    >
                      <ChevronRight className='w-4 h-4 text-blue-600' />
                    </button>
                  </>
                )}


                {/* Thumbnail gallery with smooth scroll */}
                <div
                  ref={thumbnailScrollRef}
                  className='relative flex gap-2 overflow-x-auto p-2 scroll-smooth scrollbar-hide'
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {getProductImages(product).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                        ? 'border-blue-500 shadow-lg scale-105 ring-2 ring-blue-200'
                        : 'border-blue-100 hover:border-blue-300 hover:shadow-md'
                        }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                      {/* Active indicator */}
                      {selectedImage === index && (
                        <div className='absolute inset-0 bg-blue-600/10 pointer-events-none' />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scroll indicator dots - show for 2-8 images - Always centered */}
              {getProductImages(product).length > 1 && getProductImages(product).length <= 8 && (
                <div className='flex justify-center gap-1.5 mt-3'>
                  {getProductImages(product).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-1.5 rounded-full transition-all ${selectedImage === index ? 'w-6 bg-blue-600' : 'w-1.5 bg-blue-200 hover:bg-blue-300'
                        }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className='space-y-6'>
            <div>
              <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-2'>{product.name}</h1>
              <div className='flex items-center gap-4 mb-2'>
                <span className='text-blue-600 hover:underline cursor-pointer'>{getBrandName(product)}</span>
                <span className='text-gray-400'>|</span>
                <span className='text-sm text-gray-500'>SKU: {product.sku}</span>
              </div>

              <div className='flex items-center gap-2 mb-4'>
                <RatingStars
                  rating={stats?.averageRating || 0}
                  size='lg'
                  reviewCount={reviews.length}
                />
                <span
                  className='text-blue-600 hover:underline cursor-pointer text-sm'
                  onClick={() => {
                    setActiveTab('reviews')
                    setTimeout(() => {
                      const tabsSection = document.querySelector('[role="tablist"]')
                      if (tabsSection) {
                        tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }, 100)
                  }}
                >
                  Xem đánh giá
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <PriceDisplay
                originalPrice={product.originalPrice}
                salePrice={product.salePrice ?? product.price ?? 0}
                size='lg'
              />
            </div>

            {/* Stock Status */}
            <div className='flex items-center gap-2'>
              <div className={`w-3 h-3 rounded-full ${isProductInStock(product) ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`font-medium ${isProductInStock(product) ? 'text-green-600' : 'text-red-600'}`}>
                {isProductInStock(product) ? `Còn hàng (${product.stockQuantity} sản phẩm)` : 'Hết hàng'}
              </span>
            </div>

            {/* Quantity - Only show for non-prescription drugs */}
            {!isProductPrescription(product) && (
              <div className='flex items-center gap-4'>
                <span className='font-medium text-gray-700'>Số lượng:</span>
                <QuantityInput
                  value={quantity}
                  onChange={setQuantity}
                  max={product.stockQuantity}
                  disabled={!isProductInStock(product)}
                />
              </div>
            )}

            {/* Actions */}
            <div className='space-y-4'>
              {isProductPrescription(product) ? (
                /* Prescription Required Actions */
                <div className='space-y-4'>
                  <div className='bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm'>
                    <div className='flex items-center gap-2 text-red-800 font-medium'>
                      <BadgeAlert className='w-5 h-5 flex-shrink-0' />
                      <span>THUỐC KÊ ĐƠN - CẦN TƯ VẤN TỪ DƯỢC SĨ</span>
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    <Link to={`/prescription/upload?product=${product.slug}`} className='flex-1'>
                      <Button className='w-full bg-gradient-to-r text-white from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 shadow-lg hover:shadow-xl transition-all'>
                        <FileText className='w-5 h-5 mr-2' />
                        Upload đơn thuốc
                      </Button>
                    </Link>
                    <Link to={`/contact?product=${product.slug}`} className='flex-1'>
                      <Button
                        variant='outline'
                        className='w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 h-12 shadow-md hover:shadow-lg transition-all'
                      >
                        <MessageCircle className='w-5 h-5 mr-2' />
                        Chat dược sĩ
                      </Button>
                    </Link>
                  </div>

                  <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 shadow-sm'>
                    <div className='text-sm text-blue-800'>
                      <div className='flex items-start gap-2'>
                        <Info className='w-5 h-5 flex-shrink-0 mt-0.5' />
                        <div>
                          <p className='font-medium mb-1'>Lưu ý:</p>
                          <ul className='space-y-1 text-sm'>
                            <li>• Cần có đơn thuốc hợp lệ từ bác sĩ</li>
                            <li>• Dược sĩ sẽ xác minh trước khi bán</li>
                            <li>• Tư vấn miễn phí với dược sĩ 24/7</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular OTC Actions */
                <div className='flex gap-3'>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!isProductInStock(product)}
                    variant='outline'
                    className='flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 h-12 shadow-md hover:shadow-lg transition-all'
                  >
                    <ShoppingCart className='w-5 h-5 mr-2' />
                    Thêm giỏ hàng
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!isProductInStock(product)}
                    className='flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-500 dark:hover:from-blue-700 dark:hover:to-cyan-600 text-white dark:text-white h-12 shadow-lg hover:shadow-xl transition-all'
                  >
                    Mua ngay
                  </Button>
                </div>
              )}

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleWishlistToggle}
                  className={`flex-1 border-2 transition-all ${isInWishlist(getProductId(product))
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist(getProductId(product)) ? 'fill-red-600' : ''}`} />
                  {isInWishlist(getProductId(product)) ? 'Đã yêu thích' : 'Yêu thích'}
                </Button>
                {/* <Button
                  variant='outline'
                  size='sm'
                  className='flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all'
                >
                  So sánh sản phẩm
                </Button> */}
                <Button
                  variant='outline'
                  size='sm'
                  className='border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all'
                >
                  <Share2 className='w-4 h-4' />
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className='space-y-3 pt-4 border-t border-blue-100'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>Xuất xứ:</span>
                  <span className='ml-2 font-medium'>{product.origin || 'Việt Nam'}</span>
                </div>
                <div>
                  <span className='text-gray-600'>Đơn vị:</span>
                  <span className='ml-2 font-medium'>{product.unit || 'Hộp'}</span>
                </div>
              </div>

              <div className='text-sm'>
                <span className='text-gray-600'>Hạn sử dụng:</span>
                <span className='ml-2 font-medium'>{product.expiryInfo || '24 tháng kể từ ngày sản xuất'}</span>
              </div>

              <div className='flex items-center gap-1 text-blue-600 text-sm'>
                <Truck className='w-4 h-4' />
                <span>Giao hàng nhanh trong 2-4h tại TP.HCM</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className='flex justify-between items-center pt-4 border-t border-blue-100'>
              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <Shield className='w-4 h-4 text-green-500' />
                <span>Thanh toán an toàn</span>
              </div>
              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <Truck className='w-4 h-4 text-blue-500' />
                <span>Giao hàng nhanh</span>
              </div>
              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <RotateCcw className='w-4 h-4 text-blue-500' />
                <span>Đổi trả 7 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-12'>
          <TabsList className='inline-flex w-full overflow-x-auto bg-blue-100 p-1 rounded-lg shadow-sm scrollbar-hide'>
            <TabsTrigger value='description' className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'>
              <span className='whitespace-nowrap'>Mô tả</span>
            </TabsTrigger>
            <TabsTrigger value='ingredients' className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'>
              <span className='whitespace-nowrap'>Thành phần</span>
            </TabsTrigger>
            <TabsTrigger value='uses' className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'>
              <span className='whitespace-nowrap'>Công dụng</span>
            </TabsTrigger>
            <TabsTrigger value='instructions' className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'>
              <span className='whitespace-nowrap'>Cách dùng</span>
            </TabsTrigger>
            <TabsTrigger value='warnings' className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'>
              <span className='whitespace-nowrap'>Chú ý</span>
            </TabsTrigger>
            <TabsTrigger value='reviews' className='flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2.5 bg-blue-100 text-blue-600 border-0 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md hover:bg-blue-200'>
              <span className='whitespace-nowrap'>Đánh giá ({reviews.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='description' className='mt-6'>
            <Card className='bg-white border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='prose max-w-none'>
                  <p className='text-gray-700 leading-relaxed'>{getProductDescription(product)}</p>
                  <p className='text-gray-700 leading-relaxed mt-4'>
                    Sản phẩm chất lượng cao, được sản xuất theo tiêu chuẩn GMP, đảm bảo an toàn và hiệu quả cho người sử
                    dụng.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='ingredients' className='mt-6'>
            <Card className='bg-white border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {product.details?.activeIngredients ? (
                    <div className='prose max-w-none'>
                      <h4 className='font-semibold text-gray-900 mb-3'>Thành phần hoạt chất</h4>
                      <p className='text-gray-700 leading-relaxed'>{product.details.activeIngredients}</p>
                      {product.details.dosageForm && (
                        <div className='mt-4 pt-4 border-t border-blue-50'>
                          <span className='font-medium text-gray-600'>Dạng bào chế: </span>
                          <span className='text-gray-800'>{product.details.dosageForm}</span>
                        </div>
                      )}
                      {product.details.packSize && (
                        <div className='mt-2'>
                          <span className='font-medium text-gray-600'>Quy cách đóng gói: </span>
                          <span className='text-gray-800'>{product.details.packSize}</span>
                        </div>
                      )}
                      {product.details.manufacturer && (
                        <div className='mt-2'>
                          <span className='font-medium text-gray-600'>Nhà sản xuất: </span>
                          <span className='text-gray-800'>{product.details.manufacturer}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className='text-gray-600'>Thông tin thành phần đang được cập nhật...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='uses' className='mt-6'>
            <Card className='bg-white border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='prose max-w-none'>
                  {product.details?.indications ? (
                    <p className='text-gray-700 leading-relaxed whitespace-pre-line'>{product.details.indications}</p>
                  ) : (
                    <p className='text-gray-600'>Thông tin công dụng đang được cập nhật...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='instructions' className='mt-6'>
            <Card className='bg-white border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='prose max-w-none'>
                  {product.details?.dosageInstructions ? (
                    <p className='text-gray-700 leading-relaxed whitespace-pre-line'>{product.details.dosageInstructions}</p>
                  ) : (
                    <p className='text-gray-600'>Thông tin hướng dẫn sử dụng đang được cập nhật...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='warnings' className='mt-6'>
            <Card className='bg-white border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {product.details?.storageInstructions && (
                    <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                      <h4 className='font-semibold text-amber-900 mb-2'>Bảo quản</h4>
                      <p className='text-amber-800 leading-relaxed'>{product.details.storageInstructions}</p>
                    </div>
                  )}
                  <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <h4 className='font-semibold text-blue-900 mb-2'>Lưu ý khi sử dụng</h4>
                    <ul className='space-y-2 text-blue-800'>
                      <li className='flex items-start gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                        <span>Đọc kỹ hướng dẫn sử dụng trước khi dùng.</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                        <span>Để xa tầm tay trẻ em.</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                        <span>Tham khảo ý kiến bác sĩ hoặc dược sĩ nếu cần thiết.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='reviews' className='mt-6'>
            <div className='space-y-6'>
              {/* Review Stats */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='md:col-span-1'>
                  <ReviewStats stats={stats} loading={reviewsLoading} />
                </div>
                <div className='md:col-span-2'>
                  <Card className='bg-white border-blue-200 shadow-sm'>
                    <CardContent className='p-6'>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Đánh giá sản phẩm
                        </h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Để đảm bảo tính xác thực, bạn chỉ có thể đánh giá sản phẩm từ đơn hàng đã hoàn thành.
                        </p>
                        <Link
                          to="/account/orders"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 underline font-medium"
                        >
                          Xem đơn hàng của tôi →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Reviews List */}
              <ReviewList
                reviews={reviews}
                loading={reviewsLoading}
                page={page}
                totalPages={totalPages}
                sortBy={sortBy}
                onPageChange={setPage}
                onSortChange={(sort) => setSortBy(sort as any)}
                onHelpful={async (reviewId) => {
                  await markHelpful(reviewId)
                  refetchReviews()
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6'>
              Sản phẩm liên quan
            </h2>
            {/* Carousel Container */}
            <div className='relative group'>
              {/* Navigation Arrows - Only show if more than items per slide */}
              {relatedProducts.length > getItemsPerSlide() && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevSlide}
                    className='absolute -left-12 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 backdrop-blur-lg border-2 border-blue-100 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:border-blue-400 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 group/btn'
                    aria-label='Previous products'
                  >
                    <ChevronLeft className='w-5 h-5 text-blue-600 group-hover/btn:text-white transition-colors' />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNextSlide}
                    className='absolute -right-16 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 backdrop-blur-lg border-2 border-blue-100 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:border-blue-400 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 group/btn'
                    aria-label='Next products'
                  >
                    <ChevronRight className='w-5 h-5 text-blue-600 group-hover/btn:text-white transition-colors' />
                  </button>
                </>
              )}

              {/* Carousel - Smooth horizontal scroll */}
              <div
                ref={carousel.carouselRef}
                className='overflow-hidden scroll-smooth'
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <div className='flex gap-6'>
                  {relatedProducts.map((relatedProduct: Product) => (
                    <div
                      key={getProductId(relatedProduct)}
                      className='flex-shrink-0 w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]'
                    >
                      <ProductCard
                        product={{
                          id: getProductId(relatedProduct),
                          name: relatedProduct.name,
                          slug: relatedProduct.slug,
                          brand: getBrandName(relatedProduct),
                          image: getProductImage(relatedProduct),
                          originalPrice: relatedProduct.originalPrice,
                          salePrice: getProductSalePrice(relatedProduct) || 0,
                          rating: getProductRating(relatedProduct),
                          reviewCount: getProductReviewCount(relatedProduct),
                          inStock: isProductInStock(relatedProduct),
                          isPrescription: isProductPrescription(relatedProduct),
                          isOnSale: relatedProduct.isOnSale,
                          discountPercentage: relatedProduct.discountPercentage,
                          unit: relatedProduct.unit,
                          packaging: relatedProduct.packaging,
                          needsConsultation: relatedProduct.needsConsultation,
                        }}
                        variant='grid'
                        onToggleWishlist={() => {
                          toggleWishlist(getProductId(relatedProduct))
                        }}
                        isInWishlist={isInWishlist(getProductId(relatedProduct))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dots Indicator - Only show if multiple slides */}
              {maxSlides > 1 && (
                <div className='flex justify-center gap-2 mt-6'>
                  {Array.from({ length: maxSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToSlide(index)}
                      className={`h-2 rounded-full transition-all ${carousel.currentSlide === index
                        ? 'w-8 bg-gradient-to-r from-blue-600 to-cyan-500'
                        : 'w-2 bg-blue-200 hover:bg-blue-300'
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox - Full screen modal */}
      <Dialog open={lightbox.isOpen} onOpenChange={lightbox.close}>
        <DialogContent className='max-w-[95vw] max-h-[95vh] p-0 bg-black/95 backdrop-blur-xl border-blue-500/20 overflow-hidden'>
          {/* Accessibility: Hidden title and description for screen readers */}
          <DialogTitle className='sr-only'>{product.name} - Xem ảnh chi tiết</DialogTitle>
          <DialogDescription className='sr-only'>
            Lightbox hiển thị ảnh {selectedImage + 1} trong số {product.images?.length || 1} ảnh của {product.name}. Sử
            dụng phím mũi tên trái/phải để chuyển ảnh, ESC để đóng.
          </DialogDescription>

          {/* Close button - Top right */}
          <DialogClose className='absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/20 transition-all group'>
            <X className='w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300' />
          </DialogClose>

          {/* Image container */}
          <div className='relative w-full h-[90vh] flex items-center justify-center p-8'>
            {/* Main image */}
            <ImageWithFallback
              src={getProductImages(product)[selectedImage] || getProductImage(product)}
              alt={`${product.name} - Image ${selectedImage + 1}`}
              className='max-w-full max-h-full object-contain rounded-lg shadow-2xl'
            />

            {/* Counter badge - Top left */}
            <div className='absolute top-4 left-4 z-40 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm'>
              <span className='font-medium'>
                {selectedImage + 1} / {getProductImages(product).length}
              </span>
            </div>

            {/* Navigation arrows */}
            {getProductImages(product).length > 1 && (
              <>
                {/* Previous button */}
                <button
                  onClick={handlePrevImage}
                  className='absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/20 transition-all group'
                  aria-label='Previous image'
                >
                  <ChevronLeft className='w-6 h-6 text-white group-hover:scale-110 transition-transform' />
                </button>

                {/* Next button */}
                <button
                  onClick={handleNextImage}
                  className='absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/20 transition-all group'
                  aria-label='Next image'
                >
                  <ChevronRight className='w-6 h-6 text-white group-hover:scale-110 transition-transform' />
                </button>
              </>
            )}

            {/* Product info overlay - Bottom */}
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-6 py-3 shadow-lg max-w-2xl'>
              <h3 className='text-white font-medium text-center line-clamp-1'>{product.name}</h3>
              {product.isPrescription && (
                <Badge className='bg-red-600 text-white text-xs mt-2 mx-auto block w-fit'>Rx - Kê đơn</Badge>
              )}
            </div>

            {/* Thumbnail navigation - Bottom (optional for many images) */}
            {getProductImages(product).length > 1 && getProductImages(product).length <= 8 && (
              <div className='absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-2'>
                {getProductImages(product).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-2 rounded-full transition-all ${selectedImage === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                      }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition >
  )
}
