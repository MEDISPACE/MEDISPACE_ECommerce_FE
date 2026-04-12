import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router'
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, Home, FileText, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import { orderService } from '../../services/orderService'
import type { Order } from '../../types/order'
import { logger } from '../../utils/logger'

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')
  const paymentStatus = searchParams.get('paymentStatus')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)

    // Xóa /cart/checkout khỏi browser history để Back không quay lại trang checkout rỗng
    // Thay thế history entry hiện tại để stack là: ... → / → /order/success
    window.history.replaceState(null, '', window.location.href)
    // Đẩy trang chủ vào trước success để back → về home
    window.history.pushState(null, '', '/')
    window.history.pushState(null, '', window.location.href)

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
    { label: 'Trang chủ', href: '/' },
    { label: 'Thanh toán', href: '/cart/checkout' },
    { label: 'Đặt hàng thành công' },
  ]

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-12'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg mb-6'>
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
            Giao dịch thanh toán của bạn không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild>
              <Link to='/cart/checkout'>Thử lại</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link to='/'>Về trang chủ</Link>
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

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)'
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng'
      case 'credit_card':
        return 'Thẻ tín dụng'
      case 'e_wallet':
        return 'Ví điện tử'
      case 'vnpay':
        return 'VNPay'
      case 'payos':
        return 'Thanh toán qua PayOS'
      default:
        return 'Thanh toán khi nhận hàng (COD)'
    }
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-12'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Success Animation */}
      <div className='text-center mb-8 animate-slide-in-up'>
        <div className='inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg mb-6 animate-float'>
          <CheckCircle className='w-14 h-14 text-white' />
        </div>
        <h1 className='bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-3'>
          {paymentStatus === 'success' || paymentStatus === 'vnpay_success' ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
        </h1>
        <p className='text-xl text-gray-600'>
          Cảm ơn bạn đã tin tưởng và mua sắm tại <span className='text-blue-600'>MEDISPACE</span>
        </p>
      </div>

      {/* Removed QR Code Section */}

      {/* Order Information Card */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 mb-6 animate-slide-in-up'>
        <CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50'>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Package className='w-6 h-6 text-blue-600' />
              <span className='text-blue-900'>Thông tin đơn hàng</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Mã đơn hàng</p>
              <p className='text-lg font-mono text-blue-600'>#{order.orderNumber}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Tổng tiền</p>
              <p className='text-lg text-gray-900'>{formatCurrency(order.total)}</p>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Phương thức thanh toán</p>
              <div className='flex items-center gap-2'>
                <CreditCard className='w-4 h-4 text-gray-600' />
                <span className='text-gray-900'>{getPaymentMethodText(order.paymentMethod)}</span>
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Thời gian giao hàng dự kiến</p>
              <p className='text-gray-900'>{order.estimatedDeliveryDate}</p>
            </div>
          </div>

          <Separator />

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <MapPin className='w-5 h-5 text-blue-600 mt-1' />
              <div className='flex-1'>
                <p className='text-sm text-blue-800 mb-1'>Địa chỉ giao hàng</p>
                <p className='text-gray-900'>
                  {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
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

      {/* Next Steps */}
      <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 mb-6 animate-slide-in-up'>
        <CardHeader>
          <CardTitle className='text-blue-900'>Bước tiếp theo</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors'>
            <div className='w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0'>
              1
            </div>
            <div className='flex-1'>
              <p className='text-gray-900'>
                Chúng tôi sẽ xác nhận đơn hàng và liên hệ với bạn trong vòng <strong>30 phút</strong>
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0'>
              2
            </div>
            <div className='flex-1'>
              <p className='text-gray-900'>Dược sĩ sẽ kiểm tra và chuẩn bị đơn hàng của bạn</p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg'>
            <div className='w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0'>
              3
            </div>
            <div className='flex-1'>
              <p className='text-gray-900'>
                Đơn hàng sẽ được giao đến địa chỉ của bạn trong <strong>{order.estimatedDeliveryDate || '2-3 ngày'}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center animate-fade-in'>
        <Button
          asChild
          className='bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg'
        >
          <Link to='/account/orders' className='gap-2'>
            <FileText className='w-5 h-5' />
            Xem đơn hàng của tôi
            <ArrowRight className='w-4 h-4' />
          </Link>
        </Button>

        <Button asChild variant='outline' className='border-2 border-blue-500 text-blue-600 hover:bg-blue-50'>
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
          <a href='tel:19001234' className='text-blue-600 hover:text-blue-700 hover:underline'>
            📞 Hotline: 1900 1234
          </a>
          <span className='text-gray-300'>|</span>
          <a href='mailto:support@medispace.vn' className='text-blue-600 hover:text-blue-700 hover:underline'>
            ✉️ support@medispace.vn
          </a>
          <span className='text-gray-300'>|</span>
          <Link to='/contact' className='text-blue-600 hover:text-blue-700 hover:underline'>
            💬 Chat với dược sĩ
          </Link>
        </div>
      </div>
    </div>
  )
}
