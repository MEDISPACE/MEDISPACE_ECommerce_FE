export function meta() {
  return [{ title: 'Hồ sơ cá nhân | MEDISPACE' }, { name: 'description', content: 'Quản lý thông tin cá nhân' }]
}

export default function AccountProfile() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Hồ sơ cá nhân</h1>
        <p className='text-gray-600'>Quản lý thông tin và cài đặt tài khoản</p>
      </div>

      <div className='grid gap-6'>
        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-lg font-semibold mb-4'>Thông tin cá nhân</h2>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Họ</label>
              <div className='text-gray-900'>Chưa cập nhật</div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Tên</label>
              <div className='text-gray-900'>Chưa cập nhật</div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
              <div className='text-gray-900'>Chưa cập nhật</div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Số điện thoại</label>
              <div className='text-gray-900'>Chưa cập nhật</div>
            </div>
          </div>
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <p className='text-yellow-800'>Tính năng chỉnh sửa hồ sơ đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
