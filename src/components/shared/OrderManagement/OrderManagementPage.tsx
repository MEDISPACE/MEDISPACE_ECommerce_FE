import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Download, ShoppingCart, Plus } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Textarea } from '../../ui/textarea'
import { toast } from 'sonner'
import { getConfig } from './config'
import { OrderFilters } from './OrderFilters'
import { OrderStatsCards } from './OrderStatsCards'
import { OrderTable } from './OrderTable'
import { OrderDetailsDrawer } from './OrderDetailsDrawer'
import type { Order, OrderStatus, PaymentStatus, UserRole } from './types'
import { orderService as pharmacistOrderService } from '../../../services/pharmacist/order.service'
import { orderService as generalOrderService } from '../../../services/orderService'
import adminService from '../../../services/adminService'
import type { Order as ApiOrder } from '../../../services/pharmacist/dashboard.service'

import { OrderStatus as OrderStatusEnum } from '../../../types/order'

interface OrderManagementPageProps {
  role?: UserRole
}

// Helper function to safely format date
const formatDate = (dateValue: string | Date | undefined): string => {
  if (!dateValue) return 'N/A'

  try {
    const date = new Date(dateValue)
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('vi-VN')
  } catch {
    return 'N/A'
  }
}

// Map API order to component order format
const mapApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  return {
    id: apiOrder._id,
    customerName: `${apiOrder.shippingAddress.firstName} ${apiOrder.shippingAddress.lastName}`,
    customerPhone: apiOrder.shippingAddress.phone,
    products: apiOrder.itemCount,
    total: apiOrder.totalAmount,
    status: apiOrder.orderStatus as OrderStatus,
    paymentStatus: apiOrder.paymentStatus as 'pending' | 'paid' | 'failed',
    date: formatDate(apiOrder.createdAt),
  }
}

// Helper function to check if order is in date range
const isOrderInDateRange = (orderDate: string, filterDate: string): boolean => {
  if (filterDate === 'all') return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const orderDateObj = new Date(orderDate)
  orderDateObj.setHours(0, 0, 0, 0)

  switch (filterDate) {
    case 'today':
      return orderDateObj.getTime() === today.getTime()

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return orderDateObj.getTime() === yesterday.getTime()
    }

    case 'last7days': {
      const last7days = new Date(today)
      last7days.setDate(last7days.getDate() - 7)
      return orderDateObj >= last7days && orderDateObj <= today
    }

    case 'last30days': {
      const last30days = new Date(today)
      last30days.setDate(last30days.getDate() - 30)
      return orderDateObj >= last30days && orderDateObj <= today
    }

    case 'thisMonth':
      return orderDateObj.getMonth() === today.getMonth() && orderDateObj.getFullYear() === today.getFullYear()

    case 'lastMonth': {
      const lastMonth = new Date(today)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      return orderDateObj.getMonth() === lastMonth.getMonth() && orderDateObj.getFullYear() === lastMonth.getFullYear()
    }

    default:
      return true
  }
}

