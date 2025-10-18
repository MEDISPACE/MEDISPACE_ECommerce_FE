import { useParams } from 'react-router'

export function meta({ params }: { params: { slug: string } }) {
  return [{ title: `${params.slug} | MEDISPACE` }, { name: 'description', content: `Chi tiết sản phẩm ${params.slug}` }]
}

export default function ProductDetail() {
  const { slug } = useParams()

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='grid md:grid-cols-2 gap-8'>
        {/* Product images */}
        <div className='space-y-4'>
          <div className='aspect-square bg-gray-100 rounded-lg flex items-center justify-center'>
            <p className='text-gray-500'>Hình ảnh sản phẩm</p>
          </div>
        </div>

        {/* Product info */}
        <div className='space-y-6'>
          <h1 className='text-3xl font-bold'>{slug}</h1>
          <p className='text-gray-600'>Chi tiết sản phẩm sẽ được hiển thị ở đây...</p>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <p className='text-yellow-800'>Tính năng đang được phát triển...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
