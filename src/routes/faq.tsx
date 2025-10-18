import { FAQPage } from '~/components/info'

export function meta() {
  return [
    { title: 'Câu hỏi thường gặp | MEDISPACE' },
    { name: 'description', content: 'Câu hỏi thường gặp và hướng dẫn sử dụng' },
  ]
}

export default function FAQRoute() {
  return <FAQPage />
}
