export function meta() {
  return [{ title: 'Địa chỉ giao hàng | MEDISPACE' }, { name: 'description', content: 'Quản lý địa chỉ giao hàng' }]
}

export default function AccountAddresses() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Địa chỉ giao hàng</h1>
        <p className='text-gray-600'>Quản lý địa chỉ giao hàng của bạn</p>
      </div>

      <div className='grid gap-6'>
        <div className='bg-white p-6 rounded-lg border'>
          <div className='text-center py-12'>
            <p className='text-gray-500 mb-4'>Chưa có địa chỉ giao hàng nào</p>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>Thêm địa chỉ mới</button>
          </div>
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <p className='text-yellow-800'>Tính năng quản lý địa chỉ đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
