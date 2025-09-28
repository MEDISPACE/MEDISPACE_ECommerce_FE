import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import { LogIn, LogOut, User, ShoppingCart, Search, Menu, Heart, Package } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleLoginClick = () => {
    navigate('/auth/login')
  }

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
      <div className='container mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link to='/' className='flex items-center space-x-2'>
            <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center'>
              <Package className='h-4 w-4 text-white' />
            </div>
            <span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'>
              MEDISPACE
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className='hidden md:flex items-center space-x-6'>
            <Link to='/' className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'>
              Trang chủ
            </Link>
            <Link to='/products' className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'>
              Sản phẩm
            </Link>
            <Link to='/categories' className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'>
              Danh mục
            </Link>
            <Link to='/about' className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'>
              Về chúng tôi
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className='hidden md:flex flex-1 max-w-md mx-8'>
            <div className='relative w-full'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Tìm kiếm thuốc, sản phẩm y tế...'
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* User Actions */}
          <div className='flex items-center space-x-2'>
            {/* Search - Mobile */}
            <Button variant='ghost' size='sm' className='md:hidden'>
              <Search className='h-4 w-4' />
            </Button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Button variant='ghost' size='sm' className='relative'>
                <Heart className='h-4 w-4' />
                <Badge
                  variant='destructive'
                  className='absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs'
                >
                  3
                </Badge>
              </Button>
            )}

            {/* Cart */}
            <Button variant='ghost' size='sm' className='relative'>
              <ShoppingCart className='h-4 w-4' />
              <Badge
                variant='destructive'
                className='absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs'
              >
                2
              </Badge>
            </Button>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className='flex items-center space-x-2'>
                {/* User Menu */}
                <Button variant='ghost' size='sm' className='hidden md:flex items-center space-x-2'>
                  <User className='h-4 w-4' />
                  <span className='text-sm'>{user?.name || 'Tài khoản'}</span>
                </Button>

                {/* Logout */}
                <Button variant='outline' size='sm' onClick={handleLogout} className='flex items-center space-x-2'>
                  <LogOut className='h-4 w-4' />
                  <span className='hidden sm:inline'>Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-2'>
                {/* Login Button */}
                <Button variant='outline' size='sm' onClick={handleLoginClick} className='flex items-center space-x-2'>
                  <LogIn className='h-4 w-4' />
                  <span>Đăng nhập</span>
                </Button>

                {/* Register Button */}
                <Button
                  size='sm'
                  onClick={() => navigate('/auth/register')}
                  className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600'
                >
                  <span>Đăng ký</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Button variant='ghost' size='sm' className='md:hidden'>
              <Menu className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className='md:hidden pb-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Tìm kiếm thuốc, sản phẩm y tế...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
        </div>
      </div>
    </header>
  )
}
