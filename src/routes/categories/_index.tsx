import { CategoriesOverviewPage } from '~/components/categories'

export function meta() {
  return [{ title: 'Danh mục sản phẩm | MEDISPACE' }, { name: 'description', content: 'Xem tất cả danh mục sản phẩm' }]
}

export default function CategoriesRoute() {
  return <CategoriesOverviewPage />
}
