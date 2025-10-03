import { useParams } from 'react-router'

export function meta({ params }: { params: { slug: string } }) {
  return [
    { title: `Danh mục ${params.slug} | MEDISPACE` },
    { name: 'description', content: `Sản phẩm thuộc danh mục ${params.slug}` },
  ]
}

export default function ProductCategory() {
  const { slug } = useParams()

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Danh mục: {slug}</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {/* Product grid will be implemented here */}
        <div className='col-span-full text-center py-12'>
          <p className='text-gray-500'>Tính năng đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
