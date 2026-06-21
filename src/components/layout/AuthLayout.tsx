import { Link } from 'react-router'
import { Home, Shield, Clock, CheckCircle2, Heart, Sparkles, Star, Award } from 'lucide-react'
import { Button } from '../ui/button'
import { motion } from 'framer-motion'
import logoImage from '../../assets/logo-light.svg'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='min-h-screen flex'>
      {/* Home Button - Fixed top left, hidden on small screens (gradient + lift on hover) */}
      <Link to='/' className='fixed top-6 left-6 z-50 hidden sm:block'>
        <Button
          variant='outline'
          size='sm'
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] !text-white border-0 shadow-sm transition-transform transform hover:-translate-y-1 hover:shadow-lg hover:from-[#071A49] hover:to-[#0A2463] hover:!text-white focus:outline-none focus-visible:!text-white [&_svg]:!text-white'
        >
          <Home className='w-4 h-4 mr-2' />
          Trang chủ
        </Button>
      </Link>

      {/* Left Side - Branding (55%) */}
      <div className='hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-[#0A2463] via-[#1E40AF] to-[#1E40AF] overflow-hidden'>
        {/* Enhanced background effects */}
        <div className='absolute inset-0'>
          {/* Animated gradient mesh */}
          <div className='absolute inset-0 bg-gradient-to-br from-[#0A2463]/30 via-transparent to-[#BFDBFE]/30 animate-gradient' />

          {/* Multiple gradient orbs for depth */}
          <div className='absolute top-20 left-20 w-96 h-96 bg-white/15 rounded-full blur-3xl animate-pulse-soft' />
          <div
            className='absolute bottom-20 right-20 w-80 h-80 bg-[#BFDBFE]/30 rounded-full blur-3xl animate-pulse-soft'
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#BFDBFE]/20 rounded-full blur-3xl animate-pulse-soft'
            style={{ animationDelay: '3s' }}
          />

          {/* Floating decorative elements */}
          <motion.div
            className='absolute top-32 right-32'
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className='w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20'>
              <Sparkles className='w-8 h-8 text-white/60' />
            </div>
          </motion.div>

          <motion.div
            className='absolute bottom-40 left-24'
            animate={{
              y: [0, 15, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          >
            <div className='w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20'>
              <Star className='w-10 h-10 text-yellow-200/70' />
            </div>
          </motion.div>

          <motion.div
            className='absolute top-1/2 right-20'
            animate={{
              y: [0, -25, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          >
            <div className='w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20'>
              <Award className='w-7 h-7 text-emerald-200/70' />
            </div>
          </motion.div>

          {/* Medical pattern */}
          <div className='absolute inset-0'>
            {/* Pills Pattern */}
            <div
              className='absolute inset-0 opacity-[0.05]'
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='30' y='48' width='28' height='24' rx='12' fill='%23ffffff'/%3E%3Crect x='30' y='48' width='14' height='24' fill='%23ffffff' fill-opacity='0.5'/%3E%3Cpath d='M 75 35 L 85 45 M 80 30 L 90 40 M 85 35 L 95 45' stroke='%23ffffff' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='35' cy='85' r='3' fill='%23ffffff'/%3E%3Ccircle cx='45' cy='85' r='3' fill='%23ffffff'/%3E%3Ccircle cx='55' cy='85' r='3' fill='%23ffffff'/%3E%3Cline x1='40' y1='85' x2='50' y2='85' stroke='%23ffffff' stroke-width='1.5'/%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px',
              }}
            />

            {/* Animated grid dots */}
            <div
              className='absolute inset-0 opacity-[0.03] animate-float-pattern'
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1.5' fill='%23ffffff'/%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <motion.div
          className='relative z-10 flex flex-col justify-center px-16 py-16 w-full max-w-2xl mx-auto'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Heading */}
          <motion.div
            className='mb-12'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className='text-white text-5xl mb-6 leading-tight'>
              <motion.span
                className='block text-7xl font-black mb-3 tracking-widest bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  textShadow: '0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(147, 197, 253, 0.2)',
                }}
              >
                MEDISPACE
              </motion.span>
              <motion.span
                className='text-4xl block mb-3'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Sức khỏe trong tầm tay
              </motion.span>
            </h1>
            <motion.p
              className='text-blue-50/90 text-lg leading-relaxed'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Nền tảng mua thuốc trực tuyến hiện đại, kết nối bạn với
              <br />
              dược sĩ chuyên nghiệp 24/7 và các sản phẩm chăm sóc
              <br />
              sức khỏe chính hãng.
            </motion.p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className='grid grid-cols-2 gap-5'
            initial='hidden'
            animate='visible'
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.7,
                },
              },
            }}
          >
            {[
              {
                icon: Shield,
                title: 'An toàn & Bảo mật',
                description: 'Mã hóa tuyệt đối bảo vệ thông tin khách hàng',
                stat: '100%',
                statLabel: 'Bảo mật',
                gradient: 'from-[#0A2463]/30 via-[#1E40AF]/20 to-transparent',
                iconBg: 'bg-gradient-to-br from-[#BFDBFE]/40 to-[#1E40AF]/40',
                glowColor: 'shadow-blue-400/30',
                borderGlow: 'group-hover:shadow-[0_0_30px_rgba(96,165,250,0.4)]',
              },
              {
                icon: Clock,
                title: 'Giao hàng nhanh',
                description: 'Express 2-4h nội thành, 24-48h toàn quốc',
                stat: '2-4h',
                statLabel: 'Giao hàng',
                gradient: 'from-[#BFDBFE]/30 via-[#1E40AF]/20 to-transparent',
                iconBg: 'bg-gradient-to-br from-[#BFDBFE]/40 to-[#1E40AF]/40',
                glowColor: 'shadow-[#BFDBFE]/30',
                borderGlow: 'group-hover:shadow-[0_0_30px_rgba(191,219,254,0.45)]',
              },
              {
                icon: CheckCircle2,
                title: 'Chính hãng 100%',
                description: 'Nguồn gốc rõ ràng, tem chống hàng giả',
                stat: '5000+',
                statLabel: 'Sản phẩm',
                gradient: 'from-emerald-500/30 via-green-500/20 to-transparent',
                iconBg: 'bg-gradient-to-br from-emerald-400/40 to-green-500/40',
                glowColor: 'shadow-emerald-400/30',
                borderGlow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]',
              },
              {
                icon: Heart,
                title: 'Tư vấn tận tâm',
                description: 'Dược sĩ chuyên môn cao hỗ trợ 24/7',
                stat: '24/7',
                statLabel: 'Hỗ trợ',
                gradient: 'from-[#BFDBFE]/30 via-[#1E40AF]/20 to-transparent',
                iconBg: 'bg-gradient-to-br from-[#BFDBFE]/40 to-[#1E40AF]/40',
                glowColor: 'shadow-pink-400/30',
                borderGlow: 'group-hover:shadow-[0_0_30px_rgba(244,114,182,0.4)]',
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 100,
                        damping: 15,
                      },
                    },
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                  className='group relative'
                >
                  {/* Gradient background overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Glow effect */}
                  <div
                    className={`absolute inset-0 ${feature.glowColor} shadow-2xl rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`}
                  />

                  {/* Card content */}
                  <div
                    className={`relative bg-white/15 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 overflow-hidden ${feature.borderGlow}`}
                  >
                    {/* Shimmer effect on hover */}
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />

                    {/* Top stat badge */}
                    <div className='absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30'>
                      <div className='text-white text-xs'>{feature.stat}</div>
                    </div>

                    <motion.div
                      className={`w-16 h-16 rounded-2xl ${feature.iconBg} backdrop-blur-sm flex items-center justify-center mb-4 shadow-xl border border-white/30`}
                      whileHover={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: 1.15,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className='w-8 h-8 text-white drop-shadow-2xl' />
                    </motion.div>

                    <h3 className='text-white mb-2 text-lg group-hover:text-blue-50 transition-colors duration-300'>
                      {feature.title}
                    </h3>
                    <p className='text-blue-50/80 text-sm leading-relaxed group-hover:text-white transition-colors duration-300'>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Form (45%) */}
      <div className='flex-1 lg:w-[45%] bg-white overflow-y-auto'>
        {/* Mobile Home Button */}
        <div className='sm:hidden pt-6 px-6'>
          <Link to='/'>
            <Button
              variant='outline'
              size='sm'
              className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] !text-white border-0 shadow-sm transition-transform transform hover:-translate-y-1 hover:shadow-lg hover:from-[#071A49] hover:to-[#0A2463] hover:!text-white focus:outline-none focus-visible:!text-white [&_svg]:!text-white'
            >
              <Home className='w-4 h-4 mr-2' />
              Trang chủ
            </Button>
          </Link>
        </div>

        {/* Form Container */}
        <div className='flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-16 py-12 lg:py-16'>
          {/* Logo - Desktop & Mobile */}
          <div className='mb-6 lg:mb-8 animate-fade-in'>
            <img src={logoImage} alt='MediSpace' className='h-16 sm:h-18' />
          </div>

          {/* Form Content with animation */}
          <div className='w-full max-w-lg animate-slide-in-up'>{children}</div>
        </div>

        {/* Mobile Trust Badges */}
        <div className='lg:hidden py-6 px-6 border-t border-gray-100'>
          <div className='flex items-center justify-center gap-6 text-xs text-gray-500'>
            <div className='flex items-center gap-1.5'>
              <Shield className='w-4 h-4 text-[#1E40AF]' />
              <span>Bảo mật</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-[#1E40AF]' />
              <span>Tin cậy</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Heart className='w-4 h-4 text-[#1E40AF]' />
              <span>Tận tâm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
