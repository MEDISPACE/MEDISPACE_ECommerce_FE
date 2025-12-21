export function meta() {
  return [{ title: 'Quản lý đơn thuốc | Admin' }, { name: 'description', content: 'Quản lý đơn thuốc khách hàng' }]
}

export default function AdminPrescriptions() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Quản lý đơn thuốc</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Danh sách đơn thuốc đang được phát triển...</p>
      </div>
    </div>
  )
}
