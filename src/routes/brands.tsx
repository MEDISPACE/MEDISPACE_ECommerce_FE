export function meta() {
  return [{ title: 'Thương hiệu | MEDISPACE' }, { name: 'description', content: 'Các thương hiệu dược phẩm uy tín' }]
}

export default function Brands() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Thương hiệu</h1>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Danh sách thương hiệu đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
