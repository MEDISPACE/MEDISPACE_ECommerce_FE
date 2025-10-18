import { SubCategoryPage } from '~/components/categories'

export function meta({ params }: { params: { slug: string; subSlug: string } }) {
  return [
    { title: `${params.subSlug} | MEDISPACE` },
    { name: 'description', content: `Sản phẩm trong danh mục ${params.subSlug}` },
  ]
}

export default function SubCategoryRoute() {
  return <SubCategoryPage />
}
