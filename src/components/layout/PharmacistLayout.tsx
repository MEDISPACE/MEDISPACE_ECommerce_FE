import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  FileText,
  Plus,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  CheckCircle,
  Database,
  ShoppingCart,
  UserRoundCheck,
  UserRoundX,
  RotateCcw,
} from 'lucide-react'
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
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { Switch } from '../ui/switch'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getFullName, getUserInitials } from '~/utils/lib'
import type { BreadcrumbItem } from '../shared/UniversalBreadcrumb'
import { dashboardService, type DashboardStats } from '~/services/pharmacist'
import { settingsService } from '~/services/pharmacist/settings.service'
import { NotificationDropdown } from '../shared/NotificationDropdown'
import faviconLogo from '../../assets/MEDISPACE_Logo_favicon.png'

interface PharmacistLayoutProps {
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
    href: '/pharmacist/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Quản lý đơn thuốc',
    href: '/pharmacist/prescriptions',
    icon: FileText,
  },
  {
    label: 'Tạo đơn hàng',
    href: '/pharmacist/create-order',
    icon: Plus,
  },
  {
    label: 'Quản lý đơn hàng',
    href: '/pharmacist/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Quản lý đổi/trả',
    href: '/pharmacist/returns',
    icon: RotateCcw,
  },
  {
    label: 'Chat với khách hàng',
    href: '/pharmacist/chat',
    icon: MessageSquare,
  },
  // {
  //   label: 'Lịch sử bệnh nhân',
  //   href: '/pharmacist/patients',
  //   icon: Users,
  // },
  {
    label: 'Cơ sở dữ liệu thuốc',
    href: '/pharmacist/drug-database',
    icon: Database,
  },
  {
    label: 'Báo cáo công việc',
    href: '/pharmacist/reports',
    icon: BarChart3,
  },
  {
    label: 'Quản lý bài viết',
    href: '/pharmacist/articles',
    icon: FileText,
  },
  {
    label: 'Cài đặt',
    href: '/pharmacist/settings',
    icon: Settings,
  },
]

