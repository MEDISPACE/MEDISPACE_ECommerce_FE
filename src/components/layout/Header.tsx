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
  X,
  BadgeCheck,
  Droplets,
  Leaf,
  MonitorCheck,
  Pill,
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
import medispaceLogo from '../../assets/MEDISPACE_Logo_Final.svg'
import { NotificationDropdown } from '../shared/NotificationDropdown'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '../ui/sheet'

const getCategoryIcon = (category: Category) => {
  const slug = category.slug?.toLowerCase() ?? ''
  const normalizedName =
    category.name
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() ?? ''

  if (slug.includes('cham-soc-ca-nhan') || normalizedName.includes('cham soc ca nhan')) return User
  if (slug.includes('duoc-my-pham') || normalizedName.includes('duoc my pham')) return Droplets
  if (slug.includes('thiet-bi-y-te') || normalizedName.includes('thiet bi y te')) return MonitorCheck
  if (slug === 'thuoc' || normalizedName === 'thuoc') return Pill
  if (slug.includes('thuc-pham-chuc-nang') || normalizedName.includes('thuc pham chuc nang')) return Leaf

  return Package
}

export function Header() {
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { user, isAuthenticated, logout } = useAuth()
  const { getCartItemsCount } = useCart()
  const cartCount = getCartItemsCount()
  const [activeMegaMenuCategory, setActiveMegaMenuCategory] = useState<Category | null>(null)
  const [isMegaMenuVisible, setIsMegaMenuVisible] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mainCategories = categories.filter((cat) => cat.level === 0)

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
    <header className='sticky top-0 z-[100] border-b border-[#E8EDF5] bg-white'>
      {/* Top bar */}
      <div className='hidden bg-[#0A2463] py-2 text-white md:block'>
        <div className='max-w-7xl mx-auto px-4 flex justify-between items-center text-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1'>
              <Phone className='w-4 h-4' />
              <span className='font-semibold'>Hotline: 1800 6928</span>
            </div>
            <div className='flex items-center gap-1'>
              <MapPin className='w-4 h-4' />
              <span>Tìm nhà thuốc gần bạn</span>
            </div>
          </div>
          <div className='hidden md:flex items-center gap-4'>
            <span className='inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-semibold'>
              <BadgeCheck className='h-3.5 w-3.5 text-emerald-300' />
              GPP Certified
            </span>
            <span>Miễn phí giao hàng từ 300.000đ</span>
            <span>•</span>
            <span>Giao hàng nhanh 2h</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className='max-w-7xl mx-auto px-4 py-3 md:py-4'>
        <div className='flex items-center justify-between gap-2'>
          <Link to='/' className='flex items-center group flex-shrink-0'>
            <img
              src={medispaceLogo}
              alt='MEDISPACE - Sức khỏe trong tầm tay'
              className='h-8 md:h-12 w-auto object-contain transition-transform group-hover:scale-105'
            />
          </Link>

          {/* Enhanced Search */}
          <EnhancedSearchBar onSearch={handleSearch} className='hidden md:block md:max-w-[56%]' />

          {/* Actions */}
          <div className='flex items-center gap-2 md:gap-4 flex-shrink-0'>
            {/* Cart */}
            <Link to='/cart' className='relative'>
              <Button variant='ghost' size='sm' className='flex items-center gap-2 text-[#1C2B4A] hover:!bg-[#F0F6FF]'>
                <ShoppingCart className='w-5 h-5' />
                <span className='hidden md:inline'>Giỏ hàng</span>
                {cartCount > 0 && (
                  <Badge className='absolute -top-2 -right-2 bg-[#DC2626] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'>
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Notifications Bell – show only for customers */}
            {isAuthenticated && user?.role === UserRole.Customer && <NotificationDropdown />}

            {/* Account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='flex items-center gap-2 hover:bg-[#F0F6FF]'>
                    <Avatar className='h-6 w-6'>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className='bg-[#E8EDF5] text-[#1E40AF] text-xs'>
                        {user?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className='hidden md:inline text-sm'>
                      {user?.firstName} {user?.lastName}
                    </span>
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  sideOffset={10}
                  className='z-[1000] w-56 bg-white/95 backdrop-blur-lg border-[#E8EDF5]'
                >
                  <DropdownMenuLabel className='text-blue-900'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium truncate'>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className='text-xs text-[#1E40AF] truncate overflow-hidden text-ellipsis' title={user?.email}>
                        {user?.email}
                      </p>
                      <div className='text-xs text-gray-500 capitalize font-normal mt-1'>
                        {user?.role === UserRole.Admin
                          ? 'Quản trị viên'
                          : user?.role === UserRole.Pharmacist
                            ? 'Dược sĩ'
                            : 'Khách hàng'}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className='bg-[#E8EDF5]' />

                  {/* Role-specific dashboard links */}
                  {user?.role === UserRole.Admin && (
                    <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                      <Link to='/admin/dashboard' className='flex items-center gap-2'>
                        <Settings className='h-4 w-4' />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user?.role === UserRole.Pharmacist && (
                    <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                      <Link to='/pharmacist/dashboard' className='flex items-center gap-2'>
                        <Settings className='h-4 w-4' />
                        <span>Dược sĩ Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                    <Link to='/account' className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <span>Thông tin tài khoản</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                    <Link to='/account/orders' className='flex items-center gap-2'>
                      <Package className='h-4 w-4' />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                    <Link to='/account/prescriptions' className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      <span>Đơn thuốc</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                    <Link to='/account/wishlist' className='flex items-center gap-2'>
                      <Heart className='h-4 w-4' />
                      <span>Yêu thích</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className='cursor-pointer hover:!bg-[#F0F6FF]'>
                    <Link to='/account/notifications' className='flex items-center gap-2'>
                      <Settings className='h-4 w-4' />
                      <span>Cài đặt</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className='bg-[#E8EDF5]' />

                  <DropdownMenuItem
                    className='cursor-pointer text-red-600 hover:!bg-red-50 hover:!text-red-700'
                    onClick={() => logout()}
                  >
                    <LogOut className='h-4 w-4 mr-2' />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to='/login' className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' className='flex items-center gap-2 hover:!bg-[#F0F6FF]'>
                  <User className='w-5 h-5' />
                  <span className='hidden md:inline'>Đăng nhập</span>
                </Button>
              </Link>
            )}

            {/* Mobile menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='sm' className='md:hidden' aria-label='Mở menu điều hướng'>
                  <Menu className='w-5 h-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='w-[88vw] max-w-sm overflow-y-auto p-0'>
                <SheetHeader className='border-b border-[#E8EDF5] p-4'>
                  <div className='flex items-center justify-between pr-8'>
                    <SheetTitle className='text-blue-900'>Menu</SheetTitle>
                    <SheetClose asChild>
                      <Button variant='ghost' size='sm' aria-label='Đóng menu'>
                        <X className='h-4 w-4' />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className='space-y-5 p-4'>
                  <div className='grid gap-2'>
                    <SheetClose asChild>
                      <Link
                        to='/'
                        className='rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#F0F6FF]'
                      >
                        Trang chủ
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to='/products'
                        className='rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#F0F6FF]'
                      >
                        Sản phẩm
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to='/health'
                        className='rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#F0F6FF]'
                      >
                        Bệnh & Góc sức khỏe
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to='/community'
                        className='rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#F0F6FF]'
                      >
                        Cộng đồng
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to='/contact'
                        className='rounded-lg px-3 py-2 text-sm font-medium text-[#0A2463] hover:bg-[#F0F6FF]'
                      >
                        Tư vấn dược sĩ
                      </Link>
                    </SheetClose>
                  </div>

                  <div className='border-t border-[#E8EDF5] pt-4'>
                    <div className='mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Danh mục
                    </div>
                    <div className='grid gap-1'>
                      {mainCategories.map((category) => {
                        const CategoryIcon = getCategoryIcon(category)

                        return (
                          <SheetClose key={category._id} asChild>
                            <Link
                              to={`/categories/${category.slug}`}
                              className='flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F6FF] hover:text-[#0A2463]'
                            >
                              <span className='flex items-center gap-2'>
                                <span className='flex h-7 w-7 items-center justify-center rounded-full bg-[#F0F6FF] text-[#0A2463]'>
                                  <CategoryIcon className='h-4 w-4' />
                                </span>
                                <span>{category.name}</span>
                              </span>
                              <ChevronRight className='h-4 w-4 text-gray-400' />
                            </Link>
                          </SheetClose>
                        )
                      })}
                      <SheetClose asChild>
                        <Link
                          to='/categories'
                          className='rounded-lg px-3 py-2 text-sm font-medium text-[#0A2463] hover:bg-[#F0F6FF]'
                        >
                          Xem tất cả danh mục
                        </Link>
                      </SheetClose>
                    </div>
                  </div>

                  <div className='rounded-lg border border-[#E8EDF5] bg-[#F0F6FF] p-4 text-sm text-blue-900'>
                    <div className='font-semibold'>Cần tư vấn khẩn cấp?</div>
                    <a href='tel:18006928' className='mt-1 inline-flex items-center gap-2 font-bold text-[#0A2463]'>
                      <Phone className='h-4 w-4' />
                      1800 6928
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className='relative border-t border-[#E8EDF5]'>
        <div className='max-w-7xl mx-auto px-4'>
          <nav
            className='relative flex items-center gap-6 overflow-x-auto py-2 [scrollbar-width:none] lg:overflow-visible [&::-webkit-scrollbar]:hidden'
            onMouseLeave={handleNavigationMouseLeave}
          >
            {/* Mobile menu button */}
            <div className='lg:hidden'>
              <Link
                to='/categories'
                className='flex items-center px-3 py-2 text-[#0A2463] font-medium hover:text-[#1E40AF] transition-colors duration-200'
              >
                <Menu className='w-4 h-4 mr-2' />
                Danh mục
              </Link>
            </div>

            {/* Desktop Categories with unified mega menu - Only show main categories (level 0) */}
            <div className='hidden lg:flex items-center gap-4'>
              {mainCategories.map((category) => {
                const CategoryIcon = getCategoryIcon(category)

                return (
                  <div key={category._id} className='relative' onMouseEnter={() => handleCategoryHover(category)}>
                    <Link
                      to={`/categories/${category.slug}`}
                      className={`relative flex items-center gap-1.5 px-1 py-3 text-sm font-medium transition-colors duration-200 group ${
                        activeMegaMenuCategory?._id === category._id
                          ? 'text-[#0A2463]'
                          : 'text-[#1C2B4A] hover:text-[#0A2463]'
                      }`}
                      title={category.name}
                    >
                      <span className='flex h-6 w-6 items-center justify-center rounded-full bg-[#F0F6FF] text-[#0A2463] transition group-hover:bg-[#E8EDF5]'>
                        <CategoryIcon className='h-3.5 w-3.5' />
                      </span>
                      <span className='text-center leading-tight'>{category.name}</span>
                      <ChevronDown className='w-3 h-3 ml-1 opacity-60 flex-shrink-0' />
                      <span
                        className={`absolute bottom-0 left-0 h-0.5 bg-[#0A2463] transition-all duration-300 ${
                          activeMegaMenuCategory?._id === category._id ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      ></span>
                    </Link>
                  </div>
                )
              })}
            </div>

            <Link
              to='/health'
              className='relative flex shrink-0 items-center px-1 py-3 text-sm font-medium text-[#1C2B4A] hover:text-[#0A2463] transition-colors duration-200 group'
            >
              <span className='text-center leading-tight'>Bệnh & Góc sức khỏe</span>
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-[#0A2463] group-hover:w-full transition-all duration-300'></span>
            </Link>

            <Link
              to='/community'
              className='relative flex shrink-0 items-center px-1 py-3 text-sm font-medium text-[#1C2B4A] hover:text-[#0A2463] transition-colors duration-200 group'
            >
              <span className='text-center leading-tight'>Cộng đồng</span>
              <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-[#0A2463] group-hover:w-full transition-all duration-300'></span>
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

  // Lọc bỏ 'Trang chủ' để tránh lặp lại vì đã được render mặc định ở trên
  const displayItems = items.length > 0 && items[0].label === 'Trang chủ' ? items.slice(1) : items

  return (
    <div className='bg-blue-40 border-t border-gray-100'>
      <div className='max-w-7xl mx-auto px-4 py-3'>
        <nav className='flex items-center text-sm text-gray-600' aria-label='Breadcrumb'>
          <Link to='/' className='flex items-center gap-1 text-gray-500 hover:text-[#1E40AF] transition-colors'>
            <Home className='w-4 h-4' />
            <span>Trang chủ</span>
          </Link>
          {displayItems.length > 0 && <ChevronRight className='w-4 h-4 mx-2 text-gray-400' />}

          {displayItems.map((item, index) => (
            <div key={index} className='flex items-center'>
              {item.href ? (
                <Link
                  to={item.href}
                  className='text-gray-500 hover:text-[#1E40AF] transition-colors flex items-center gap-2'
                >
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className='text-gray-900 font-medium flex items-center gap-2'>
                  <span>{item.label}</span>
                </div>
              )}

              {index < displayItems.length - 1 && <ChevronRight className='w-4 h-4 mx-2 text-gray-400' />}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
