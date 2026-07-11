import { Eye, Edit, Download, MoreVertical, Calendar, Phone, MapPin } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { getOrderStatusBadge, getPaymentStatusBadge } from '../../../utils/badgeUtils'
import type { Order, RoleConfig } from './types'
import { formatCurrency } from '~/utils/formatCurrency'
import { PaymentMethodDisplay } from '../PaymentMethodDisplay'

interface OrderTableProps {
  orders: Order[]
  onUpdateStatus: (order: Order) => void
  onViewDetails: (orderId: string) => void
  config: RoleConfig
}

const ACTIVE_RETURN_STATUSES = new Set(['requested', 'approved', 'awaiting_return', 'received', 'refund_processing', 'completed'])

const returnStatusLabels: Record<string, string> = {
  requested: 'Đã yêu cầu hoàn trả',
  approved: 'Đã duyệt hoàn trả',
  awaiting_return: 'Đang thu hồi hàng',
  received: 'Đã nhận hàng trả',
  refund_processing: 'Đang hoàn tiền',
  completed: 'Hoàn trả hoàn tất',
  rejected: 'Từ chối hoàn trả',
  cancelled: 'Đã hủy hoàn trả',
}

const getReturnStatusBadge = (status?: string) => {
  if (!status || status === 'none') return null
  const terminalTone = status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : ''
  const rejectedTone = ['rejected', 'cancelled'].includes(status) ? 'bg-red-100 text-red-700 border-red-200' : ''
  const activeTone = !terminalTone && !rejectedTone ? 'bg-amber-100 text-amber-700 border-amber-200' : ''
  return <Badge className={`${terminalTone || rejectedTone || activeTone} mt-1 text-xs`}>{returnStatusLabels[status] || status}</Badge>
}

export function OrderTable({ orders, onUpdateStatus, onViewDetails, config }: OrderTableProps) {
  const showPharmacistColumn = config.themeColor === 'blue'

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='!border-b-2 !border-[#BFDBFE]'>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead>Tổng tiền</TableHead>
            {showPharmacistColumn && <TableHead>Dược sĩ xử lý</TableHead>}
            <TableHead>Hình thức thanh toán</TableHead>
            <TableHead>Trạng thái thanh toán</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày đặt</TableHead>
            <TableHead className='text-right'>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className='border-b border-[#BFDBFE] hover:bg-[#F0F6FF]/30'>
              <TableCell>
                <div>
                  <button
                    onClick={() => onViewDetails(order.id)}
                    className={`font-medium font-mono text-sm text-${config.themeColor}-600 hover:text-${config.themeColor}-800 hover:underline cursor-pointer transition-colors`}
                  >
                    {order.orderNumber || order.id}
                  </button>
                  {order.requiresPrescription && <Badge className='bg-red-100 text-red-700 mt-1 text-xs'>Rx</Badge>}
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
                <p className={`font-semibold text-${config.themeColor}-600`}>{formatCurrency(order.total)}</p>
              </TableCell>
              {showPharmacistColumn && (
                <TableCell>
                  {order.pharmacistName ? (
                    <div className='space-y-1'>
                      <p className='font-medium text-gray-900'>{order.pharmacistName}</p>
                      {order.pharmacistPhone && <p className='text-xs text-gray-500'>{order.pharmacistPhone}</p>}
                      <Badge className='bg-green-100 text-green-700 border-green-200 text-xs'>Đang xử lý</Badge>
                    </div>
                  ) : (
                    <Badge className='bg-gray-100 text-gray-600 border-gray-200 text-xs'>Chưa phân công</Badge>
                  )}
                </TableCell>
              )}
              <TableCell>
                <PaymentMethodDisplay
                  method={order.paymentMethod}
                  className='gap-2 text-xs'
                  logoClassName='h-3.5 w-auto max-w-full'
                  showDescription={false}
                />
              </TableCell>
              <TableCell>
                {getPaymentStatusBadge(order.paymentStatus, { paymentMethod: order.paymentMethod })}
              </TableCell>
              <TableCell>
                <div className='flex flex-col items-start gap-1'>
                  {ACTIVE_RETURN_STATUSES.has(order.returnStatus || '') ? getReturnStatusBadge(order.returnStatus) : getOrderStatusBadge(order.status)}
                  {ACTIVE_RETURN_STATUSES.has(order.returnStatus || '') && (
                    <span className='text-xs text-gray-500'>Đơn gốc: Đã giao</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='w-3 h-3' />
                  {order.date}
                </div>
              </TableCell>
              <TableCell className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm'>
                      <MoreVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='bg-white border border-[#BFDBFE] shadow-lg'>
                    <DropdownMenuLabel className='text-[#0A2463]'>Thao tác</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='hover:!bg-[#F0F6FF] hover:!text-[#1E40AF]'
                      onClick={() => onViewDetails(order.id)}
                    >
                      <Eye className='w-4 h-4 mr-2' />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='hover:!bg-[#F0F6FF] hover:!text-[#1E40AF]'
                      onClick={() => onUpdateStatus(order)}
                    >
                      <Edit className='w-4 h-4 mr-2' />
                      Cập nhật trạng thái
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem className='hover:!bg-[#F0F6FF]' onClick={() => onViewDetails(order.id)}>
                      <Download className='w-4 h-4 mr-2' />
                      In hóa đơn
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
