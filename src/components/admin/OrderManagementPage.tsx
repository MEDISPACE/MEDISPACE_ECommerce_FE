import { useState } from 'react'
import {
  ShoppingCart,
  Search,
  Edit,
  Eye,
  Download,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import { getOrderStatusBadge, getPaymentStatusBadge } from '../../utils/badgeUtils'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: number
  total: number
  status: OrderStatus
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'refunded'
  shippingAddress: string
  orderDate: string
  requiresPrescription: boolean
}

const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'nguyenvanan@example.com',
    customerPhone: '0901234567',
    items: 3,
    total: 450000,
    status: 'pending',
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    shippingAddress: '123 Đường Lê Lợi, Q.1, TP.HCM',
    orderDate: '2025-01-09T10:30:00',
    requiresPrescription: true,
  },
  {
    id: 'ORD-2024-002',
    customerName: 'Trần Thị Bình',
    customerEmail: 'tranthibinh@example.com',
    customerPhone: '0912345678',
    items: 2,
    total: 285000,
    status: 'confirmed',
    paymentMethod: 'VNPay',
    paymentStatus: 'paid',
    shippingAddress: '456 Nguyễn Huệ, Q.1, TP.HCM',
    orderDate: '2025-01-09T09:15:00',
    requiresPrescription: false,
  },
  {
    id: 'ORD-2024-003',
    customerName: 'Lê Văn Cường',
    customerEmail: 'levancuong@example.com',
    customerPhone: '0923456789',
    items: 5,
    total: 1250000,
    status: 'processing',
    paymentMethod: 'MoMo',
    paymentStatus: 'paid',
    shippingAddress: '789 Hai Bà Trưng, Q.3, TP.HCM',
    orderDate: '2025-01-08T14:20:00',
    requiresPrescription: false,
  },
  {
    id: 'ORD-2024-004',
    customerName: 'Phạm Thị Dung',
    customerEmail: 'phamthidung@example.com',
    customerPhone: '0934567890',
    items: 1,
    total: 85000,
    status: 'shipping',
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    shippingAddress: '321 Lý Tự Trọng, Q.1, TP.HCM',
    orderDate: '2025-01-08T08:45:00',
    requiresPrescription: true,
  },
  {
    id: 'ORD-2024-005',
    customerName: 'Hoàng Minh Tú',
    customerEmail: 'hoangminhtu@example.com',
    customerPhone: '0945678901',
    items: 4,
    total: 680000,
    status: 'delivered',
    paymentMethod: 'VNPay',
    paymentStatus: 'paid',
    shippingAddress: '654 Trần Hưng Đạo, Q.5, TP.HCM',
    orderDate: '2025-01-07T11:00:00',
    requiresPrescription: false,
  },
  {
    id: 'ORD-2024-006',
    customerName: 'Võ Thị Hoa',
    customerEmail: 'vothihoa@example.com',
    customerPhone: '0956789012',
    items: 2,
    total: 320000,
    status: 'cancelled',
    paymentMethod: 'MoMo',
    paymentStatus: 'refunded',
    shippingAddress: '987 Võ Văn Kiệt, Q.6, TP.HCM',
    orderDate: '2025-01-07T15:30:00',
    requiresPrescription: false,
  },
]

