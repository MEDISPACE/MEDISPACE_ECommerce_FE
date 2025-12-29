import { useParams, Link, useNavigate } from 'react-router'
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
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { getOrderStatusBadge, getPaymentStatusBadge } from '../../utils/badgeUtils'
import { orderService } from '../../services/orderService'
import { reviewService } from '../../services/reviewService'
import { useCart } from '../../contexts/CartContext'
import { WriteReviewDialog } from '../reviews/WriteReviewDialog'
import type { Order, OrderItem } from '../../types/account'
import { useState, useEffect, useCallback } from 'react'

// Order status steps for timeline
const ORDER_STEPS = [
  { status: 'pending', statusText: 'Đặt hàng', description: 'Đơn hàng đã được tạo' },
  { status: 'confirmed', statusText: 'Xác nhận', description: 'Đơn hàng đã được xác nhận' },
  { status: 'preparing', statusText: 'Đang chuẩn bị', description: 'Đơn hàng đang được chuẩn bị' },
  { status: 'shipping', statusText: 'Đang giao', description: 'Đơn hàng đang được vận chuyển' },
  { status: 'delivered', statusText: 'Đã giao', description: 'Đơn hàng đã được giao thành công' }
]

// Generate timeline based on current order status
const generateOrderTimeline = (currentStatus: string, createdAt: string, updatedAt: string) => {
  const statusOrder = ['pending', 'pending_payment', 'confirmed', 'processing', 'preparing', 'shipping', 'delivered']
  const currentIndex = statusOrder.indexOf(currentStatus)

  // Handle cancelled status
  if (currentStatus === 'cancelled') {
    return [{
      id: 'cancelled',
      status: 'cancelled',
      statusText: 'Đã hủy',
      description: 'Đơn hàng đã bị hủy',
      isCompleted: true,
      timestamp: updatedAt
    }]
  }

  // Handle returned status
  if (currentStatus === 'returned') {
    return [
      ...ORDER_STEPS.map((step, index) => ({
        id: step.status,
        status: step.status,
        statusText: step.statusText,
        description: step.description,
        isCompleted: true,
        timestamp: index === 0 ? createdAt : updatedAt
      })),
      {
        id: 'returned',
        status: 'returned',
        statusText: 'Đã hoàn trả',
        description: 'Đơn hàng đã được hoàn trả',
        isCompleted: true,
        timestamp: updatedAt
      }
    ]
  }

  return ORDER_STEPS.map((step, index) => {
    const stepIndex = statusOrder.indexOf(step.status)
    const isCompleted = currentIndex >= stepIndex
    const isCurrent = currentStatus === step.status ||
      (step.status === 'pending' && currentStatus === 'pending_payment') ||
      (step.status === 'preparing' && currentStatus === 'processing')

    return {
      id: step.status,
      status: step.status,
      statusText: step.statusText,
      description: step.description,
      isCompleted,
      timestamp: isCompleted ? (index === 0 ? createdAt : updatedAt) : ''
    }
  })
}

