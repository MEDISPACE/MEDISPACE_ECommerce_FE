import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Calendar, Package, Star, RotateCcw, Eye } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { WriteReviewDialog } from '../reviews/WriteReviewDialog'
import { reviewService } from '../../services/reviewService'
import { toast } from 'sonner'
import { getOrderStatusBadge } from '../../utils/badgeUtils'
import { type Order, type OrderItem } from '../../types/account'

interface OrderCardProps {
  order: Order
  variant?: 'default' | 'compact'
}

export function OrderCard({ order, variant = 'default' }: OrderCardProps) {
  const [showProductSelection, setShowProductSelection] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())

  // Check which products have been reviewed
  useEffect(() => {
    const checkReviewedProducts = async () => {
      try {
        const userReviews = await reviewService.getUserReviews()
        const reviewedIds = new Set(userReviews.map(review => review.productId))
        setReviewedProductIds(reviewedIds)
      } catch (error) {
        console.error('Error fetching user reviews:', error)
      }
    }

    if (order.status === 'delivered') {
      checkReviewedProducts()
    }
  }, [order.status])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  const getEstimatedDelivery = () => {
    if (order.estimatedDelivery) {
      return `Dự kiến: ${formatDate(order.estimatedDelivery)}`
    }
    return ''
  }

  // Check if all products in order have been reviewed
  const allProductsReviewed = order.items && order.items.length > 0 &&
    order.items.every(item => reviewedProductIds.has(item.productId))

  if (variant === 'compact') {
    return (
      <Card className='border-blue-100 hover:shadow-md transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-3'>
              <Package className='w-5 h-5 text-blue-600' />
              <div>
                <h3 className='font-medium'>#{order.orderNumber}</h3>
                <p className='text-sm text-gray-500'>{formatDate(order.createdAt)}</p>
              </div>
            </div>
            {getOrderStatusBadge(order.status)}
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>
                {order.items.reduce((total, item) => total + item.quantity, 0)} sản phẩm
              </p>
              <p className='font-medium text-blue-600'>{formatPrice(order.total)}</p>
            </div>

            <Link to={`/account/orders/${order.id}`}>
              <Button size='sm' variant='outline' className='text-blue-600 border-blue-200'>
                <Eye className='w-4 h-4 mr-1' />
                Xem
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-blue-100 hover:shadow-md transition-all duration-300'>
      <CardContent className='p-6'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <Package className='w-5 h-5 text-blue-600' />
              <h3 className='font-medium'>Đơn hàng #{order.orderNumber}</h3>
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-600'>
              <span className='flex items-center gap-1'>
                <Calendar className='w-4 h-4' />
                {formatDate(order.createdAt)} | {formatTime(order.createdAt)}
              </span>
            </div>
          </div>

          {getOrderStatusBadge(order.status)}
        </div>

        <div className='border-t border-b py-4 my-4 border-blue-300'>
          {order.items && order.items.length > 0 && (
            <div className='space-y-3'>
              {order.items.slice(0, 2).map((item: OrderItem) => (
                <div key={item.id} className='flex gap-3'>
                  <div className='w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center'>
                    <Package className='w-6 h-6 text-gray-400' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-sm line-clamp-1'>{item.productName}</h4>
                    <p className='text-sm text-gray-500'>x{item.quantity}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium text-blue-600'>{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className='text-sm text-gray-500 text-center'>+ {order.items.length - 2} sản phẩm khác</p>
              )}
            </div>
          )}
        </div>

        <div className='flex justify-between items-center mb-4'>
          <div className='space-y-1'>
            <p className='text-sm text-gray-600'>
              Tổng số lượng:{' '}
              <span className='font-medium'>
                {order.items.reduce((total, item) => total + item.quantity, 0)} sản phẩm
              </span>
            </p>
            <p className='text-sm text-gray-600'>
              Tổng thanh toán: <span className='font-medium text-blue-600'>{formatPrice(order.total)}</span>
            </p>
            {order.estimatedDelivery && <p className='text-sm text-gray-600'>{getEstimatedDelivery()}</p>}
          </div>
        </div>

        <div className='flex gap-2'>
          <Link to={`/account/orders/${order.id}`} className='flex-1'>
            <Button variant='outline' className='w-full text-blue-600 border-blue-300'>
              <Eye className='w-4 h-4 mr-2' />
              Xem chi tiết
            </Button>
          </Link>

          {order.status === 'delivered' && (
            <Button variant='outline' className='text-blue-600 border-blue-200'>
              <RotateCcw className='w-4 h-4 mr-2' />
              Mua lại
            </Button>
          )}

          {order.status === 'delivered' && order.items && order.items.length > 0 && (
            <>
              {allProductsReviewed ? (
                <Link to='/account/reviews' className='flex-1'>
                  <Button className='w-full bg-green-600 hover:bg-green-700 text-white'>
                    <Star className='w-4 h-4 mr-2' />
                    Xem đánh giá
                  </Button>
                </Link>
              ) : (
                <Button
                  className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                  onClick={() => setShowProductSelection(true)}
                >
                  <Star className='w-4 h-4 mr-2' />
                  Đánh giá
                </Button>
              )}
            </>
          )}
        </div>

        {/* Product Selection Dialog */}
        <Dialog open={showProductSelection} onOpenChange={setShowProductSelection}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Chọn sản phẩm để đánh giá</DialogTitle>
              <DialogDescription>
                Chọn sản phẩm bạn muốn đánh giá từ đơn hàng #{order.orderNumber}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 max-h-[400px] overflow-y-auto'>
              {order.items.map((item) => {
                const isReviewed = reviewedProductIds.has(item.productId)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${isReviewed
                        ? 'border-green-200 bg-green-50 cursor-not-allowed opacity-60'
                        : 'border-blue-200 hover:bg-blue-50 cursor-pointer'
                      }`}
                    onClick={() => {
                      if (isReviewed) {
                        toast.info('Bạn đã đánh giá sản phẩm này rồi!')
                        return
                      }
                      setSelectedProduct(item)
                      setShowProductSelection(false)
                      setShowWriteReview(true)
                    }}
                  >
                    <div className='w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center'>
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className='w-full h-full object-cover rounded-lg' />
                      ) : (
                        <Package className='w-8 h-8 text-gray-400' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium'>{item.productName}</h4>
                      <p className='text-sm text-gray-500'>x{item.quantity}</p>
                      {isReviewed && (
                        <p className='text-xs text-green-600 mt-1'>✓ Đã đánh giá</p>
                      )}
                    </div>
                    {isReviewed ? (
                      <div className='w-5 h-5 rounded-full bg-green-500 flex items-center justify-center'>
                        <span className='text-white text-xs'>✓</span>
                      </div>
                    ) : (
                      <Star className='w-5 h-5 text-blue-600' />
                    )}
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Write Review Dialog */}
        {selectedProduct && (
          <WriteReviewDialog
            open={showWriteReview}
            onOpenChange={setShowWriteReview}
            product={{
              id: selectedProduct.productId,
              name: selectedProduct.productName,
              image: selectedProduct.productImage || ''
            }}
            orderId={order.id}
            onSubmit={async (data) => {
              try {
                await reviewService.createReview(data)
                toast.success('Đánh giá của bạn đã được gửi thành công!')
                setShowWriteReview(false)
                setSelectedProduct(null)
                // Refresh reviewed products list
                const userReviews = await reviewService.getUserReviews()
                const reviewedIds = new Set(userReviews.map(review => review.productId))
                setReviewedProductIds(reviewedIds)
              } catch (error: any) {
                if (error.response?.status === 409) {
                  toast.error('Bạn đã đánh giá sản phẩm này rồi!')
                } else {
                  toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.')
                }
                console.error('Error submitting review:', error)
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
