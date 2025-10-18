import { useParams } from 'react-router'

export function meta({ params }: { params: { id: string } }) {
  return [{ title: `Đơn hàng #${params.id} | Admin` }, { name: 'description', content: 'Chi tiết đơn hàng' }]
}

export default function AdminOrderDetail() {
  const { id } = useParams()

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Đơn hàng #{id}</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Chi tiết đơn hàng đang được phát triển...</p>
      </div>
    </div>
  )
}
