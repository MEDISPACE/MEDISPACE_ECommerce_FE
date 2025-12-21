import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
// import { motion } from 'framer-motion' // DISABLED for performance
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  Shield,
  Users,
  ArrowRight,
  Droplets,
  Stethoscope,
  Pill,
  User,
  Award,
  UserCheck,
  ShoppingBag,
  MessageCircle,
  FileText,
  Zap,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { categoryService } from '../../services/categoryService'
import { productService } from '../../services/productService'
import { ProductCard } from '../products/ProductCard'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import type { Category, Product } from '../../types/product'

type CategoryIconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

const categoryIcons: Record<string, CategoryIconType> = {
  thuoc: Pill, // 💊 Thuốc - Icon viên thuốc hoàn hảo
  'thuc-pham-chuc-nang': Shield, // 🛡️ Thực phẩm chức năng - Bảo vệ sức khỏe
  'cham-soc-ca-nhan': User, // 👤 Chăm sóc cá nhân - Icon người dùng
  'thiet-bi-y-te': Stethoscope, // 🩺 Thiết bị y tế - Ống nghe y tế
  'san-pham-tre-em': Users, // 👥 Sản phẩm trẻ em - Nhóm người
  'duoc-my-pham': Droplets, // 💧 Dược mỹ phẩm - Serum/kem dưỡng
}

const stats = [
  { value: '50,000+', label: 'Sản phẩm', icon: ShoppingBag },
  { value: '1,000+', label: 'Thương hiệu', icon: Award },
  { value: '100+', label: 'Dược sĩ', icon: UserCheck },
  { value: '500,000+', label: 'Khách hàng', icon: Users },
]

