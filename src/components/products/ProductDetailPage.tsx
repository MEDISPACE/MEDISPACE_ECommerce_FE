import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router'
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
import { addToCart, buyNow, toggleWishlist, showPrescriptionWarning } from '../../utils/cartUtils'
import { useImageLightbox, useCarousel } from '../../hooks'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import type { Product, Review } from '~/types/product'
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
  createLegacyProduct,
} from '../../utils/productHelpers'

export function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const thumbnailScrollRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Reviews - TODO: Replace with real API call
  const reviews: Review[] = [] // mockReviews

  // Find product by slug - TODO: Replace with real API call
  const rawProduct: Product | undefined = undefined // mockProducts.find((p: Product) => p.slug === slug)
  const product = rawProduct ? createLegacyProduct(rawProduct) : undefined

  // Related products (mock) - memoized for performance - TODO: Replace with real API call
  const relatedProducts = useMemo<Product[]>(
    () =>
      rawProduct
        ? [] // mockProducts.filter((p: Product) => getBrandName(p) === getBrandName(rawProduct) && getProductId(p) !== getProductId(rawProduct)).slice(0, 12)
        : [],
    [rawProduct],
  )

  // Use custom hooks - temporarily disabled due to type conflicts
  // const breadcrumbItems = useBreadcrumb({ product: rawProduct })
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/products' },
    { label: product?.name || 'Chi tiết sản phẩm', href: '#' },
  ]

  const lightbox = useImageLightbox({
    images: product ? getProductImages(product) : [],
    initialIndex: 0,
  })

  const carousel = useCarousel({
    itemsCount: relatedProducts.length,
    autoScroll: false,
  })

  if (!product) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='text-center py-12'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Sản phẩm không tồn tại</h2>
          <p className='text-gray-600 mb-6'>Sản phẩm bạn đang tìm kiếm không có trong hệ thống.</p>
          <Button onClick={() => window.history.back()}>Quay lại</Button>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    if (!product) return
    if (isProductPrescription(product)) {
      showPrescriptionWarning(product.name)
      return
    }
    addToCart(getProductId(product), product.name, quantity)
  }

  const handleBuyNow = () => {
    if (!product) return
    if (isProductPrescription(product)) {
      showPrescriptionWarning(product.name)
      return
    }
    buyNow(getProductId(product), product.name, quantity)
  }

  const handleWishlistToggle = () => {
    if (!product) return
    const newWishlistState = toggleWishlist(getProductId(product), product.name)
    setIsInWishlist(newWishlistState)
  }

  // Thumbnail gallery scroll handlers
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailScrollRef.current) return
    const scrollAmount = 96 // width of thumbnail (80px) + gap (16px)
    const newScrollLeft = thumbnailScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
    thumbnailScrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
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
    setCurrentSlide((prev) => Math.max(0, prev - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlide((prev) => Math.min(maxSlides - 1, prev + 1))
  }

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  return (
    <PageTransition>
      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Product Info Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
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
                  src={product.images[lightbox.currentIndex] || product.image}
                  alt={product.name}
                  className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
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
              {product.images.length > 1 && (
                <div className='absolute bottom-4 left-4 z-20 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm'>
                  <span className='font-medium text-sm'>
                    {lightbox.currentIndex + 1}/{product.images.length}
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
                {/* Navigation arrows - only show if more than 5 images */}
                {product.images.length > 5 && (
                  <>
                    <button
                      onClick={() => scrollThumbnails('left')}
                      className='absolute -left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-lg border border-blue-100 shadow-lg hover:shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 disabled:opacity-0 p-2'
                      aria-label='Scroll left'
                    >
                      <ChevronLeft className='w-4 h-4 text-blue-600' />
                    </button>
                    <button
                      onClick={() => scrollThumbnails('right')}
                      className='absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-lg border border-blue-100 shadow-lg hover:shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 disabled:opacity-0 p-2'
                      aria-label='Scroll right'
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
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
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
              {product.images.length > 1 && product.images.length <= 8 && (
                <div className='flex justify-center gap-1.5 mt-3'>
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        selectedImage === index ? 'w-6 bg-blue-600' : 'w-1.5 bg-blue-200 hover:bg-blue-300'
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
                  rating={getProductRating(product)}
                  size='lg'
                  reviewCount={getProductReviewCount(product)}
                />
                <span className='text-blue-600 hover:underline cursor-pointer text-sm'>Xem đánh giá</span>
              </div>
            </div>

            {/* Price */}
            <div>
              <PriceDisplay originalPrice={product.originalPrice} salePrice={product.salePrice || 0} size='lg' />
            </div>

            {/* Stock Status */}
            <div className='flex items-center gap-2'>
              <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {product.inStock ? `Còn hàng (${product.stockQuantity} sản phẩm)` : 'Hết hàng'}
              </span>
            </div>

            {/* Quantity - Only show for non-prescription drugs */}
            {!product.isPrescription && (
              <div className='flex items-center gap-4'>
                <span className='font-medium text-gray-700'>Số lượng:</span>
                <QuantityInput
                  value={quantity}
                  onChange={setQuantity}
                  max={product.stockQuantity}
                  disabled={!product.inStock}
                />
              </div>
            )}

            {/* Actions */}
            <div className='space-y-4'>
              {product.isPrescription ? (
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
                      <Button className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 shadow-lg hover:shadow-xl transition-all'>
                        <FileText className='w-5 h-5 mr-2' />
                        Upload đơn thuốc
                      </Button>
                    </Link>
                    <Link to={`/consultation/chat?product=${product.slug}`} className='flex-1'>
                      <Button
                        variant='outline'
                        className='w-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 h-12 shadow-md hover:shadow-lg transition-all'
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
                    disabled={!product.inStock}
                    variant='outline'
                    className='flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 h-12 shadow-md hover:shadow-lg transition-all'
                  >
                    <ShoppingCart className='w-5 h-5 mr-2' />
                    Thêm giỏ hàng
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!product.inStock}
                    className='flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 shadow-lg hover:shadow-xl transition-all'
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
                  className={`flex-1 border-2 transition-all ${
                    isInWishlist
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist ? 'fill-red-600' : ''}`} />
                  {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all'
                >
                  So sánh sản phẩm
                </Button>
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
                  <span className='ml-2 font-medium'>{product.origin}</span>
                </div>
                <div>
                  <span className='text-gray-600'>Đơn vị:</span>
                  <span className='ml-2 font-medium'>{product.unit}</span>
                </div>
              </div>

              <div className='text-sm'>
                <span className='text-gray-600'>Hạn sử dụng:</span>
                <span className='ml-2 font-medium'>{product.expiryInfo}</span>
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
        <Tabs defaultValue='description' className='mb-12'>
          <TabsList className='grid w-full grid-cols-6 bg-blue-50/80 backdrop-blur-sm border border-blue-100'>
            <TabsTrigger value='description'>Mô tả</TabsTrigger>
            <TabsTrigger value='ingredients'>Thành phần</TabsTrigger>
            <TabsTrigger value='uses'>Công dụng</TabsTrigger>
            <TabsTrigger value='instructions'>Cách dùng</TabsTrigger>
            <TabsTrigger value='warnings'>Chú ý</TabsTrigger>
            <TabsTrigger value='reviews'>Đánh giá ({product.reviewCount})</TabsTrigger>
          </TabsList>

          <TabsContent value='description' className='mt-6'>
            <Card className='border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='prose max-w-none'>
                  <p className='text-gray-700 leading-relaxed'>{product.description}</p>
                  <p className='text-gray-700 leading-relaxed mt-4'>
                    Sản phẩm chất lượng cao, được sản xuất theo tiêu chuẩn GMP, đảm bảo an toàn và hiệu quả cho người sử
                    dụng.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='ingredients' className='mt-6'>
            <Card className='border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {product.ingredients?.map((ingredient, index) => (
                    <div key={index} className='flex justify-between py-2 border-b border-blue-50 last:border-0'>
                      <span className='font-medium'>{ingredient}</span>
                      <span className='text-gray-600'>Chính</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='uses' className='mt-6'>
            <Card className='border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <ul className='space-y-2'>
                  {product.uses?.map((use, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <div className='w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0' />
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='instructions' className='mt-6'>
            <Card className='border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='prose max-w-none'>
                  <p className='text-gray-700 leading-relaxed'>{product.instructions}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='warnings' className='mt-6'>
            <Card className='border-blue-100 shadow-sm'>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  {product.warnings?.map((warning, index) => (
                    <div
                      key={index}
                      className='flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'
                    >
                      <div className='w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0' />
                      <span className='text-yellow-800'>{warning}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='reviews' className='mt-6'>
            <div className='space-y-6'>
              {/* Review Summary */}
              <Card className='border-blue-100 shadow-sm'>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='text-center'>
                      <div className='text-4xl font-bold text-blue-600 mb-2'>{product.rating.toFixed(1)}</div>
                      <RatingStars rating={product.rating} size='lg' showRating={false} />
                      <div className='text-sm text-gray-600 mt-2'>{product.reviewCount} đánh giá</div>
                    </div>

                    <div className='space-y-2'>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className='flex items-center gap-2'>
                          <span className='text-sm w-8'>{rating} ⭐</span>
                          <div className='flex-1 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-yellow-400 h-2 rounded-full'
                              style={{
                                width: `${rating === 5 ? 70 : rating === 4 ? 20 : 10}%`,
                              }}
                            />
                          </div>
                          <span className='text-sm text-gray-600 w-8'>
                            {rating === 5 ? '70%' : rating === 4 ? '20%' : '10%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className='my-6' />

                  <Button className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all'>
                    <Star className='w-4 h-4 mr-2' />
                    Viết đánh giá
                  </Button>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className='space-y-4'>
                {reviews.map((review: Review) => (
                  <Card key={review.id} className='border-blue-100 shadow-sm hover:shadow-md transition-shadow'>
                    <CardContent className='p-6'>
                      <div className='flex items-start gap-4'>
                        <Avatar>
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback className='bg-blue-100 text-blue-600'>
                            {review.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='font-medium'>{review.userName}</span>
                            <span className='text-gray-400'>•</span>
                            <span className='text-sm text-gray-500'>{review.date}</span>
                          </div>

                          <RatingStars rating={review.rating} size='sm' showRating={false} />

                          <p className='text-gray-700 mt-3 leading-relaxed'>{review.comment}</p>

                          {review.images && review.images.length > 0 && (
                            <div className='flex gap-2 mt-4'>
                              {review.images.map((image: string, index: number) => (
                                <div
                                  key={index}
                                  className='w-20 h-20 rounded-lg overflow-hidden border border-blue-100'
                                >
                                  <ImageWithFallback
                                    src={image}
                                    alt={`Review ${index + 1}`}
                                    className='w-full h-full object-cover'
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className='flex items-center gap-4 mt-4'>
                            <Button variant='ghost' size='sm' className='text-gray-500 hover:text-blue-600'>
                              <ThumbsUp className='w-4 h-4 mr-1' />
                              Hữu ích ({review.helpful})
                            </Button>
                            <Button variant='ghost' size='sm' className='text-gray-500 hover:text-blue-600'>
                              Trả lời
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                ref={carouselRef}
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
                      className={`h-2 rounded-full transition-all ${
                        currentSlide === index
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
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className='max-w-[95vw] max-h-[95vh] p-0 bg-black/95 backdrop-blur-xl border-blue-500/20 overflow-hidden'>
          {/* Accessibility: Hidden title and description for screen readers */}
          <DialogTitle className='sr-only'>{product.name} - Xem ảnh chi tiết</DialogTitle>
          <DialogDescription className='sr-only'>
            Lightbox hiển thị ảnh {selectedImage + 1} trong số {product.images.length} ảnh của {product.name}. Sử dụng
            phím mũi tên trái/phải để chuyển ảnh, ESC để đóng.
          </DialogDescription>

          {/* Close button - Top right */}
          <DialogClose className='absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg hover:bg-white/20 transition-all group'>
            <X className='w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300' />
          </DialogClose>

          {/* Image container */}
          <div className='relative w-full h-[90vh] flex items-center justify-center p-8'>
            {/* Main image */}
            <ImageWithFallback
              src={product.images[selectedImage] || product.image}
              alt={`${product.name} - Image ${selectedImage + 1}`}
              className='max-w-full max-h-full object-contain rounded-lg shadow-2xl'
            />

            {/* Counter badge - Top left */}
            <div className='absolute top-4 left-4 z-40 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm'>
              <span className='font-medium'>
                {selectedImage + 1} / {product.images.length}
              </span>
            </div>

            {/* Navigation arrows */}
            {product.images.length > 1 && (
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
            {product.images.length > 1 && product.images.length <= 8 && (
              <div className='absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-2'>
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-2 rounded-full transition-all ${
                      selectedImage === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
