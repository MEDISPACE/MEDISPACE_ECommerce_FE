import { AddressBookPage } from '~/components/account'

export function meta() {
  return [{ title: 'Địa chỉ giao hàng | MEDISPACE' }, { name: 'description', content: 'Quản lý địa chỉ giao hàng' }]
}

export default function AddressesRoute() {
  return <AddressBookPage />
}
