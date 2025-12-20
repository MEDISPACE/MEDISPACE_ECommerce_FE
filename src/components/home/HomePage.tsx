import React, { useState, useEffect } from 'react'
import { EnhancedPageTransition } from '../shared/EnhancedPageTransition'
import { ScrollReveal } from '../shared/ScrollReveal'
import { StaggerContainer, StaggerItem } from '../shared/StaggerContainer'
import { InteractiveCard } from '../shared/InteractiveCard'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  Search,
  Truck,
  Shield,
  Users,
  Star,
  Pill,
  Stethoscope,
  Clock,
  MessageCircle,
  ArrowRight,
  Award,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  User,
  Droplets,
} from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ProductCard } from '../products/ProductCard'
import { productService } from '../../services/productService'
import { useWishlist } from '../../hooks/product/useWishlist'
import { useCategories } from '../../hooks/product'
import { useCart } from '../../contexts/CartContext'
import type { Product } from '../../types/product'

// Now using proper Product type from service

// Category icon mapping cho hệ thống MediSpace
const categoryIcons = {
  thuoc: Pill, // 💊 Thuốc - Icon viên thuốc hoàn hảo
  'thuc-pham-chuc-nang': Shield, // 🛡️ Thực phẩm chức năng - Bảo vệ sức khỏe
  'cham-soc-ca-nhan': User, // 👤 Chăm sóc cá nhân - Icon người dùng
  'thiet-bi-y-te': Stethoscope, // 🩺 Thiết bị y tế - Ống nghe y tế
  'duoc-my-pham': Droplets, // 💧 Dược mỹ phẩm - Serum/kem dưỡng
}

