import React from 'react'
import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '~/contexts/AuthContext'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

export default function AdminTopbar() {
  const { user, logout } = useAuth()

  return (
    <header className='bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6'>
      {/* Search Bar */}
      <div className='flex-1 max-w-md'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='Tìm kiếm sản phẩm, đơn hàng, khách hàng...'
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      {/* Admin Actions */}
      <div className='flex items-center space-x-4'>
        {/* Notifications */}
        <Button variant='ghost' size='sm' className='relative'>
          <Bell className='h-4 w-4' />
          <Badge
            variant='destructive'
            className='absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs'
          >
            5
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant='ghost' size='sm'>
          <Settings className='h-4 w-4' />
        </Button>

        {/* Admin Profile */}
        <div className='flex items-center space-x-3 border-l border-gray-200 pl-4'>
          <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center'>
            <User className='w-4 h-4 text-white' />
          </div>
          <div className='hidden md:block'>
            <p className='text-sm font-medium text-gray-900'>{user ? `${user.firstName} ${user.lastName}` : 'Admin'}</p>
            <p className='text-xs text-gray-500'>Quản trị viên</p>
          </div>
          <Button variant='ghost' size='sm' onClick={logout}>
            <LogOut className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </header>
  )
}