export function PharmacistLayout({ children }: PharmacistLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true)
  const [stats, setStats] = useState<DashboardStats | null>(null)


  // Redirect if not authenticated or not pharmacist
  useEffect(() => {
    if (loading) return // Đợi AuthContext restore xong
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tiếp tục')
      navigate('/login', { replace: true })
      return
    }
    if (user && user.role !== 1) {
      // 1 = Pharmacist role
      toast.error('Bạn không có quyền truy cập trang này')
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, navigate, loading])

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch (error) {}
    }
    loadStats()
  }, [])

  // Sync isOnline with user profile
  useEffect(() => {
    if (user?.isOnline !== undefined) {
      setIsOnline(user.isOnline)
    }
  }, [user?.isOnline])

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
  }

  const handleStatusToggle = async (checked: boolean) => {
    const previousStatus = isOnline
    try {
      // Optimistic update
      setIsOnline(checked)

      // Call API to update status in database
      await settingsService.updateOnlineStatus({ isOnline: checked })

      toast.success(checked ? 'Bạn đã online - Sẵn sàng tư vấn' : 'Bạn đã offline - Không nhận tư vấn mới', {
        icon: checked ? (
          <UserRoundCheck className='w-5 h-5 text-green-600' />
        ) : (
          <UserRoundX className='w-5 h-5 text-gray-600' />
        ),
      })
    } catch (error) {
      // Rollback on error
      setIsOnline(previousStatus)
      toast.error('Không thể cập nhật trạng thái. Vui lòng thử lại.')
    }
  }

  const SidebarContent = () => (
    <div className='flex flex-col h-full'>
      {/* Logo Section */}
      <div className='p-6 border-b border-[#E8EDF5] flex-shrink-0'>
        <Link to='/pharmacist/dashboard' className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg flex items-center justify-center shadow-lg'>
            <img src={faviconLogo} alt='MEDISPACE' className='w-8 h-8' />
          </div>
          <div className='flex-1'>
            <h2 className='font-semibold text-blue-900'>MEDISPACE</h2>
            <p className='text-xs text-[#1E40AF]'>Dược sĩ</p>
          </div>
        </Link>
      </div>

      {/* Status Toggle */}
      <div className='px-6 py-4 border-b border-[#E8EDF5] flex-shrink-0'>
        <div className='flex items-center justify-between p-3 bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF] rounded-lg'>
          <div className='flex items-center gap-2'>
            {isOnline ? (
              <UserRoundCheck className='w-4 h-4 text-green-600' />
            ) : (
              <UserRoundX className='w-4 h-4 text-gray-500' />
            )}
            <div>
              <p className='text-sm font-semibold text-gray-900'>{isOnline ? 'Online' : 'Offline'}</p>
              <p className='text-xs text-gray-500'>{isOnline ? 'Sẵn sàng tư vấn' : 'Không nhận tư vấn mới'}</p>
            </div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={handleStatusToggle}
            className={`${
              isOnline
                ? 'data-[state=checked]:bg-green-600'
                : 'data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <div className='flex-1 overflow-y-auto min-h-0'>
        <div className='px-3 py-4'>
          <nav className='space-y-1'>
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-[#F0F6FF] hover:text-[#0A2463]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#1E40AF]'}`} />
                  <span className='flex-1 text-sm font-medium'>{item.label}</span>
                  {item.badge && (
                    <Badge
                      className={`text-xs ${
                        item.badgeVariant === 'destructive'
                          ? 'bg-red-500'
                          : item.badgeVariant === 'warning'
                            ? 'bg-yellow-500'
                            : item.badgeVariant === 'success'
                              ? 'bg-green-500'
                              : 'bg-[#1E40AF]'
                      } text-white`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId='activeIndicatorPharmacist'
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
      <div className='px-6 py-4 border-t border-[#E8EDF5] bg-gradient-to-br from-[#F8FAFB] to-[#F0F6FF] flex-shrink-0'>
        <p className='text-xs text-gray-600 mb-3'>Hôm nay</p>
        <div className='grid grid-cols-2 gap-3'>
          <div className='text-center p-2 bg-white rounded-lg shadow-sm'>
            <p className='text-xs text-gray-600'>Đơn thuốc</p>
            <p className='text-lg font-semibold text-[#1E40AF]'>{stats?.prescriptionsToday.total ?? 0}</p>
          </div>
          <div className='text-center p-2 bg-white rounded-lg shadow-sm'>
            <p className='text-xs text-gray-600'>Tư vấn</p>
            <p className='text-lg font-semibold text-green-600'>{stats?.activeChats ?? 0}</p>
          </div>
        </div>
      </div>

      {/* User Profile Section - Fixed at bottom */}
      <div className='p-4 border-t border-[#E8EDF5] flex-shrink-0'>
        <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF] rounded-lg'>
          <Avatar className='w-10 h-10 border-2 border-[#1E40AF]'>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className='bg-[#0A2463] text-white'>{getUserInitials(user) || 'D'}</AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-gray-900 truncate'>{getFullName(user) || 'Dược sĩ'}</p>
            <p className='text-xs text-[#1E40AF]'>Dược sĩ</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-[#0A2463]'>
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48 z-50 bg-white shadow-lg border border-[#E8EDF5]'>
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/pharmacist/settings')}>
                <User className='w-4 h-4 mr-2' />
                Hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/pharmacist/settings')}>
                <Settings className='w-4 h-4 mr-2' />
                Cài đặt
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
    <div className='flex h-screen bg-gradient-to-br from-[#F8FAFB] via-white to-[#F0F6FF] overflow-hidden'>
      {/* Desktop Sidebar */}
      <AnimatePresence mode='wait'>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='hidden lg:flex w-72 bg-white flex-col shadow-xl border-r border-[#E8EDF5]'
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
            <div className='hidden md:flex items-center gap-2 bg-[#F0F6FF] rounded-lg px-4 py-2 flex-1 max-w-md border border-[#BFDBFE]'>
              <Search className='w-4 h-4 text-blue-400' />
              <Input
                type='search'
                placeholder='Tìm kiếm bệnh nhân, thuốc...'
                className='bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm'
              />
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* Quick Stats (Desktop) */}
            <div className='hidden xl:flex items-center gap-4 mr-4'>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200'>
                <FileText className='w-4 h-4 text-yellow-600' />
                <div>
                  <p className='text-xs text-gray-600'>Đơn chờ</p>
                  <p className='text-sm font-semibold text-yellow-600'>{stats?.pendingPrescriptions ?? 0}</p>
                </div>
              </div>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200'>
                <CheckCircle className='w-4 h-4 text-green-600' />
                <div>
                  <p className='text-xs text-gray-600'>Hoàn thành</p>
                  <p className='text-sm font-semibold text-green-600'>{stats?.prescriptionsToday.verified ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <Badge className={`${isOnline ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
              {isOnline ? <UserRoundCheck className='w-3 h-3 mr-1' /> : <UserRoundX className='w-3 h-3 mr-1' />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>

            {/* Notifications - real-time via socket + polling */}
            <NotificationDropdown viewAllUrl='/pharmacist/notifications' />

            {/* User Menu - Always visible for quick access to logout */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    <Avatar className='w-8 h-8'>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className='bg-[#0A2463] text-white text-xs'>
                        {getUserInitials(user) || 'D'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48 z-50 bg-white shadow-lg border border-[#E8EDF5]'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{getFullName(user) || 'Dược sĩ'}</span>
                      <span className='text-xs text-gray-500'>Pharmacist</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/pharmacist/settings')}>
                    <User className='w-4 h-4 mr-2' />
                    Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/pharmacist/settings')}>
                    <Settings className='w-4 h-4 mr-2' />
                    Cài đặt
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
          {/* Breadcrumb removed - Pharmacist pages don't need breadcrumbs (Option 3: Layer 2) */}

          <div className='p-6'>{children}</div>
        </main>
      </div>
    </div>
  )
}
