import { useParams } from 'react-router'

export function meta({ params }: { params: { id: string } }) {
  return [
    { title: `Chỉnh sửa sản phẩm #${params.id} | Admin` },
    { name: 'description', content: 'Chỉnh sửa thông tin sản phẩm' },
  ]
}

export default function AdminProductEdit() {
  const { id } = useParams()

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Chỉnh sửa sản phẩm #{id}</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Form chỉnh sửa sản phẩm đang được phát triển...</p>
      </div>
    </div>
  )
}
