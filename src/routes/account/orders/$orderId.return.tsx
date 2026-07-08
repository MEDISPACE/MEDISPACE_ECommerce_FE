import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { ReturnRequestForm } from '~/components/returns'
import { orderService } from '~/services/orderService'
import { Skeleton } from '~/components/ui/skeleton'
import { Package } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Link } from 'react-router'

const ACTIVE_RETURN_STATUSES = new Set(['requested', 'approved', 'awaiting_return', 'received', 'refund_processing', 'completed'])

export default function CreateReturnRequestPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return

      try {
        setLoading(true)
        const fetchedOrder = await orderService.getOrderById(orderId)

        if (!fetchedOrder) {
          setError('Không tìm thấy đơn hàng')
          return
        }

        if (fetchedOrder.status !== 'delivered') {
          setError('Chỉ có thể yêu cầu đổi/trả với đơn hàng đã giao')
          return
        }

        if (ACTIVE_RETURN_STATUSES.has(fetchedOrder.returnStatus || '') && fetchedOrder.latestReturnRequestId) {
          setOrder({ latestReturnRequestId: fetchedOrder.latestReturnRequestId })
          setError('Đơn hàng này đã có yêu cầu đổi/trả đang được xử lý')
          return
        }

        // Transform order for ReturnRequestForm
        const transformedOrder = {
          _id: fetchedOrder.id,
          orderNumber: fetchedOrder.orderNumber,
          deliveredAt: fetchedOrder.deliveredAt || fetchedOrder.updatedAt,
          total: fetchedOrder.total,
          items: fetchedOrder.items.map((item: any) => ({
            productId: item.productId,
            name: item.product?.name || item.productName || 'Sản phẩm',
            sku: item.product?.sku || item.sku || '',
            unit: item.unit || 'Sản phẩm',
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.total,
            discountAllocation: item.discountAllocation || 0,
            pointsAllocation: item.pointsAllocation || 0,
            prescriptionRequired: item.product?.requiresPrescription || false,
            image: item.product?.images?.[0] || item.product?.featuredImage || '',
          })),
        }

        setOrder(transformedOrder)
      } catch (err) {
        setError('Không thể tải thông tin đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='max-w-4xl mx-auto p-6 text-center'>
        <Package className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
        <h2 className='text-xl font-medium mb-2'>{error || 'Không tìm thấy đơn hàng'}</h2>
        <p className='text-muted-foreground mb-4'>Vui lòng quay lại và thử lại.</p>
        <div className='flex flex-col items-center justify-center gap-3 sm:flex-row'>
          {order?.latestReturnRequestId && (
            <Link to={`/account/returns/${order.latestReturnRequestId}`}>
              <Button>Xem yêu cầu hoàn trả</Button>
            </Link>
          )}
          <Link to='/account/orders'>
            <Button variant={order?.latestReturnRequestId ? 'outline' : 'default'}>Quay lại đơn hàng</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ReturnRequestForm order={order} />
}