export function OrderManagementPage({ role = 'admin' }: OrderManagementPageProps) {
  const config = getConfig(role)
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<ApiOrder[]>([]) // Store all orders for date filtering
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [detailsOrder, setDetailsOrder] = useState<ApiOrder | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending')
  const [notes, setNotes] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)

        if (role === 'pharmacist') {
          // Use pharmacist-specific API
          const response = await pharmacistOrderService.getOrders({
            limit: 100, // Get all orders for now
          })
          setAllOrders(response.orders) // Store all orders
          const mappedOrders = response.orders.map(mapApiOrderToOrder)
          setOrders(mappedOrders)
        } else if (role === 'admin') {
          // Use admin-specific API
          const response = await adminService.getAllOrders({
            limit: 100, // Get all orders for now
          })
          setAllOrders(response.orders) // Store all orders for date filtering
          const mappedOrders = response.orders.map(mapApiOrderToOrder)
          setOrders(mappedOrders)
        } else {
          // Use general order API for other roles
          const apiOrders = await generalOrderService.getOrders()
          const mappedOrders: Order[] = apiOrders.map((order) => ({
            id: order.id,
            customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            customerPhone: order.shippingAddress.phone,
            products: order.items.length,
            total: order.total,
            status: order.status.toLowerCase() as OrderStatus,
            paymentStatus: order.paymentStatus.toLowerCase() as PaymentStatus,
            date: formatDate(order.createdAt),
          }))
          setOrders(mappedOrders)
        }
      } catch (error) {

        toast.error('Không thể tải danh sách đơn hàng', {
          description: 'Vui lòng thử lại sau',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [role])

  // Apply date filter when filterDate changes
  useEffect(() => {
    if ((role === 'pharmacist' || role === 'admin') && allOrders.length > 0) {
      const filtered = allOrders.filter((order) => isOrderInDateRange(order.createdAt, filterDate))
      const mappedOrders = filtered.map(mapApiOrderToOrder)
      setOrders(mappedOrders)
    }
  }, [filterDate, allOrders, role])

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'shipping').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    revenue: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    avgOrder:
      orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0) /
      orders.filter((o) => o.status !== 'cancelled').length || 0,
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery)
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesPayment = filterPayment === 'all' || order.paymentStatus === filterPayment
    return matchesSearch && matchesStatus && matchesPayment
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterPayment, filterDate])

  const handleViewDetails = async (orderId: string) => {
    try {
      if (role === 'pharmacist') {
        const orderDetails = await pharmacistOrderService.getOrderDetails(orderId)
        setDetailsOrder(orderDetails)
        setShowDetailsDrawer(true)
      } else if (role === 'admin') {
        // Use admin-specific API
        const orderDetails = await adminService.getOrderDetails(orderId)
        setDetailsOrder(orderDetails)
        setShowDetailsDrawer(true)
      } else {
        toast.info('Chi tiết đơn hàng đang được phát triển')
      }
    } catch (error) {

      toast.error('Không thể tải chi tiết đơn hàng')
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterPayment('all')
    setFilterDate('all')
  }

  const handleUpdateStatus = (order: Order) => {
    setCurrentOrder(order)
    setNewStatus(order.status)
    setNotes('')
    setShowUpdateDialog(true)
  }

  const confirmUpdateStatus = async () => {
    if (!currentOrder || !newStatus) return

    try {
      if (role === 'pharmacist') {
        // Use pharmacist-specific API - backend expects 'status' not 'orderStatus'
        await pharmacistOrderService.updateStatus(currentOrder.id, {
          status: newStatus,
          notes: notes || undefined,
        })
      } else if (role === 'admin') {
        // Use admin-specific API
        await adminService.updateOrderStatus(currentOrder.id, {
          status: newStatus,
          notes: notes || undefined,
        })
      } else {
        // Use general order API for other roles
        // Convert component OrderStatus to API OrderStatus enum
        const statusMap: Record<OrderStatus, OrderStatusEnum> = {
          pending: OrderStatusEnum.Pending,
          confirmed: OrderStatusEnum.Confirmed,
          processing: OrderStatusEnum.Processing,
          shipping: OrderStatusEnum.Shipped,
          shipped: OrderStatusEnum.Shipped,
          delivered: OrderStatusEnum.Delivered,
          cancelled: OrderStatusEnum.Cancelled,
        }
        await generalOrderService.updateOrderStatus(currentOrder.id, statusMap[newStatus])
      }

      // Update local state
      setOrders(orders.map((o) => (o.id === currentOrder.id ? { ...o, status: newStatus } : o)))

      toast.success('Cập nhật thành công', {
        description: `Đã cập nhật trạng thái đơn hàng thành công`,
      })

      setShowUpdateDialog(false)
      setCurrentOrder(null)
      setNotes('')
    } catch (error) {

      toast.error('Cập nhật thất bại', {
        description: 'Vui lòng thử lại sau',
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map((o) => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId])
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId))
    }
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`,
            }}
          >
            {config.title}
          </h1>
          <p className='text-gray-600 mt-2'>{config.description}</p>
        </div>
        <div className='flex items-center gap-3'>
          {/* Create Order Button */}
          <Link to={role === 'admin' ? '/admin/create-order' : '/pharmacist/create-order'}>
            <Button
              className='gap-2 text-white'
              style={{
                backgroundImage: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`,
              }}
            >
              <Plus className='w-4 h-4' />
              Tạo đơn hàng
            </Button>
          </Link>

          {/* Export Button */}
          {config.showExportButton && (
            <Button variant='outline' className='gap-2'>
              <Download className='w-4 h-4' />
              Xuất báo cáo
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <OrderStatsCards stats={stats} config={config} />

      {/* Filters & Search */}
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterPayment={filterPayment}
        onPaymentChange={setFilterPayment}
        filterDate={filterDate}
        onDateChange={setFilterDate}
        onClearFilters={handleClearFilters}
      />

      {/* Orders Table */}
      <Card className='bg-white backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ShoppingCart className={`w-5 h-5 text-${config.themeColor}-600`} />
              Danh sách đơn hàng ({filteredOrders.length})
            </div>
            <div className='text-sm text-gray-600 font-normal'>
              Trang {currentPage} / {totalPages || 1}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable
            orders={paginatedOrders}
            selectedOrders={selectedOrders}
            onSelectAll={handleSelectAll}
            onSelectOrder={handleSelectOrder}
            onUpdateStatus={handleUpdateStatus}
            onViewDetails={handleViewDetails}
            config={config}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4 pt-4 border-t'>
              <div className='text-sm text-gray-600'>
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} / {filteredOrders.length} đơn
                hàng
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <div className='flex gap-1'>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer isOpen={showDetailsDrawer} onClose={() => setShowDetailsDrawer(false)} order={detailsOrder} />

      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái cho đơn hàng <strong>{currentOrder?.id}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Trạng thái mới</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger className='border-2 border-blue-200'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='pending'>Chờ xử lý</SelectItem>
                  <SelectItem value='confirmed'>Đã xác nhận</SelectItem>
                  <SelectItem value='processing'>Đang chuẩn bị</SelectItem>
                  <SelectItem value='shipping'>Đang giao</SelectItem>
                  <SelectItem value='delivered'>Đã giao</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Ghi chú</Label>
              <Textarea
                placeholder='Ghi chú về việc cập nhật...'
                className='border-2 border-blue-200'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowUpdateDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={confirmUpdateStatus}
              style={{
                backgroundImage: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`,
              }}
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
