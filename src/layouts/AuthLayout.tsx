import { Outlet, useLocation, Link } from 'react-router'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Package } from 'lucide-react'

import MedicalBackground from '~/components/ui/MedicalBackground'
import { Button } from '~/components/ui/button'

import '../style/MedicalBackground.css'
import '../style/AuthLayout.css'

export default function AuthLayout() {
  const location = useLocation()

  // Debug log
  console.log('🚀 AuthLayout rendered for:', location.pathname)

  // Analytics tracking cho auth flows
  useEffect(() => {
    // Track page views for authentication pages
    console.log(`Auth page visited: ${location.pathname}`)
    // TODO: Add actual analytics tracking (Google Analytics, etc.)
  }, [location.pathname])

  // SEO meta tags cho auth pages
  useEffect(() => {
    const getPageTitle = () => {
      switch (location.pathname) {
        case '/auth/login':
          return 'Đăng nhập - MEDISPACE'
        case '/auth/register':
          return 'Đăng ký - MEDISPACE'
        case '/auth/forgot-password':
          return 'Quên mật khẩu - MEDISPACE'
        default:
          return 'MEDISPACE - Nhà thuốc trực tuyến'
      }
    }

    document.title = getPageTitle()

    // TODO: Add meta descriptions, og tags, etc.
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Đăng nhập vào MEDISPACE để mua thuốc trực tuyến an toàn, tiện lợi')
    }
  }, [location.pathname])

  return (
    <div className='min-h-screen relative overflow-hidden'>
      {/* Medical themed background for all auth pages */}
      <MedicalBackground />

      {/* Header with Home Button and MEDISPACE Logo */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='absolute top-0 left-0 right-0 z-40 p-6'
      >
        <div className='flex items-center justify-between'>
          {/* Home Button */}
          <Link to='/'>
            <Button
              variant='ghost'
              size='sm'
              className='bg-white/25 backdrop-blur-sm border border-white/50 text-[#0066CC] font-semibold shadow-lg hover:bg-white/40 hover:border-white/60 hover:text-[#003d7a] transition-all duration-300 group'
              style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
            >
              <ArrowLeft className='w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300' />
              Về trang chủ
            </Button>
          </Link>

          {/* MEDISPACE Logo */}
          <Link to='/' className='flex items-center space-x-2 group'>
            <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
              <Package className='h-4 w-4 text-white' />
            </div>
            <span className='text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
              MEDISPACE
            </span>
          </Link>
        </div>
      </motion.header>

      {/* Page Transition Animation */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className='relative z-30 pt-20'
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
