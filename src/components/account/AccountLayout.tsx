import React from 'react'
import { Outlet } from 'react-router'
import AccountSidebar from './AccountSidebar'

export default function AccountLayout() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Sidebar */}
        <div className='lg:col-span-1'>
          <AccountSidebar />
        </div>

        {/* Main Content */}
        <div className='lg:col-span-3'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
