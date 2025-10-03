export function meta() {
  return [
    { title: 'Về MEDISPACE | MEDISPACE' },
    { name: 'description', content: 'Tìm hiểu về MEDISPACE - nhà thuốc trực tuyến uy tín' },
  ]
}

export default function About() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Về MEDISPACE</h1>

      <div className='prose max-w-none'>
        <div className='bg-white p-6 rounded-lg border'>
          <p className='text-gray-600 mb-4'>
            MEDISPACE là nền tảng mua thuốc trực tuyến uy tín, an toàn và tiện lợi hàng đầu Việt Nam.
          </p>
          <p className='text-gray-600'>
            Chúng tôi cam kết mang đến cho khách hàng trải nghiệm mua sắm thuốc tốt nhất với đội ngũ dược sĩ chuyên
            nghiệp và dịch vụ giao hàng nhanh chóng.
          </p>
        </div>
      </div>
    </div>
  )
}
