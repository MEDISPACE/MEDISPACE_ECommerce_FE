import { Link } from 'react-router'
import { Package, FileText, Search, Gift, Star, TrendingUp, Calendar, RefreshCcw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { OrderCard } from '../order'
import { useAuth } from '../../contexts/AuthContext'
import { notificationService } from '../../services/notificationService'
import { orderService } from '../../services/orderService'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { useForYou, useReplenishment } from '../../hooks/product/useRecommendations'
import type { RecommendedProduct } from '../../services/recommendationService'
import type { User as AccountUser, Notification, Order } from '../../types/account'

export function AccountDashboard() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  const { user } = useAuth()
  const accountUser = user as unknown as AccountUser | undefined

  // ML Recommendations (isAuthenticated = !!user)
  const isAuth = !!user
  const { products: forYouProducts, loading: forYouLoading } = useForYou(8, isAuth)
  const { products: replenishProducts, loading: replenishLoading } = useReplenishment(4, isAuth)

  const [orders, setOrders] = useState<Order[]>([])
  // const [loading, setLoading] = useState(true) // TODO: Add loading state if needed

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await orderService.getOrders()
        // Transform to account Order type
        const transformedOrders: Order[] = fetchedOrders.map((order) => ({
          id: order.id,
          customerId: order.userId,
          orderNumber: order.orderNumber,
          status: (order.status === 'pending'
            ? 'pending_payment'
            : order.status === 'shipped'
              ? 'shipping'
              : order.status === 'confirmed'
                ? 'confirmed'
                : order.status === 'processing'
                  ? 'processing'
                  : order.status === 'delivered'
                    ? 'delivered'
                    : order.status === 'cancelled'
                      ? 'cancelled'
                      : order.status === 'returned'
                        ? 'returned'
                        : 'pending_payment') as
            | 'pending_payment'
            | 'confirmed'
            | 'processing'
            | 'preparing'
            | 'shipping'
            | 'delivered'
            | 'cancelled'
            | 'returned',
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images?.[0] || '',
            brand: item.product.brand?.name || '',
            unit: item.product.unit || 'viên',
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.total,
            discountAllocation: item.discountAllocation,
            pointsAllocation: item.pointsAllocation,
            isPrescription: item.product.requiresPrescription || false,
          })),
          subtotal: order.subtotal,
          shippingFee: order.shipping,
          discount: order.discount,
          total: order.total,
          shippingAddress: {
            id: '',
            userId: order.userId,
            type: 'home',
            recipientName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            phone: order.shippingAddress.phone,
            addressLine1: order.shippingAddress.address,
            ward: order.shippingAddress.ward,
            district: order.shippingAddress.district,
            city: order.shippingAddress.province,
            isDefault: false,
          },
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus as Order['paymentStatus'],
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveryMethod: order.shippingMethod,
          notes: order.notes,
          timeline: [], // TODO: Add timeline if available
        }))
        setOrders(transformedOrders)
      } catch {
        // Failed to fetch orders
      } finally {
        // setLoading(false) // TODO: Add loading state if needed
      }
    }

    fetchOrders()
  }, [])

  const getOrderCount = () => {
    return orders.length
  }

  const recentOrders = orders.slice(0, 3)

  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await notificationService.getNotifications()
        if (mounted) setNotifications(data.notifications)
      } catch {
        // Failed to load notifications
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const unreadNotifications = notifications.filter((n) => !n.isRead)

  return (
    <div className='space-y-6'>
      {/* Welcome Header */}
      <div className='text-center md:text-left'>
        <h1 className='text-2xl font-bold text-blue-800 mb-2'>
          Chào mừng trở lại, {accountUser?.firstName || 'Người'} {accountUser?.lastName || 'dùng'}! 👋
        </h1>
        <p className='text-gray-600'>Quản lý đơn hàng, đơn thuốc và thông tin cá nhân của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='border-blue-100'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Đơn hàng</p>
                <p className='text-2xl font-bold text-blue-600'>{getOrderCount()}</p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-blue-100'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Điểm thưởng</p>
                <p className='text-2xl font-bold text-orange-600'>
                  {(accountUser?.loyaltyPoints || 0).toLocaleString()}
                </p>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Star className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-blue-100'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Đã tiết kiệm</p>
                <p className='text-2xl font-bold text-green-600'>{formatPrice(accountUser?.totalSaved || 0)}</p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className='border-blue-100'>
        <CardHeader>
          <CardTitle className='text-blue-800'>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Link to='/account/orders'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-blue-200 hover:bg-blue-50'>
                <Package className='w-6 h-6 text-blue-600' />
                <span className='text-sm'>Đơn hàng</span>
                <span className='text-xs text-gray-500'>Xem đơn hàng gần đây</span>
              </Button>
            </Link>

            <Link to='/upload-prescription'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-blue-200 hover:bg-blue-50'>
                <FileText className='w-6 h-6 text-blue-600' />
                <span className='text-sm'>Đơn thuốc</span>
                <span className='text-xs text-gray-500'>Upload mới, Tư vấn DS</span>
              </Button>
            </Link>

            <Link to='/products'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-blue-200 hover:bg-blue-50'>
                <Search className='w-6 h-6 text-blue-600' />
                <span className='text-sm'>Tìm kiếm</span>
                <span className='text-xs text-gray-500'>Thuốc, TPCN, Dược phẩm</span>
              </Button>
            </Link>

            <Link to='/account/loyalty'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-blue-200 hover:bg-blue-50'>
                <Gift className='w-6 h-6 text-blue-600' />
                <span className='text-sm'>Khuyến mãi</span>
                <span className='text-xs text-gray-500'>Ưu đãi riêng cho bạn</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders & Health Reminders */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Orders */}
        <Card className='border-blue-100'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-blue-800'>Đơn hàng gần đây</CardTitle>
              <Link to='/account/orders'>
                <Button variant='outline' size='sm'>
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => <OrderCard key={order.id} order={order} variant='compact' />)
            ) : (
              <div className='text-center py-8'>
                <Package className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                <p className='text-gray-500'>Chưa có đơn hàng nào</p>
                <Link to='/products'>
                  <Button className='mt-3' size='sm'>
                    Mua sắm ngay
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Reminders & Notifications */}
        <Card className='border-blue-100'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-blue-800'>Thông báo & Nhắc nhở</CardTitle>
              <Link to='/account/notifications'>
                <Button variant='outline' size='sm'>
                  Xem tất cả
                  {unreadNotifications.length > 0 && (
                    <Badge className='ml-2 bg-red-500 text-white text-xs'>{unreadNotifications.length}</Badge>
                  )}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Health Reminders */}
            <div className='space-y-3'>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>💊</div>
                  <div className='flex-1'>
                    <h4 className='font-medium text-blue-800'>Nhắc nhở uống thuốc</h4>
                    <p className='text-sm text-blue-600'>Amoxicillin - Uống 2 viên sau bữa ăn sáng</p>
                    <p className='text-xs text-blue-500 mt-1'>
                      <Calendar className='w-3 h-3 inline mr-1' />
                      Hôm nay, 8:00 AM
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center'>⚠️</div>
                  <div className='flex-1'>
                    <h4 className='font-medium text-amber-800'>Đơn thuốc sắp hết</h4>
                    <p className='text-sm text-amber-700'>Lisinopril còn 3 ngày. Bạn có muốn đặt mua thêm?</p>
                    <Button size='sm' className='mt-2' variant='outline'>
                      Đặt mua ngay
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className='space-y-2 pt-2 border-t border-gray-100'>
              {notifications.slice(0, 2).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className='flex items-start gap-2'>
                    <div className='text-sm'>
                      {notification.type === 'order' && '📦'}
                      {notification.type === 'prescription' && '📋'}
                      {notification.type === 'promotion' && '🎁'}
                    </div>
                    <div className='flex-1'>
                      <h5 className='font-medium text-sm'>{notification.title}</h5>
                      <p className='text-xs text-gray-600 line-clamp-2'>{notification.message}</p>
                    </div>
                    {!notification.isRead && <div className='w-2 h-2 bg-red-500 rounded-full mt-1' />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Replenishment — sản phẩm cần mua lại */}
      {!replenishLoading && replenishProducts.length > 0 && (
        <Card className='border-amber-100 bg-amber-50/50'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <RefreshCcw className='w-5 h-5 text-amber-600' />
              <CardTitle className='text-amber-800'>Có thể bạn cần mua lại</CardTitle>
              <Badge className='bg-amber-100 text-amber-700 border-amber-200 text-xs'>Tái đặt hàng</Badge>
            </div>
            <p className='text-sm text-amber-600'>Dựa trên lịch sử mua hàng của bạn</p>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {replenishProducts.map((product: RecommendedProduct) => {
                const defaultVariant = product.priceVariants?.find((v) => v.isDefault) ?? product.priceVariants?.[0]
                const price = defaultVariant?.salePrice || defaultVariant?.price || 0
                return (
                  <Link
                    key={product._id}
                    to={`/products/${product.slug || product._id}`}
                    className='group p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all'
                  >
                    <img
                      src={product.featuredImage || '/placeholder-product.jpg'}
                      alt={product.name}
                      className='w-full h-20 object-contain mb-2 group-hover:scale-105 transition-transform'
                    />
                    <p className='text-xs font-medium text-gray-800 line-clamp-2'>{product.name}</p>
                    {price > 0 && (
                      <p className='text-xs text-amber-600 font-semibold mt-1'>
                        {new Intl.NumberFormat('vi-VN').format(price)}đ
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* For You — gợi ý cá nhân hoá */}
      <RecommendationCarousel
        title='Dành Riêng Cho Bạn'
        subtitle='Gợi ý dựa trên lịch sử mua hàng và sở thích của bạn'
        badge='for-you'
        products={forYouProducts}
        loading={forYouLoading}
        viewAllLink='/products'
      />
    </div>
  )
}
