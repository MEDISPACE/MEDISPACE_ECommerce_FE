import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import {
  User,
  Package,
  FileText,
  MapPin,
  CreditCard,
  Bell,
  Heart,
  Award,
  Lock,
  Settings,
  Menu,
  BarChart3,
} from 'lucide-react'
import type { BreadcrumbItem } from '../shared/UniversalBreadcrumb'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { mockUser } from '../../utils/mockAccountData'
import { useAuth } from '../../contexts/AuthContext'
import type { User as AccountUser } from '../../types/account'

interface AccountLayoutProps {
  children: ReactNode
  breadcrumbItems?: BreadcrumbItem[]
}

const navigationItems = [
  {
    label: 'Tổng quan',
    href: '/account',
    icon: BarChart3,
    exact: true,
  },
  {
    label: 'Thông tin cá nhân',
    href: '/account/profile',
    icon: User,
  },
  {
    label: 'Đơn hàng của tôi',
    href: '/account/orders',
    icon: Package,
  },
  {
    label: 'Lịch sử đơn thuốc',
    href: '/account/prescriptions',
    icon: FileText,
  },
  {
    label: 'Sổ địa chỉ',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    label: 'Phương thức thanh toán',
    href: '/account/payment-methods',
    icon: CreditCard,
  },
  {
    label: 'Thông báo',
    href: '/account/notifications',
    icon: Bell,
  },
  {
    label: 'Sản phẩm yêu thích',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    label: 'Điểm thưởng',
    href: '/account/rewards',
    icon: Award,
  },
  {
    label: 'Đổi mật khẩu',
    href: '/account/change-password',
    icon: Lock,
  },
  {
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
      return { label: 'Thành viên Bạch Kim', className: 'bg-purple-100 text-purple-700' }
    default:
      return { label: 'Thành viên', className: 'bg-blue-100 text-blue-700' }
  }
}

export function AccountLayout({ children, breadcrumbItems = [] }: AccountLayoutProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { user } = useAuth()
  // Auth user shape (backend) differs from the account mock shape used in the account UI.
  // We'll treat the auth user as an AccountUser when available, and fall back to mockAccount values.
  const accountUser = user as unknown as AccountUser | undefined
  const membershipLevel = accountUser?.membershipLevel ?? mockUser.membershipLevel
  const membershipConfig = getMembershipLevelConfig(membershipLevel)

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className='space-y-6'>
      {/* User Info */}
      <div className='text-center pb-6 border-b border-blue-100'>
        <Avatar className='w-20 h-20 mx-auto mb-3'>
          <AvatarImage src={accountUser?.avatar ?? mockUser.avatar} />
          <AvatarFallback className='text-xl bg-blue-100 text-blue-600'>
            {(accountUser?.firstName ?? mockUser.firstName).charAt(0)}
            {(accountUser?.lastName ?? mockUser.lastName).charAt(0)}
          </AvatarFallback>
        </Avatar>

        <h3 className='font-medium text-gray-900'>
          {accountUser?.firstName ?? mockUser.firstName} {accountUser?.lastName ?? mockUser.lastName}
        </h3>
        <p className='text-sm text-gray-500 mb-2'>{accountUser?.email ?? mockUser.email}</p>

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
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
    <div>
      {breadcrumbItems.length > 0 && <UniversalBreadcrumb items={breadcrumbItems} />}
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Desktop Sidebar */}
          <div className='hidden lg:block lg:col-span-1'>
            <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6 sticky top-6'>
              <SidebarContent />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className='lg:hidden mb-4'>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant='outline' className='border-blue-200'>
                  <Menu className='w-4 h-4 mr-2' />
                  Menu tài khoản
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-80 p-0'>
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
          <div className='lg:col-span-3'>
            <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
