import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  ArrowRight,
  FileText,
  Plus,
  MessageSquare,
  Settings,
  Menu,
  X,
  Search,
  Loader2,
  LogOut,
  User,
  CheckCircle,
  Database,
  ShoppingCart,
  Pill,
  Phone,
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
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getFullName, getUserInitials } from '~/utils/lib'
import type { BreadcrumbItem } from '../shared/UniversalBreadcrumb'
import { dashboardService, type DashboardStats } from '~/services/pharmacist'
import type { PatientSearchResult } from '~/services/pharmacist/types'
import { settingsService } from '~/services/pharmacist/settings.service'
import { searchService, type SearchProductsHit, type SearchProductsResult } from '~/services/searchService'
import { useDebounce } from '~/hooks/useDebounce'
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

const PHARMACIST_ONLINE_PREFERENCE_KEY = 'medispace_pharmacist_online_preference'

const getStoredOnlinePreference = () => {
  if (typeof window === 'undefined') return undefined

  const value = window.localStorage.getItem(PHARMACIST_ONLINE_PREFERENCE_KEY)
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

const storeOnlinePreference = (isOnline: boolean) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PHARMACIST_ONLINE_PREFERENCE_KEY, String(isOnline))
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
  const { user, logout, isAuthenticated, loading, updateUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => getStoredOnlinePreference() ?? user?.isOnline ?? true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false)
  const [productResults, setProductResults] = useState<SearchProductsHit[]>([])
  const [patientResults, setPatientResults] = useState<PatientSearchResult[]>([])
  const [productSearchSource, setProductSearchSource] = useState<SearchProductsResult['source'] | null>(null)
  const debouncedGlobalSearch = useDebounce(globalSearchQuery.trim(), 250)

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

  useEffect(() => {
    const query = debouncedGlobalSearch

    if (query.length < 2) {
      setProductResults([])
      setPatientResults([])
      setProductSearchSource(null)
      setGlobalSearchLoading(false)
      return
    }

    let cancelled = false
    const digits = query.replace(/\D/g, '')

    setGlobalSearchLoading(true)
    Promise.all([
      searchService.searchProducts({ q: query, limit: 5 }),
      digits.length >= 3 ? dashboardService.searchPatient(digits) : Promise.resolve([]),
    ])
      .then(([products, patients]) => {
        if (cancelled) return
        setProductResults(products.hits || [])
        setProductSearchSource(products.source)
        setPatientResults(patients)
      })
      .catch(() => {
        if (cancelled) return
        setProductResults([])
        setPatientResults([])
        setProductSearchSource(null)
      })
      .finally(() => {
        if (!cancelled) setGlobalSearchLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedGlobalSearch])

  // Keep pharmacist availability stable across refresh/login. Socket presence is separate from this preference.
  useEffect(() => {
    if (loading || !isAuthenticated || user?.role !== 1) return

    const preferredStatus = getStoredOnlinePreference() ?? true
    setIsOnline(preferredStatus)

    if (user.isOnline !== preferredStatus) {
      let cancelled = false

      settingsService
        .updateOnlineStatus({ isOnline: preferredStatus })
        .then((updatedProfile) => {
          if (cancelled) return
          updateUser({ ...user, isOnline: updatedProfile.isOnline ?? preferredStatus })
        })
        .catch(() => {
          if (!cancelled) setIsOnline(user.isOnline ?? preferredStatus)
        })

      return () => {
        cancelled = true
      }
    }
  }, [isAuthenticated, loading, updateUser, user])

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
      storeOnlinePreference(checked)

      // Call API to update status in database
      const updatedProfile = await settingsService.updateOnlineStatus({ isOnline: checked })
      if (user) updateUser({ ...user, isOnline: updatedProfile.isOnline ?? checked })

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
      storeOnlinePreference(previousStatus)
      toast.error('Không thể cập nhật trạng thái. Vui lòng thử lại.')
    }
  }

  const closeGlobalSearch = () => {
    setGlobalSearchOpen(false)
  }

  const goToProductSearch = (query = globalSearchQuery.trim()) => {
    if (!query) return
    closeGlobalSearch()
    navigate(`/pharmacist/drug-database?search=${encodeURIComponent(query)}`)
  }

  const goToPatientSearch = (phone: string) => {
    closeGlobalSearch()
    navigate(`/pharmacist/patient-history?phone=${encodeURIComponent(phone)}`)
  }

  const handleGlobalSearchSubmit = () => {
    const query = globalSearchQuery.trim()
    if (!query) return

    const digits = query.replace(/\D/g, '')
    if (digits.length >= 3 && productResults.length === 0) {
      goToPatientSearch(digits)
      return
    }

    goToProductSearch(query)
  }

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className='flex flex-col h-full'>
      {/* Logo Section */}
      <div className={`${collapsed ? 'px-3 py-4' : 'p-6'} border-b border-[#E8EDF5] flex-shrink-0`}>
        <Link
          to='/pharmacist/dashboard'
          title={collapsed ? 'MEDISPACE Pharmacist' : undefined}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className='w-10 h-10 rounded-lg flex items-center justify-center shadow-lg'>
            <img src={faviconLogo} alt='MEDISPACE' className='w-8 h-8' />
          </div>
          <div className={collapsed ? 'hidden' : 'flex-1'}>
            <h2 className='font-semibold text-blue-900'>MEDISPACE</h2>
            <p className='text-xs text-[#1E40AF]'>Dược sĩ</p>
          </div>
        </Link>
      </div>

      {/* Status Toggle */}
      {collapsed && (
        <div className='border-b border-[#E8EDF5] px-2 py-3 flex-shrink-0'>
          <button
            type='button'
            title={isOnline ? 'Online' : 'Offline'}
            aria-label={isOnline ? 'Online' : 'Offline'}
            onClick={() => handleStatusToggle(!isOnline)}
            className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border transition-all ${
              isOnline
                ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {isOnline ? <UserRoundCheck className='w-5 h-5' /> : <UserRoundX className='w-5 h-5' />}
          </button>
        </div>
      )}
      <div className={`${collapsed ? 'hidden' : 'px-6 py-4'} border-b border-[#E8EDF5] flex-shrink-0`}>
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
      <div className='app-sidebar-scrollbar flex-1 overflow-y-auto min-h-0'>
        <div className={collapsed ? 'px-2 py-4' : 'px-3 py-4'}>
          <nav className='space-y-1'>
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              const badgeLabel = typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`group relative transition-all ${
                    collapsed
                      ? 'mx-auto flex h-11 w-11 items-center justify-center rounded-lg'
                      : 'flex items-center gap-3 rounded-lg px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-[#F0F6FF] hover:text-[#0A2463]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#1E40AF]'}`} />
                  {!collapsed && <span className='flex-1 text-sm font-medium'>{item.label}</span>}
                  {item.badge && !collapsed && (
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
                      {badgeLabel}
                    </Badge>
                  )}
                  {item.badge && collapsed && (
                    <span
                      className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white ${
                        item.badgeVariant === 'destructive'
                          ? 'bg-red-500'
                          : item.badgeVariant === 'warning'
                            ? 'bg-yellow-500'
                            : item.badgeVariant === 'success'
                              ? 'bg-green-500'
                              : 'bg-[#1E40AF]'
                      }`}
                    >
                      {badgeLabel}
                    </span>
                  )}
                  {isActive && !collapsed && (
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

    </div>
  )

  return (
    <div className='flex h-screen bg-gradient-to-br from-[#F8FAFB] via-white to-[#F0F6FF] overflow-hidden'>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 288 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className='hidden lg:flex overflow-hidden bg-white flex-col shadow-xl border-r border-[#E8EDF5]'
      >
        <SidebarContent collapsed={!sidebarOpen} />
      </motion.aside>

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
            <div className='relative hidden md:block w-[420px]'>
              <div className='flex h-10 items-center gap-2 rounded-lg border border-[#D7E3F5] bg-white px-3 shadow-sm transition-colors focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#BFDBFE]/60'>
                <Search className='h-4 w-4 shrink-0 text-[#1E40AF]' />
                <Input
                  type='search'
                  value={globalSearchQuery}
                  onChange={(event) => {
                    setGlobalSearchQuery(event.target.value)
                    setGlobalSearchOpen(true)
                  }}
                  onFocus={() => setGlobalSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleGlobalSearchSubmit()
                    if (event.key === 'Escape') closeGlobalSearch()
                  }}
                  placeholder='Tìm thuốc hoặc số điện thoại bệnh nhân...'
                  className='h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0'
                />
                {globalSearchLoading && <Loader2 className='h-4 w-4 shrink-0 animate-spin text-[#1E40AF]' />}
              </div>

              {globalSearchOpen && globalSearchQuery.trim().length >= 2 && (
                <div className='absolute left-0 top-12 z-[60] w-full overflow-hidden rounded-lg border border-[#E8EDF5] bg-white shadow-xl'>
                  <div className='flex items-center justify-between border-b border-[#E8EDF5] px-3 py-2'>
                    <span className='text-xs font-medium text-gray-500'>Kết quả tìm kiếm nhanh</span>
                    {productSearchSource && (
                      <Badge
                        variant='outline'
                        className={
                          productSearchSource === 'typesense'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                        }
                      >
                        {productSearchSource === 'typesense' ? 'Typesense' : 'MongoDB fallback'}
                      </Badge>
                    )}
                  </div>

                  <div className='scrollbar-thin max-h-[420px] overflow-y-auto p-2'>
                    {patientResults.length > 0 && (
                      <div className='mb-2'>
                        <p className='px-2 pb-1 text-xs font-semibold uppercase text-gray-500'>Bệnh nhân</p>
                        {patientResults.slice(0, 3).map((patient) => (
                          <button
                            key={patient.customerId}
                            type='button'
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => goToPatientSearch(patient.phoneNumber)}
                            className='flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#F0F6FF]'
                          >
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={patient.avatar} />
                              <AvatarFallback className='bg-[#E8EDF5] text-xs text-[#1E40AF]'>
                                {patient.fullName.charAt(0) || 'B'}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-medium text-gray-900'>{patient.fullName}</p>
                              <p className='flex items-center gap-1 text-xs text-gray-500'>
                                <Phone className='h-3 w-3' />
                                {patient.phoneNumber || 'Chưa có số điện thoại'}
                              </p>
                            </div>
                            <ArrowRight className='h-4 w-4 text-gray-400' />
                          </button>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className='px-2 pb-1 text-xs font-semibold uppercase text-gray-500'>Sản phẩm trong kho</p>
                      {productResults.length > 0 ? (
                        productResults.map((hit) => (
                          <button
                            key={hit.document.mongoId}
                            type='button'
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => goToProductSearch(hit.document.name)}
                            className='flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#F0F6FF]'
                          >
                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8EDF5]'>
                              <Pill className='h-4 w-4 text-[#1E40AF]' />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-medium text-gray-900'>{hit.document.name}</p>
                              <p className='truncate text-xs text-gray-500'>
                                {hit.document.brandName || 'Không có thương hiệu'}
                                {hit.document.price ? ` - ${hit.document.price.toLocaleString('vi-VN')}đ` : ''}
                              </p>
                            </div>
                            {hit.document.requiresPrescription && (
                              <Badge className='bg-red-100 text-red-700'>Rx</Badge>
                            )}
                          </button>
                        ))
                      ) : globalSearchLoading ? (
                        <p className='px-2 py-4 text-center text-sm text-gray-500'>Đang tìm...</p>
                      ) : (
                        <p className='px-2 py-4 text-center text-sm text-gray-500'>Không có sản phẩm phù hợp</p>
                      )}
                    </div>
                  </div>

                  <button
                    type='button'
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToProductSearch()}
                    className='flex w-full items-center justify-between border-t border-[#E8EDF5] px-3 py-2 text-sm font-medium text-[#0A2463] hover:bg-[#F0F6FF]'
                  >
                    Xem toàn bộ trong cơ sở dữ liệu thuốc
                    <ArrowRight className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* Quick Stats (Desktop) */}
            <div className='hidden xl:flex items-center gap-2 mr-2'>
              <div className='flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3'>
                <FileText className='h-4 w-4 shrink-0 text-yellow-600' />
                <span className='text-sm font-medium text-yellow-900'>Đơn chờ</span>
                <span className='text-base font-bold leading-none text-yellow-700'>{stats?.pendingPrescriptions ?? 0}</span>
              </div>
              <div className='flex h-10 min-w-[148px] items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3'>
                <CheckCircle className='h-4 w-4 shrink-0 text-green-600' />
                <span className='text-sm font-medium text-green-900'>Hoàn thành</span>
                <span className='text-base font-bold leading-none text-green-700'>{stats?.prescriptionsToday.verified ?? 0}</span>
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
        <main className='app-content-scrollbar flex-1 overflow-auto'>
          {/* Breadcrumb removed - Pharmacist pages don't need breadcrumbs (Option 3: Layer 2) */}

          <div className='p-6'>{children}</div>
        </main>
      </div>
    </div>
  )
}
