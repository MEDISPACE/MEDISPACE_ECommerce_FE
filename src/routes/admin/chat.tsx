import { AdminChatPage } from '~/components/admin'

export function meta() {
  return [{ title: 'Quản lý Chat | MEDISPACE Admin' }, { name: 'description', content: 'Giám sát và quản lý các cuộc tư vấn chat' }]
}

export default function AdminChatRoute() {
  return <AdminChatPage />
}
