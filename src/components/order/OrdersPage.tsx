import { useState } from 'react'
import { Search, Package } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { OrderCard } from './OrderCard'
import { EmptyState } from '../shared/EmptyState'
import { mockOrders } from '../../utils/mockAccountData'

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  const filterOrders = (status?: string) => {
    let filtered = mockOrders

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

      if (timeFilter !== 'all') {
        filtered = filtered.filter((order) => new Date(order.createdAt) >= filterDate)
      }
    }

    return filtered
  }

  const getTabCounts = () => {
    return {
      all: mockOrders.length,
      pending_payment: mockOrders.filter((o) => o.status === 'pending_payment').length,
      processing: mockOrders.filter((o) => o.status === 'processing').length,
      shipping: mockOrders.filter((o) => o.status === 'shipping').length,
      delivered: mockOrders.filter((o) => o.status === 'delivered').length,
      cancelled: mockOrders.filter((o) => o.status === 'cancelled').length,
    }
  }

  const tabCounts = getTabCounts()
  const filteredOrders = filterOrders(selectedTab === 'all' ? undefined : selectedTab)

  const tabs = [
    { value: 'all', label: 'Tất cả', count: tabCounts.all },
    { value: 'pending_payment', label: 'Chờ thanh toán', count: tabCounts.pending_payment },
    { value: 'processing', label: 'Đang xử lý', count: tabCounts.processing },
    { value: 'shipping', label: 'Đang giao', count: tabCounts.shipping },
    { value: 'delivered', label: 'Hoàn thành', count: tabCounts.delivered },
    { value: 'cancelled', label: 'Đã hủy', count: tabCounts.cancelled },
  ]

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
        <TabsList className='grid w-full grid-cols-2 md:grid-cols-6 bg-blue-50'>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className='text-xs md:text-sm'>
              {tab.label}
              {tab.count > 0 && (
                <span className='ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs'>{tab.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Orders List */}
        <div className='mt-6'>
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
