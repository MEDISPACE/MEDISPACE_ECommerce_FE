export function meta() {
  return [{ title: 'Quản lý kho | Admin' }, { name: 'description', content: 'Quản lý tồn kho sản phẩm' }]
}

export default function AdminInventory() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Quản lý kho</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Quản lý tồn kho đang được phát triển...</p>
      </div>
    </div>
  )
}
