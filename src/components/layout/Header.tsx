import { useState } from 'react'
import {
  ShoppingCart,
  User,
  Menu,
  Phone,
  MapPin,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  FileText,
  Heart,
  Home,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Link, useNavigate, useLocation } from 'react-router'
import { UnifiedMegaMenu } from './UnifiedMegaMenu'
import { EnhancedSearchBar } from '../shared/EnhancedSearchBar'
import { useAuth } from '~/contexts/AuthContext'
import { useBreadcrumbContext } from '~/contexts/BreadcrumbContext'
import { UserRole } from '~/types/user'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ChevronRight } from 'lucide-react'
import { useCart } from '~/contexts/CartContext'
import { useCategories } from '~/hooks/product'
import type { Category } from '../../types/product'

export function Header() {
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { user, isAuthenticated, logout } = useAuth()
  const { getCartItemsCount } = useCart()
  const [activeMegaMenuCategory, setActiveMegaMenuCategory] = useState<Category | null>(null)
  const [isMegaMenuVisible, setIsMegaMenuVisible] = useState(false)

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleCategoryHover = (category: Category) => {
    setActiveMegaMenuCategory(category)
    setIsMegaMenuVisible(true)
  }

  const handleNavigationMouseLeave = () => {
    setIsMegaMenuVisible(false)
    setActiveMegaMenuCategory(null)
  }

  const handleMegaMenuClose = () => {
    setIsMegaMenuVisible(false)
    setActiveMegaMenuCategory(null)
  }
  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
      {/* Top bar */}
      <div className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-2'>
        <div className='max-w-7xl mx-auto px-4 flex justify-between items-center text-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1'>
              <Phone className='w-4 h-4' />
              <span>Hotline: 1800 6928</span>
            </div>
            <div className='flex items-center gap-1'>
              <MapPin className='w-4 h-4' />
              <span>Tìm nhà thuốc gần bạn</span>
            </div>
          </div>
          <div className='hidden md:flex items-center gap-4'>
            <span>Miễn phí giao hàng từ 300.000đ</span>
            <span>•</span>
            <span>Giao hàng nhanh 2h</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className='max-w-7xl mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          {/* Logo */}
          <Link to='/' className='flex items-center group'>
            <img
              src='/src/assets/MEDISPACE_Logo_Final.svg'
              alt='MEDISPACE - Sức khỏe trong tầm tay'
              className='h-8 md:h-12 w-auto object-contain transition-transform group-hover:scale-105'
            />
          </Link>

          {/* Enhanced Search */}
          <EnhancedSearchBar onSearch={handleSearch} />

          {/* Actions */}
          <div className='flex items-center gap-4'>
            {/* Cart */}
            <Link to='/cart' className='relative'>
              <Button variant='ghost' size='sm' className='flex items-center gap-2'>
                <ShoppingCart className='w-5 h-5' />
                <span className='hidden md:inline'>Giỏ hàng</span>
                <Badge className='absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>
                  {getCartItemsCount()}
                </Badge>
              </Button>
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='flex items-center gap-2 hover:bg-blue-50'>
                    <Avatar className='h-6 w-6'>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className='bg-blue-100 text-blue-600 text-xs'>
                        {user?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className='hidden md:inline text-sm'>
                      {user?.firstName} {user?.lastName}
                    </span>
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56 bg-white/95 backdrop-blur-lg border-blue-100'>
                  <DropdownMenuLabel className='text-blue-900'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium'>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className='text-xs text-blue-600'>{user?.email}</p>
                      <div className='text-xs text-gray-500 capitalize font-normal mt-1'>
                        {user?.role === UserRole.Admin
                          ? 'Quản trị viên'
                          : user?.role === UserRole.Pharmacist
                            ? 'Dược sĩ'
                            : 'Khách hàng'}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className='bg-blue-100' />

                  {/* Role-specific dashboard links */}
                  {user?.role === UserRole.Admin && (
                    <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                      <Link to='/admin/dashboard' className='flex items-center gap-2'>
                        <Settings className='h-4 w-4' />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user?.role === UserRole.Pharmacist && (
                    <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                      <Link to='/pharmacist/dashboard' className='flex items-center gap-2'>
                        <Settings className='h-4 w-4' />
                        <span>Dược sĩ Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                    <Link to='/account' className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <span>Thông tin tài khoản</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                    <Link to='/account/orders' className='flex items-center gap-2'>
                      <Package className='h-4 w-4' />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                    <Link to='/account/prescriptions' className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      <span>Đơn thuốc</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                    <Link to='/account/wishlist' className='flex items-center gap-2'>
                      <Heart className='h-4 w-4' />
                      <span>Yêu thích</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:bg-blue-50'>
                    <Link to='/account/notifications' className='flex items-center gap-2'>
                      <Settings className='h-4 w-4' />
                      <span>Cài đặt</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className='bg-blue-100' />

                  <DropdownMenuItem
                    className='cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700'
                    onClick={() => logout()}
                  >
                    <LogOut className='h-4 w-4 mr-2' />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to='/login' className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' className='flex items-center gap-2 hover:bg-blue-50'>
                  <User className='w-5 h-5' />
                  <span className='hidden md:inline'>Đăng nhập</span>
                </Button>
              </Link>
            )}

            {/* Mobile menu */}
            <Button variant='ghost' size='sm' className='md:hidden'>
              <Menu className='w-5 h-5' />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className='border-t border-gray-200 relative'>
        <div className='max-w-7xl mx-auto px-4'>
          <nav className='flex items-center gap-8 py-3 relative' onMouseLeave={handleNavigationMouseLeave}>
            {/* Mobile menu button */}
            <div className='lg:hidden'>
              <Link
                to='/categories'
                className='flex items-center px-3 py-2 text-primary-500 font-medium hover:text-primary-600 transition-colors duration-200'
              >
                <Menu className='w-4 h-4 mr-2' />
                Danh mục
              </Link>
            </div>

            {/* Desktop Categories with unified mega menu - Only show main categories (level 0) */}
            <div className='hidden lg:flex items-center gap-4'>
              {categories.filter((cat) => cat.level === 0).map((category) => (
                <div key={category._id} className='relative' onMouseEnter={() => handleCategoryHover(category)}>
                  <Link
                    to={`/categories/${category.slug}`}
                    className={`relative flex items-center px-1 py-3 text-sm font-medium transition-colors duration-200 group ${activeMegaMenuCategory?._id === category._id ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                      }`}
                    title={category.name}
                  >
                    <span className='text-center leading-tight'>{category.name}</span>
                    <ChevronDown className='w-3 h-3 ml-1 opacity-60 flex-shrink-0' />
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 ${activeMegaMenuCategory?._id === category._id ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                    ></span>
                  </Link>
                </div>
              ))}
            </div>

            <Link
              to='/health'
              className='relative px-2 py-3 text-gray-700 font-medium hover:text-blue-600 transition-colors duration-200 group'
            >
              Bệnh & Góc sức khỏe
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:w-full transition-all duration-300'></span>
            </Link>

            {/* Unified Mega Menu */}
            <UnifiedMegaMenu
              activeCategory={activeMegaMenuCategory}
              isVisible={isMegaMenuVisible}
              onClose={handleMegaMenuClose}
            />
          </nav>
        </div>
      </div>

      {/* Breadcrumb - Inside header for sticky behavior */}
      <HeaderBreadcrumb />
    </header>
  )
}

// Breadcrumb component that renders inside header
function HeaderBreadcrumb() {
  const { items } = useBreadcrumbContext()
  const location = useLocation()

  // Hide on admin/pharmacist routes
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/pharmacist')) {
    return null
  }

  // Hide if no items
  if (items.length === 0) return null

  return (
    <div className='bg-blue-50/50 border-t border-gray-100'>
      <div className='max-w-7xl mx-auto px-4 py-3'>
        <nav className='flex items-center text-sm text-gray-600' aria-label='Breadcrumb'>
          <Link to='/' className='flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors'>
            <Home className='w-4 h-4' />
            <span>Trang chủ</span>
          </Link>
          {items.length > 0 && <ChevronRight className='w-4 h-4 mx-2 text-gray-400' />}

          {items.map((item, index) => (
            <div key={index} className='flex items-center'>
              {item.href ? (
                <Link
                  to={item.href}
                  className='text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2'
                >
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className='text-gray-900 font-medium flex items-center gap-2'>
                  <span>{item.label}</span>
                </div>
              )}

              {index < items.length - 1 && <ChevronRight className='w-4 h-4 mx-2 text-gray-400' />}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
