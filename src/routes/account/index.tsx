export default function AccountIndex() {
  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>Thông tin tài khoản</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Họ và tên</label>
            <input
              type='text'
              className='w-full border border-gray-300 rounded-lg px-3 py-2'
              placeholder='Nhập họ và tên'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
            <input
              type='email'
              className='w-full border border-gray-300 rounded-lg px-3 py-2'
              placeholder='Nhập email'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Số điện thoại</label>
            <input
              type='tel'
              className='w-full border border-gray-300 rounded-lg px-3 py-2'
              placeholder='Nhập số điện thoại'
            />
          </div>
        </div>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Ngày sinh</label>
            <input type='date' className='w-full border border-gray-300 rounded-lg px-3 py-2' />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Giới tính</label>
            <select className='w-full border border-gray-300 rounded-lg px-3 py-2'>
              <option value=''>Chọn giới tính</option>
              <option value='male'>Nam</option>
              <option value='female'>Nữ</option>
              <option value='other'>Khác</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
