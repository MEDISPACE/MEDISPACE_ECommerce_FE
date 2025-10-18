import { UserManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý người dùng | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý tài khoản khách hàng' },
  ]
}

export default function UsersRoute() {
  return <UserManagementPage />
}
