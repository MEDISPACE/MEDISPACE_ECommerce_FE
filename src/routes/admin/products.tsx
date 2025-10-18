import { ProductManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý sản phẩm | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý danh mục sản phẩm và thuốc' },
  ]
}

export default function ProductsRoute() {
  return <ProductManagementPage />
}
