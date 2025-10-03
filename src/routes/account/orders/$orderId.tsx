import { useParams } from 'react-router'

export function meta({ params }: { params: { orderId: string } }) {
  return [{ title: `Đơn hàng #${params.orderId} | MEDISPACE` }, { name: 'description', content: 'Chi tiết đơn hàng' }]
}

export default function OrderDetail() {
  const { orderId } = useParams()

  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Đơn hàng #{orderId}</h1>
        <p className='text-gray-600'>Chi tiết đơn hàng</p>
      </div>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Chi tiết đơn hàng đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
