export function meta() {
  return [{ title: 'Đánh giá của tôi | MEDISPACE' }, { name: 'description', content: 'Quản lý đánh giá sản phẩm' }]
}

export default function AccountReviews() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Đánh giá của tôi</h1>
        <p className='text-gray-600'>Các đánh giá bạn đã viết</p>
      </div>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Chưa có đánh giá nào</p>
        </div>
      </div>
    </div>
  )
}
