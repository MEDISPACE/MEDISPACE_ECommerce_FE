import { Search } from 'lucide-react'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface OrderFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  filterPayment: string
  onPaymentChange: (value: string) => void
}

export function OrderFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterPayment,
  onPaymentChange,
}: OrderFiltersProps) {
  return (
    <Card className='bg-white/80 backdrop-blur-lg border-blue-100'>
      <CardContent className='p-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm kiếm theo mã đơn, tên khách hàng, SĐT...'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='pl-10 border-2 border-blue-200 focus:border-blue-500'
            />
          </div>
          <Select value={filterStatus} onValueChange={onStatusChange}>
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
          <Select value={filterPayment} onValueChange={onPaymentChange}>
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
  )
}
