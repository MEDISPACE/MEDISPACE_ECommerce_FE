import { useState, useEffect } from 'react'
import { Download, ShoppingCart } from 'lucide-react'
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
import type { Order, OrderStatus, PaymentStatus, UserRole } from './types'
import { orderService as pharmacistOrderService } from '../../../services/pharmacist/order.service'
import { orderService as generalOrderService } from '../../../services/orderService'
import type { Order as ApiOrder } from '../../../services/pharmacist/dashboard.service'

interface OrderManagementPageProps {
  role?: UserRole
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
    date: new Date(apiOrder.createdAt).toLocaleDateString('vi-VN'),
  }
}

export function OrderManagementPage({ role = 'admin' }: OrderManagementPageProps) {
  const config = getConfig(role)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending')
  const [notes, setNotes] = useState('')

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
          const mappedOrders = response.orders.map(mapApiOrderToOrder)
          setOrders(mappedOrders)
        } else {
          // Use general order API for admin
          const apiOrders = await generalOrderService.getOrders()
          const mappedOrders: Order[] = apiOrders.map((order) => ({
            id: order.id,
            customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            customerPhone: order.shippingAddress.phone,
            products: order.items.length,
            total: order.total,
            status: order.status.toLowerCase() as OrderStatus,
            paymentStatus: order.paymentStatus.toLowerCase() as PaymentStatus,
            date: new Date(order.createdAt).toLocaleDateString('vi-VN'),
          }))
          setOrders(mappedOrders)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        toast.error('Không thể tải danh sách đơn hàng', {
          description: 'Vui lòng thử lại sau',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [role])

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
        // Use pharmacist-specific API
        await pharmacistOrderService.updateStatus(currentOrder.id, {
          orderStatus: newStatus,
          notes: notes || undefined,
        })
      } else {
        // Use general order API for admin
        // Convert component OrderStatus to API OrderStatus
        const apiStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
        await generalOrderService.updateOrderStatus(currentOrder.id, apiStatus as any)
      }

      // Update local state
      setOrders(orders.map((o) => (o.id === currentOrder.id ? { ...o, status: newStatus } : o)))

      toast.success('Cập nhật thành công', {
        description: `Đã cập nhật trạng thái đơn hàng ${currentOrder.id}`,
      })

      setShowUpdateDialog(false)
      setCurrentOrder(null)
      setNotes('')
    } catch (error) {
      console.error('Failed to update order status:', error)
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
        {config.showExportButton && (
          <Button variant='outline' className='gap-2'>
            <Download className='w-4 h-4' />
            Xuất báo cáo
          </Button>
        )}
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
      />

      {/* Orders Table */}
      <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ShoppingCart className={`w-5 h-5 text-${config.themeColor}-600`} />
            Danh sách đơn hàng ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable
            orders={filteredOrders}
            selectedOrders={selectedOrders}
            onSelectAll={handleSelectAll}
            onSelectOrder={handleSelectOrder}
            onUpdateStatus={handleUpdateStatus}
            config={config}
          />
        </CardContent>
      </Card>

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
