import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Stethoscope,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Shield,
  TrendingUp,
  Tag,
  MessageSquare,
  Star,
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
import { notificationService } from '../../services/notificationService'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

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
    label: 'Quản lý danh mục',
    href: '/admin/categories',
    icon: Tag,
  },
  {
    label: 'Quản lý đơn hàng',
    href: '/admin/orders',
    icon: ShoppingCart,
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
    label: 'Quản lý nội dung',
    href: '/admin/content',
    icon: MessageSquare,
  },
  {
    label: 'Quản lý đánh giá',
    href: '/admin/reviews',
    icon: Star,
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
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000,
  })

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  })

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Format notification time
  const formatNotificationTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: vi })
    } catch {
      return timestamp
    }
  }

  // Get unread notification count
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  const SidebarContent = () => (
    <div className='flex flex-col h-full'>
      {/* Logo Section */}
      <div className='p-6 border-b border-blue-100 flex-shrink-0'>
        <Link to='/admin/dashboard' className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg flex items-center justify-center shadow-lg'>
            <img src='/src/assets/MEDISPACE_Logo_favicon.png' alt='MEDISPACE' className='w-8 h-8' />
          </div>
          <div className='flex-1'>
            <h2 className='font-semibold text-gray-900'>MEDISPACE</h2>
            <p className='text-xs text-[#0066CC]'>Admin Panel</p>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${isActive
                    ? 'bg-gradient-to-r from-[#0066CC] to-[#4A90E2] text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-[#0066CC]'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#0066CC]'}`} />
                  <span className='flex-1 text-sm font-medium'>{item.label}</span>
                  {badge && (
                    <Badge
                      className={`text-xs ${badgeVariant === 'destructive'
                        ? 'bg-red-500'
                        : badgeVariant === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
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

      {/* Quick Stats - Fixed at bottom */}
      <div className='px-6 py-4 border-t border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0'>
        <p className='text-xs text-gray-600 mb-3'>Hệ thống</p>
        <div className='grid grid-cols-2 gap-3'>
          <div className='text-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm'>
            <p className='text-xs text-gray-600'>Users</p>
            <p className='text-lg font-semibold text-[#0066CC]'>
              {dashboardStats?.users.total.toLocaleString() || '...'}
            </p>
          </div>
          <div className='text-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm'>
            <p className='text-xs text-gray-600'>Orders</p>
            <p className='text-lg font-semibold text-[#4A90E2]'>
              {dashboardStats?.orders.todayCount.toLocaleString() || '...'}
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Section - Fixed at bottom */}
      <div className='p-4 border-t border-blue-100 flex-shrink-0'>
        <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg'>
          <Avatar className='w-10 h-10 border-2 border-[#0066CC]'>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className='bg-[#0066CC] text-white'>{getUserInitials(user) || 'A'}</AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-gray-900 truncate'>{getFullName(user) || 'Admin User'}</p>
            <p className='text-xs text-[#0066CC]'>Administrator</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-[#0066CC]'>
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48 z-50 bg-white shadow-lg border border-blue-100'>
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
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
            className='hidden lg:flex w-72 bg-white/95 backdrop-blur-lg flex-col shadow-xl border-r border-blue-100'
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side='left' className='w-72 p-0 bg-white border-blue-100'>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Top Header */}
        <header className='h-16 bg-white/80 backdrop-blur-lg border-b border-blue-100 flex items-center justify-between px-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            {/* Toggle Sidebar Button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='hidden lg:flex text-gray-600 hover:text-[#0066CC]'
            >
              {sidebarOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setMobileMenuOpen(true)}
              className='lg:hidden text-gray-600 hover:text-[#0066CC]'
            >
              <Menu className='w-5 h-5' />
            </Button>

            {/* Search Bar */}
            <div className='hidden md:flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 w-80 border border-blue-200'>
              <Search className='w-4 h-4 text-[#4A90E2]' />
              <Input
                type='search'
                placeholder='Tìm kiếm...'
                className='bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm'
              />
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* Quick Stats (Desktop) */}
            <div className='hidden xl:flex items-center gap-4 mr-4'>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg'>
                <TrendingUp className='w-4 h-4 text-[#0066CC]' />
                <div>
                  <p className='text-xs text-gray-600'>Doanh thu</p>
                  <p className='text-sm font-semibold text-[#0066CC]'>
                    {dashboardStats?.revenue.month
                      ? `₫${(dashboardStats.revenue.month / 1000000).toFixed(1)}M`
                      : '...'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg'>
                <ShoppingCart className='w-4 h-4 text-[#4A90E2]' />
                <div>
                  <p className='text-xs text-gray-600'>Đơn hàng</p>
                  <p className='text-sm font-semibold text-[#4A90E2]'>
                    {dashboardStats?.orders.todayCount.toLocaleString() || '...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='relative'>
                  <Bell className='w-5 h-5 text-gray-600' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-80 z-50 bg-white shadow-lg border border-blue-100'>
                <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className='max-h-96 overflow-y-auto'>
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification: any) => (
                      <DropdownMenuItem key={notification._id || notification.id} className='flex-col items-start py-3'>
                        <p className='font-medium text-sm'>{notification.title || notification.message}</p>
                        <p className='text-xs text-gray-500'>
                          {formatNotificationTime(notification.createdAt || notification.timestamp)}
                        </p>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className='py-8 text-center text-gray-500 text-sm'>
                      Không có thông báo mới
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='justify-center text-[#0066CC]'>Xem tất cả thông báo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu - Always visible for quick access to logout */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    <Avatar className='w-8 h-8'>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className='bg-[#0066CC] text-white text-xs'>
                        {getUserInitials(user) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48 z-50 bg-white shadow-lg border border-blue-100'>
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
              <Badge className='bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 shadow-lg'>
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
