import { Link } from 'react-router'
import { CheckCircle, Package, Truck } from 'lucide-react'
import { Button } from '~/components/ui/button'

export function meta() {
  return [
    { title: 'Đặt hàng thành công | MEDISPACE' },
    { name: 'description', content: 'Cảm ơn bạn đã đặt hàng tại MEDISPACE' },
  ]
}

export default function CartSuccess() {
  return (
    <div className='container mx-auto px-4 py-16'>
      <div className='max-w-md mx-auto text-center'>
        <div className='mb-6'>
          <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Đặt hàng thành công!</h1>
          <p className='text-gray-600'>Cảm ơn bạn đã tin tưởng MEDISPACE</p>
        </div>

        <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-600'>Mã đơn hàng:</span>
            <span className='font-mono font-medium'>#MDS001234</span>
          </div>
        </div>

        <div className='space-y-3 mb-8'>
          <div className='flex items-center justify-center text-sm text-gray-600'>
            <Package className='w-4 h-4 mr-2' />
            <span>Đang chuẩn bị hàng</span>
          </div>
          <div className='flex items-center justify-center text-sm text-gray-600'>
            <Truck className='w-4 h-4 mr-2' />
            <span>Giao hàng trong 1-2 ngày</span>
          </div>
        </div>

        <div className='space-y-3'>
          <Button asChild className='w-full'>
            <Link to='/account/orders'>Xem đơn hàng</Link>
          </Button>
          <Button asChild variant='outline' className='w-full'>
            <Link to='/'>Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
