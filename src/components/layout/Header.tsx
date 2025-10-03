import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import { LogIn, LogOut, User, ShoppingCart, Search, Menu, Heart, Package, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleLoginClick = () => {
    navigate('/auth/login')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchFocused(false)
    }
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setSearchFocused(true)
  }

  return (
    <header className='sticky top-0 z-50 w-full border-b border-white/20 bg-white/95 backdrop-blur-xl shadow-lg shadow-blue-500/5 supports-[backdrop-filter]:bg-white/80'>
      <div className='container mx-auto px-4'>
        {/* Top Row - Emergency & Quick Actions */}
        <div className='hidden lg:flex items-center justify-between py-2 border-b border-gray-100/50'>
          <div className='flex items-center gap-6 text-xs text-gray-600'>
            <div className='flex items-center gap-1'>
              <Package className='h-3 w-3 text-[#0066CC]' />
              <span>
                Tư vấn 24/7: <strong className='text-[#0066CC]'>1900-xxxx</strong>
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs h-7 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200'
            >
              📋 Upload đơn thuốc
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs h-7 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200'
            >
              🩺 Tư vấn trực tuyến
            </Button>
          </div>
        </div>

        {/* Main Header Row */}
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link to='/' className='flex items-center space-x-3 group'>
            <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#4A90E2] flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105'>
              <Package className='h-5 w-5 text-white' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xl font-bold bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
                MEDISPACE
              </span>
              <span className='text-xs text-gray-500 -mt-1'>Nhà thuốc trực tuyến</span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className='hidden lg:flex items-center space-x-8'>
            <Link
              to='/'
              className='text-sm font-medium text-gray-700 hover:text-[#0066CC] transition-all duration-200 relative group'
            >
              Trang chủ
              <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#0066CC] to-[#4A90E2] transition-all duration-200 group-hover:w-full'></span>
            </Link>
            <Link
              to='/products'
              className='text-sm font-medium text-gray-700 hover:text-[#0066CC] transition-all duration-200 relative group'
            >
              Sản phẩm
              <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#0066CC] to-[#4A90E2] transition-all duration-200 group-hover:w-full'></span>
            </Link>
            <Link
              to='/categories'
              className='text-sm font-medium text-gray-700 hover:text-[#0066CC] transition-all duration-200 relative group'
            >
              Danh mục thuốc
              <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#0066CC] to-[#4A90E2] transition-all duration-200 group-hover:w-full'></span>
            </Link>
            <Link
              to='/consultation'
              className='text-sm font-medium text-amber-600 hover:text-amber-700 transition-all duration-200 relative group'
            >
              💊 Tư vấn thuốc
              <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200 group-hover:w-full'></span>
            </Link>
          </nav>

          {/* Enhanced Search Bar - Desktop */}
          <div className='hidden md:flex flex-1 max-w-lg mx-8'>
            <form onSubmit={handleSearchSubmit} className='relative w-full group'>
              <div
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                  searchFocused ? 'text-[#0066CC] scale-110' : 'text-gray-400'
                }`}
              >
                <Search className='h-4 w-4' />
              </div>
              <input
                type='text'
                placeholder='Tìm thuốc theo tên hoặc hoạt chất...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full pl-12 pr-12 py-3 bg-white/90 backdrop-blur-sm border-2 rounded-2xl shadow-lg transition-all duration-300 focus:outline-none ${
                  searchFocused
                    ? 'border-[#0066CC] shadow-xl shadow-[#0066CC]/20 bg-white scale-[1.02]'
                    : 'border-gray-200/50 hover:border-gray-300/70 shadow-gray-200/20'
                } placeholder:text-gray-400 text-sm`}
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={handleSearchClear}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
              {searchFocused && (
                <div className='absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50'>
                  <div className='p-3 text-xs text-gray-500 border-b border-gray-100'>
                    <div className='flex flex-wrap gap-2'>
                      <span className='bg-blue-50 text-blue-600 px-2 py-1 rounded-lg'>Paracetamol</span>
                      <span className='bg-blue-50 text-blue-600 px-2 py-1 rounded-lg'>Vitamin C</span>
                      <span className='bg-blue-50 text-blue-600 px-2 py-1 rounded-lg'>Thuốc ho</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Enhanced User Actions */}
          <div className='flex items-center space-x-1'>
            {/* Search - Mobile */}
            <Button
              variant='ghost'
              size='sm'
              className='md:hidden p-2 hover:bg-blue-50 hover:text-[#0066CC] transition-all duration-200'
            >
              <Search className='h-4 w-4' />
            </Button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Button
                variant='ghost'
                size='sm'
                className='relative p-2 hover:bg-red-50 hover:text-red-600 transition-all duration-200'
              >
                <Heart className='h-4 w-4' />
                <Badge
                  variant='destructive'
                  className='absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-red-600 border-0'
                >
                  3
                </Badge>
              </Button>
            )}

            {/* Enhanced Cart */}
            <Button
              variant='ghost'
              size='sm'
              className='relative p-2 hover:bg-green-50 hover:text-green-600 transition-all duration-200 group'
            >
              <ShoppingCart className='h-4 w-4' />
              <Badge
                variant='destructive'
                className='absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-green-500 to-green-600 border-0 group-hover:scale-110 transition-transform duration-200'
              >
                2
              </Badge>
            </Button>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className='flex items-center space-x-2 ml-2'>
                {/* User Menu */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='hidden md:flex items-center space-x-2 px-3 hover:bg-blue-50 hover:text-[#0066CC] transition-all duration-200'
                >
                  <User className='h-4 w-4' />
                  <span className='text-sm'>{user ? `${user.firstName} ${user.lastName}` : 'Tài khoản'}</span>
                </Button>

                {/* Logout */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleLogout}
                  className='flex items-center space-x-2 border-gray-200/50 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200'
                >
                  <LogOut className='h-4 w-4' />
                  <span className='hidden sm:inline'>Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-2 ml-2'>
                {/* Login Button */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleLoginClick}
                  className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm border-gray-200/50 hover:border-[#0066CC]/50 hover:bg-blue-50 hover:text-[#0066CC] transition-all duration-200'
                >
                  <LogIn className='h-4 w-4' />
                  <span>Đăng nhập</span>
                </Button>

                {/* Register Button */}
                <Button
                  size='sm'
                  onClick={() => navigate('/auth/register')}
                  className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105 backdrop-blur-sm'
                >
                  <span>Đăng ký</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Button variant='ghost' size='sm' className='md:hidden p-2 hover:bg-gray-50 transition-all duration-200'>
              <Menu className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Search */}
        <div className='md:hidden pb-4'>
          <form onSubmit={handleSearchSubmit} className='relative'>
            <div
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                searchFocused ? 'text-[#0066CC] scale-110' : 'text-gray-400'
              }`}
            >
              <Search className='h-4 w-4' />
            </div>
            <input
              type='text'
              placeholder='Tìm thuốc theo tên hoặc hoạt chất...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full pl-12 pr-12 py-3 bg-white/90 backdrop-blur-sm border-2 rounded-2xl shadow-lg transition-all duration-300 focus:outline-none ${
                searchFocused
                  ? 'border-[#0066CC] shadow-xl shadow-[#0066CC]/20 bg-white'
                  : 'border-gray-200/50 hover:border-gray-300/70'
              } placeholder:text-gray-400 text-sm`}
            />
            {searchQuery && (
              <button
                type='button'
                onClick={handleSearchClear}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </form>

          {/* Mobile Quick Actions */}
          <div className='flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100/50'>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs h-8 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200'
            >
              📋 Upload đơn
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200'
            >
              🩺 Tư vấn
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200'
            >
              🚨 Cấp cứu
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
