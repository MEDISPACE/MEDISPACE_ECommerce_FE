import { SystemSettingsPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Cài đặt hệ thống | MEDISPACE Admin' },
    { name: 'description', content: 'Cấu hình hệ thống và cài đặt' },
  ]
}

export default function SettingsRoute() {
  return <SystemSettingsPage />
}
