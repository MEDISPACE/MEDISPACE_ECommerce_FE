import { RewardsPage } from '~/components/account'

export function meta() {
  return [{ title: 'Điểm thưởng | MEDISPACE' }, { name: 'description', content: 'Quản lý điểm thưởng và ưu đãi' }]
}

export default function RewardsRoute() {
  return <RewardsPage />
}
