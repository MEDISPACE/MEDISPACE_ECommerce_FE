import { AdminLoyaltyPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Loyalty & Điểm thưởng | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý tài khoản điểm thưởng và hạng thành viên' },
  ]
}

export default function AdminLoyaltyRoute() {
  return <AdminLoyaltyPage />
}
