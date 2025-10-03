export function meta() {
  return [
    { title: 'Danh mục sản phẩm | MEDISPACE' },
    { name: 'description', content: 'Tất cả danh mục thuốc và sản phẩm y tế' },
  ]
}

export default function Categories() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Danh mục sản phẩm</h1>

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-xl font-semibold mb-2'>Thuốc theo đơn</h2>
          <p className='text-gray-600'>Thuốc kê đơn chính hãng</p>
        </div>

        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-xl font-semibold mb-2'>Thuốc không kê đơn</h2>
          <p className='text-gray-600'>OTC an toàn, hiệu quả</p>
        </div>

        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-xl font-semibold mb-2'>Thực phẩm chức năng</h2>
          <p className='text-gray-600'>Vitamin & supplements</p>
        </div>
      </div>
    </div>
  )
}
