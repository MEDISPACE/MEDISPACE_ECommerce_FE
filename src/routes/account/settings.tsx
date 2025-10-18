export function meta() {
  return [{ title: 'Cài đặt tài khoản | MEDISPACE' }, { name: 'description', content: 'Cài đặt và bảo mật tài khoản' }]
}

export default function AccountSettings() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Cài đặt tài khoản</h1>
        <p className='text-gray-600'>Quản lý cài đặt và bảo mật</p>
      </div>

      <div className='grid gap-6'>
        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-lg font-semibold mb-4'>Bảo mật</h2>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span>Đổi mật khẩu</span>
              <button className='text-blue-600 hover:text-blue-700'>Thay đổi</button>
            </div>
            <div className='flex justify-between items-center'>
              <span>Xác thực 2 bước</span>
              <button className='text-blue-600 hover:text-blue-700'>Thiết lập</button>
            </div>
          </div>
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <p className='text-yellow-800'>Tính năng cài đặt đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
