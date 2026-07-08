import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Download, ShoppingCart, Plus, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
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
import type { Order, OrderReturnStatus, OrderStatus, PaymentStatus, UserRole } from './types'
import { PaginationComponent } from '../PaginationComponent'
import { orderService as pharmacistOrderService } from '../../../services/pharmacist/order.service'
import { orderService as generalOrderService } from '../../../services/orderService'
import adminService from '../../../services/adminService'
import type { Order as ApiOrder } from '../../../services/pharmacist/dashboard.service'
import { getErrorMessage } from '../../../constants/errorMapping'

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

const toUiOrderStatus = (status?: string): OrderStatus => {
  if (status === 'shipped') return 'shipping'
  return (status || 'pending') as OrderStatus
}

const getPersonName = (person?: any) => {
  const fullName = person?.fullName || `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim()
  return fullName || person?.email || undefined
}

// Map API order to component order format
const mapApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  const addr = apiOrder.shippingAddress
  const assignedPharmacist = (apiOrder as any).assignedPharmacist
  const createdByPharmacist = (apiOrder as any).createdByPharmacist || (apiOrder as any).createdByInfo
  const pharmacistName = getPersonName(assignedPharmacist) || getPersonName(createdByPharmacist)
  return {
    id: apiOrder._id,
    orderNumber: apiOrder.orderNumber,
    customerName: addr ? `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim() : 'Không có địa chỉ',
    customerPhone: addr?.phone ?? '',
    products: apiOrder.itemCount,
    total: apiOrder.totalAmount,
    status: toUiOrderStatus(apiOrder.orderStatus),
    paymentStatus: apiOrder.paymentStatus as PaymentStatus,
    returnStatus: (apiOrder.returnStatus || 'none') as OrderReturnStatus,
    latestReturnRequestId: apiOrder.latestReturnRequestId,
    returnUpdatedAt: apiOrder.returnUpdatedAt,
    date: formatDate(apiOrder.createdAt),
    pharmacistName,
    pharmacistPhone: assignedPharmacist?.phoneNumber || createdByPharmacist?.phoneNumber,
    pharmacistSource: assignedPharmacist?._id ? 'assigned' : createdByPharmacist?._id ? 'created' : 'unassigned',
  }
}

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang chuẩn bị' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'returned', label: 'Đổi/trả' },
]

const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thanh toán thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
  { value: 'partially_refunded', label: 'Hoàn tiền một phần' },
]

const toApiOrderStatus = (status?: OrderStatus) => {
  if (!status) return undefined
  return status === 'shipping' ? 'shipped' : status
}

const RETURN_FLOW_STATUSES = new Set(['requested', 'approved', 'awaiting_return', 'received', 'refund_processing', 'completed'])
const isOrderInReturnFlow = (order: Order) => order.status === 'returned' || RETURN_FLOW_STATUSES.has(order.returnStatus || '')

const TERMINAL_ORDER_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'returned']
const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = ['refunded']

const getAllowedOrderStatuses = (order: Order): OrderStatus[] => {
  if (TERMINAL_ORDER_STATUSES.includes(order.status)) return [order.status]

  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['pending', 'confirmed', 'cancelled'],
    confirmed: ['confirmed', 'processing', 'shipping', 'cancelled'],
    processing: ['processing', 'shipping', 'cancelled'],
    shipping: ['shipping', 'delivered', 'cancelled'],
    shipped: ['shipped', 'delivered', 'cancelled'],
    delivered: ['delivered'],
    cancelled: ['cancelled'],
    returned: ['returned'],
  }

  return transitions[order.status] || [order.status]
}

