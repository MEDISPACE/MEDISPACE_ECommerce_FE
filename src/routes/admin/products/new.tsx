export function meta() {
  return [{ title: 'Thêm sản phẩm mới | Admin' }, { name: 'description', content: 'Thêm sản phẩm mới vào hệ thống' }]
}

export default function AdminProductNew() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Thêm sản phẩm mới</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Form thêm sản phẩm đang được phát triển...</p>
      </div>
    </div>
  )
}
