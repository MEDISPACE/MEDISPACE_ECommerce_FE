import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  User,
  Package,
  Star,
  FileText,
  MapPin,
  Bell,
  TicketPercent,
  Heart,
  Award,
  Lock,
  Settings,
  Menu,
  BarChart3,
  RotateCcw,
} from 'lucide-react'
import type { BreadcrumbItem } from '../shared/UniversalBreadcrumb'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { useAuth } from '../../contexts/AuthContext'
import type { User as AccountUser } from '../../types/account'

interface AccountLayoutProps {
  children: ReactNode
  breadcrumbItems?: BreadcrumbItem[]
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Tổng quan',
    href: '/account',
    icon: BarChart3,
    exact: true,
  },
  {
    id: 'profile',
    label: 'Thông tin cá nhân',
    href: '/account/profile',
    icon: User,
  },
  {
    id: 'orders',
    label: 'Đơn hàng của tôi',
    href: '/account/orders',
    icon: Package,
  },
  {
    id: 'returns',
    label: 'Yêu cầu đổi/trả',
    href: '/account/returns',
    icon: RotateCcw,
  },
  {
    id: 'reviews',
    label: 'Đánh giá của tôi',
    href: '/account/reviews',
    icon: Star,
  },
  {
    id: 'prescriptions',
    label: 'Lịch sử đơn thuốc',
    href: '/account/prescriptions',
    icon: FileText,
  },
  {
    id: 'addresses',
    label: 'Sổ địa chỉ',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    id: 'notifications',
    label: 'Thông báo',
    href: '/account/notifications',
    icon: Bell,
  },
  {
    id: 'coupons',
    label: 'Ưu đãi của tôi',
    href: '/account/coupons',
    icon: TicketPercent,
  },
  {
    id: 'wishlist',
    label: 'Sản phẩm yêu thích',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    id: 'rewards',
    label: 'Điểm thưởng',
    href: '/account/rewards',
    icon: Award,
  },
  {
    id: 'change-password',
    label: 'Đổi mật khẩu',
    href: '/account/change-password',
    icon: Lock,
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    href: '/account/settings',
    icon: Settings,
  },
]

const getMembershipLevelConfig = (level: string) => {
  switch (level) {
    case 'bronze':
      return { label: 'Thành viên Đồng', className: 'bg-orange-100 text-orange-700' }
    case 'silver':
      return { label: 'Thành viên Bạc', className: 'bg-gray-100 text-gray-700' }
    case 'gold':
      return { label: 'Thành viên Vàng', className: 'bg-yellow-100 text-yellow-700' }
    case 'platinum':
      return { label: 'Thành viên Bạch Kim', className: 'bg-[#E8EDF5] text-[#0A2463]' }
    default:
      return { label: 'Thành viên', className: 'bg-[#E8EDF5] text-[#0A2463]' }
  }
}

export function AccountLayout({ children, breadcrumbItems = [] }: AccountLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { user, isAuthenticated, loading } = useAuth()
  // Auth user shape (backend) differs from the account mock shape used in the account UI.
  // We'll treat the auth user as an AccountUser when available
  const accountUser = user as unknown as AccountUser | undefined
  const membershipLevel = accountUser?.membershipLevel ?? 'bronze'
  const membershipConfig = getMembershipLevelConfig(membershipLevel)

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [isAuthenticated, loading, location, navigate, user])

  if (loading || !isAuthenticated || !user) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#F8FAFB] to-[#F0F6FF] flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className='space-y-6'>
      {/* User Info */}
      <div className='text-center pb-6 border-b border-[#E8EDF5]'>
        <Avatar className='w-20 h-20 mx-auto mb-3'>
          <AvatarImage src={accountUser?.avatar} />
          <AvatarFallback className='text-xl bg-[#E8EDF5] text-[#1E40AF]'>
            {(accountUser?.firstName || 'U').charAt(0)}
            {(accountUser?.lastName || 'N').charAt(0)}
          </AvatarFallback>
        </Avatar>

        <h3 className='font-medium text-gray-900' data-testid='sidebar-username'>
          {accountUser?.firstName || 'Người'} {accountUser?.lastName || 'dùng'}
        </h3>
        <p className='text-sm text-gray-500 mb-2'>{accountUser?.email || 'Chưa có email'}</p>

        <Badge className={`${membershipConfig.className} text-xs`}>⭐ {membershipConfig.label}</Badge>
      </div>

      {/* Navigation */}
      <nav className='space-y-1'>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = isActiveRoute(item.href, item.exact)

          return (
            <Link
              key={item.href}
              to={item.href}
              data-testid={`account-nav-${item.id}`}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#F0F6FF] text-[#0A2463] font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className='w-5 h-5' />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className='bg-[#F8FAFB] text-gray-900 [color-scheme:light] forced-color-adjust-none'>
      {breadcrumbItems.length > 0 && <UniversalBreadcrumb items={breadcrumbItems} />}
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Desktop Sidebar */}
          <div className='hidden lg:block lg:col-span-1'>
            <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6 sticky top-6 text-gray-900 [color-scheme:light] forced-color-adjust-none'>
              <SidebarContent />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className='lg:hidden mb-4'>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant='outline' className='border-[#BFDBFE]' data-testid='account-mobile-menu-trigger'>
                  <Menu className='w-4 h-4 mr-2' />
                  Menu tài khoản
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-80 p-0' data-testid='account-mobile-menu'>
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-lg font-medium'>Tài khoản</h2>
                  </div>
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <div className='lg:col-span-3' data-testid='account-content'>
            <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6 text-gray-900 [color-scheme:light] forced-color-adjust-none'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
