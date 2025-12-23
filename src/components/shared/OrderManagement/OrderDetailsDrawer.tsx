import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { Package, MapPin, Phone, ShoppingCart, CreditCard, Truck } from 'lucide-react'
import type { Order } from '~/services/pharmacist'
import { formatCurrency } from '~/utils/formatCurrency'

interface OrderDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export function OrderDetailsDrawer({ isOpen, onClose, order }: OrderDetailsDrawerProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getOrderStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-700' },
      processing: { label: 'Đang chuẩn bị', className: 'bg-purple-100 text-purple-700' },
      shipping: { label: 'Đang giao', className: 'bg-indigo-100 text-indigo-700' },
      shipped: { label: 'Đang giao', className: 'bg-indigo-100 text-indigo-700' },
      delivered: { label: 'Đã giao', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant='secondary' className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      pending: { label: 'Chờ thanh toán', className: 'bg-yellow-100 text-yellow-700' },
      paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
      failed: { label: 'Thất bại', className: 'bg-red-100 text-red-700' },
      refunded: { label: 'Đã hoàn tiền', className: 'bg-gray-100 text-gray-700' },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant='secondary' className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (!order) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='w-full sm:max-w-2xl overflow-y-auto !bg-gradient-to-br from-blue-50/50 to-white'>
        <SheetHeader className='pb-4 border-b border-blue-100'>
          <SheetTitle className='text-2xl font-bold text-blue-900 flex items-center gap-2'>
            <Package className='w-6 h-6 text-blue-600' />
            Chi tiết đơn hàng
          </SheetTitle>
        </SheetHeader>

        <div className='mt-6 space-y-5'>
          {/* Order Info Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <Package className='w-5 h-5 text-blue-600' />
                Thông tin đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                <span className='text-sm text-gray-600'>Mã đơn hàng:</span>
                <span className='font-semibold text-blue-900'>{order.orderNumber}</span>
              </div>
              <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                <span className='text-sm text-gray-600'>Ngày đặt:</span>
                <span className='font-medium text-gray-900'>{formatDate(order.createdAt)}</span>
              </div>
              <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                <span className='text-sm text-gray-600'>Trạng thái:</span>
                {getOrderStatusBadge(order.orderStatus as OrderStatus)}
              </div>
              <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                <span className='text-sm text-gray-600'>Thanh toán:</span>
                {getPaymentStatusBadge(order.paymentStatus as PaymentStatus)}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-blue-600' />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 space-y-2'>
                <p className='font-semibold text-gray-900 text-lg'>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <div className='flex items-center gap-2 text-gray-600'>
                  <Phone className='w-4 h-4' />
                  <span>{order.shippingAddress.phone}</span>
                </div>
                {order.shippingAddress.email && (
                  <div className='flex items-center gap-2 text-gray-600'>
                    <span className='text-sm'>✉️</span>
                    <span>{order.shippingAddress.email}</span>
                  </div>
                )}
                <div className='flex items-start gap-2 text-gray-600 pt-2 border-t border-blue-100'>
                  <MapPin className='w-4 h-4 mt-0.5 flex-shrink-0' />
                  <span className='text-sm'>
                    {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district},{' '}
                    {order.shippingAddress.province}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <ShoppingCart className='w-5 h-5 text-blue-600' />
                Sản phẩm ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {order.items.map((item: Order['items'][0], index: number) => (
                <div
                  key={index}
                  className='flex gap-3 bg-gradient-to-r from-blue-50/50 to-white p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow'
                >
                  <div className='flex-1 space-y-1'>
                    <p className='font-semibold text-gray-900'>{item.name}</p>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>SKU: {item.sku}</span>
                      {(item as any).unit && (
                        <span className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                          {(item as any).unit}
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-gray-600'>
                      <span className='text-blue-600 font-medium'>{formatCurrency(item.unitPrice)}</span>
                      {(item as any).unit && <span className='text-gray-400'>/{(item as any).unit}</span>}
                      {' '}x {item.quantity}
                    </p>
                  </div>
                  <div className='text-right flex flex-col justify-center'>
                    <p className='text-lg font-bold text-blue-600'>{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <CreditCard className='w-5 h-5 text-blue-600' />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Tạm tính:</span>
                  <span className='font-medium text-gray-900'>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600 flex items-center gap-1'>
                    <Truck className='w-4 h-4' />
                    Phí vận chuyển:
                  </span>
                  <span className='font-medium text-gray-900'>{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>VAT (10%):</span>
                  <span className='font-medium text-gray-900'>{formatCurrency(order.taxAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className='flex justify-between items-center text-green-600'>
                    <span className='font-medium'>Giảm giá:</span>
                    <span className='font-semibold'>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <Separator className='my-2' />
                <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-white'>
                  <span className='text-lg font-bold'>Tổng cộng:</span>
                  <span className='text-2xl font-bold'>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {(order.notes ||
            ('pharmacistNotes' in order && (order as Order & { pharmacistNotes?: string }).pharmacistNotes)) && (
              <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg font-semibold text-blue-900'>Ghi chú</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {order.notes && (
                    <div className='bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200'>
                      <p className='text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2'>
                        <span>💬</span> Ghi chú khách hàng:
                      </p>
                      <p className='text-gray-700'>{order.notes}</p>
                    </div>
                  )}
                  {'pharmacistNotes' in order && (order as Order & { pharmacistNotes?: string }).pharmacistNotes && (
                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200'>
                      <p className='text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2'>
                        <span>💊</span> Ghi chú dược sĩ:
                      </p>
                      <p className='text-gray-700'>{(order as Order & { pharmacistNotes?: string }).pharmacistNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
