import DashboardPage from '../pages/Dashboard/DashboardPage'

export function meta() {
  return [{ title: 'Dashboard | MEDISPACE' }, { name: 'description', content: 'Bảng điều khiển cá nhân MEDISPACE' }]
}

export default function Dashboard() {
  return <DashboardPage />
}
