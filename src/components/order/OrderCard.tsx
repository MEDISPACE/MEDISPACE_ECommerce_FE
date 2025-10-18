import { Link } from 'react-router'
import { Calendar, Package, Star, RotateCcw, Eye } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { getOrderStatusBadge } from '../../utils/badgeUtils'
import { type Order, type OrderItem } from '../../types/account'

interface OrderCardProps {
  order: Order
  variant?: 'default' | 'compact'
}

export function OrderCard({ order, variant = 'default' }: OrderCardProps) {
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

        <div className='border-t border-b py-4 my-4'>
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
            <Button variant='outline' className='w-full text-blue-600 border-blue-200'>
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

          {order.status === 'delivered' && (
            <Button className='bg-blue-600 hover:bg-blue-700 text-white'>
              <Star className='w-4 h-4 mr-2' />
              Đánh giá
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
