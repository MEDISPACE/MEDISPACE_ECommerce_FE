export function meta() {
  return [{ title: 'Quản lý đơn hàng | Admin' }, { name: 'description', content: 'Quản lý tất cả đơn hàng' }]
}

export default function AdminOrders() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Quản lý đơn hàng</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Danh sách đơn hàng đang được phát triển...</p>
      </div>
    </div>
  )
}