export function CategoriesOverviewPage() {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  // Featured products carousel state
  const [featuredCurrentIndex, setFeaturedCurrentIndex] = useState(0)
  const featuredProductsPerPage = 4
  const featuredTotalPages = Math.ceil(featuredProducts.length / featuredProductsPerPage)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch categories and featured products in parallel
        const [categoriesData, productsData] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts(12)
        ])

        setCategories(categoriesData)
        setFeaturedProducts(productsData)
      } catch (error) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setFeaturedCurrentIndex((prev) => (prev === 0 ? featuredTotalPages - 1 : prev - 1))
    } else {
      setFeaturedCurrentIndex((prev) => (prev === featuredTotalPages - 1 ? 0 : prev + 1))
    }
  }

  const breadcrumbItems = [{ label: 'Danh mục sản phẩm' }]

  // Only show parent categories (level 0) for cleaner UI
  const filteredCategories = categories.filter(cat => cat.level === 0)


  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải danh mục sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 mb-4'>⚠️ {error}</div>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Hero Section */}
      <section className='relative bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden'>
        {/* Floating Elements */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div
            className='absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full'


          />
          <div
            className='absolute top-32 right-20 w-16 h-16 bg-cyan-200/30 rounded-full'


          />
          <div
            className='absolute bottom-32 left-1/4 w-12 h-12 bg-blue-300/20 rounded-full'


          />
        </div>

        <div className='max-w-7xl mx-auto px-4 py-16'>
          <div



            className='text-center mt-8'
          >
            <h1 className='text-5xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 px-[0px] py-[12px]'>
              Khám phá thế giới sức khỏe
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
              Hơn 50,000 sản phẩm y tế chất lượng cao, được tư vấn bởi đội ngũ dược sĩ chuyên nghiệp
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4'>
          <div



            className='grid grid-cols-2 md:grid-cols-4 gap-8'
          >
            {stats.map((stat, index) => (
              <div
                key={index}




                className='text-center group'
              >
                <div className='bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300'>
                  <stat.icon className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-3xl font-bold text-blue-800 mb-2'>{stat.value}</h3>
                <p className='text-gray-600'>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className='max-w-7xl mx-auto px-4 py-12 pb-24'>
        {/* Main Categories Grid */}
        <section className='mb-16'>
          <div



            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-4'>
              Danh mục sản phẩm
            </h2>
            <p className='text-xl text-gray-600'>Tìm kiếm sản phẩm phù hợp với nhu cầu của bạn</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6'>
            {filteredCategories.map((category) => {
              const IconComponent = categoryIcons[category.slug] || ShoppingBag
              // Get child categories for this parent
              const childCategories = categories.filter(cat => cat.parentId === category._id)

              return (
                <Card
                  key={category._id}
                  className='bg-white border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden'
                >
                  {/* Header with Icon and Badge */}
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg'>
                        <IconComponent className='w-7 h-7 text-white' />
                      </div>
                      <Badge className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1 text-sm font-semibold'>
                        {category.productCount?.toLocaleString() || 0} SP
                      </Badge>
                    </div>
                    <CardTitle className='text-xl font-bold text-gray-900'>
                      {category.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='flex-1 flex flex-col pt-0'>
                    {/* Description */}
                    <p className='text-gray-500 text-sm italic mb-4 line-clamp-2'>
                      {category.description || 'Khám phá các sản phẩm chất lượng cao'}
                    </p>

                    {/* Subcategories List */}
                    <div className='flex-1 space-y-2 mb-4'>
                      {childCategories.slice(0, 3).map((sub) => (
                        <div
                          key={sub._id}
                          className='flex items-center justify-between text-sm'
                        >
                          <span className='text-gray-700'>{sub.name}</span>
                          <span className='text-blue-600 font-medium'>({sub.productCount || 0})</span>
                        </div>
                      ))}
                      {childCategories.length > 3 && (
                        <div className='text-sm text-gray-400 pt-1'>
                          +{childCategories.length - 3} danh mục khác
                        </div>
                      )}
                      {childCategories.length === 0 && (
                        <div className='text-sm text-gray-400 italic'>
                          Xem chi tiết danh mục
                        </div>
                      )}
                    </div>

                    {/* Full-width Button */}
                    <Button
                      className='w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium'
                      onClick={() => navigate(`/categories/${category.slug}`)}
                    >
                      Khám phá ngay
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Featured Products Section */}
        <section className='mb-16'>
          <div className='text-center mb-12'>
            <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-4'>
              Sản phẩm nổi bật
            </h2>
            <p className='text-xl text-gray-600'>
              Chất lượng cao với thiết kế chuyên nghiệp và thông tin đóng gói chi tiết

            </p>

            {/* View All Products Button */}
            <div className='text-center mt-6'>
              <Link to='/products'>
                <Button
                  variant='outline'
                  size='lg'
                  className='border-2 border-blue-300 text-blue-600 hover:bg-blue-50'
                >
                  Xem tất cả sản phẩm
                  <ArrowRight className='ml-2 w-4 h-4' />
                </Button>
              </Link>
            </div>
          </div>

          {/* 4 Products Carousel with Smooth Sliding */}
          <div
            className='relative px-16 lg:px-20'



          >
            {/* Navigation Arrows - Positioned outside product area */}
            {featuredTotalPages > 1 && (
              <>
                <div
                  className='absolute left-0 top-1/2 -translate-y-1/2 z-20'


                >
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => scrollFeatured('left')}
                    className='h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl'
                  >
                    <ChevronLeft className='w-6 h-6' />
                  </Button>
                </div>

                <div
                  className='absolute right-0 top-1/2 -translate-y-1/2 z-20'


                >
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => scrollFeatured('right')}
                    className='h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl'
                  >
                    <ChevronRight className='w-6 h-6' />
                  </Button>
                </div>
              </>
            )}

            {/* Products Carousel Container */}
            <div className='overflow-hidden rounded-2xl'>
              <div
                className='flex transition-transform duration-500'
                style={{ transform: `translateX(-${featuredCurrentIndex * 100}%)` }}
              >
                {Array.from({ length: featuredTotalPages }).map((_, pageIndex) => (
                  <div
                    key={pageIndex}
                    className='w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-[10px] m-[10px]'
                  >
                    {featuredProducts.slice(pageIndex * 4, (pageIndex + 1) * 4).map((product, productIndex) => {
                      // Extract price from priceVariants (new data format)
                      const defaultVariant = product.priceVariants?.find(v => v.isDefault) || product.priceVariants?.[0]
                      const salePrice = defaultVariant?.price || product.price || 0
                      const originalPrice = defaultVariant?.originalPrice || salePrice
                      const hasDiscount = originalPrice > salePrice
                      const discountPercentage = hasDiscount ? Math.round((1 - salePrice / originalPrice) * 100) : 0
                      const unit = defaultVariant?.unit || 'Hộp'

                      return (
                        <div
                          key={`${product._id || product.id || `product-${productIndex}-${pageIndex}`}-${pageIndex}`}
                          className='h-full hover:-translate-y-1 transition-transform duration-200'
                        >
                          <ProductCard
                            product={{
                              id: product._id,
                              name: product.name,
                              slug: product.slug,
                              brand: product.brand?.name || 'Unknown',
                              image: product.featuredImage || '/images/product-placeholder.jpg',
                              originalPrice: originalPrice,
                              salePrice: salePrice,
                              rating: product.rating || 0,
                              reviewCount: product.reviewCount || 0,
                              inStock: product.stockQuantity > 0,
                              isPrescription: product.requiresPrescription,
                              isOnSale: hasDiscount,
                              discountPercentage: discountPercentage,
                              unit: unit,
                              packaging: '',
                              needsConsultation: false,
                              priceVariants: product.priceVariants,
                            }}
                            variant='grid'
                            onAddToCart={(selectedUnit) => {
                              const variant = product.priceVariants?.find(v => v.unit === selectedUnit)
                              const price = variant?.price || product.priceVariants?.[0]?.price
                              addToCart(product, 1, selectedUnit, price)
                            }}
                            onToggleWishlist={() => {
                              toggleWishlist(product._id)
                            }}
                            isInWishlist={isInWishlist(product._id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Page Indicators */}
            {featuredTotalPages > 1 && (
              <div
                className='flex justify-center items-center gap-2 mt-8'



              >
                {Array.from({ length: featuredTotalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFeaturedCurrentIndex(index)}
                    className={`h-3 rounded-full transition-all duration-300 ${index === featuredCurrentIndex
                      ? 'bg-blue-600 w-8 shadow-lg'
                      : 'bg-blue-200 hover:bg-blue-300 w-3'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* View All Button */}
        </section>

        {/* Medical Consultation CTA */}
        <section className='mb-16'>
          <div



            className='glass-consultation rounded-3xl p-12 text-center relative overflow-hidden'
          >
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-10 left-10 w-32 h-32 bg-white rounded-full'></div>
              <div className='absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full'></div>
              <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full'></div>
            </div>

            <div className='relative z-10'>
              <div


                className='w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8'
              >
                <Stethoscope className='w-12 h-12 text-white' />
              </div>

              <h2 className='text-4xl font-bold text-blue-800 mb-4'>Cần tư vấn từ dược sĩ?</h2>
              <p className='text-xl text-gray-700 mb-8 max-w-2xl mx-auto'>
                Đội ngũ dược sĩ chuyên nghiệp luôn sẵn sàng tư vấn miễn phí 24/7. Hãy để chúng tôi giúp bạn tìm ra
                giải pháp tốt nhất cho sức khỏe.
              </p>

              <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                <Link to='/contact'>
                  <Button
                    size='lg'
                    className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 py-4 text-lg'
                  >
                    <MessageCircle className='mr-2 w-5 h-5' />
                    Tư vấn ngay
                  </Button>
                </Link>
                <Link to='/upload-prescription'>
                  <Button
                    variant='outline'
                    size='lg'
                    className='border-2 border-blue-300 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg'
                  >
                    <FileText className='mr-2 w-5 h-5' />
                    Gửi đơn thuốc
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Health Tips Section */}
        <section className='mb-16'>
          <div



            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-4'>
              Góc sức khỏe
            </h2>
            <p className='text-xl text-gray-600'>Kiến thức và mẹo hay để bảo vệ sức khỏe gia đình</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                title: '5 loại vitamin cần thiết cho mùa đông',
                description: 'Tăng cường sức đề kháng và bảo vệ sức khỏe trong thời tiết lạnh',
                icon: Shield,
                color: 'from-green-500 to-emerald-500',
              },
              {
                title: 'Cách sử dụng thuốc an toàn',
                description: 'Hướng dẫn chi tiết về liều lượng và tác dụng phụ cần lưu ý',
                icon: Pill,
                color: 'from-red-500 to-rose-500',
              },
              {
                title: 'Chăm sóc sức khỏe gia đình',
                description: 'Những điều cần biết để bảo vệ sức khỏe cho mọi thành viên',
                icon: Heart,
                color: 'from-pink-500 to-purple-500',
              },
            ].map((tip, index) => (
              <div
                key={index}




              >
                <Card className='group hover:shadow-xl transition-all duration-500 bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-blue-200 h-full'>
                  <CardContent className='p-6'>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tip.color} flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-300`}
                    >
                      <tip.icon className='w-8 h-8 text-white' />
                    </div>
                    <h3 className='text-xl font-bold text-gray-800 mb-3 hover:text-blue-600 transition-colors'>
                      {tip.title}
                    </h3>
                    <p className='text-gray-600 mb-4'>{tip.description}</p>
                    <Link to='/health'>
                      <Button variant='ghost' className='text-blue-600 hover:bg-blue-50 p-0'>
                        Đọc thêm <ArrowRight className='ml-1 w-4 h-4' />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section>
          <div



            className='bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 rounded-3xl p-12 text-center text-white relative overflow-hidden'
          >
            {/* Background Effects */}
            <div className='absolute inset-0 opacity-20'>
              <div
                className='absolute top-4 left-4 w-16 h-16 bg-white rounded-full'


              />
              <div
                className='absolute bottom-4 right-4 w-20 h-20 bg-white rounded-full'


              />
            </div>

            <div className='relative z-10'>
              <div


                className='w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8'
              >
                <Zap className='w-10 h-10 text-white' />
              </div>

              <h2 className='text-4xl font-bold mb-4'>Nhận ưu đãi độc quyền</h2>
              <p className='text-xl mb-8 max-w-2xl mx-auto opacity-90'>
                Đăng ký nhận thông tin về sản phẩm mới, khuyến mãi đặc biệt và mẹo chăm sóc sức khỏe
              </p>

              <div className='flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto'>
                <Input
                  type='email'
                  placeholder='Nhập email của bạn...'
                  className='bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30'
                />
                <Button className='bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8'>Đăng ký</Button>
              </div>
            </div>
          </div>
        </section>
      </div >
    </div >
  )
}
