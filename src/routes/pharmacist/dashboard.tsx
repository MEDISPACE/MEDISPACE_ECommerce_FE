import { PharmacistDashboard } from '~/components/pharmacist'

export function meta() {
  return [
    { title: 'Dashboard Dược sĩ | MEDISPACE' },
    { name: 'description', content: 'Bảng điều khiển dành cho dược sĩ' },
  ]
}

export default function PharmacistDashboardRoute() {
  return <PharmacistDashboard />
}
