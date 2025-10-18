import { ChatPage } from '~/components/consultation'

export function meta() {
  return [
    { title: 'Tư vấn dược sĩ | MEDISPACE' },
    { name: 'description', content: 'Chat trực tiếp với dược sĩ chuyên nghiệp' },
  ]
}

export default function ConsultationRoute() {
  return <ChatPage />
}