export function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedProductForReview, setSelectedProductForReview] = useState<OrderItem | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const fetchedOrder = await orderService.getOrderById(orderId)
      if (fetchedOrder) {
        // Transform to account Order type
        const transformedOrder: Order = {
          id: fetchedOrder.id,
          customerId: fetchedOrder.userId,
          orderNumber: fetchedOrder.orderNumber,
          status: fetchedOrder.status as 'pending' | 'pending_payment' | 'confirmed' | 'processing' | 'preparing' | 'shipping' | 'delivered' | 'cancelled',
          items: fetchedOrder.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images?.[0] || '',
            brand: item.product.brand?.name || '',
            unit: (item as any).unit || item.product.unit || 'viên',
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.total,
            isPrescription: item.product.requiresPrescription || false,
          })),
          subtotal: fetchedOrder.subtotal,
          shippingFee: fetchedOrder.shipping,
          discount: fetchedOrder.discount,
          total: fetchedOrder.total,
          shippingAddress: {
            id: '',
            userId: fetchedOrder.userId,
            type: 'home',
            recipientName: `${fetchedOrder.shippingAddress.firstName} ${fetchedOrder.shippingAddress.lastName}`,
            phone: fetchedOrder.shippingAddress.phone,
            addressLine1: fetchedOrder.shippingAddress.address,
            ward: fetchedOrder.shippingAddress.ward,
            district: fetchedOrder.shippingAddress.district,
            city: fetchedOrder.shippingAddress.province,
            isDefault: false,
          },
          paymentMethod: fetchedOrder.paymentMethod,
          paymentStatus: (fetchedOrder.paymentStatus === 'pending' ? 'pending' : fetchedOrder.paymentStatus === 'paid' ? 'paid' : fetchedOrder.paymentStatus === 'failed' ? 'failed' : fetchedOrder.paymentStatus === 'refunded' ? 'refunded' : 'pending') as 'pending' | 'paid' | 'failed' | 'refunded',
          createdAt: fetchedOrder.createdAt,
          updatedAt: fetchedOrder.updatedAt,
          deliveryMethod: fetchedOrder.shippingMethod,
          notes: fetchedOrder.notes,
          estimatedDelivery: fetchedOrder.estimatedDeliveryDate,
          timeline: generateOrderTimeline(fetchedOrder.status, fetchedOrder.createdAt, fetchedOrder.updatedAt),
        }
        setOrder(transformedOrder)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  if (loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-4 text-gray-600'>Đang tải chi tiết đơn hàng...</p>
      </div>
    )
  }

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
        <div className='flex items-center gap-4'>
          <Button
            className='text-blue-600 hover:!text-blue-700 hover:!bg-blue-50 rounded-full p-2.5 h-10 w-10'
            variant='ghost'
            size='icon'
            onClick={() => navigate('/account/orders')}
          >
            <ArrowLeft className='h-7 w-7' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold text-blue-800'>Đơn hàng #{order.orderNumber}</h1>
            <p className='text-gray-600'>Đặt ngày {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          {getOrderStatusBadge(order.status)}
          {/* <Button variant='outline' size='sm'>
            <Download className='w-4 h-4 mr-2' />
            Tải PDF
          </Button> */}
          <Button
            // className='!border-blue-100 !bg-blue-100 !text-blue-600 !hover:border-blue-200 !hover:bg-blue-200 !hover:text-blue-600'
            variant='outline'
            className='!border-blue-200 !text-blue-600 hover:!bg-blue-100 hover:!text-blue-700'
            size='sm'
            onClick={() => {
              const chatBtn = document.querySelector('button[aria-label="Chat với dược sĩ"]') as HTMLButtonElement | null
              if (chatBtn) {
                chatBtn.click()
              } else {
                window.location.href = '/contact'
              }
            }}
          >
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
                        <Button variant='outline' size='sm' className='!border-blue-200 !text-blue-600 hover:!bg-blue-50'>
                          Xem sản phẩm
                        </Button>
                      </Link>
                      <Button
                        size='sm'
                        className='bg-blue-600 text-white hover:!bg-blue-700'
                        onClick={async () => {
                          try {
                            const product = {
                              _id: item.productId,
                              name: item.productName,
                              price: item.unitPrice,
                              image: item.productImage,
                            } as any
                            await addToCart(product, item.quantity, item.unit, item.unitPrice)
                            toast.success('Đã thêm vào giỏ hàng', {
                              description: `${item.productName} x${item.quantity}`,
                            })
                          } catch (error) {
                            toast.error('Không thể thêm vào giỏ hàng')
                          }
                        }}
                      >
                        <RotateCcw className='w-4 h-4 mr-1' />
                        Mua lại
                      </Button>
                      {order.status === 'delivered' && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='!border-yellow-400 !text-yellow-600 hover:!bg-yellow-50'
                          onClick={() => {
                            setSelectedProductForReview(item)
                            setReviewDialogOpen(true)
                          }}
                        >
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
                  <p className='text-sm text-gray-600'>{order.estimatedDelivery}</p>
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
              {order.paymentStatus === 'pending' && order.paymentMethod !== 'cod' && (
                <Button
                  className='w-full text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:!bg-gradient-to-r hover:from-blue-700 hover:to-cyan-600'
                  onClick={() => {
                    toast.info('Tính năng thanh toán lại đang được phát triển', {
                      description: 'Vui lòng liên hệ hỗ trợ để được trợ giúp thanh toán',
                      duration: 4000
                    })
                  }}
                >
                  Thanh toán ngay
                </Button>
              )}

              {(order.status === 'pending_payment' || order.status === 'confirmed') && (
                <Button
                  variant='outline'
                  className='w-full !border-red-200 !text-red-600 hover:!bg-red-50 hover:!text-red-700'
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <X className='w-4 h-4 mr-2' />
                  Hủy đơn hàng
                </Button>
              )}

              <Button
                variant='outline'
                className='w-full !border-blue-200 !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700'
                onClick={() => {
                  const chatBtn = document.querySelector('button[aria-label="Chat với dược sĩ"]') as HTMLButtonElement | null
                  if (chatBtn) {
                    chatBtn.click()
                  } else {
                    window.location.href = '/contact'
                  }
                }}
              >
                <Phone className='w-4 h-4 mr-2' />
                Liên hệ hỗ trợ
              </Button>

              <Button
                variant='outline'
                className='w-full !border-blue-200 !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700'
                onClick={async () => {
                  try {
                    // Add items to cart sequentially
                    for (const item of order.items) {
                      // Construct minimal product object for addToCart
                      const product = {
                        _id: item.productId,
                        name: item.productName,
                        price: item.unitPrice,
                        image: item.productImage,
                        // Add other required fields with defaults if needed
                      } as any
                      await addToCart(product, item.quantity)
                    }
                    navigate('/cart')
                  } catch (error) {
                    toast.error('Lỗi khi thêm vào giỏ hàng')
                  }
                }}
              >
                <RotateCcw className='w-4 h-4 mr-2' />
                Mua lại đơn hàng
              </Button>

              {/* Return Request Button - Only for delivered orders */}
              {order.status === 'delivered' && (
                <Button
                  variant='outline'
                  className='w-full !border-orange-300 !text-orange-600 hover:!bg-orange-50 hover:!text-orange-700'
                  onClick={() => navigate(`/account/orders/${order.id}/return`)}
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Yêu cầu đổi/trả hàng
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Write Review Dialog - Direct for specific product */}
      {selectedProductForReview && order && (
        <WriteReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          product={{
            id: selectedProductForReview.productId,
            name: selectedProductForReview.productName,
            image: selectedProductForReview.productImage || ''
          }}
          orderId={order.id}
          onSubmit={async (data) => {
            try {
              const result = await reviewService.createReview(data)
              setReviewDialogOpen(false)
              setSelectedProductForReview(null)
              return result
            } catch (error: any) {
              if (error.response?.status === 409) {
                toast.error('Bạn đã đánh giá sản phẩm này rồi!')
              } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.')
              }
              throw error
            }
          }}
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='w-5 h-5' />
              {order.paymentStatus === 'paid' ? 'Huỷ đơn hàng đã thanh toán?' : 'Xác nhận hủy đơn hàng'}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-base text-gray-600 mt-2'>
              {order.paymentStatus === 'paid' ? (
                <span>
                  Đơn hàng này <b>đã được thanh toán</b>. Nếu bạn hủy ngay bây giờ, <b>Medispace</b> sẽ liên hệ và hoàn tiền cho bạn trong vòng <b>72h làm việc</b>.
                </span>
              ) : (
                'Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không, giữ lại</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700 text-white'
              onClick={async () => {
                const isPaid = order.paymentStatus === 'paid'
                try {
                  await orderService.cancelOrder(order.id)

                  if (isPaid) {
                    toast.success('Gửi yêu cầu hủy thành công', {
                      description: 'Chúng tôi sẽ liên hệ trong 72h để hoàn tiền.',
                      duration: 5000,
                      icon: '💸'
                    })
                  } else {
                    toast.success('Đã hủy đơn hàng thành công')
                  }

                  fetchOrder()
                } catch (error) {
                  toast.error('Không thể hủy đơn hàng')
                } finally {
                  setCancelDialogOpen(false)
                }
              }}
            >
              Tôi muốn hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
