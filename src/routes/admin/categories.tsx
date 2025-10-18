import { CategoryManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý danh mục | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý danh mục sản phẩm' },
  ]
}

export default function CategoriesRoute() {
  return <CategoryManagementPage />
}