export function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPayment, setFilterPayment] = useState<string>('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending')

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
    setShowUpdateDialog(true)
  }

  const confirmUpdateStatus = () => {
    if (currentOrder && newStatus) {
      setOrders(orders.map((o) => (o.id === currentOrder.id ? { ...o, status: newStatus } : o)))
      toast.success(`Đã cập nhật trạng thái đơn hàng ${currentOrder.id}`)
      setShowUpdateDialog(false)
      setCurrentOrder(null)
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

  return (
    <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
              Quản lý đơn hàng
            </h1>
            <p className='text-gray-600 mt-2'>Theo dõi và quản lý tất cả đơn hàng</p>
          </div>
          <Button variant='outline' className='gap-2'>
            <Download className='w-4 h-4' />
            Xuất báo cáo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4'>
          <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Tổng đơn</p>
                  <p className='text-2xl font-semibold text-blue-600'>{stats.total}</p>
                </div>
                <ShoppingCart className='w-8 h-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Chờ xử lý</p>
                  <p className='text-2xl font-semibold text-yellow-600'>{stats.pending}</p>
                </div>
                <Clock className='w-8 h-8 text-yellow-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đang xử lý</p>
                  <p className='text-2xl font-semibold text-[#4A90E2]'>{stats.processing}</p>
                </div>
                <Package className='w-8 h-8 text-[#4A90E2]' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đã giao</p>
                  <p className='text-2xl font-semibold text-green-600'>{stats.delivered}</p>
                </div>
                <CheckCircle className='w-8 h-8 text-green-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Đã hủy</p>
                  <p className='text-2xl font-semibold text-red-600'>{stats.cancelled}</p>
                </div>
                <XCircle className='w-8 h-8 text-red-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/80 backdrop-blur-lg border-blue-100 lg:col-span-2'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-gray-600'>Tổng doanh thu</p>
                  <p className='text-xl font-semibold text-green-600'>₫{(stats.revenue / 1000000).toFixed(1)}M</p>
                  <p className='text-xs text-gray-500 mt-1'>TB: ₫{Math.round(stats.avgOrder / 1000)}K/đơn</p>
                </div>
                <DollarSign className='w-8 h-8 text-green-400' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardContent className='p-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm theo mã đơn, tên khách hàng, SĐT...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-48 border-2 border-blue-200'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='pending'>Chờ xử lý</SelectItem>
                  <SelectItem value='confirmed'>Đã xác nhận</SelectItem>
                  <SelectItem value='processing'>Đang chuẩn bị</SelectItem>
                  <SelectItem value='shipping'>Đang giao</SelectItem>
                  <SelectItem value='delivered'>Đã giao</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className='w-48 border-2 border-blue-200'>
                  <SelectValue placeholder='Thanh toán' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='paid'>Đã thanh toán</SelectItem>
                  <SelectItem value='pending'>Chưa thanh toán</SelectItem>
                  <SelectItem value='refunded'>Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShoppingCart className='w-5 h-5 text-blue-600' />
              Danh sách đơn hàng ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-12'>
                      <Checkbox
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium text-blue-600'>{order.id}</p>
                          {order.requiresPrescription && (
                            <Badge className='bg-red-100 text-red-700 mt-1 text-xs'>Rx</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <p className='font-medium text-gray-900'>{order.customerName}</p>
                          <div className='flex items-center gap-2 text-xs text-gray-600'>
                            <Phone className='w-3 h-3' />
                            {order.customerPhone}
                          </div>
                          <div className='flex items-center gap-2 text-xs text-gray-500'>
                            <MapPin className='w-3 h-3' />
                            {order.shippingAddress}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='text-gray-700'>{order.items} sản phẩm</span>
                      </TableCell>
                      <TableCell>
                        <p className='font-semibold text-blue-600'>₫{order.total.toLocaleString('vi-VN')}</p>
                        <p className='text-xs text-gray-500'>{order.paymentMethod}</p>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Calendar className='w-3 h-3' />
                          {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                        </div>
                        <p className='text-xs text-gray-500'>
                          {new Date(order.orderDate).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreVertical className='w-4 h-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className='w-4 h-4 mr-2' />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order)}>
                              <Edit className='w-4 h-4 mr-2' />
                              Cập nhật trạng thái
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className='w-4 h-4 mr-2' />
                              In hóa đơn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                <Textarea placeholder='Ghi chú về việc cập nhật...' className='border-2 border-blue-200' />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowUpdateDialog(false)}>
                Hủy
              </Button>
              <Button onClick={confirmUpdateStatus} className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2]'>
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
