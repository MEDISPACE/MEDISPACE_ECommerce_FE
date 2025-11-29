import { Eye, Edit, Download, MoreVertical, Calendar, Phone, MapPin } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
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

interface OrderTableProps {
  orders: Order[]
  selectedOrders: string[]
  onSelectAll: (checked: boolean) => void
  onSelectOrder: (orderId: string, checked: boolean) => void
  onUpdateStatus: (order: Order) => void
  onViewDetails: (orderId: string) => void
  config: RoleConfig
}

export function OrderTable({
  orders,
  selectedOrders,
  onSelectAll,
  onSelectOrder,
  onUpdateStatus,
  onViewDetails,
  config,
}: OrderTableProps) {
  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-12'>
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={onSelectAll}
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
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={(checked) => onSelectOrder(order.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div>
                  <button
                    onClick={() => onViewDetails(order.id)}
                    className={`font-medium text-${config.themeColor}-600 hover:text-${config.themeColor}-800 hover:underline cursor-pointer transition-colors`}
                  >
                    {order.id}
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
                <p className={`font-semibold text-${config.themeColor}-600`}>₫{order.total.toLocaleString('vi-VN')}</p>
                <p className='text-xs text-gray-500'>{order.paymentMethod}</p>
              </TableCell>
              <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
              <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
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
                  <DropdownMenuContent align='end' className='bg-white border border-blue-200 shadow-lg'>
                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
                      <Eye className='w-4 h-4 mr-2' />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(order)}>
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
  )
}
