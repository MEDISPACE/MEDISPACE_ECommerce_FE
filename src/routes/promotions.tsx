export function meta() {
  return [{ title: 'Khuyến mãi | MEDISPACE' }, { name: 'description', content: 'Các chương trình khuyến mãi hấp dẫn' }]
}

export default function Promotions() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Khuyến mãi</h1>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Chương trình khuyến mãi đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
