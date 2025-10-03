export default function AdminDashboard() {
  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>Bảng điều khiển</h1>

      {/* Dashboard Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Đơn hàng hôm nay</h3>
          <p className='text-3xl font-bold text-blue-600'>125</p>
          <p className='text-sm text-green-600'>+12% so với hôm qua</p>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Doanh thu hôm nay</h3>
          <p className='text-3xl font-bold text-green-600'>15.2M</p>
          <p className='text-sm text-green-600'>+8% so với hôm qua</p>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Sản phẩm bán chạy</h3>
          <p className='text-3xl font-bold text-purple-600'>89</p>
          <p className='text-sm text-gray-500'>Sản phẩm khác nhau</p>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Khách hàng mới</h3>
          <p className='text-3xl font-bold text-cyan-600'>42</p>
          <p className='text-sm text-green-600'>+15% so với hôm qua</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Hoạt động gần đây</h2>
        <div className='space-y-4'>
          <div className='flex items-center justify-between py-2'>
            <span className='text-gray-600'>Đơn hàng #12345 đã được tạo</span>
            <span className='text-sm text-gray-500'>5 phút trước</span>
          </div>
          <div className='flex items-center justify-between py-2'>
            <span className='text-gray-600'>Sản phẩm "Paracetamol 500mg" đã hết hàng</span>
            <span className='text-sm text-gray-500'>15 phút trước</span>
          </div>
          <div className='flex items-center justify-between py-2'>
            <span className='text-gray-600'>Khách hàng mới đăng ký tài khoản</span>
            <span className='text-sm text-gray-500'>30 phút trước</span>
          </div>
        </div>
      </div>
    </div>
  )
}
