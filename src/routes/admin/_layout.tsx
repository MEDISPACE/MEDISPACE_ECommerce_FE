import { Outlet } from 'react-router'
import AdminSidebar from '~/components/admin/AdminSidebar'
import AdminTopbar from '~/components/admin/AdminTopbar'

export function meta() {
  return [{ title: 'Quản trị | MEDISPACE' }, { name: 'description', content: 'Bảng điều khiển quản trị MEDISPACE' }]
}

export default function AdminLayout() {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Admin Topbar */}
      <AdminTopbar />

      <div className='flex'>
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Admin Content */}
        <main className='flex-1 p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
