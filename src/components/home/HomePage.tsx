import { motion } from 'framer-motion'
import {
  Shield,
  Truck,
  Clock,
  Star,
  Award,
  Heart,
  Pill,
  Stethoscope,
  Plus,
  ArrowRight,
  Phone,
  CheckCircle,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import '~/style/HomePage.css'

const HomePage = () => {
  const featuredCategories = [
    {
      id: 1,
      name: 'Thuốc theo đơn',
      description: 'Thuốc kê đơn chính hãng',
      icon: Pill,
      color: 'from-blue-500/20 to-cyan-500/20',
      count: '2,500+ sản phẩm',
    },
    {
      id: 2,
      name: 'Thuốc không kê đơn',
      description: 'OTC an toàn, hiệu quả',
      icon: Heart,
      color: 'from-cyan-500/20 to-blue-400/20',
      count: '1,800+ sản phẩm',
    },
    {
      id: 3,
      name: 'Thực phẩm chức năng',
      description: 'Vitamin & supplements',
      icon: Plus,
      color: 'from-blue-400/20 to-cyan-600/20',
      count: '900+ sản phẩm',
    },
    {
      id: 4,
      name: 'Thiết bị y tế',
      description: 'Máy đo, dụng cụ y tế',
      icon: Stethoscope,
      color: 'from-cyan-600/20 to-blue-500/20',
      count: '450+ sản phẩm',
    },
  ]

  const services = [
    {
      icon: Truck,
      title: 'Giao hàng nhanh',
      description: 'Giao hàng trong 2-4 giờ tại TP.HCM & Hà Nội',
      highlight: 'Miễn phí từ 200K',
    },
    {
      icon: Shield,
      title: 'Đảm bảo chính hãng',
      description: 'Thuốc 100% chính hãng từ nhà sản xuất',
      highlight: 'Có giấy phép FDA',
    },
    {
      icon: Clock,
      title: 'Tư vấn 24/7',
      description: 'Dược sĩ tư vấn miễn phí mọi lúc',
      highlight: 'Hotline: 1900-2024',
    },
    {
      icon: Award,
      title: 'Uy tín hàng đầu',
      description: 'Được tin tưởng bởi 500K+ khách hàng',
      highlight: 'Top 1 Việt Nam',
    },
  ]

  const popularProducts = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      brand: 'Pharmedic',
      price: '15.000',
      originalPrice: '20.000',
      rating: 4.8,
      reviews: 234,
      badge: 'Bán chạy',
      prescription: false,
    },
    {
      id: 2,
      name: 'Vitamin C 1000mg',
      brand: "Nature's Plus",
      price: '185.000',
      originalPrice: '220.000',
      rating: 4.9,
      reviews: 156,
      badge: 'Khuyến mãi',
      prescription: false,
    },
    {
      id: 3,
      name: 'Amoxicillin 500mg',
      brand: 'DHG Pharma',
      price: '45.000',
      originalPrice: null,
      rating: 4.7,
      reviews: 89,
      badge: 'Kê đơn',
      prescription: true,
    },
    {
      id: 4,
      name: 'Omega-3 Fish Oil',
      brand: 'Nordic Naturals',
      price: '320.000',
      originalPrice: '380.000',
      rating: 4.9,
      reviews: 203,
      badge: 'Premium',
      prescription: false,
    },
  ]

  const stats = [
    { number: '500K+', label: 'Khách hàng tin tưởng' },
    { number: '5,000+', label: 'Sản phẩm đa dạng' },
    { number: '98%', label: 'Khách hàng hài lòng' },
    { number: '24/7', label: 'Hỗ trợ tư vấn' },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white'>
      {/* Hero Section */}
      <section className='relative pt-8 pb-20 overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3C...medical-pattern...%3E')] bg-repeat"></div>
        </div>

        <div className='container mx-auto px-6 relative z-10'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className='space-y-8'
            >
              <div className='space-y-4'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-200/30 rounded-full px-4 py-2'
                >
                  <Shield className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-medium text-blue-700'>Nhà thuốc trực tuyến #1 Việt Nam</span>
                </motion.div>

                <h1 className='text-5xl lg:text-6xl font-bold leading-tight'>
                  <span className='bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent'>
                    MEDISPACE
                  </span>
                  <br />
                  <span className='text-gray-800'>Sức khỏe trong tầm tay</span>
                </h1>

                <p className='text-xl text-gray-600 leading-relaxed max-w-lg'>
                  Mua thuốc trực tuyến an toàn, tiện lợi. Giao hàng nhanh, tư vấn miễn phí từ dược sĩ chuyên nghiệp.
                </p>
              </div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='flex flex-wrap gap-4'
              >
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-3 rounded-xl text-base'
                >
                  Mua thuốc ngay
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Button>
                <Button
                  variant='outline'
                  size='lg'
                  className='border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl text-base'
                >
                  <Phone className='mr-2 w-5 h-5' />
                  Tư vấn miễn phí
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Image/Stats */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='relative'
            >
              {/* Stats Cards */}
              <div className='grid grid-cols-2 gap-4 mb-8'>
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className='bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center shadow-lg'
                  >
                    <div className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2'>
                      {stat.number}
                    </div>
                    <div className='text-sm text-gray-600 font-medium'>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Medical Illustration */}
              <div className='relative bg-gradient-to-br from-blue-100/50 to-cyan-100/50 rounded-3xl p-8 backdrop-blur-sm border border-white/30'>
                <div className='flex items-center justify-center h-48'>
                  <div className='relative'>
                    <div className='w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 absolute animate-pulse'></div>
                    <Stethoscope className='w-24 h-24 text-blue-600 relative z-10' />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className='py-20 bg-white/50 backdrop-blur-sm'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl font-bold text-gray-800 mb-4'>Danh mục sản phẩm</h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Khám phá hàng nghìn sản phẩm chăm sóc sức khỏe chính hãng
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {featuredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='group cursor-pointer'
              >
                <Card className='h-full bg-white/70 backdrop-blur-md border-white/30 hover:shadow-xl transition-all duration-300 group-hover:scale-105'>
                  <CardContent className='p-6'>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <category.icon className='w-8 h-8 text-blue-600' />
                    </div>
                    <h3 className='text-xl font-semibold text-gray-800 mb-2'>{category.name}</h3>
                    <p className='text-gray-600 mb-4'>{category.description}</p>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-blue-600 font-medium'>{category.count}</span>
                      <ArrowRight className='w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all' />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className='py-20'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl font-bold text-gray-800 mb-4'>Sản phẩm bán chạy</h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Những sản phẩm được khách hàng tin tưởng và lựa chọn nhiều nhất
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {popularProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='group cursor-pointer'
              >
                <Card className='h-full bg-white/70 backdrop-blur-md border-white/30 hover:shadow-xl transition-all duration-300 group-hover:scale-105'>
                  <CardContent className='p-6'>
                    {/* Product Badge */}
                    <div className='flex justify-between items-start mb-4'>
                      <Badge
                        variant={product.prescription ? 'destructive' : 'secondary'}
                        className={`${
                          product.badge === 'Bán chạy'
                            ? 'bg-orange-100 text-orange-700'
                            : product.badge === 'Khuyến mãi'
                              ? 'bg-red-100 text-red-700'
                              : product.badge === 'Premium'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {product.badge}
                      </Badge>
                      <Heart className='w-5 h-5 text-gray-300 hover:text-red-500 cursor-pointer transition-colors' />
                    </div>

                    {/* Product Image Placeholder */}
                    <div className='w-full h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl mb-4 flex items-center justify-center'>
                      <Pill className='w-12 h-12 text-blue-300' />
                    </div>

                    {/* Product Info */}
                    <div className='space-y-2 mb-4'>
                      <h3 className='font-semibold text-gray-800 line-clamp-2'>{product.name}</h3>
                      <p className='text-sm text-gray-500'>{product.brand}</p>
                    </div>

                    {/* Rating */}
                    <div className='flex items-center gap-1 mb-4'>
                      <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm font-medium text-gray-700'>{product.rating}</span>
                      <span className='text-sm text-gray-500'>({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className='flex items-center justify-between'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-lg font-bold text-blue-600'>{product.price}đ</span>
                          {product.originalPrice && (
                            <span className='text-sm text-gray-400 line-through'>{product.originalPrice}đ</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size='sm'
                        className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      >
                        <Plus className='w-4 h-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className='text-center mt-12'
          >
            <Button
              size='lg'
              variant='outline'
              className='border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl'
            >
              Xem tất cả sản phẩm
              <ArrowRight className='ml-2 w-5 h-5' />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className='py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white overflow-hidden relative'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3C...pattern...%3E')] bg-repeat"></div>
        </div>

        <div className='container mx-auto px-6 relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl font-bold mb-4'>Tại sao chọn MEDISPACE?</h2>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Chúng tôi cam kết mang đến dịch vụ tốt nhất cho sức khỏe của bạn
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='text-center group'
              >
                <div className='relative mb-6'>
                  <div className='w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform'>
                    <service.icon className='w-10 h-10 text-white' />
                  </div>
                </div>
                <h3 className='text-xl font-semibold mb-3'>{service.title}</h3>
                <p className='text-blue-100 mb-3 leading-relaxed'>{service.description}</p>
                <div className='inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1'>
                  <CheckCircle className='w-4 h-4' />
                  <span className='text-sm font-medium'>{service.highlight}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className='py-20 bg-white/50 backdrop-blur-sm'>
        <div className='container mx-auto px-6'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='max-w-4xl mx-auto text-center'
          >
            <div className='bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white relative overflow-hidden'>
              <div className='absolute inset-0 bg-white/5 backdrop-blur-sm'></div>
              <div className='relative z-10'>
                <h2 className='text-3xl font-bold mb-4'>Nhận tin tức về sức khỏe</h2>
                <p className='text-blue-100 mb-8 text-lg'>
                  Đăng ký để nhận thông tin mới nhất về sản phẩm, khuyến mãi và tips chăm sóc sức khỏe
                </p>

                <div className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
                  <Input
                    placeholder='Nhập email của bạn'
                    className='flex-1 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/70 focus:border-white/40'
                  />
                  <Button className='bg-white text-blue-600 hover:bg-white/90 font-semibold px-8'>Đăng ký</Button>
                </div>

                <p className='text-sm text-blue-100 mt-4'>* Chúng tôi cam kết bảo mật thông tin cá nhân của bạn</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
