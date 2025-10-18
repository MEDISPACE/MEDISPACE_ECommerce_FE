export function meta() {
  return [
    { title: 'Upload đơn thuốc | MEDISPACE' },
    { name: 'description', content: 'Upload đơn thuốc để mua thuốc theo đơn' },
  ]
}

export default function PrescriptionUpload() {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 pb-4'>
        <h1 className='text-2xl font-bold text-gray-900'>Upload đơn thuốc</h1>
        <p className='text-gray-600'>Tải lên đơn thuốc để mua thuốc theo đơn</p>
      </div>

      <div className='bg-white p-6 rounded-lg border'>
        <div className='text-center py-12'>
          <p className='text-gray-500 mb-4'>Tính năng upload đơn thuốc đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
