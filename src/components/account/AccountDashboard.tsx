import { Link } from 'react-router'
import { Bell, Package, FileText, Search, Gift, Star, TrendingUp, RefreshCcw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { OrderCard } from '../order'
import { useAuth } from '../../contexts/AuthContext'
import { notificationService } from '../../services/notificationService'
import { orderService } from '../../services/orderService'
import { apiClient } from '../../services/apiClient'
import { RecommendationCarousel } from '../products/RecommendationCarousel'
import { useForYou, useReplenishment } from '../../hooks/product/useRecommendations'
import type { RecommendedProduct } from '../../services/recommendationService'
import { recommendationService } from '../../services/recommendationService'
import type { User as AccountUser, Notification, Order } from '../../types/account'

export function AccountDashboard() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  const { user } = useAuth()
  const accountUser = user as unknown as AccountUser | undefined

  // ML Recommendations (isAuthenticated = !!user)
  const isAuth = !!user
  const { products: forYouProducts, loading: forYouLoading, algorithm: forYouAlgorithm } = useForYou(8, isAuth)
  const { products: replenishProducts, loading: replenishLoading, algorithm: replenishAlgorithm } = useReplenishment(4, isAuth)

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersError('')
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
          timeline: [],
        }))
        setOrders(transformedOrders)
      } catch {
        setOrdersError('Không thể tải đơn hàng gần đây')
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    let mounted = true
    const loadLoyalty = async () => {
      try {
        const res = await apiClient.get<{ result: { pointsBalance: number } }>('/loyalty/account')
        if (mounted) setLoyaltyPoints(res.data.result.pointsBalance)
      } catch {
        if (mounted) setLoyaltyPoints(null)
      }
    }

    loadLoyalty()
    return () => {
      mounted = false
    }
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
    <div className='space-y-6' data-testid='account-page'>
      {/* Welcome Header */}
      <div className='text-center md:text-left'>
        <h1 className='text-2xl font-bold text-blue-800 mb-2' data-testid='account-greeting'>
          Chào mừng trở lại, {accountUser?.firstName || 'Người'} {accountUser?.lastName || 'dùng'}! 👋
        </h1>
        <p className='text-gray-600'>Quản lý đơn hàng, đơn thuốc và thông tin cá nhân của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Đơn hàng</p>
                <p className='text-2xl font-bold text-[#1E40AF]' data-testid='overview-order-count'>{getOrderCount()}</p>
              </div>
              <div className='w-12 h-12 bg-[#E8EDF5] rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-[#1E40AF]' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Điểm thưởng</p>
                <p className='text-2xl font-bold text-orange-600' data-testid='overview-points-balance'>
                  {(loyaltyPoints ?? 0).toLocaleString()}
                </p>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Star className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-[#E8EDF5]'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Đã tiết kiệm</p>
                <p className='text-2xl font-bold text-green-600' data-testid='overview-wishlist-count'>
                  {formatPrice(accountUser?.totalSaved || 0)}
                </p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className='border-[#E8EDF5]'>
        <CardHeader>
          <CardTitle className='text-blue-800'>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Link to='/account/orders' data-testid='quick-action-orders'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-[#BFDBFE] hover:bg-[#F0F6FF]'>
                <Package className='w-6 h-6 text-[#1E40AF]' />
                <span className='text-sm'>Đơn hàng</span>
                <span className='text-xs text-gray-500'>Xem đơn hàng gần đây</span>
              </Button>
            </Link>

            <Link to='/account/prescriptions/upload' data-testid='quick-action-prescriptions'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-[#BFDBFE] hover:bg-[#F0F6FF]'>
                <FileText className='w-6 h-6 text-[#1E40AF]' />
                <span className='text-sm'>Đơn thuốc</span>
                <span className='text-xs text-gray-500'>Upload mới, Tư vấn DS</span>
              </Button>
            </Link>

            <Link to='/products' data-testid='quick-action-products'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-[#BFDBFE] hover:bg-[#F0F6FF]'>
                <Search className='w-6 h-6 text-[#1E40AF]' />
                <span className='text-sm'>Tìm kiếm</span>
                <span className='text-xs text-gray-500'>Thuốc, TPCN, Dược phẩm</span>
              </Button>
            </Link>

            <Link to='/account/rewards' data-testid='quick-action-rewards'>
              <Button variant='outline' className='w-full h-20 flex-col gap-2 border-[#BFDBFE] hover:bg-[#F0F6FF]'>
                <Gift className='w-6 h-6 text-[#1E40AF]' />
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
        <Card className='border-[#E8EDF5]'>
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
          <CardContent className='space-y-4' data-testid='recent-orders'>
            {ordersLoading ? (
              <div className='space-y-3'>
                <div className='h-20 animate-pulse rounded-lg bg-gray-100' />
                <div className='h-20 animate-pulse rounded-lg bg-gray-100' />
              </div>
            ) : ordersError ? (
              <div className='text-center py-8'>
                <Package className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                <p className='text-gray-500'>{ordersError}</p>
              </div>
            ) : recentOrders.length > 0 ? (
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
        <Card className='border-[#E8EDF5]'>
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
            <div className='space-y-2'>
              {notifications.slice(0, 4).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-[#F0F6FF] border-[#BFDBFE]'
                  }`}
                >
                  <div className='flex items-start gap-2'>
                    <div className='text-sm'>
                      {notification.type === 'order' && '📦'}
                      {notification.type === 'prescription' && '📋'}
                      {notification.type === 'promotion' && '🎁'}
                      {notification.type === 'reminder' && '🔔'}
                    </div>
                    <div className='flex-1'>
                      <h5 className='font-medium text-sm'>{notification.title}</h5>
                      <p className='text-xs text-gray-600 line-clamp-2'>{notification.message}</p>
                    </div>
                    {!notification.isRead && <div className='w-2 h-2 bg-red-500 rounded-full mt-1' />}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className='text-center py-8'>
                  <Bell className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-500'>Chưa có thông báo hoặc nhắc nhở mới</p>
                </div>
              )}
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
              {replenishProducts.map((product: RecommendedProduct, index) => {
                const defaultVariant = product.priceVariants?.find((v) => v.isDefault) ?? product.priceVariants?.[0]
                const price = defaultVariant?.salePrice || defaultVariant?.price || 0
                return (
                  <Link
                    key={product._id}
                    to={`/products/${product.slug || product._id}`}
                    onClick={() => {
                      void recommendationService.trackClick({
                        productId: product._id,
                        algorithm: replenishAlgorithm,
                        section: 'replenishment',
                        position: index,
                      })
                    }}
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
        algorithm={forYouAlgorithm}
        viewAllLink='/products'
      />
    </div>
  )
}
