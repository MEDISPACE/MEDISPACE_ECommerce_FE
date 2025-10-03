export function meta() {
  return [
    { title: 'Thanh toán | MEDISPACE' },
    { name: 'description', content: 'Thanh toán đơn hàng an toàn và tiện lợi' },
  ]
}

export default function CartCheckout() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Thanh toán</h1>

      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Checkout form */}
        <div className='space-y-6'>
          <div className='bg-white p-6 rounded-lg border'>
            <h2 className='text-xl font-semibold mb-4'>Thông tin giao hàng</h2>
            <p className='text-gray-500'>Form thanh toán sẽ được phát triển...</p>
          </div>
        </div>

        {/* Order summary */}
        <div className='space-y-6'>
          <div className='bg-white p-6 rounded-lg border'>
            <h2 className='text-xl font-semibold mb-4'>Tóm tắt đơn hàng</h2>
            <p className='text-gray-500'>Thông tin đơn hàng sẽ được hiển thị ở đây...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
