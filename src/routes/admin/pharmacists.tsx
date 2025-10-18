import { PharmacistManagementPage } from '~/components/admin'

export function meta() {
  return [{ title: 'Quản lý dược sĩ | MEDISPACE Admin' }, { name: 'description', content: 'Quản lý tài khoản dược sĩ' }]
}

export default function PharmacistsRoute() {
  return <PharmacistManagementPage />
}
