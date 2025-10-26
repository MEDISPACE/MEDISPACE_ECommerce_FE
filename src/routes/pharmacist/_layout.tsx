import { Outlet } from 'react-router'
import { PharmacistLayout } from '~/components/layout/PharmacistLayout'
import { AuthProvider } from '~/contexts/AuthContext'

export function meta() {
  return [{ title: 'Dược sĩ | MEDISPACE' }, { name: 'description', content: 'Khu vực dành cho dược sĩ' }]
}

export default function PharmacistLayoutRoute() {
  return (
    <AuthProvider>
      <PharmacistLayout>
        <Outlet />
      </PharmacistLayout>
    </AuthProvider>
  )
}
