import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Plus,
  FileText,
  MessageCircle,
  BarChart3,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Package,
  Pill,
  Eye,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useStatsCards } from '~/components/shared/useStatsCards'
import { StatsCardGrid, type StatCardConfig } from '~/components/shared/StatsCard'
import { dashboardService, type DashboardStats, type Prescription, type Order } from '~/services/pharmacist'
import { prescriptionService } from '~/services/pharmacist/prescription.service'
import { orderService } from '~/services/pharmacist/order.service'
import { OrderDetailsDrawer } from '~/components/shared/OrderManagement/OrderDetailsDrawer'
import { PrescriptionDetailsDialog } from './PrescriptionDetailsDialog'
import { toast } from 'sonner'
import { formatCurrency } from '~/utils/formatCurrency'

export function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const { StatsCard } = useStatsCards()

  // State for real API data
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  // State for order details drawer
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // State for prescription details
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  // Load dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        // Load stats and recent data in parallel
        const [statsData, prescriptions, ordersResponse] = await Promise.all([
          dashboardService.getStats(),
          prescriptionService.getAll({ limit: 5 }),
          orderService.getOrders({ limit: 5 }),
        ])

        const orders = ordersResponse.orders

        setStats(statsData)
        setRecentPrescriptions(prescriptions)
        setRecentOrders(orders)
      } catch (error) {
        const err = error as { response?: { status?: number; data?: { message?: string } } }

        // Check if it's an authentication error
        if (err.response?.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn', {
            description: 'Vui lòng đăng nhập lại',
          })
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        } else {
          toast.error('Không thể tải dữ liệu dashboard', {
            description: err.response?.data?.message || 'Vui lòng thử lại sau',
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('vi-VN')
  }

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
  }

  const handlePrescriptionUpdate = async () => {
    // Reload dashboard data after prescription update
    const [prescriptions] = await Promise.all([prescriptionService.getAll({ limit: 5 })])
    setRecentPrescriptions(prescriptions)
  }

  const handleCreateOrder = (prescriptionId: string) => {
    window.location.href = `/pharmacist/create-order?prescriptionId=${prescriptionId}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
      case 'verified':
        return 'bg-green-100 text-green-700'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'active':
        return 'bg-[#E8EDF5] text-[#0A2463]'
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'preparing':
      case 'processing':
      case 'shipped':
        return 'bg-orange-100 text-orange-700'
      case 'expired':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý'
      case 'approved':
      case 'verified':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'cancelled':
        return 'Đã hủy'
      case 'active':
        return 'Đang chat'
      case 'completed':
        return 'Hoàn thành'
      case 'delivered':
        return 'Đã giao'
      case 'confirmed':
        return 'Đã xác nhận'
      case 'preparing':
        return 'Đang chuẩn bị'
      case 'processing':
        return 'Đang xử lý'
      case 'shipped':
        return 'Đang giao'
      case 'expired':
        return 'Hết hạn'
      default:
        return status
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF] mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  // Define stats cards config using real API data
  const statsCards: StatCardConfig[] = [
    {
      title: 'Đơn thuốc chờ',
      value: stats?.pendingPrescriptions || 0,
      icon: FileText,
      color: 'yellow',
      badge:
        (stats?.pendingPrescriptions || 0) > 0
          ? {
              text: 'Cần xử lý',
              icon: AlertCircle,
              show: true,
            }
          : undefined,
    },
    {
      title: 'Đơn hàng hôm nay',
      value: stats?.ordersToday || 0,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Doanh thu hôm nay',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'emerald',
      trend: stats?.prescriptionsToday
        ? {
            value: `${stats.prescriptionsToday.verified}/${stats.prescriptionsToday.total}`,
            type: 'positive' as const,
            label: 'đơn đã duyệt',
          }
        : undefined,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1
          className='text-3xl font-bold bg-clip-text text-transparent'
          style={{
            backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
          }}
        >
          Dashboard Tổng quan
        </h1>
        <p className='text-gray-600 mt-2'>Quản lý công việc hàng ngày của bạn</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-4 bg-white shadow-lg border-2 border-[#E8EDF5] rounded-lg p-1.5 gap-1 h-auto'>
          <TabsTrigger
            value='overview'
            className='border-0 outline-none focus-visible:ring-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A2463] data-[state=active]:to-[#1E40AF] data-[state=active]:!text-white data-[state=active]:shadow-md text-gray-700 hover:text-[#1E40AF] hover:bg-[#F0F6FF] transition-all rounded-md font-medium py-2'
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value='prescriptions'
            className='border-0 outline-none focus-visible:ring-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A2463] data-[state=active]:to-[#1E40AF] data-[state=active]:!text-white data-[state=active]:shadow-md text-gray-700 hover:text-[#1E40AF] hover:bg-[#F0F6FF] transition-all rounded-md font-medium py-2'
          >
            Đơn thuốc
          </TabsTrigger>
          <TabsTrigger
            value='create-order'
            className='border-0 outline-none focus-visible:ring-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A2463] data-[state=active]:to-[#1E40AF] data-[state=active]:!text-white data-[state=active]:shadow-md text-gray-700 hover:text-[#1E40AF] hover:bg-[#F0F6FF] transition-all rounded-md font-medium py-2'
          >
            Tạo đơn hàng
          </TabsTrigger>
          <TabsTrigger
            value='reports'
            className='border-0 outline-none focus-visible:ring-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0A2463] data-[state=active]:to-[#1E40AF] data-[state=active]:!text-white data-[state=active]:shadow-md text-gray-700 hover:text-[#1E40AF] hover:bg-[#F0F6FF] transition-all rounded-md font-medium py-2'
          >
            Báo cáo
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          {/* Stats Cards - Using reusable hook */}
          <StatsCardGrid cols={4}>
            {statsCards.map((stat, index) => (
              <StatsCard key={index} config={stat} />
            ))}
          </StatsCardGrid>

          {/* Recent Activities */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Recent Prescriptions */}
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-[#E8EDF5]'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center justify-between'>
                  Đơn thuốc mới nhất
                  <Link to='/pharmacist/prescriptions'>
                    <Button variant='outline' size='sm'>
                      Xem tất cả
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {recentPrescriptions.length === 0 ? (
                  <p className='text-center text-gray-500 py-4'>Chưa có đơn thuốc nào</p>
                ) : (
                  recentPrescriptions.slice(0, 3).map((prescription) => (
                    <div key={prescription._id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <Avatar className='w-8 h-8 bg-[#E8EDF5]'>
                            <AvatarFallback>
                              <Pill className='w-4 h-4 text-[#1E40AF]' />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>{prescription.prescriptionNumber}</p>
                            <p className='text-xs text-gray-500'>{prescription.doctorName}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(prescription.status?.toLowerCase() || 'pending')}`}>
                          {getStatusText(prescription.status?.toLowerCase() || 'pending')}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-600 mb-2'>{prescription.medications.length} loại thuốc</p>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-500'>{formatTime(prescription.createdAt)}</span>
                        <Button size='sm' variant='outline' onClick={() => handleViewPrescription(prescription)}>
                          <Eye className='w-4 h-4 mr-1' />
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-[#E8EDF5]'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center justify-between'>
                  Đơn hàng mới nhất
                  <Link to='/pharmacist/orders'>
                    <Button variant='outline' size='sm'>
                      Xem tất cả
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {recentOrders.length === 0 ? (
                  <p className='text-center text-gray-500 py-4'>Chưa có đơn hàng nào</p>
                ) : (
                  recentOrders.slice(0, 3).map((order) => (
                    <div key={order._id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <Avatar className='w-8 h-8 bg-green-100'>
                            <AvatarFallback>
                              <Package className='w-4 h-4 text-green-600' />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-sm'>{order.orderNumber}</p>
                            <p className='text-xs text-gray-500'>
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(order.orderStatus?.toLowerCase() || 'pending')}`}>
                          {getStatusText(order.orderStatus?.toLowerCase() || 'pending')}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-600 mb-2'>
                        {order.itemCount} sản phẩm - {formatCurrency(order.totalAmount)}
                      </p>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-500'>{formatTime(order.createdAt)}</span>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={async () => {
                            try {
                              const orderDetails = await orderService.getOrderDetails(order._id)
                              setSelectedOrder(orderDetails)
                              setShowOrderDetails(true)
                            } catch (error) {
                              toast.error('Không thể tải chi tiết đơn hàng')
                            }
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value='prescriptions'>
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-800 flex items-center justify-between'>
                Quản lý đơn thuốc
                <Link to='/pharmacist/prescriptions'>
                  <Button>
                    <Plus className='w-4 h-4 mr-2' />
                    Xem chi tiết
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentPrescriptions.length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>Chưa có đơn thuốc nào</p>
                ) : (
                  recentPrescriptions.map((prescription) => (
                    <div key={prescription._id} className='border border-gray-200 rounded-lg p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-center gap-4'>
                          <Avatar className='bg-[#E8EDF5]'>
                            <AvatarFallback>
                              <Pill className='w-5 h-5 text-[#1E40AF]' />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className='font-medium'>{prescription.prescriptionNumber}</h3>
                            <p className='text-sm text-gray-600'>{prescription.doctorName}</p>
                            <p className='text-xs text-gray-500'>
                              {formatDate(prescription.createdAt)} lúc {formatTime(prescription.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(prescription.status?.toLowerCase() || 'pending')}>
                          {getStatusText(prescription.status?.toLowerCase() || 'pending')}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                        <div>
                          <p className='text-sm font-medium mb-1'>Thuốc:</p>
                          <p className='text-sm text-gray-600'>{prescription.medications.length} loại</p>
                        </div>
                        <div>
                          <p className='text-sm font-medium mb-1'>Ghi chú:</p>
                          <p className='text-sm text-gray-600'>{prescription.notes || 'Không có'}</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <Button variant='outline' size='sm' onClick={() => handleViewPrescription(prescription)}>
                          <Eye className='w-4 h-4 mr-1' />
                          Xem chi tiết
                        </Button>
                        {prescription.status === 'verified' && (
                          <Button
                            size='sm'
                            onClick={() => handleCreateOrder(prescription._id)}
                            className='bg-[#0A2463] hover:bg-[#071A49] text-white'
                          >
                            <Plus className='w-4 h-4 mr-1' />
                            Tạo đơn hàng
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Order Tab */}
        <TabsContent value='create-order'>
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-800 flex items-center gap-2'>
                <Plus className='w-5 h-5' />
                Tạo đơn hàng mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-12'>
                <Plus className='w-16 h-16 text-blue-300 mx-auto mb-4' />
                <h3 className='text-xl font-medium text-gray-900 mb-2'>Module tạo đơn hàng</h3>
                <p className='text-gray-600 mb-6'>Tính năng này sẽ được triển khai trong phiên bản tiếp theo</p>
                <Link to='/pharmacist/create-order'>
                  <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'>
                    Đi đến trang tạo đơn hàng
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value='reports'>
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg border-2 border-[#E8EDF5]'>
            <CardHeader>
              <CardTitle className='text-blue-800'>Báo cáo & Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-12'>
                <BarChart3 className='w-16 h-16 text-blue-300 mx-auto mb-4' />
                <h3 className='text-xl font-medium text-gray-900 mb-2'>Báo cáo chi tiết</h3>
                <p className='text-gray-600 mb-6'>Thống kê doanh thu, đơn hàng và hiệu suất làm việc</p>
                <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'>
                  Xem báo cáo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prescription Details Dialog */}
      <PrescriptionDetailsDialog
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
        onUpdate={handlePrescriptionUpdate}
      />

      {/* Order Details Drawer */}
      <OrderDetailsDrawer isOpen={showOrderDetails} onClose={() => setShowOrderDetails(false)} order={selectedOrder} />
    </div>
  )
}
