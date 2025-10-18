import { CategoryPage } from '~/components/categories/CategoryPage'

export function meta({ params }: { params: { slug: string } }) {
  return [
    { title: `Danh mục ${params.slug} | MEDISPACE` },
    { name: 'description', content: `Sản phẩm thuộc danh mục ${params.slug}` },
  ]
}

export default function ProductCategory() {
  return <CategoryPage />
}
