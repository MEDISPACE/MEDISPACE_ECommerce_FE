import { useParams, Link } from 'react-router'
import {
  Package,
  Truck,
  MapPin,
  CreditCard,
  Download,
  MessageCircle,
  RotateCcw,
  Star,
  Phone,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { getOrderStatusBadge, getPaymentStatusBadge } from '../../utils/badgeUtils'
import { mockOrders } from '../../utils/mockAccountData'

export function OrderDetailPage() {
  const { orderId } = useParams()
  const order = mockOrders.find((o) => o.id === orderId)

  if (!order) {
    return (
      
        <div className='text-center py-12'>
          <Package className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h2 className='text-xl font-medium text-gray-900 mb-2'>Không tìm thấy đơn hàng</h2>
          <p className='text-gray-600 mb-6'>Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link to='/account/orders'>
            <Button>Quay lại danh sách đơn hàng</Button>
          </Link>
        </div>
      
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  const getTimelineIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className='w-5 h-5 text-green-600' />
    } else {
      return <Clock className='w-5 h-5 text-gray-400' />
    }
  }

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-blue-800'>Đơn hàng #{order.orderNumber}</h1>
            <p className='text-gray-600'>Đặt ngày {formatDate(order.createdAt)}</p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {getOrderStatusBadge(order.status)}
            <Button variant='outline' size='sm'>
              <Download className='w-4 h-4 mr-2' />
              Tải PDF
            </Button>
            <Button variant='outline' size='sm'>
              <MessageCircle className='w-4 h-4 mr-2' />
              Hỗ trợ
            </Button>
          </div>
        </div>

        {/* Order Timeline */}
        <Card className='border-blue-100'>
          <CardHeader>
            <CardTitle className='text-blue-800'>Trạng thái đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {order.timeline.map((item, index) => (
                <div key={item.id} className='flex items-start gap-4'>
                  <div className='flex flex-col items-center'>
                    {getTimelineIcon(item.status, item.isCompleted)}
                    {index < order.timeline.length - 1 && (
                      <div className={`w-0.5 h-8 mt-2 ${item.isCompleted ? 'bg-green-200' : 'bg-gray-200'}`} />
                    )}
                  </div>

                  <div className='flex-1 pb-4'>
                    <div className='flex items-center justify-between mb-1'>
                      <h4 className={`font-medium ${item.isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.statusText}
                      </h4>
                      {item.timestamp && <span className='text-sm text-gray-500'>{formatDate(item.timestamp)}</span>}
                    </div>
                    {item.description && <p className='text-sm text-gray-600'>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>

            {order.trackingNumber && (
              <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-blue-800'>Mã vận đơn</p>
                    <p className='text-blue-600'>{order.trackingNumber}</p>
                  </div>
                  <Button size='sm' variant='outline'>
                    <Truck className='w-4 h-4 mr-2' />
                    Theo dõi
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Order Items */}
          <div className='lg:col-span-2 space-y-6'>
            <Card className='border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800'>Sản phẩm đã đặt</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {order.items.map((item) => (
                  <div key={item.id} className='flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0'>
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className='w-16 h-16 object-cover rounded border border-gray-200'
                    />
                    <div className='flex-1'>
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <h4 className='font-medium line-clamp-2'>{item.productName}</h4>
                          <p className='text-sm text-gray-500'>
                            {item.brand} • {item.unit}
                          </p>
                          {item.isPrescription && (
                            <Badge className='bg-red-100 text-red-700 text-xs mt-1'>Thuốc kê đơn</Badge>
                          )}
                        </div>
                        <div className='text-right'>
                          <p className='font-medium'>{formatPrice(item.subtotal)}</p>
                          <p className='text-sm text-gray-500'>
                            {formatPrice(item.unitPrice)} x {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Link to={`/products/${item.productId}`}>
                          <Button variant='outline' size='sm'>
                            Xem sản phẩm
                          </Button>
                        </Link>
                        <Button variant='outline' size='sm'>
                          <RotateCcw className='w-4 h-4 mr-1' />
                          Mua lại
                        </Button>
                        {order.status === 'delivered' && (
                          <Button variant='outline' size='sm'>
                            <Star className='w-4 h-4 mr-1' />
                            Đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className='pt-4 space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Tạm tính:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Phí vận chuyển:</span>
                    <span>{formatPrice(order.shippingFee)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className='flex justify-between text-sm text-green-600'>
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className='flex justify-between font-medium text-lg'>
                    <span>Tổng cộng:</span>
                    <span className='text-blue-600'>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Delivery Info */}
            <Card className='border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <MapPin className='w-5 h-5' />
                  Thông tin giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='font-medium'>{order.shippingAddress.recipientName}</p>
                  <p className='text-sm text-gray-600'>{order.shippingAddress.phone}</p>
                </div>
                <div className='text-sm text-gray-600'>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.ward}, {order.shippingAddress.district}
                  </p>
                  <p>{order.shippingAddress.city}</p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Phương thức giao hàng:</p>
                  <p className='text-sm text-gray-600'>{order.deliveryMethod}</p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className='text-sm font-medium'>Dự kiến giao hàng:</p>
                    <p className='text-sm text-gray-600'>{formatDate(order.estimatedDelivery)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className='border-blue-100'>
              <CardHeader>
                <CardTitle className='text-blue-800 flex items-center gap-2'>
                  <CreditCard className='w-5 h-5' />
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm font-medium'>Phương thức thanh toán:</p>
                  <p className='text-sm text-gray-600'>{order.paymentMethod}</p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Trạng thái thanh toán:</p>
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
                {order.notes && (
                  <div>
                    <p className='text-sm font-medium'>Ghi chú:</p>
                    <p className='text-sm text-gray-600'>{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className='border-blue-100'>
              <CardContent className='p-4 space-y-3'>
                {order.status === 'pending_payment' && (
                  <Button className='w-full bg-gradient-to-r from-blue-600 to-cyan-500'>Thanh toán ngay</Button>
                )}

                {(order.status === 'pending_payment' || order.status === 'confirmed') && (
                  <Button variant='outline' className='w-full border-red-200 text-red-600'>
                    <X className='w-4 h-4 mr-2' />
                    Hủy đơn hàng
                  </Button>
                )}

                <Button variant='outline' className='w-full'>
                  <Phone className='w-4 h-4 mr-2' />
                  Liên hệ hỗ trợ
                </Button>

                <Button variant='outline' className='w-full'>
                  <RotateCcw className='w-4 h-4 mr-2' />
                  Mua lại đơn hàng
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  )
}
