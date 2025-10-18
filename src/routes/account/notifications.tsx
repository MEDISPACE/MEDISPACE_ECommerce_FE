import { NotificationsPage } from '~/components/account'

export function meta() {
  return [{ title: 'Thông báo | MEDISPACE' }, { name: 'description', content: 'Xem thông báo và tin tức' }]
}

export default function NotificationsRoute() {
  return <NotificationsPage />
}
