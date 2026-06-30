import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  ArrowRight,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Stethoscope,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  LogOut,
  User,
  Shield,
  TrendingUp,
  Tag,
  MessageSquare,
  MessageCircle,
  Star,
  Building2,
  RotateCcw,
  Gift,
  Sparkles,
  Archive,
  Video,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { Sheet, SheetContent } from '../ui/sheet'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getFullName, getUserInitials } from '~/utils/lib'
import type { BreadcrumbItem } from '../shared/UniversalBreadcrumb'
import { getDashboardStats } from '../../services/adminService'
import { NotificationDropdown } from '../shared/NotificationDropdown'
import faviconLogo from '../../assets/MEDISPACE_Logo_favicon.png'
import { UserRole } from '~/types/user'
import { toast } from 'sonner'

interface AdminLayoutProps {
  children: ReactNode
  breadcrumbItems?: BreadcrumbItem[]
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: 'default' | 'destructive' | 'success' | 'warning'
}

const navigationItems: NavItem[] = [
  {
    label: 'Tổng quan',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Quản lý người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Quản lý sản phẩm',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: 'Quản lý tồn kho',
    href: '/admin/inventory',
    icon: Archive,
  },
  {
    label: 'Quản lý danh mục',
    href: '/admin/categories',
    icon: Tag,
  },
  {
    label: 'Quản lý thương hiệu',
    href: '/admin/brands',
    icon: Building2,
  },
  {
    label: 'Quản lý đơn hàng',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Quản lý đổi/trả',
    href: '/admin/returns',
    icon: RotateCcw,
  },
  {
    label: 'Quản lý đơn thuốc',
    href: '/admin/prescriptions',
    icon: FileText,
  },
  {
    label: 'Quản lý dược sĩ',
    href: '/admin/pharmacists',
    icon: Stethoscope,
  },
  {
    label: 'Quản lý Chat',
    href: '/admin/chat',
    icon: MessageCircle,
  },
  {
    label: 'Kiểm duyệt cộng đồng',
    href: '/admin/moderation',
    icon: Shield,
  },
  {
    label: 'Quản lý cộng đồng',
    href: '/admin/community',
    icon: Users,
  },
  {
    label: 'Hội thảo cộng đồng',
    href: '/admin/video-events',
    icon: Video,
  },
  {
    label: 'Quản lý nội dung',
    href: '/admin/content',
    icon: MessageSquare,
  },
  {
    label: 'Quản lý bài viết',
    href: '/admin/articles',
    icon: FileText,
  },
  {
    label: 'Quản lý đánh giá',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    label: 'Coupon & Khuyến mãi',
    href: '/admin/coupons',
    icon: Gift,
  },
  {
    label: 'Loyalty & Điểm thưởng',
    href: '/admin/loyalty',
    icon: Sparkles,
  },
  {
    label: 'Báo cáo & Phân tích',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    label: 'Cài đặt hệ thống',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminSearchQuery, setAdminSearchQuery] = useState('')
  const [adminSearchOpen, setAdminSearchOpen] = useState(false)
  const isAdmin = user?.role === UserRole.Admin

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: isAdmin ? 30000 : false, // Refetch every 30 seconds for admins
    staleTime: 20000,
    enabled: isAdmin,
  })

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tiếp tục')
      navigate('/login', { replace: true })
      return
    }
    if (!isAdmin) {
      toast.error('Bạn không có quyền truy cập trang này')
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isAdmin, loading, navigate])

  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className='flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-[#1E40AF] border-t-transparent' />
      </div>
    )
  }

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
  }

  const adminSearchResults = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(adminSearchQuery.trim().toLowerCase()),
  )

  const goToAdminSearchResult = (href?: string) => {
    const target = href || adminSearchResults[0]?.href
    if (!target) return
    setAdminSearchOpen(false)
    setAdminSearchQuery('')
    navigate(target)
  }



  const SidebarContent = () => (
    <div className='flex flex-col h-full'>
      {/* Logo Section */}
      <div className='p-6 border-b border-[#E8EDF5] flex-shrink-0'>
        <Link to='/admin/dashboard' className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg flex items-center justify-center shadow-lg'>
            <img src={faviconLogo} alt='MEDISPACE' className='w-8 h-8' />
          </div>
          <div className='flex-1'>
            <h2 className='font-semibold text-gray-900'>MEDISPACE</h2>
            <p className='text-xs text-[#0A2463]'>Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <div className='flex-1 overflow-y-auto min-h-0'>
        <div className='px-3 py-4'>
          <nav className='space-y-1'>
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              // Get dynamic badge from API data
              let badge: string | number | undefined
              let badgeVariant: 'default' | 'destructive' | 'success' | 'warning' = 'default'

              if (dashboardStats) {
                if (item.href === '/admin/orders' && dashboardStats.orders.pending > 0) {
                  badge = dashboardStats.orders.pending
                  badgeVariant = 'destructive'
                } else if (item.href === '/admin/prescriptions' && dashboardStats.prescriptions.pending > 0) {
                  badge = dashboardStats.prescriptions.pending
                  badgeVariant = 'warning'
                }
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-[#0A2463]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#0A2463]'}`} />
                  <span className='flex-1 text-sm font-medium'>{item.label}</span>
                  {badge && (
                    <Badge
                      className={`text-xs ${
                        badgeVariant === 'destructive'
                          ? 'bg-red-500'
                          : badgeVariant === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-[#1E40AF]'
                      } text-white`}
                    >
                      {badge}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId='activeIndicator'
                      className='absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full'
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

    </div>
  )

  return (
    <div className='flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden'>
      {/* Desktop Sidebar */}
      <AnimatePresence mode='wait'>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='hidden lg:flex w-72 bg-white/95 backdrop-blur-lg flex-col shadow-xl border-r border-[#E8EDF5]'
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side='left' className='w-72 p-0 bg-white border-[#E8EDF5]'>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Top Header */}
        <header className='relative z-50 h-16 bg-white/80 backdrop-blur-lg border-b border-[#E8EDF5] flex items-center justify-between px-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            {/* Toggle Sidebar Button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='hidden lg:flex text-gray-600 hover:text-[#0A2463]'
            >
              {sidebarOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setMobileMenuOpen(true)}
              className='lg:hidden text-gray-600 hover:text-[#0A2463]'
            >
              <Menu className='w-5 h-5' />
            </Button>

            {/* Search Bar */}
            <div className='relative hidden md:block w-[360px]'>
              <div className='flex h-10 items-center gap-2 rounded-lg border border-[#D7E3F5] bg-white px-3 shadow-sm transition-colors focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#BFDBFE]/60'>
                <Search className='h-4 w-4 shrink-0 text-[#1E40AF]' />
                <Input
                  type='search'
                  value={adminSearchQuery}
                  onChange={(event) => {
                    setAdminSearchQuery(event.target.value)
                    setAdminSearchOpen(true)
                  }}
                  onFocus={() => setAdminSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') goToAdminSearchResult()
                    if (event.key === 'Escape') setAdminSearchOpen(false)
                  }}
                  placeholder='Tìm nhanh module quản trị...'
                  className='h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>

              {adminSearchOpen && adminSearchQuery.trim().length > 0 && (
                <div className='absolute left-0 top-12 z-[60] w-full overflow-hidden rounded-lg border border-[#E8EDF5] bg-white p-2 shadow-xl'>
                  {adminSearchResults.length > 0 ? (
                    adminSearchResults.slice(0, 6).map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.href}
                          type='button'
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => goToAdminSearchResult(item.href)}
                          className='flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#F0F6FF]'
                        >
                          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-[#E8EDF5]'>
                            <Icon className='h-4 w-4 text-[#1E40AF]' />
                          </div>
                          <span className='min-w-0 flex-1 truncate text-sm font-medium text-gray-900'>{item.label}</span>
                          <ArrowRight className='h-4 w-4 text-gray-400' />
                        </button>
                      )
                    })
                  ) : (
                    <p className='px-2 py-4 text-center text-sm text-gray-500'>Không có module phù hợp</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* Quick Stats (Desktop) */}
            <div className='hidden xl:flex items-center gap-2 mr-2'>
              <div className='flex h-10 items-center gap-2 rounded-lg border border-[#D7E3F5] bg-white px-3'>
                <TrendingUp className='w-4 h-4 text-[#0A2463]' />
                <div className='leading-tight'>
                  <p className='text-[11px] text-gray-600'>Doanh thu</p>
                  <p className='text-sm font-bold text-[#0A2463]'>
                    {dashboardStats?.revenue.month ? `₫${(dashboardStats.revenue.month / 1000000).toFixed(1)}M` : '...'}
                  </p>
                </div>
              </div>
              <div className='flex h-10 items-center gap-2 rounded-lg border border-[#D7E3F5] bg-white px-3'>
                <ShoppingCart className='w-4 h-4 text-[#1E40AF]' />
                <div className='leading-tight'>
                  <p className='text-[11px] text-gray-600'>Đơn hàng</p>
                  <p className='text-sm font-bold text-[#1E40AF]'>
                    {dashboardStats?.orders.todayCount.toLocaleString() || '...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications – rich dropdown with type icons, mark-all-read, navigation */}
            <NotificationDropdown viewAllUrl='/admin/notifications' />
            {/* User Menu - Always visible for quick access to logout */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    <Avatar className='w-8 h-8'>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className='bg-[#0A2463] text-white text-xs'>
                        {getUserInitials(user) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48 z-50 bg-white shadow-lg border border-[#E8EDF5]'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{getFullName(user) || 'Admin User'}</span>
                      <span className='text-xs text-gray-500'>Administrator</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <User className='w-4 h-4 mr-2' />
                    Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className='w-4 h-4 mr-2' />
                    Cài đặt hệ thống
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className='text-red-600'>
                    <LogOut className='w-4 h-4 mr-2' />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='flex-1 overflow-auto'>
          {/* Breadcrumb removed - Admin pages don't need breadcrumbs (Option 3: Layer 2) */}

          <div className='p-6'>
            {/* Admin Badge */}
            {/* <div className='mb-6'>
              <Badge className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white px-3 py-1 shadow-lg'>
                <Shield className='w-3 h-3 mr-1' />
                Administrator Access
              </Badge>
            </div> */}

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
