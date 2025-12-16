export function meta() {
  return [{ title: 'Đơn thuốc | MEDISPACE' }, { name: 'description', content: 'Quản lý đơn thuốc của bạn' }]
}

export default function AccountPrescriptions() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-blue-800 mb-2'>Đơn thuốc của tôi</h1>
        <p className='text-gray-600'>Quản lý và theo dõi đơn thuốc</p>
      </div>

      <div className='grid gap-6'>
        <div className='bg-white p-6 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-300'>
          <div className='text-center py-12'>
            <p className='text-gray-500 mb-4'>Chưa có đơn thuốc nào</p>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>Upload đơn thuốc</button>
          </div>
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <p className='text-yellow-800'>Tính năng quản lý đơn thuốc đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
