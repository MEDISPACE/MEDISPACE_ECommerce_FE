export function meta() {
  return [{ title: 'Liên hệ | MEDISPACE' }, { name: 'description', content: 'Thông tin liên hệ MEDISPACE' }]
}

export default function Contact() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Liên hệ</h1>

      <div className='grid md:grid-cols-2 gap-8'>
        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-xl font-semibold mb-4'>Thông tin liên hệ</h2>
          <div className='space-y-3'>
            <div>
              <strong>Điện thoại:</strong> 1900 1234
            </div>
            <div>
              <strong>Email:</strong> support@medispace.vn
            </div>
            <div>
              <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg border'>
          <h2 className='text-xl font-semibold mb-4'>Gửi tin nhắn</h2>
          <p className='text-gray-500'>Form liên hệ đang được phát triển...</p>
        </div>
      </div>
    </div>
  )
}