const getAllowedPaymentStatuses = (order: Order): PaymentStatus[] => {
  if (TERMINAL_PAYMENT_STATUSES.includes(order.paymentStatus)) return [order.paymentStatus]
  if (order.paymentStatus === 'partially_refunded') return ['partially_refunded', 'refunded']

  if (order.paymentStatus === 'paid') {
    return order.status === 'cancelled' || order.status === 'returned' ? ['paid', 'refunded'] : ['paid']
  }

  if (order.paymentStatus === 'failed') return ['failed', 'pending', 'paid']

  return ['pending', 'paid', 'failed']
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
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [detailsOrder, setDetailsOrder] = useState<ApiOrder | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending')
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>('')
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
            customerName: order.shippingAddress
              ? `${order.shippingAddress.firstName ?? ''} ${order.shippingAddress.lastName ?? ''}`.trim()
              : 'Không có địa chỉ',
            customerPhone: order.shippingAddress?.phone ?? '',
            products: order.items.length,
            total: order.total,
            status: toUiOrderStatus(order.status.toLowerCase()),
            paymentStatus: order.paymentStatus.toLowerCase() as PaymentStatus,
            date: formatDate(order.createdAt),
          }))
          setOrders(mappedOrders)
        }
      } catch (error) {
        const apiError = error as { response?: { data?: { message?: string } } }
        const message = apiError.response?.data?.message
        toast.error('Không thể tải danh sách đơn hàng', {
          description: message ? getErrorMessage(message) : 'Vui lòng thử lại sau',
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
    delivered: orders.filter((o) => o.status === 'delivered' && !isOrderInReturnFlow(o)).length,
    returned: orders.filter(isOrderInReturnFlow).length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    revenue: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    avgOrder:
      orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0) /
        orders.filter((o) => o.status !== 'cancelled').length || 0,
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery)
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'returned'
        ? isOrderInReturnFlow(order)
        : filterStatus === 'delivered'
          ? order.status === 'delivered' && !isOrderInReturnFlow(order)
          : order.status === filterStatus)
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
    setNewPaymentStatus(order.paymentStatus || 'pending')
    setNotes('')
    setShowUpdateDialog(true)
  }

  const executeStatusUpdate = async () => {
    if (!currentOrder || !newStatus) return

    try {
      const statusToSend = newStatus !== currentOrder.status ? toApiOrderStatus(newStatus) : undefined
      // Send payment status (only if different from current)
      const paymentStatusToSend = newPaymentStatus !== currentOrder.paymentStatus ? newPaymentStatus : undefined

      let updatedOrder: any
      if (role === 'pharmacist') {
        // Use pharmacist-specific API - backend expects 'status' not 'orderStatus'
        updatedOrder = await pharmacistOrderService.updateStatus(currentOrder.id, {
          status: statusToSend,
          paymentStatus: paymentStatusToSend,
          notes: notes || undefined,
        })
      } else if (role === 'admin') {
        // Use admin-specific API
        updatedOrder = await adminService.updateOrderStatus(currentOrder.id, {
          status: statusToSend,
          paymentStatus: paymentStatusToSend,
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
          returned: OrderStatusEnum.Returned,
        }
        updatedOrder = await generalOrderService.updateOrderStatus(currentOrder.id, statusMap[newStatus])
      }

      const normalizedOrder =
        updatedOrder?._id
          ? mapApiOrderToOrder(updatedOrder)
          : updatedOrder?.id
            ? {
                ...currentOrder,
                status: toUiOrderStatus(updatedOrder.status),
                paymentStatus: updatedOrder.paymentStatus as PaymentStatus,
                returnStatus: updatedOrder.returnStatus || currentOrder.returnStatus,
                latestReturnRequestId: updatedOrder.latestReturnRequestId || currentOrder.latestReturnRequestId,
                returnUpdatedAt: updatedOrder.returnUpdatedAt || currentOrder.returnUpdatedAt,
                total: updatedOrder.total ?? currentOrder.total,
              }
            : null

      if (normalizedOrder) {
        setOrders(orders.map((o) => (o.id === currentOrder.id ? { ...o, ...normalizedOrder } : o)))
      }

      // Show specific message for paid orders cancellation
      if (newStatus === 'cancelled' && currentOrder.paymentStatus === 'paid') {
        toast.success('Huỷ thành công', {
          description: 'Medispace sẽ liên hệ và hoàn tiền trong 72h làm việc.',
        })
      } else {
        toast.success('Cập nhật thành công', {
          description: `Đã cập nhật trạng thái đơn hàng thành công`,
        })
      }

      setShowUpdateDialog(false)
      setShowCancelConfirmDialog(false)
      setCurrentOrder(null)
      setNotes('')
      setNewPaymentStatus('')
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } }
      const message = apiError.response?.data?.message
      toast.error('Cập nhật thất bại', {
        description: message ? getErrorMessage(message) : 'Vui lòng thử lại sau',
      })
    }
  }

  const confirmUpdateStatus = () => {
    if (!currentOrder || !newStatus) return

    // Special handling for cancelling paid orders
    if (newStatus === 'cancelled' && currentOrder.paymentStatus === 'paid') {
      setShowCancelConfirmDialog(true)
      return
    }

    // Otherwise proceed directly
    executeStatusUpdate()
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF] mx-auto'></div>
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
          {/* {config.showExportButton && (
            <Button variant='outline' className='gap-2'>
              <Download className='w-4 h-4' />
              Xuất báo cáo
            </Button>
          )} */}
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
      <Card className='bg-white backdrop-blur-lg border-[#E8EDF5]'>
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
            onUpdateStatus={handleUpdateStatus}
            onViewDetails={handleViewDetails}
            config={config}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4 pt-4 border-t border-[#BFDBFE]'>
              <div className='text-sm text-gray-600'>
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} / {filteredOrders.length} đơn
                hàng
              </div>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
              Cập nhật trạng thái cho đơn hàng <strong>{currentOrder?.orderNumber || currentOrder?.id}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Trạng thái đơn hàng</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger className='border-2 border-[#BFDBFE]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={currentOrder ? !getAllowedOrderStatuses(currentOrder).includes(option.value) : false}
                    >
                      {option.label}
                      {currentOrder?.status === option.value && (
                        <span className='ml-2 text-xs text-[#1E40AF]'>(Hiện tại)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentOrder && TERMINAL_ORDER_STATUSES.includes(currentOrder.status) && (
                <p className='text-xs text-amber-600'>
                  Đơn ở trạng thái cuối, không thể chuyển ngược để tránh sai refund/coupon/points.
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Trạng thái thanh toán</Label>
              <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                <SelectTrigger className='border-2 border-[#BFDBFE]'>
                  <SelectValue placeholder='Giữ nguyên' />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={currentOrder ? !getAllowedPaymentStatuses(currentOrder).includes(option.value) : false}
                    >
                      {option.label}
                      {currentOrder?.paymentStatus === option.value && (
                        <span className='ml-2 text-xs text-[#1E40AF]'>(Hiện tại)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentOrder?.paymentStatus === 'paid' && currentOrder.status !== 'cancelled' && currentOrder.status !== 'returned' && (
                <p className='text-xs text-gray-500'>
                  Hoàn tiền nên đi qua luồng đổi/trả hoặc hủy đơn để BE xử lý points/coupon đúng.
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Ghi chú</Label>
              <Textarea
                placeholder='Ghi chú về việc cập nhật...'
                className='border-2 border-[#BFDBFE]'
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
              className='!text-white hover:!bg-[#071A49]'
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Paid Order Confirmation Dialog */}
      <AlertDialog open={showCancelConfirmDialog} onOpenChange={setShowCancelConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='w-5 h-5' />
              Xác nhận hủy đơn hàng đã thanh toán
            </AlertDialogTitle>
            <AlertDialogDescription className='text-base text-gray-600 mt-2'>
              Đơn hàng <b>#{currentOrder?.id}</b> đang có trạng thái thanh toán là <b>ĐÃ THANH TOÁN</b>.
              <br />
              <br />
              Việc hủy đơn hàng này sẽ yêu cầu quy trình hoàn tiền thủ công. <b>Medispace</b> cam kết sẽ hoàn tiền cho
              khách hàng trong vòng <b>72h làm việc</b>.
              <br />
              <br />
              Bạn có chắc chắn muốn tiếp tục hủy không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quay lại</AlertDialogCancel>
            <AlertDialogAction className='bg-red-600 hover:bg-red-700 text-white' onClick={executeStatusUpdate}>
              Xác nhận hủy & Hoàn tiền
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
