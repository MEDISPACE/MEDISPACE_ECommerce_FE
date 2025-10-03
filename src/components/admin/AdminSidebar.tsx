import React from 'react'
import { Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Pill,
  UserCheck,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { cn } from '~/lib/utils'

const adminMenuItems = [
  { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Quản lý sản phẩm', icon: Package },
  { path: '/admin/categories', label: 'Quản lý danh mục', icon: Pill },
  { path: '/admin/orders', label: 'Quản lý đơn hàng', icon: ShoppingCart },
  { path: '/admin/customers', label: 'Quản lý khách hàng', icon: Users },
  { path: '/admin/prescriptions', label: 'Quản lý đơn thuốc', icon: FileText },
  { path: '/admin/pharmacists', label: 'Quản lý dược sĩ', icon: UserCheck },
  { path: '/admin/analytics', label: 'Báo cáo & Thống kê', icon: BarChart3 },
  { path: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings },
]

export default function AdminSidebar() {
  const location = useLocation()

  return (
    <div className='w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]'>
      {/* Admin Header */}
      <div className='p-6 border-b border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-900'>Quản trị viên</h2>
        <p className='text-sm text-gray-500'>MEDISPACE Admin Panel</p>
      </div>

      {/* Navigation Menu */}
      <nav className='p-4'>
        <ul className='space-y-1'>
          {adminMenuItems.map((item) => {
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
      </nav>
    </div>
  )
}
