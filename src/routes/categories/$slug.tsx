import { CategoryPage } from '~/components/categories'

export function meta({ params }: { params: { slug: string } }) {
  return [
    { title: `Danh mục ${params.slug} | MEDISPACE` },
    { name: 'description', content: `Sản phẩm trong danh mục ${params.slug}` },
  ]
}

export default function CategorySlugRoute() {
  return <CategoryPage />
}
