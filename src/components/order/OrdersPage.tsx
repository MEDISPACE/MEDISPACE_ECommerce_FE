import { useState, useEffect } from 'react'
import { Search, Package } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { OrderCard } from './OrderCard'
import { EmptyState } from '../shared/EmptyState'
import { orderService } from '../../services/orderService'
import type { Order } from '../../types/account'

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const fetchedOrders = await orderService.getOrders()
      // Transform to account Order type
      const transformedOrders: Order[] = fetchedOrders.map((order) => {
        // Determine display status based on both orderStatus and paymentStatus
        let displayStatus:
          | 'pending_payment'
          | 'confirmed'
          | 'processing'
          | 'preparing'
          | 'shipping'
          | 'delivered'
          | 'cancelled'
          | 'returned'
          | 'pending'

        if (order.status === 'pending') {
          // If order is pending, check payment status
          displayStatus = order.paymentStatus === 'pending' ? 'pending_payment' : 'pending'
        } else if (order.status === 'shipped') {
          displayStatus = 'shipping'
        } else {
          displayStatus = order.status as any
        }

        return {
          id: order.id,
          customerId: order.userId,
          orderNumber: order.orderNumber,
          status: displayStatus,
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.featuredImage || item.product.image || item.product.images?.[0] || '',
            brand: item.product.brand?.name || '',
            unit: (item as any).unit || item.product.unit || 'viên',
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.total,
            discountAllocation: item.discountAllocation,
            pointsAllocation: item.pointsAllocation,
            isPrescription: item.product.requiresPrescription || false,
          })),
          subtotal: order.subtotal,
          shippingFee: order.shipping,
          discount: order.discount,
          total: order.total,
          shippingAddress: {
            id: '',
            userId: order.userId,
            type: 'home',
            recipientName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            phone: order.shippingAddress.phone,
            addressLine1: order.shippingAddress.address,
            ward: order.shippingAddress.ward,
            district: order.shippingAddress.district,
            city: order.shippingAddress.province,
            isDefault: false,
          },
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus as Order['paymentStatus'],
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveryMethod: order.shippingMethod,
          notes: order.notes,
          timeline: [], // TODO: Add timeline if available,
        }
      })
      setOrders(transformedOrders)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = (status?: string) => {
    let filtered = orders

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter((order) => order.status === status)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (timeFilter) {
        case '7days':
          filterDate.setDate(now.getDate() - 7)
          break
        case '1month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case '3months':
          filterDate.setMonth(now.getMonth() - 3)
          break
        case '1year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter((order) => new Date(order.createdAt) >= filterDate)
    }

    return filtered
  }

  const getTabCounts = () => {
    return {
      all: orders.length,
      pending_payment: orders.filter((o) => o.status === 'pending_payment').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      returned: orders.filter((o) => o.status === 'returned').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }

  const tabCounts = getTabCounts()
  const filteredOrders = filterOrders(selectedTab === 'all' ? undefined : selectedTab)

  const tabs = [
    { value: 'all', label: 'Tất cả', count: tabCounts.all },
    { value: 'pending_payment', label: 'Chờ thanh toán', count: tabCounts.pending_payment },
    { value: 'confirmed', label: 'Đã xác nhận', count: tabCounts.confirmed },
    { value: 'processing', label: 'Đang xử lý', count: tabCounts.processing },
    { value: 'shipping', label: 'Đang giao', count: tabCounts.shipping },
    { value: 'delivered', label: 'Hoàn thành', count: tabCounts.delivered },
    { value: 'returned', label: 'Đã trả hàng', count: tabCounts.returned },
    { value: 'cancelled', label: 'Đã hủy', count: tabCounts.cancelled },
  ]

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Đang tải đơn hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-blue-800 mb-2'>Lịch sử đơn hàng</h1>
        <p className='text-gray-600'>Theo dõi và quản lý tất cả đơn hàng của bạn</p>
      </div>

      {/* Filters */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Tìm đơn hàng theo mã hoặc tên sản phẩm...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 border-blue-200 focus:border-blue-500'
          />
        </div>

        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className='w-full md:w-[200px] border-blue-200'>
            <SelectValue placeholder='Lọc theo thời gian' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả thời gian</SelectItem>
            <SelectItem value='7days'>7 ngày qua</SelectItem>
            <SelectItem value='1month'>1 tháng qua</SelectItem>
            <SelectItem value='3months'>3 tháng qua</SelectItem>
            <SelectItem value='1year'>1 năm qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className='w-full'>
        <TabsList className='!inline-flex !overflow-x-auto !gap-1.5 !h-auto !w-full !bg-blue-50 !p-2 !pb-3 !rounded-lg !justify-start scrollbar-thin'>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='flex-shrink-0 text-sm px-3 py-2 !bg-white !text-gray-700 border border-blue-200 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 transition-all duration-200 rounded-md hover:!bg-blue-100'
            >
              <span className='whitespace-nowrap'>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    selectedTab === tab.value ? 'bg-white/90 text-blue-600' : 'bg-blue-500 text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Orders List */}
        <div className='mt-5'>
          {filteredOrders.length > 0 ? (
            <div className='space-y-4'>
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}

              {/* Pagination */}
              {filteredOrders.length > 10 && (
                <div className='flex justify-center pt-6'>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' disabled>
                      Trước
                    </Button>
                    <Button variant='outline' size='sm' className='bg-blue-600 text-white'>
                      1
                    </Button>
                    <Button variant='outline' size='sm'>
                      2
                    </Button>
                    <Button variant='outline' size='sm'>
                      3
                    </Button>
                    <Button variant='outline' size='sm'>
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Package className='w-16 h-16' />}
              title='Không tìm thấy đơn hàng'
              description={
                searchTerm || timeFilter !== 'all' || selectedTab !== 'all'
                  ? 'Không có đơn hàng nào phù hợp với bộ lọc của bạn. Thử thay đổi bộ lọc hoặc tìm kiếm khác.'
                  : 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên!'
              }
              actionLabel='Mua sắm ngay'
              actionUrl='/products'
            />
          )}
        </div>
      </Tabs>
    </div>
  )
}
