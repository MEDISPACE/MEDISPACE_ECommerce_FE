export function meta() {
  return [{ title: 'Quản lý khách hàng | Admin' }, { name: 'description', content: 'Quản lý danh sách khách hàng' }]
}

export default function AdminCustomers() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Quản lý khách hàng</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Danh sách khách hàng đang được phát triển...</p>
      </div>
    </div>
  )
}
