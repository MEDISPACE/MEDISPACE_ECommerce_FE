import { InventoryManagementPage } from '~/components/admin/InventoryManagementPage'

export function meta() {
  return [{ title: 'Quản lý kho | Admin' }, { name: 'description', content: 'Quản lý tồn kho sản phẩm' }]
}

export default function AdminInventory() {
  return <InventoryManagementPage />
}
