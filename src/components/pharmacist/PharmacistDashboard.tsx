import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Plus,
  FileText,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Package,
  Pill,
  Eye,
  RefreshCw,
  ShoppingCart,
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
import { getErrorMessage } from '~/constants/errorMapping'

export function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const { StatsCard } = useStatsCards()

  // State for real API data
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loadErrors, setLoadErrors] = useState<{ stats?: string; prescriptions?: string; orders?: string }>({})

  // State for order details drawer
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // State for prescription details
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  const handleLoadError = (error: unknown) => {
    const err = error as { response?: { status?: number; data?: { message?: string } } }

    if (err.response?.status === 401) {
      toast.error('Phiên đăng nhập đã hết hạn', {
        description: 'Vui lòng đăng nhập lại',
      })
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return 'Phiên đăng nhập đã hết hạn'
    }

    const backendMessage = err.response?.data?.message
    return backendMessage ? getErrorMessage(backendMessage) : 'Không thể tải dữ liệu'
  }

  const loadDashboardData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true)

      const [statsResult, prescriptionsResult, ordersResult] = await Promise.allSettled([
        dashboardService.getStats(),
        prescriptionService.getAll({ limit: 4, status: 'pending' }),
        orderService.getOrders({ limit: 3 }),
      ])

      const nextErrors: typeof loadErrors = {}

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value)
      } else {
        nextErrors.stats = handleLoadError(statsResult.reason)
      }

      if (prescriptionsResult.status === 'fulfilled') {
        setRecentPrescriptions(prescriptionsResult.value)
      } else {
        nextErrors.prescriptions = handleLoadError(prescriptionsResult.reason)
      }

      if (ordersResult.status === 'fulfilled') {
        setRecentOrders(ordersResult.value.orders)
      } else {
        nextErrors.orders = handleLoadError(ordersResult.reason)
      }

      setLoadErrors(nextErrors)

      if (showToast && Object.keys(nextErrors).length === 0) {
        toast.success('Dashboard đã được cập nhật')
      } else if (showToast && Object.keys(nextErrors).length > 0) {
        toast.error('Một phần dữ liệu dashboard chưa tải được')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Load dashboard data from API and keep it fresh for daily operations.
  useEffect(() => {
    loadDashboardData()
    const interval = window.setInterval(() => loadDashboardData(), 60000)
    return () => window.clearInterval(interval)
  }, [loadDashboardData])

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
    await loadDashboardData()
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
    {
      title: 'Chat đang mở',
      value: stats?.activeChats || 0,
      icon: MessageCircle,
      color: 'blue',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
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
        <Button variant='outline' onClick={() => loadDashboardData(true)} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3 bg-white shadow-lg border-2 border-[#E8EDF5] rounded-lg p-1.5 gap-1 h-auto'>
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
                {loadErrors.prescriptions ? (
                  <p className='text-center text-red-500 py-4'>{loadErrors.prescriptions}</p>
                ) : recentPrescriptions.length === 0 ? (
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
                {loadErrors.orders ? (
                  <p className='text-center text-red-500 py-4'>{loadErrors.orders}</p>
                ) : recentOrders.length === 0 ? (
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
              <CardTitle className='text-blue-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <span>Quản lý đơn thuốc</span>
                <Link to='/pharmacist/prescriptions'>
                  <Button className='w-full sm:w-auto'>
                    <ArrowRight className='w-4 h-4 mr-2' />
                    Xem chi tiết
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {loadErrors.prescriptions ? (
                  <p className='text-center text-red-500 py-8'>{loadErrors.prescriptions}</p>
                ) : recentPrescriptions.length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>Chưa có đơn thuốc nào</p>
                ) : (
                  recentPrescriptions.map((prescription) => (
                    <div
                      key={prescription._id}
                      className='rounded-lg border border-[#E8EDF5] bg-white px-4 py-4 shadow-sm transition-colors hover:border-[#BFDBFE]'
                    >
                      <div className='grid gap-4 lg:grid-cols-[64px_minmax(0,1.6fr)_180px_220px_180px] lg:items-center'>
                        <Avatar className='h-12 w-12 bg-[#E8EDF5] lg:mx-auto'>
                          <AvatarFallback>
                            <Pill className='w-5 h-5 text-[#1E40AF]' />
                          </AvatarFallback>
                        </Avatar>

                        <div className='min-w-0'>
                          <div className='mb-1 flex min-w-0 flex-wrap items-center gap-2'>
                            <h3 className='truncate font-semibold text-gray-900'>{prescription.prescriptionNumber}</h3>
                            <Badge className={`shrink-0 ${getStatusColor(prescription.status?.toLowerCase() || 'pending')}`}>
                              {getStatusText(prescription.status?.toLowerCase() || 'pending')}
                            </Badge>
                          </div>
                          <p className='truncate text-sm font-medium text-gray-600'>{prescription.doctorName}</p>
                          <p className='mt-0.5 text-xs text-gray-500'>
                            {formatDate(prescription.createdAt)} lúc {formatTime(prescription.createdAt)}
                          </p>
                        </div>

                        <div className='min-h-[56px] rounded-md bg-[#F8FAFB] px-3 py-2'>
                          <p className='text-xs font-medium uppercase text-gray-500'>Thuốc</p>
                          <p className='text-sm font-semibold text-gray-900'>{prescription.medications.length} loại</p>
                        </div>

                        <div className='min-h-[56px] rounded-md bg-[#F8FAFB] px-3 py-2'>
                          <p className='text-xs font-medium uppercase text-gray-500'>Ghi chú</p>
                          <p className='line-clamp-1 text-sm font-semibold text-gray-900'>
                            {prescription.notes || 'Không có'}
                          </p>
                        </div>

                        <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
                          <Button className='w-full sm:w-auto lg:w-[164px]' variant='outline' size='sm' onClick={() => handleViewPrescription(prescription)}>
                            <Eye className='w-4 h-4 mr-1' />
                            Xem chi tiết
                          </Button>
                          {prescription.status === 'verified' && (
                            <Button
                              size='sm'
                              onClick={() => handleCreateOrder(prescription._id)}
                              className='w-full bg-[#0A2463] hover:bg-[#071A49] text-white sm:w-auto lg:w-[164px]'
                            >
                              <ShoppingCart className='w-4 h-4 mr-1' />
                              Tạo đơn hàng
                            </Button>
                          )}
                        </div>
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
              <div className='grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'>
                <div className='rounded-lg border border-[#E8EDF5] bg-[#F8FAFB] p-5'>
                  <div className='flex items-start gap-4'>
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E8EDF5] text-[#1E40AF]'>
                      <ShoppingCart className='h-6 w-6' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h3 className='text-lg font-semibold text-gray-900'>Tạo đơn bán tại quầy hoặc giao hàng</h3>
                      <p className='mt-1 text-sm text-gray-600'>
                        Tìm khách hàng, thêm sản phẩm, kiểm tra thuốc kê đơn và hoàn tất thanh toán trong flow tạo đơn
                        hàng đầy đủ.
                      </p>
                      <div className='mt-4 flex flex-wrap gap-2'>
                        <Link to='/pharmacist/create-order'>
                          <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white'>
                            <Plus className='w-4 h-4 mr-2' />
                            Tạo đơn mới
                          </Button>
                        </Link>
                        <Link to='/pharmacist/prescriptions'>
                          <Button variant='outline'>
                            <FileText className='w-4 h-4 mr-2' />
                            Chọn từ đơn thuốc
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border border-[#E8EDF5] bg-white p-5'>
                  <h3 className='font-semibold text-gray-900'>Việc cần xử lý trước khi tạo đơn</h3>
                  <div className='mt-4 space-y-3'>
                    <div className='flex items-center justify-between rounded-md bg-yellow-50 px-3 py-2'>
                      <span className='text-sm text-yellow-900'>Đơn thuốc chờ duyệt</span>
                      <span className='text-lg font-bold text-yellow-700'>{stats?.pendingPrescriptions || 0}</span>
                    </div>
                    <div className='flex items-center justify-between rounded-md bg-green-50 px-3 py-2'>
                      <span className='text-sm text-green-900'>Đơn hàng hôm nay</span>
                      <span className='text-lg font-bold text-green-700'>{stats?.ordersToday || 0}</span>
                    </div>
                  </div>
                </div>

                <div className='lg:col-span-2 rounded-lg border border-[#E8EDF5] bg-white p-5'>
                  <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <h3 className='font-semibold text-gray-900'>Đơn thuốc đang chờ xử lý</h3>
                      <p className='text-sm text-gray-600'>Duyệt đơn thuốc trước, sau đó tạo đơn hàng từ đơn đã duyệt.</p>
                    </div>
                    <Link to='/pharmacist/prescriptions'>
                      <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                        Xem toàn bộ
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                    </Link>
                  </div>

                  {loadErrors.prescriptions ? (
                    <p className='py-4 text-sm text-red-500'>{loadErrors.prescriptions}</p>
                  ) : recentPrescriptions.length === 0 ? (
                    <p className='py-6 text-center text-sm text-gray-500'>Không có đơn thuốc chờ xử lý.</p>
                  ) : (
                    <div className='grid gap-3 md:grid-cols-2'>
                      {recentPrescriptions.slice(0, 4).map((prescription) => (
                        <button
                          key={prescription._id}
                          type='button'
                          onClick={() => handleViewPrescription(prescription)}
                          className='rounded-lg border border-[#E8EDF5] p-4 text-left transition-colors hover:border-[#BFDBFE] hover:bg-[#F0F6FF]'
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <p className='truncate font-semibold text-gray-900'>{prescription.prescriptionNumber}</p>
                              <p className='mt-1 text-sm text-gray-600'>{prescription.doctorName}</p>
                              <p className='mt-1 text-xs text-gray-500'>
                                {prescription.medications.length} loại thuốc - {formatDate(prescription.createdAt)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(prescription.status?.toLowerCase() || 'pending')}>
                              {getStatusText(prescription.status?.toLowerCase() || 'pending')}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
