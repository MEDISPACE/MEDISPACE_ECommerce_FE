import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ChartNoAxesColumn,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Search,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
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
  const filterIconClassName = 'size-4'
  const filterItemClassName = 'inline-flex items-center gap-2'

  return (
    <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500' />
            <Input
              placeholder='Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại...'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='pl-12 pr-4 h-12 border-2 border-[#BFDBFE] focus:border-[#1E40AF] rounded-xl text-base placeholder:text-gray-400 bg-white shadow-sm'
            />
          </div>

          {/* Filters Row */}
          <div className='flex flex-wrap items-center gap-3'>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className='w-full sm:w-[200px] border-2 border-[#BFDBFE] rounded-xl h-11 bg-white hover:bg-[#F0F6FF] transition-colors'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='pending'>
                  <span className={filterItemClassName}>
                    <Clock3 className={`${filterIconClassName} text-amber-500`} />
                    <span>Chờ xử lý</span>
                  </span>
                </SelectItem>
                <SelectItem value='confirmed'>
                  <span className={filterItemClassName}>
                    <CheckCircle2 className={`${filterIconClassName} text-blue-600`} />
                    <span>Đã xác nhận</span>
                  </span>
                </SelectItem>
                <SelectItem value='processing'>
                  <span className={filterItemClassName}>
                    <PackageCheck className={`${filterIconClassName} text-indigo-600`} />
                    <span>Đang chuẩn bị</span>
                  </span>
                </SelectItem>
                <SelectItem value='shipping'>
                  <span className={filterItemClassName}>
                    <Truck className={`${filterIconClassName} text-sky-600`} />
                    <span>Đang giao</span>
                  </span>
                </SelectItem>
                <SelectItem value='shipped'>
                  <span className={filterItemClassName}>
                    <Truck className={`${filterIconClassName} text-cyan-600`} />
                    <span>Đã gửi hàng</span>
                  </span>
                </SelectItem>
                <SelectItem value='delivered'>
                  <span className={filterItemClassName}>
                    <CheckCircle2 className={`${filterIconClassName} text-emerald-600`} />
                    <span>Đã giao</span>
                  </span>
                </SelectItem>
                <SelectItem value='cancelled'>
                  <span className={filterItemClassName}>
                    <XCircle className={`${filterIconClassName} text-red-500`} />
                    <span>Đã hủy</span>
                  </span>
                </SelectItem>
                <SelectItem value='returned'>
                  <span className={filterItemClassName}>
                    <RotateCcw className={`${filterIconClassName} text-violet-600`} />
                    <span>Đổi/trả</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPayment} onValueChange={onPaymentChange}>
              <SelectTrigger className='w-full sm:w-[200px] border-2 border-[#BFDBFE] rounded-xl h-11 bg-white hover:bg-[#F0F6FF] transition-colors'>
                <SelectValue placeholder='Thanh toán' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='paid'>
                  <span className={filterItemClassName}>
                    <CheckCircle2 className={`${filterIconClassName} text-emerald-600`} />
                    <span>Đã thanh toán</span>
                  </span>
                </SelectItem>
                <SelectItem value='pending'>
                  <span className={filterItemClassName}>
                    <Clock3 className={`${filterIconClassName} text-amber-500`} />
                    <span>Chưa thanh toán</span>
                  </span>
                </SelectItem>
                <SelectItem value='failed'>
                  <span className={filterItemClassName}>
                    <XCircle className={`${filterIconClassName} text-red-500`} />
                    <span>Thanh toán thất bại</span>
                  </span>
                </SelectItem>
                <SelectItem value='refunded'>
                  <span className={filterItemClassName}>
                    <RotateCcw className={`${filterIconClassName} text-blue-600`} />
                    <span>Đã hoàn tiền</span>
                  </span>
                </SelectItem>
                <SelectItem value='partially_refunded'>
                  <span className={filterItemClassName}>
                    <ReceiptText className={`${filterIconClassName} text-blue-600`} />
                    <span>Hoàn tiền một phần</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDate} onValueChange={onDateChange}>
              <SelectTrigger className='w-full sm:w-[200px] border-2 border-[#BFDBFE] rounded-xl h-11 bg-white hover:bg-[#F0F6FF] transition-colors'>
                <SelectValue placeholder='Thời gian' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả thời gian</SelectItem>
                <SelectItem value='today'>
                  <span className={filterItemClassName}>
                    <Calendar className={`${filterIconClassName} text-blue-600`} />
                    <span>Hôm nay</span>
                  </span>
                </SelectItem>
                <SelectItem value='yesterday'>
                  <span className={filterItemClassName}>
                    <CalendarDays className={`${filterIconClassName} text-blue-600`} />
                    <span>Hôm qua</span>
                  </span>
                </SelectItem>
                <SelectItem value='last7days'>
                  <span className={filterItemClassName}>
                    <ChartColumn className={`${filterIconClassName} text-emerald-600`} />
                    <span>7 ngày qua</span>
                  </span>
                </SelectItem>
                <SelectItem value='last30days'>
                  <span className={filterItemClassName}>
                    <ChartNoAxesColumn className={`${filterIconClassName} text-indigo-600`} />
                    <span>30 ngày qua</span>
                  </span>
                </SelectItem>
                <SelectItem value='thisMonth'>
                  <span className={filterItemClassName}>
                    <CalendarDays className={`${filterIconClassName} text-violet-600`} />
                    <span>Tháng này</span>
                  </span>
                </SelectItem>
                <SelectItem value='lastMonth'>
                  <span className={filterItemClassName}>
                    <CalendarRange className={`${filterIconClassName} text-slate-600`} />
                    <span>Tháng trước</span>
                  </span>
                </SelectItem>
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
