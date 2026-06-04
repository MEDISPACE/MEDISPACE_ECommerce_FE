import { Search, Calendar, X } from 'lucide-react'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface OrderFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  filterPayment: string
  onPaymentChange: (value: string) => void
  filterDate: string
  onDateChange: (value: string) => void
  onClearFilters?: () => void
}

export function OrderFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterPayment,
  onPaymentChange,
  filterDate,
  onDateChange,
  onClearFilters,
}: OrderFiltersProps) {
  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterPayment !== 'all' || filterDate !== 'all'

  return (
    <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500' />
            <Input
              placeholder='Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại...'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='pl-12 pr-4 h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-base placeholder:text-gray-400 bg-white shadow-sm'
            />
          </div>

          {/* Filters Row */}
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className='w-full sm:w-[200px] border-2 border-blue-200 rounded-xl h-11 bg-white hover:bg-blue-50 transition-colors'>
                <SelectValue placeholder='🔄 Trạng thái' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='pending'>⏳ Chờ xử lý</SelectItem>
                <SelectItem value='confirmed'>✅ Đã xác nhận</SelectItem>
                <SelectItem value='processing'>📦 Đang chuẩn bị</SelectItem>
                <SelectItem value='shipping'>🚚 Đang giao</SelectItem>
                <SelectItem value='shipped'>🚚 Đã gửi hàng</SelectItem>
                <SelectItem value='delivered'>✔️ Đã giao</SelectItem>
                <SelectItem value='cancelled'>❌ Đã hủy</SelectItem>
                <SelectItem value='returned'>↩️ Đã trả hàng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPayment} onValueChange={onPaymentChange}>
              <SelectTrigger className='w-full sm:w-[200px] border-2 border-blue-200 rounded-xl h-11 bg-white hover:bg-blue-50 transition-colors'>
                <SelectValue placeholder='💳 Thanh toán' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='paid'>✅ Đã thanh toán</SelectItem>
                <SelectItem value='pending'>⏳ Chưa thanh toán</SelectItem>
                <SelectItem value='failed'>❌ Thanh toán thất bại</SelectItem>
                <SelectItem value='refunded'>↩️ Đã hoàn tiền</SelectItem>
                <SelectItem value='partially_refunded'>↩️ Hoàn tiền một phần</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDate} onValueChange={onDateChange}>
              <SelectTrigger className='w-full sm:w-[200px] border-2 border-blue-200 rounded-xl h-11 bg-white hover:bg-blue-50 transition-colors'>
                <SelectValue placeholder='📅 Thời gian' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả thời gian</SelectItem>
                <SelectItem value='today'>📅 Hôm nay</SelectItem>
                <SelectItem value='yesterday'>📆 Hôm qua</SelectItem>
                <SelectItem value='last7days'>📊 7 ngày qua</SelectItem>
                <SelectItem value='last30days'>📈 30 ngày qua</SelectItem>
                <SelectItem value='thisMonth'>🗓️ Tháng này</SelectItem>
                <SelectItem value='lastMonth'>📋 Tháng trước</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && onClearFilters && (
              <Button
                onClick={onClearFilters}
                variant='outline'
                size='sm'
                className='h-9 px-4 border-2 border-red-200 !text-red-600 hover:!bg-red-50 hover:!border-red-300 rounded-xl transition-all flex items-center gap-2'
              >
                <X className='w-4 h-4' />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
