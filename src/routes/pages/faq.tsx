export function meta() {
  return [
    { title: 'Câu hỏi thường gặp | MEDISPACE' },
    { name: 'description', content: 'Giải đáp các thắc mắc thường gặp' },
  ]
}

export default function FAQ() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Câu hỏi thường gặp</h1>
      <div className='bg-white p-6 rounded-lg border'>
        <p className='text-gray-500'>Nội dung FAQ đang được phát triển...</p>
      </div>
    </div>
  )
}
