export function meta() {
  return [
    { title: 'Chính sách giao hàng | MEDISPACE' },
    { name: 'description', content: 'Thông tin về chính sách giao hàng và vận chuyển' },
  ]
}

export default function ShippingPolicy() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Chính sách giao hàng</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Nội dung chính sách giao hàng đang được phát triển...</p>
      </div>
    </div>
  )
}