export function HomePage() {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  // Products state
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Categories state
  const { categories: realCategories, loading: categoriesLoading } = useCategories()

  // Fetch featured products using service
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        const products = await productService.getFeaturedProducts(12)
        // Ensure we always set an array
        setFeaturedProducts(Array.isArray(products) ? products : [])
      } catch (error) {
        setFeaturedProducts([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  const allFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : []

  // Featured products carousel state
  const [featuredCurrentIndex, setFeaturedCurrentIndex] = useState(0)
  const featuredProductsPerPage = 4
  const featuredTotalPages = Math.ceil(allFeaturedProducts.length / featuredProductsPerPage)

  // Transform products for ProductCard component
  const transformedFeaturedProducts = allFeaturedProducts.map((product) => ({
    id: product._id || product.id || '',
    name: product.name,
    slug: product.slug,
    brand: product.brand?.name || 'Jpanwell',
    image: product.featuredImage || product.image || '/placeholder-product.png',
    originalPrice: product.originalPrice || product.price,
    salePrice: product.salePrice || product.price || 0,
    rating: product.rating || 4.5,
    reviewCount: product.reviewCount || 0,
    inStock: product.inStock !== false && (product.stockQuantity || 0) > 0,
    isPrescription: product.requiresPrescription || product.isPrescription || false,
    isOnSale: product.isOnSale || product.onSale || false,
    discountPercentage: product.discountPercentage || 0,
    unit: product.unit || 'Hộp',
    packaging: product.packaging || '',
    needsConsultation: product.needsConsultation || product.requiresPrescription || false,
  }))

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setFeaturedCurrentIndex((prev) => (prev === 0 ? featuredTotalPages - 1 : prev - 1))
    } else {
      setFeaturedCurrentIndex((prev) => (prev === featuredTotalPages - 1 ? 0 : prev + 1))
    }
  }

  return (
    <EnhancedPageTransition variant='scale' duration={0.8}>
      {/* Hero Section - Modern blue gradient background */}
      <section className='relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50'>
        <div
          className='absolute inset-0 opacity-40'
          style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgb(0 102 204 / 0.05) 2px, transparent 2px)',
            backgroundSize: '50px 50px',
          }}
        ></div>

        <div className='relative max-w-7xl mx-auto px-4 py-20'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <StaggerContainer direction='up' staggerDelay={0.15}>
              <StaggerItem>
                <div className='inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-5 py-2.5 mb-6'>
                  <Shield className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-medium text-blue-600'>Nhà thuốc trực tuyến #1 Việt Nam</span>
                </div>
              </StaggerItem>

              <StaggerItem>
                <h1 className='text-6xl lg:text-7xl font-bold mb-4 leading-tight tracking-wide'>
                  <span className='bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent'>
                    MEDISPACE
                  </span>
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className='text-xl lg:text-2xl text-gray-600 mb-6 font-medium tracking-wide'>
                  Sức khỏe trong tầm tay
                </p>
              </StaggerItem>

              <StaggerItem>
                <p className='text-xl text-gray-600 mb-8 leading-relaxed'>
                  Nền tảng dược phẩm hiện đại với
                  <span className='font-semibold text-blue-600'> 10,000+ sản phẩm chính hãng</span>, giao hàng siêu tốc
                  và tư vấn dược sĩ 24/7.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className='flex flex-col sm:flex-row gap-4 mb-8'>
                  <Button
                    size='lg'
                    onClick={() => (window.location.href = '/products')}
                    className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/25 px-8 h-14 text-white'
                  >
                    <Search className='w-5 h-5 mr-2' />
                    Tìm thuốc ngay
                    <ArrowRight className='w-5 h-5 ml-2' />
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={() => (window.location.href = '/contact')}
                    className='border-2 border-blue-200 text-blue-700 hover:!bg-[#eff6ff] hover:border-blue-400 hover:text-blue-500transition-all duration-300 backdrop-blur-sm h-14'
                  >
                    <MessageCircle className='w-5 h-5 mr-2' />
                    Tư vấn miễn phí
                  </Button>
                </div>
              </StaggerItem>

              {/* Stats */}
              <StaggerItem>
                <div className='grid grid-cols-3 gap-6'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>500K+</div>
                    <div className='text-sm text-gray-600'>Khách hàng</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-cyan-600'>10K+</div>
                    <div className='text-sm text-gray-600'>Sản phẩm</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-800'>200+</div>
                    <div className='text-sm text-gray-600'>Nhà thuốc</div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>

            <ScrollReveal direction='right' delay={0.3}>
              <div className='relative'>
                {/* Decorative background elements */}
                <div className='absolute top-1/4 -right-12 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-slow'></div>
                <div className='absolute bottom-1/4 -left-12 w-48 h-48 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float-pattern'></div>

                {/* Quick Actions Grid */}
                <div className='max-w-4xl mx-auto'>
                  {/* Clean Stats Row - 3 Cards */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
                    <div className='bg-white/80 backdrop-blur-lg rounded-xl border border-blue-100 shadow-lg p-6 text-center'>
                      <div className='w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Users className='w-7 h-7 text-blue-600' />
                      </div>
                      <div className='text-3xl font-bold text-blue-600 mb-2'>500K+</div>
                      <p className='text-gray-600'>Khách hàng tin tưởng</p>
                    </div>

                    <div className='bg-white/80 backdrop-blur-lg rounded-xl border border-blue-100 shadow-lg p-6 text-center'>
                      <div className='w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Star className='w-7 h-7 text-amber-600' />
                      </div>
                      <div className='text-3xl font-bold text-amber-600 mb-2'>98%</div>
                      <p className='text-gray-600'>Khách hàng hài lòng</p>
                    </div>

                    <div className='bg-white/80 backdrop-blur-lg rounded-xl border border-blue-100 shadow-lg p-6 text-center'>
                      <div className='w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Clock className='w-7 h-7 text-purple-600' />
                      </div>
                      <div className='text-3xl font-bold text-purple-600 mb-2'>24/7</div>
                      <p className='text-gray-600'>Hỗ trợ tư vấn</p>
                    </div>
                  </div>

                  {/* Core Action Cards - 3 Cards */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
                    {/* Tư vấn dược sĩ */}
                    <Link to='/contact'>
                      <div
                        className='rounded-xl p-6 text-white hover:shadow-xl hover:scale-[1.02] transition-all group cursor-pointer'
                        style={{
                          background: 'var(--gradient-consultation)',
                        }}
                      >
                        <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                          <MessageCircle className='w-6 h-6' />
                        </div>
                        <h3 className='font-semibold mb-2'>Tư vấn dược sĩ</h3>
                        <p className='text-sm text-white/80 mb-4'>Hỏi đáp miễn phí 24/7</p>
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>Chat ngay</span>
                          <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                        </div>
                      </div>
                    </Link>

                    {/* Mua thuốc OTC */}
                    <Link to='/products'>
                      <div
                        className='rounded-xl p-6 text-white hover:shadow-xl hover:scale-[1.02] transition-all group cursor-pointer'
                        style={{
                          background: 'var(--gradient-otc)',
                        }}
                      >
                        <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                          <Pill className='w-6 h-6' />
                        </div>
                        <h3 className='font-semibold mb-2'>Mua thuốc</h3>
                        <p className='text-sm text-white/80 mb-4'>5,000+ sản phẩm chính hãng</p>
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>Mua ngay</span>
                          <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                        </div>
                      </div>
                    </Link>

                    {/* Thuốc kê đơn Rx */}
                    <Link to='/prescription/upload'>
                      <div
                        className='rounded-xl p-6 text-white hover:shadow-xl hover:scale-[1.02] transition-all group cursor-pointer'
                        style={{
                          background: 'var(--gradient-rx)',
                        }}
                      >
                        <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                          <Stethoscope className='w-6 h-6' />
                        </div>
                        <h3 className='font-semibold mb-2'>Thuốc kê đơn</h3>
                        <p className='text-sm text-white/80 mb-4'>Đặt thuốc theo đơn bác sĩ</p>
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>Đặt ngay</span>
                          <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Glassmorphism cards */}
      <ScrollReveal direction='up' delay={0.2}>
        <section className='py-16 bg-gradient-to-r from-slate-50 to-blue-50'>
          <div className='max-w-7xl mx-auto px-4'>
            <StaggerContainer direction='up' staggerDelay={0.2}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                <StaggerItem>
                  <InteractiveCard hoverScale={1.02} glowEffect floatEffect>
                    <div className='flex items-center gap-6 p-8 bg-white/80 backdrop-blur-lg rounded-2xl border border-blue-100 shadow-lg'>
                      <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                        <Truck className='w-8 h-8 text-white' />
                      </div>
                      <div>
                        <h3 className='font-bold text-gray-900 text-lg'>Giao hàng siêu tốc</h3>
                        <p className='text-gray-600'>Trong 2H, miễn phí từ 300K</p>
                      </div>
                    </div>
                  </InteractiveCard>
                </StaggerItem>

                <StaggerItem>
                  <InteractiveCard hoverScale={1.02} glowEffect floatEffect>
                    <div className='flex items-center gap-6 p-8 bg-white/80 backdrop-blur-lg rounded-2xl border border-blue-100 shadow-lg'>
                      <div className='w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center'>
                        <Shield className='w-8 h-8 text-white' />
                      </div>
                      <div>
                        <h3 className='font-bold text-gray-900 text-lg'>Chính hãng 100%</h3>
                        <p className='text-gray-600'>Đảm bảo nguồn gốc rõ ràng</p>
                      </div>
                    </div>
                  </InteractiveCard>
                </StaggerItem>

                <StaggerItem>
                  <InteractiveCard hoverScale={1.02} glowEffect floatEffect>
                    <div className='flex items-center gap-6 p-8 bg-white/80 backdrop-blur-lg rounded-2xl border border-blue-100 shadow-lg'>
                      <div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                        <HeartHandshake className='w-8 h-8 text-white' />
                      </div>
                      <div>
                        <h3 className='font-bold text-gray-900 text-lg'>Tư vấn 24/7</h3>
                        <p className='text-gray-600'>Dược sĩ chuyên nghiệp</p>
                      </div>
                    </div>
                  </InteractiveCard>
                </StaggerItem>
              </div>
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* Categories - Modern grid with hover effects */}
      <ScrollReveal direction='up' delay={0.3}>
        <section className='py-20 bg-white px-[0px] py-[60px]'>
          <div className='max-w-7xl mx-auto px-4'>
            <StaggerContainer direction='up' staggerDelay={0.1}>
              <StaggerItem>
                <div className='text-center mb-16'>
                  <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-4'>
                    Danh mục sản phẩm
                  </h2>
                  <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                    Khám phá hàng nghìn sản phẩm chăm sóc sức khỏe được phân loại chi tiết
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <StaggerContainer direction='up' staggerDelay={0.1}>
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6'>
                    {categoriesLoading ? (
                      <div className='col-span-full text-center py-12'>
                        <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                        <p className='mt-4 text-gray-600'>Đang tải danh mục...</p>
                      </div>
                    ) : (
                      realCategories.map((category) => {
                        const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Pill

                        return (
                          <StaggerItem key={category._id}>
                            <Link to={`/categories/${category.slug}`} className='group'>
                              <InteractiveCard hoverScale={1.05} glowEffect floatEffect>
                                <Card className='border-0 shadow-lg bg-gradient-to-br from-white to-gray-50'>
                                  <CardContent className='p-6 text-center'>
                                    <div className='w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 text-white bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:from-blue-700 group-hover:to-cyan-600'>
                                      <IconComponent className='w-10 h-10' />
                                    </div>
                                    <h3 className='font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
                                      {category.name}
                                    </h3>
                                    <p className='text-sm text-gray-500'>
                                      {category.productCount?.toLocaleString() || 0} sản phẩm
                                    </p>
                                  </CardContent>
                                </Card>
                              </InteractiveCard>
                            </Link>
                          </StaggerItem>
                        )
                      })
                    )}
                  </div>
                </StaggerContainer>
              </StaggerItem>

              <StaggerItem>
                <div className='text-center mt-8'>
                  <Link to='/categories'>
                    <Button variant='outline' className='border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8'>
                      Xem tất cả danh mục
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Button>
                  </Link>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* Featured Products - Carousel design */}
      <ScrollReveal direction='up' delay={0.4}>
        <section className='py-20 bg-gradient-to-br from-gray-50 to-blue-50 px-[0px] py-[60px]'>
          <div className='max-w-7xl mx-auto px-4'>
            <StaggerContainer direction='up' staggerDelay={0.1}>
              <StaggerItem>
                <div className='text-center mb-8'>
                  <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-4'>
                    Sản phẩm nổi bật
                  </h2>
                  <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                    Chất lượng cao với thiết kế chuyên nghiệp và thông tin đóng gói chi tiết
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className='text-center mb-[12px] mt-[0px] mr-[0px] ml-[0px]'>
                  <Link to='/products'>
                    <Button variant='outline' className='border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-6'>
                      Xem tất cả sản phẩm
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Button>
                  </Link>
                </div>
              </StaggerItem>

              <StaggerItem>
                {loading ? (
                  <div className='text-center py-12'>
                    <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    <p className='mt-4 text-gray-600'>Đang tải sản phẩm...</p>
                  </div>
                ) : (
                  /* 4 Products Carousel with Smooth Sliding */
                  <div className='relative px-16 lg:px-20 py-[10px] px-[80px] py-[8px]'>
                    {/* Navigation Arrows - Positioned outside product area */}
                    {featuredTotalPages > 1 && (
                      <>
                        <motion.div
                          className='absolute left-6 top-1/2 -translate-y-1/2 z-20'
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() => scrollFeatured('left')}
                            className='h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl'
                          >
                            <ChevronLeft className='w-6 h-6' />
                          </Button>
                        </motion.div>

                        <motion.div
                          className='absolute right-6 top-1/2 -translate-y-1/2 z-20'
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() => scrollFeatured('right')}
                            className='h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl'
                          >
                            <ChevronRight className='w-6 h-6' />
                          </Button>
                        </motion.div>
                      </>
                    )}

                    {/* Products Carousel Container */}
                    <div className='overflow-hidden rounded-2xl'>
                      <motion.div
                        className='flex'
                        animate={{
                          x: `${-featuredCurrentIndex * 100}%`,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                          mass: 0.8,
                        }}
                      >
                        {Array.from({
                          length: featuredTotalPages,
                        }).map((_, pageIndex) => (
                          <div
                            key={pageIndex}
                            className='w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-[0px] m-[10px] py-[10px] p-[10px]'
                          >
                            {allFeaturedProducts
                              .slice(pageIndex * 4, (pageIndex + 1) * 4)
                              .map((originalProduct, productIndex) => {
                                const product = transformedFeaturedProducts[pageIndex * 4 + productIndex]
                                return (
                                  <motion.div
                                    key={`${product.id}-${pageIndex}`}
                                    className='h-full'
                                    initial={{
                                      opacity: 0,
                                      y: 20,
                                    }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: productIndex * 0.1,
                                      duration: 0.5,
                                      ease: 'easeOut',
                                    }}
                                    whileHover={{
                                      y: -5,
                                      transition: {
                                        duration: 0.2,
                                      },
                                    }}
                                  >
                                    <ProductCard
                                      product={product}
                                      variant='grid'
                                      onAddToCart={() => {
                                        addToCart(originalProduct, 1)
                                      }}
                                      onToggleWishlist={() => {
                                        toggleWishlist(product.id)
                                      }}
                                      isInWishlist={isInWishlist(product.id)}
                                    />
                                  </motion.div>
                                )
                              })}
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Enhanced Page Indicators */}
                    {featuredTotalPages > 1 && (
                      <motion.div
                        className='flex justify-center items-center gap-2 mt-8'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        {Array.from({
                          length: featuredTotalPages,
                        }).map((_, index) => (
                          <motion.button
                            key={index}
                            onClick={() => setFeaturedCurrentIndex(index)}
                            className={`h-3 rounded-full transition-all duration-300 ${index === featuredCurrentIndex
                              ? 'bg-blue-600 w-8 shadow-lg'
                              : 'bg-blue-200 hover:bg-blue-300 w-3'
                              }`}
                            whileHover={{
                              scale: 1.2,
                              backgroundColor: index === featuredCurrentIndex ? '#0066CC' : '#4A90E2',
                            }}
                            whileTap={{ scale: 0.9 }}
                          />
                        ))}
                        <motion.span
                          className='ml-4 text-sm text-gray-500'
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        ></motion.span>
                      </motion.div>
                    )}
                  </div>
                )}
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* Consultation CTA - Enhanced blue gradient */}
      <ScrollReveal direction='up' delay={0.6}>
        <section className='py-20 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 relative overflow-hidden'>
          <div
            className='absolute inset-0 opacity-20'
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)',
            }}
          ></div>

          <div className='relative max-w-7xl mx-auto px-4 text-center'>
            <div className='max-w-4xl mx-auto'>
              <StaggerContainer direction='up' staggerDelay={0.2}>
                <StaggerItem>
                  <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8'>
                    <Award className='w-5 h-5 text-white' />
                    <span className='text-white font-medium'>Dược sĩ chuyên nghiệp</span>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <h2 className='text-4xl lg:text-5xl font-bold text-white mb-6'>
                    Cần tư vấn sức khỏe?
                    <br />
                    <span className='text-cyan-300'>Hoàn toàn miễn phí!</span>
                  </h2>
                </StaggerItem>

                <StaggerItem>
                  <p className='text-xl text-blue-100 mb-10 leading-relaxed'>
                    Đội ngũ dược sĩ với hơn 10 năm kinh nghiệm sẵn sàng tư vấn 24/7. Chat ngay để nhận lời khuyên phù
                    hợp nhất cho tình trạng sức khỏe của bạn.
                  </p>
                </StaggerItem>

                <StaggerItem>
                  <div className='flex flex-col sm:flex-row gap-6 justify-center'>
                    <Button
                      size='lg'
                      className='bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-2xl px-10 h-16 text-lg font-semibold'
                    >
                      <MessageCircle className='w-6 h-6 mr-3' />
                      Chat ngay với dược sĩ
                    </Button>
                    <Button
                      size='lg'
                      variant='outline'
                      className='border-2 border-white text-white hover:bg-white hover:text-blue-700 backdrop-blur-sm bg-white/10 px-10 h-16 text-lg font-semibold'
                    >
                      <Clock className='w-6 h-6 mr-3' />
                      Đặt lịch tư vấn
                    </Button>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Enhanced Stats */}
      <ScrollReveal direction='up' delay={0.7}>
        <section className='py-20 bg-white'>
          <div className='max-w-7xl mx-auto px-4'>
            <StaggerContainer direction='up' staggerDelay={0.15}>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
                <StaggerItem>
                  <InteractiveCard hoverScale={1.05} glowEffect floatEffect className='text-center group'>
                    <div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
                      <Users className='w-10 h-10 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-blue-600 mb-2'>500K+</div>
                    <div className='text-gray-600 font-medium'>Khách hàng tin dùng</div>
                  </InteractiveCard>
                </StaggerItem>

                <StaggerItem>
                  <InteractiveCard hoverScale={1.05} glowEffect floatEffect className='text-center group'>
                    <div className='w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
                      <Pill className='w-10 h-10 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-emerald-600 mb-2'>10K+</div>
                    <div className='text-gray-600 font-medium'>Sản phẩm chất lượng</div>
                  </InteractiveCard>
                </StaggerItem>

                <StaggerItem>
                  <InteractiveCard hoverScale={1.05} glowEffect floatEffect className='text-center group'>
                    <div className='w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
                      <Shield className='w-10 h-10 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-purple-600 mb-2'>200+</div>
                    <div className='text-gray-600 font-medium'>Nhà thuốc đối tác</div>
                  </InteractiveCard>
                </StaggerItem>

                <StaggerItem>
                  <InteractiveCard hoverScale={1.05} glowEffect floatEffect className='text-center group'>
                    <div className='w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
                      <Clock className='w-10 h-10 text-white' />
                    </div>
                    <div className='text-3xl font-bold text-orange-600 mb-2'>24/7</div>
                    <div className='text-gray-600 font-medium'>Hỗ trợ khách hàng</div>
                  </InteractiveCard>
                </StaggerItem>
              </div>
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>
    </EnhancedPageTransition>
  )
}
