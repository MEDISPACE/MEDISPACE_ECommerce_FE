export function meta() {
  return [{ title: 'Danh sách yêu thích | MEDISPACE' }, { name: 'description', content: 'Sản phẩm yêu thích của bạn' }]
}

export default function AccountWishlist() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Danh sách yêu thích</h1>
        <p className='text-gray-600'>Các sản phẩm bạn đã lưu</p>
      </div>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Chưa có sản phẩm yêu thích nào</p>
        </div>
      </div>
    </div>
  )
}
