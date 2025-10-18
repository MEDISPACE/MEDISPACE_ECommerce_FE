import React from 'react'
import { Users, Package, FileText, BarChart3, Settings, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { useAuth } from '~/contexts/AuthContext'
// import { getUserStats } from '~/utils/mockUserData' // Removed - using BE for user data
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'

export function AdminDashboard() {
  const { user } = useAuth()
  // const userStats = getUserStats() // Removed - using BE for user data
  // Temporary placeholder data - should be replaced with API calls
  const userStats = {
    total: 0,
    customers: 0,
    pharmacists: 0,
    admins: 0,
    verified: 0,
  }
  const { StatsCard } = useStatsCards()

  const quickStats: StatCardConfig[] = [
    {
      title: 'Tổng người dùng',
      value: userStats.total,
      icon: Users,
      color: 'blue',
      trend: {
        value: '+12.5%',
        type: 'positive',
        label: 'so với tháng trước',
      },
    },
    {
      title: 'Đơn hàng hôm nay',
      value: 47,
      icon: Package,
      color: 'green',
      trend: {
        value: '+8.2%',
        type: 'positive',
        label: 'so với tháng trước',
      },
    },
    {
      title: 'Doanh thu tháng',
      value: '₫125.4M',
      icon: DollarSign,
      color: 'emerald',
      trend: {
        value: '+15.3%',
        type: 'positive',
        label: 'so với tháng trước',
      },
    },
    {
      title: 'Đơn thuốc chờ',
      value: 23,
      icon: FileText,
      color: 'orange',
      trend: {
        value: '-5.1%',
        type: 'negative',
        label: 'so với tháng trước',
      },
    },
  ]

  const systemHealth = [
    { name: 'Server Status', status: 'healthy', value: 99.9 },
    { name: 'Database', status: 'healthy', value: 98.5 },
    { name: 'API Response', status: 'warning', value: 85.2 },
    { name: 'Payment Gateway', status: 'healthy', value: 99.1 },
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      message: 'Người dùng mới đăng ký: Nguyễn Văn A',
      time: '5 phút trước',
      severity: 'info',
    },
    {
      id: 2,
      type: 'prescription_approved',
      message: 'Đơn thuốc #RX-2024-001 đã được duyệt',
      time: '15 phút trước',
      severity: 'success',
    },
    {
      id: 3,
      type: 'system_warning',
      message: 'Cảnh báo: API response time cao hơn bình thường',
      time: '30 phút trước',
      severity: 'warning',
    },
    {
      id: 4,
      type: 'order_completed',
      message: 'Đơn hàng #MD-2024-156 đã hoàn thành',
      time: '1 giờ trước',
      severity: 'success',
    },
  ]

  const quickActions = [
    {
      title: 'Quản lý người dùng',
      description: 'Xem và chỉnh sửa thông tin người dùng',
      icon: Users,
      href: '/admin/users',
      color: 'blue',
    },
    {
      title: 'Quản lý sản phẩm',
      description: 'Thêm, sửa, xóa sản phẩm và thuốc',
      icon: Package,
      href: '/admin/products',
      color: 'green',
    },
    {
      title: 'Báo cáo & Thống kê',
      description: 'Xem báo cáo chi tiết về hoạt động',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'blue',
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình và quản lý hệ thống',
      icon: Settings,
      href: '/admin/settings',
      color: 'gray',
    },
  ]

  return (
    <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
            Dashboard Tổng quan
          </h1>
          <p className='text-gray-600 mt-1'>
            Chào mừng trở lại, {user ? `${user.firstName} ${user.lastName}` : 'Admin'} 👋
          </p>
        </div>

        {/* Quick Stats - Using reusable hook */}
        <StatsCardGrid cols={4}>
          {quickStats.map((stat, index) => (
            <StatsCard key={index} config={stat} />
          ))}
        </StatsCardGrid>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* System Health */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100 lg:col-span-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5 text-blue-600' />
                Tình trạng hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {systemHealth.map((item, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.status === 'healthy'
                            ? 'bg-green-500'
                            : item.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <span className='text-gray-900'>{item.name}</span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Progress value={item.value} className='w-24' />
                      <span className='text-sm text-gray-600 min-w-[3rem]'>{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='w-5 h-5 text-blue-600' />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentActivities.map((activity) => (
                  <div key={activity.id} className='flex items-start gap-3'>
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.severity === 'success'
                          ? 'bg-green-500'
                          : activity.severity === 'warning'
                            ? 'bg-yellow-500'
                            : activity.severity === 'error'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                      }`}
                    />
                    <div className='flex-1'>
                      <p className='text-sm text-gray-900'>{activity.message}</p>
                      <p className='text-xs text-gray-500'>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className='mt-8'>
          <h2 className='text-xl text-gray-900 mb-6'>Thao tác nhanh</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer group'
              >
                <CardContent className='p-6 text-center'>
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-lg bg-${action.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className={`w-8 h-8 text-${action.color}-600`} />
                  </div>
                  <h3 className='font-medium text-gray-900 mb-2'>{action.title}</h3>
                  <p className='text-sm text-gray-600'>{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Statistics */}
        <div className='mt-8'>
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5 text-blue-600' />
                Thống kê người dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-blue-600'>{userStats.total}</div>
                  <div className='text-sm text-gray-600'>Tổng cộng</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-green-600'>{userStats.customers}</div>
                  <div className='text-sm text-gray-600'>Khách hàng</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-[#4A90E2]'>{userStats.pharmacists}</div>
                  <div className='text-sm text-gray-600'>Dược sĩ</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-orange-600'>{userStats.admins}</div>
                  <div className='text-sm text-gray-600'>Admin</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-emerald-600'>{userStats.verified}</div>
                  <div className='text-sm text-gray-600'>Đã xác thực</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
