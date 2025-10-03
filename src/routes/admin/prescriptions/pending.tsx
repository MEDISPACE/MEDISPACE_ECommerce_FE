export function meta() {
  return [{ title: 'Đơn thuốc chờ duyệt | Admin' }, { name: 'description', content: 'Duyệt đơn thuốc khách hàng' }]
}

export default function AdminPrescriptionsPending() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Đơn thuốc chờ duyệt</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Danh sách đơn thuốc chờ duyệt đang được phát triển...</p>
      </div>
    </div>
  )
}
