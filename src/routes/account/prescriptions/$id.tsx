import { useParams } from 'react-router'

export function meta({ params }: { params: { id: string } }) {
  return [{ title: `Đơn thuốc #${params.id} | MEDISPACE` }, { name: 'description', content: 'Chi tiết đơn thuốc' }]
}

export default function PrescriptionDetail() {
  const { id } = useParams()

  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Đơn thuốc #{id}</h1>
        <p className='text-gray-600'>Chi tiết đơn thuốc</p>
      </div>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Chi tiết đơn thuốc đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
