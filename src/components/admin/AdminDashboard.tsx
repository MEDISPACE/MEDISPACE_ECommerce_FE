import { Users, Package, FileText, BarChart3, Settings, Clock, DollarSign, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useAuth } from '~/contexts/AuthContext'
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'
import { useQuery } from '@tanstack/react-query'
import adminService from '~/services/adminService'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { useState } from 'react'
import { Link } from 'react-router'

export function AdminDashboard() {
  const { user } = useAuth()
  const { StatsCard } = useStatsCards()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['admin', 'dashboard', 'activities'],
    queryFn: () => adminService.getRecentActivities(10),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₫`
    }
    return `${amount.toLocaleString('vi-VN')} ₫`
  }

  // Quick stats configuration
  const quickStats: StatCardConfig[] = dashboardStats ? [
    {
      title: 'Tổng người dùng',
      value: dashboardStats.users.total,
      icon: Users,
      color: 'blue',
      trend: {
        value: `+${dashboardStats.users.newToday}`,
        type: 'positive',
        label: 'mới hôm nay',
      },
    },
    {
      title: 'Đơn hàng hôm nay',
      value: dashboardStats.orders.todayCount,
      icon: Package,
      color: 'green',
      trend: {
        value: `${dashboardStats.orders.pending} chờ xử lý`,
        type: dashboardStats.orders.pending > 10 ? 'negative' : 'positive',
        label: '',
      },
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(dashboardStats.revenue.month),
      icon: DollarSign,
      color: 'emerald',
      trend: {
        value: `${dashboardStats.revenue.growth > 0 ? '+' : ''}${dashboardStats.revenue.growth.toFixed(1)}%`,
        type: dashboardStats.revenue.growth >= 0 ? 'positive' : 'negative',
        label: 'so với tháng trước',
      },
    },
    {
      title: 'Đơn thuốc chờ',
      value: dashboardStats.prescriptions.pending,
      icon: FileText,
      color: 'orange',
      trend: {
        value: `${dashboardStats.prescriptions.approved} đã duyệt`,
        type: 'positive',
        label: '',
      },
    },
  ] : []

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

  // Handle refresh all with toast notification
  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    toast.loading('Đang làm mới dữ liệu...', { id: 'refresh-dashboard' })

    try {
      await Promise.all([
        refetchStats(),
        refetchActivities()
      ])

      toast.success('Đã cập nhật dữ liệu mới nhất!', { id: 'refresh-dashboard' })
    } catch (error) {
      toast.error('Không thể làm mới dữ liệu', { id: 'refresh-dashboard' })
    } finally {
      // Delay để user thấy animation
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Show error state
  if (statsError) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Card className='bg-white/80 backdrop-blur-lg border-red-200 p-6'>
          <div className='flex flex-col items-center gap-4'>
            <AlertCircle className='w-12 h-12 text-red-500' />
            <h3 className='text-lg font-semibold text-red-800'>Lỗi tải dữ liệu</h3>
            <p className='text-red-600'>Không thể tải thống kê dashboard. Vui lòng thử lại.</p>
            <Button onClick={() => refetchStats()} className='bg-red-600 hover:bg-red-700'>
              Thử lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1
              className='text-3xl font-bold bg-clip-text text-transparent'
              style={{
                backgroundImage: `linear-gradient(to right, #0066CC, #4A90E2)`,
              }}
            >
              Dashboard Tổng quan
            </h1>
            <p className='text-gray-600 mt-1'>
              Chào mừng trở lại, {user ? `${user.firstName} ${user.lastName}` : 'Admin'} 👋
            </p>
          </div>
          <Button
            onClick={handleRefreshAll}
            variant='outline'
            className='gap-2'
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Quick Stats - Using reusable hook */}
      {statsLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className='bg-white/80 backdrop-blur-lg border-blue-100 animate-pulse'>
              <CardContent className='p-6'>
                <div className='h-20 bg-gray-200 rounded'></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StatsCardGrid cols={4}>
          {quickStats.map((stat, index) => (
            <StatsCard key={index} config={stat} />
          ))}
        </StatsCardGrid>
      )}

      <div className='grid grid-cols-1 gap-8'>
        {/* Recent Activities */}
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='w-5 h-5 text-blue-600' />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className='space-y-4'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='h-12 bg-gray-200 rounded animate-pulse'></div>
                ))}
              </div>
            ) : (
              <div className='space-y-4'>
                {recentActivities?.map((activity) => (
                  <div key={activity.id} className='flex items-start gap-3'>
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${activity.severity === 'success'
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
                      <p className='text-xs text-gray-500'>
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='mt-8'>
        <h2 className='text-xl text-gray-900 mb-6'>Thao tác nhanh</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer group h-full'>
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
            </Link>
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
            {statsLoading ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className='h-16 bg-gray-200 rounded animate-pulse'></div>
                ))}
              </div>
            ) : dashboardStats ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-blue-600'>{dashboardStats.users.total}</div>
                  <div className='text-sm text-gray-600'>Tổng cộng</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-green-600'>{dashboardStats.users.customers}</div>
                  <div className='text-sm text-gray-600'>Khách hàng</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-[#4A90E2]'>{dashboardStats.users.pharmacists}</div>
                  <div className='text-sm text-gray-600'>Dược sĩ</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-orange-600'>{dashboardStats.users.admins}</div>
                  <div className='text-sm text-gray-600'>Admin</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-medium text-emerald-600'>{dashboardStats.users.verified}</div>
                  <div className='text-sm text-gray-600'>Đã xác thực</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
