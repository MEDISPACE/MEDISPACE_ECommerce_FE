import React from 'react'
import { Link, useLocation } from 'react-router'
import { User, Package, Heart, MapPin, CreditCard, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '~/contexts/AuthContext'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const accountMenuItems = [
  { path: '/account', label: 'Thông tin tài khoản', icon: User },
  { path: '/account/orders', label: 'Đơn hàng của tôi', icon: Package },
  { path: '/account/wishlist', label: 'Sản phẩm yêu thích', icon: Heart },
  { path: '/account/addresses', label: 'Sổ địa chỉ', icon: MapPin },
  { path: '/account/payment-methods', label: 'Phương thức thanh toán', icon: CreditCard },
  { path: '/account/settings', label: 'Cài đặt', icon: Settings },
]

export default function AccountSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className='w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]'>
      {/* User Info */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-center space-x-3'>
          <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center'>
            <User className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>{user ? `${user.firstName} ${user.lastName}` : 'Tài khoản'}</h3>
            <p className='text-sm text-gray-500'>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className='p-4'>
        <ul className='space-y-1'>
          {accountMenuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <div className='flex items-center space-x-3'>
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-600' : 'text-gray-400')} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={cn('w-4 h-4', isActive ? 'text-blue-600' : 'text-gray-300')} />
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Logout Button */}
        <div className='mt-8 pt-4 border-t border-gray-200'>
          <Button
            variant='ghost'
            onClick={logout}
            className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'
          >
            <LogOut className='w-4 h-4 mr-3' />
            Đăng xuất
          </Button>
        </div>
      </nav>
    </div>
  )
}
