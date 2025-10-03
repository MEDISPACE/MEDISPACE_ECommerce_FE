export function meta() {
  return [{ title: 'Tìm kiếm | MEDISPACE' }, { name: 'description', content: 'Tìm kiếm sản phẩm' }]
}

export default function Search() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Tìm kiếm sản phẩm</h1>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Tính năng tìm kiếm đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
