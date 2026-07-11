import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { Package, MapPin, Phone, ShoppingCart, CreditCard, Truck } from 'lucide-react'
import type { Order } from '~/services/pharmacist'
import { formatCurrency } from '~/utils/formatCurrency'
import { PaymentMethodDisplay } from '../PaymentMethodDisplay'
import { ShippingMethodDisplay } from '../ShippingMethodDisplay'

interface OrderDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'

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
      confirmed: { label: 'Đã xác nhận', className: 'bg-[#E8EDF5] text-[#0A2463]' },
      processing: { label: 'Đang chuẩn bị', className: 'bg-[#E8EDF5] text-[#1E40AF]' },
      shipping: { label: 'Đang giao', className: 'bg-[#E8EDF5] text-[#1E40AF]' },
      shipped: { label: 'Đang giao', className: 'bg-[#E8EDF5] text-[#1E40AF]' },
      delivered: { label: 'Đã giao', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
      returned: { label: 'Đã trả hàng', className: 'bg-orange-100 text-orange-700' },
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
      partially_refunded: { label: 'Hoàn tiền một phần', className: 'bg-slate-100 text-slate-700' },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant='secondary' className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getReturnStatusBadge = (status?: string) => {
    if (!status || status === 'none') return null
    const terminalTone = status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : ''
    const rejectedTone = ['rejected', 'cancelled'].includes(status) ? 'bg-red-100 text-red-700 border-red-200' : ''
    const activeTone = !terminalTone && !rejectedTone ? 'bg-amber-100 text-amber-700 border-amber-200' : ''
    return <Badge className={terminalTone || rejectedTone || activeTone}>{returnStatusLabels[status] || status}</Badge>
  }

  if (!order) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='w-full sm:max-w-2xl overflow-y-auto !bg-gradient-to-br !from-blue-50 !to-white border border-[#E8EDF5]'>
        <SheetHeader className='pb-4 border-b border-[#E8EDF5]'>
          <SheetTitle className='text-2xl font-bold text-blue-900 flex items-center gap-2'>
            <Package className='w-6 h-6 text-[#1E40AF]' />
            Chi tiết đơn hàng
          </SheetTitle>
        </SheetHeader>

        <div className='mt-6 space-y-5 pr-2 pl-2 pb-2'>
          {/* Order Info Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <Package className='w-5 h-5 text-[#1E40AF]' />
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
              {order.returnStatus && order.returnStatus !== 'none' && (
                <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Hoàn trả:</span>
                  {getReturnStatusBadge(order.returnStatus)}
                </div>
              )}
              <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                <span className='text-sm text-gray-600'>Thanh toán:</span>
                {getPaymentStatusBadge(order.paymentStatus as PaymentStatus)}
              </div>
              {order.paymentMethod && (
                <div className='flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Phương thức:</span>
                  <PaymentMethodDisplay method={order.paymentMethod} className='justify-end gap-2' logoClassName='h-4 w-auto max-w-full' showDescription={false} />
                </div>
              )}
              {(order.shippingMethod || order.deliveryMethod) && (
                <div className='flex justify-between items-center p-3 bg-white rounded-lg'>
                  <span className='text-sm text-gray-600'>Vận chuyển:</span>
                  <ShippingMethodDisplay
                    method={order.shippingMethod || order.deliveryMethod}
                    className='justify-end gap-2'
                    logoClassName='h-5 w-full object-contain'
                    showDescription={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-[#1E40AF]' />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className='bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-[#E8EDF5] space-y-2'>
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
                  <div className='flex items-start gap-2 text-gray-600 pt-2 border-t border-[#E8EDF5]'>
                    <MapPin className='w-4 h-4 mt-0.5 flex-shrink-0' />
                    <span className='text-sm'>
                      {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district},{' '}
                      {order.shippingAddress.province}
                    </span>
                  </div>
                </div>
              ) : (
                <div className='bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-[#E8EDF5] text-gray-500 text-sm'>
                  Không có thông tin địa chỉ giao hàng
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <ShoppingCart className='w-5 h-5 text-[#1E40AF]' />
                Sản phẩm ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {order.items.map((item: Order['items'][0], index: number) => (
                <div
                  key={index}
                  className='flex gap-3 bg-gradient-to-r from-blue-50/50 to-white p-4 rounded-xl border border-[#E8EDF5] hover:shadow-md transition-shadow'
                >
                  <div className='flex-1 space-y-1'>
                    <p className='font-semibold text-gray-900'>{item.name}</p>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>SKU: {item.sku}</span>
                      {(item as any).unit && (
                        <span className='text-xs text-[#1E40AF] bg-[#F0F6FF] px-2 py-1 rounded'>{(item as any).unit}</span>
                      )}
                    </div>
                    <p className='text-sm text-gray-600'>
                      <span className='text-[#1E40AF] font-medium'>{formatCurrency(item.unitPrice)}</span>
                      {(item as any).unit && <span className='text-gray-400'>/{(item as any).unit}</span>} x{' '}
                      {item.quantity}
                    </p>
                  </div>
                  <div className='text-right flex flex-col justify-center'>
                    <p className='text-lg font-bold text-[#1E40AF]'>{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <CreditCard className='w-5 h-5 text-[#1E40AF]' />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-[#E8EDF5] space-y-3'>
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
                {order.taxAmount > 0 && (
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Thuế:</span>
                    <span className='font-medium text-gray-900'>{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                {(order.discountAmount > 0 || (order.appliedCoupons && order.appliedCoupons.length > 0)) && (
                  <>
                    {order.discountAmount > 0 && (
                      <div className='flex justify-between items-center text-green-600'>
                        <span className='font-medium'>Giảm giá coupon:</span>
                        <span className='font-semibold'>-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    {(order.shippingDiscountAmount || 0) > 0 && (
                      <div className='flex justify-between items-center text-green-600'>
                        <span className='font-medium'>Tiết kiệm phí vận chuyển:</span>
                        <span className='font-semibold'>-{formatCurrency(order.shippingDiscountAmount || 0)}</span>
                      </div>
                    )}
                    {order.appliedCoupons && order.appliedCoupons.length > 0 && (
                      <div className='space-y-1 rounded-lg border border-green-100 bg-green-50/60 p-3'>
                        {order.appliedCoupons.map((coupon) => (
                          <div key={coupon.code} className='flex justify-between gap-3 text-xs text-gray-600'>
                            <span className='font-medium'>
                              {coupon.code}
                              {coupon.name ? ` - ${coupon.name}` : ''}
                            </span>
                            {coupon.type === 'free_shipping' ? (
                              <span className='text-green-700'>
                                {coupon.discountAmount > 0 ? `-${formatCurrency(coupon.discountAmount)}` : 'Freeship'}
                              </span>
                            ) : (
                              <span className='text-green-700'>-{formatCurrency(coupon.discountAmount)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {(order.pointsRedeemAmount || 0) > 0 && (
                  <div className='flex justify-between items-center text-[#1E40AF]'>
                    <span className='font-medium'>
                      Điểm thưởng ({(order.pointsRedeemed || 0).toLocaleString('vi-VN')} điểm):
                    </span>
                    <span className='font-semibold'>-{formatCurrency(order.pointsRedeemAmount || 0)}</span>
                  </div>
                )}
                <Separator className='my-2' />
                <div className='flex justify-between items-center p-3 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] rounded-lg text-white'>
                  <span className='text-lg font-bold'>Tổng cộng:</span>
                  <span className='text-2xl font-bold'>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {(order.notes ||
            ('pharmacistNotes' in order && (order as Order & { pharmacistNotes?: string }).pharmacistNotes)) && (
            <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5]'>
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
                  <div className='bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF] p-4 rounded-xl border border-[#BFDBFE]'>
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
