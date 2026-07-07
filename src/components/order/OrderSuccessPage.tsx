import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router'
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, Home, FileText, Loader2, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { PaymentMethodDisplay } from '../shared/PaymentMethodDisplay'
import { ShippingMethodDisplay } from '../shared/ShippingMethodDisplay'
import { orderService } from '../../services/orderService'
import type { Order } from '../../types/order'
import { logger } from '../../utils/logger'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { usePostPurchase } from '../../hooks/product/useRecommendations'
import { recommendationService } from '../../services/recommendationService'

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')
  const paymentStatus = searchParams.get('paymentStatus')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract productIds from order for post-purchase recommendations
  const orderProductIds =
    order?.items?.map((item: any) => item.productId || item.product?._id || '').filter(Boolean) ?? []
  const {
    products: postPurchaseProducts,
    loading: postPurchaseLoading,
    algorithm: postPurchaseAlgorithm,
  } = usePostPurchase(orderProductIds)

  useEffect(() => {
    if (orderProductIds.length > 0) {
      void recommendationService.trackPurchases(orderProductIds)
    }
    // Track purchase attribution once order items are loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderProductIds.join(',')])

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)

    // Clear selectedItems from sessionStorage on successful payment
    if (paymentStatus === 'success') {
      sessionStorage.removeItem('medispace_selected_items')
    }

    // Fetch order data if orderId is provided
    if (orderId) {
      fetchOrderData(orderId)
    } else {
      setLoading(false)
      setError('Không tìm thấy mã đơn hàng')
    }
  }, [orderId, paymentStatus])

  const fetchOrderData = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const orderData = await orderService.getOrderById(id)
      if (orderData) {
        setOrder(orderData)
      } else {
        setError('Không tìm thấy thông tin đơn hàng')
      }
    } catch (err) {
      const errorMessage = 'Không thể tải thông tin đơn hàng'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbItems = [
    { label: 'Trang ch?', href: '/' },
    { label: 'Đơn hàng của tôi', href: '/account/orders' },
    { label: paymentStatus === 'failed' ? 'Thanh toán thất bại' : 'Đặt hàng thành công' },
  ]

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-12'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#BFDBFE] to-[#1E40AF] shadow-lg mb-6'>
            <Loader2 className='w-14 h-14 text-white animate-spin' />
          </div>
          <h1 className='text-xl text-gray-600 mb-4'>Đang tải thông tin đơn hàng...</h1>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className='max-w-4xl mx-auto px-4 py-12'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg mb-6'>
            <CreditCard className='w-14 h-14 text-white' />
          </div>
          <h1 className='text-xl text-red-600 mb-4'>Thanh toán thất bại!</h1>
          <p className='text-gray-500 mb-6'>
            Giao dịch thanh toán không thành công hoặc liên kết thanh toán đã hết hạn. Đơn hàng vẫn được lưu để bạn có
            thể mở chi tiết đơn hàng và thử thanh toán lại.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild>
              <Link to={orderId ? `/account/orders/${orderId}` : '/account/orders'}>Thử thanh toán lại</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link to='/cart'>Quay lại giỏ hàng</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-12'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg mb-6'>
            <CheckCircle className='w-14 h-14 text-white' />
          </div>
          <h1 className='text-xl text-gray-600 mb-4'>Đặt hàng thành công!</h1>
          <p className='text-gray-500 mb-6'>
            {error || 'Không thể tải chi tiết đơn hàng, nhưng đơn hàng của bạn đã được tạo thành công.'}
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild>
              <Link to='/account/orders'>Xem đơn hàng của tôi</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link to='/'>Về trang chủ</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }
  const isCodPayment = order.paymentMethod?.toLowerCase() === 'cod'
  const hasPendingPayment = paymentStatus === 'pending' || order.paymentStatus === 'pending'
  const isPaymentPending = hasPendingPayment && !isCodPayment
  const isPaymentSuccess =
    paymentStatus === 'success' || paymentStatus === 'vnpay_success' || order.paymentStatus === 'paid'

  return (
    <div className='max-w-4xl mx-auto px-4 py-12'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Success Animation */}
      <div className='text-center mb-8 animate-slide-in-up'>
        <div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full shadow-lg mb-6 animate-float ${
            isPaymentPending
              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
              : 'bg-gradient-to-br from-green-400 to-green-600'
          }`}
        >
          {isPaymentPending ? (
            <Clock className='w-14 h-14 text-white' />
          ) : (
            <CheckCircle className='w-14 h-14 text-white' />
          )}
        </div>
        <h1 className='bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-3'>
          {isPaymentPending
            ? 'Đang xác nhận thanh toán'
            : isPaymentSuccess
              ? 'Thanh toán thành công!'
              : 'Đặt hàng thành công!'}
        </h1>
        <p className='text-xl text-gray-600'>
          {isPaymentPending ? (
            'Nếu bạn đã thanh toán, hệ thống sẽ cập nhật đơn hàng ngay khi cổng thanh toán xác nhận.'
          ) : (
            <>
              Cảm ơn bạn đã tin tưởng và mua sắm tại <span className='text-[#1E40AF]'>MEDISPACE</span>
            </>
          )}
        </p>
      </div>

      {isPaymentPending && (
        <Card className='mb-6 border-amber-200 bg-amber-50'>
          <CardContent className='p-4'>
            <p className='text-sm text-amber-800'>
              Trạng thái thanh toán đang chờ xác nhận. Nếu trạng thái không đổi sau vài phút, hãy mở chi tiết đơn hàng
              để tạo lại liên kết thanh toán hoặc liên hệ hỗ trợ.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Removed QR Code Section */}

      {/* Order Information Card */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] mb-6 animate-slide-in-up'>
        <CardHeader className='bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF]'>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Package className='w-6 h-6 text-[#1E40AF]' />
              <span className='text-blue-900'>Thông tin đơn hàng</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Mã đơn hàng</p>
              <p className='text-lg font-mono text-[#1E40AF]'>#{order.orderNumber}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Tổng tiền</p>
              <p className='text-lg text-gray-900'>{formatCurrency(order.total)}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Phương thức thanh toán</p>
              <div className='flex items-center gap-2'>
                <PaymentMethodDisplay method={order.paymentMethod} showDescription={false} />
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Ph??ng th?c giao h?ng</p>
              <ShippingMethodDisplay method={order.shippingMethod} showDescription={false} />
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Thời gian giao hàng dự kiến</p>
              <p className='text-gray-900'>{order.estimatedDeliveryDate}</p>
            </div>
          </div>

          <Separator />

          <div className='bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <MapPin className='w-5 h-5 text-[#1E40AF] mt-1' />
              <div className='flex-1'>
                <p className='text-sm text-blue-800 mb-1'>Địa chỉ giao hàng</p>
                <p className='text-gray-900'>
                  {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district},{' '}
                  {order.shippingAddress.province}
                </p>
                <p className='text-sm text-gray-600 mt-1'>SĐT: {order.shippingAddress.phone}</p>
                {order.shippingAddress.email && (
                  <p className='text-sm text-gray-600'>Email: {order.shippingAddress.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <p className='text-sm text-yellow-800'>
              📧 <strong>Thông tin đơn hàng đã được gửi đến email của bạn.</strong> Vui lòng kiểm tra hộp thư để theo
              dõi tình trạng đơn hàng.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center animate-fade-in'>
        <Button
          asChild
          className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white shadow-lg'
        >
          <Link to='/account/orders' className='gap-2'>
            <FileText className='w-5 h-5' />
            Xem đơn hàng của tôi
            <ArrowRight className='w-4 h-4' />
          </Link>
        </Button>

        <Button asChild variant='outline' className='border-2 border-[#1E40AF] text-[#1E40AF] hover:bg-[#F0F6FF]'>
          <Link to='/' className='gap-2'>
            <Home className='w-5 h-5' />
            Về trang chủ
          </Link>
        </Button>
      </div>

      {/* Support Information */}
      <div className='mt-8 text-center'>
        <p className='text-gray-600 mb-2'>Cần hỗ trợ? Liên hệ với chúng tôi</p>
        <div className='flex flex-wrap justify-center gap-4 text-sm'>
          <a href='tel:19001234' className='text-[#1E40AF] hover:text-[#0A2463] hover:underline'>
            📞 Hotline: 1900 1234
          </a>
          <span className='text-gray-300'>|</span>
          <a href='mailto:support@medispace.vn' className='text-[#1E40AF] hover:text-[#0A2463] hover:underline'>
            ✉️ support@medispace.vn
          </a>
          <span className='text-gray-300'>|</span>
          <Link to='/contact' className='text-[#1E40AF] hover:text-[#0A2463] hover:underline'>
            💬 Chat với dược sĩ
          </Link>
        </div>
      </div>

      {/* Post-purchase Recommendations */}
      {order && (
        <div className='mt-4'>
          <RecommendationCarousel
            title='Bạn Có Thể Cũng Thích'
            subtitle='Dựa trên đơn hàng vừa đặt của bạn'
            badge='post-purchase'
            products={postPurchaseProducts}
            loading={postPurchaseLoading}
            algorithm={postPurchaseAlgorithm}
            viewAllLink='/products'
          />
        </div>
      )}
    </div>
  )
}
