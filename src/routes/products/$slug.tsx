import { ProductDetailPage } from '../../components/products/ProductDetailPage'

export function meta({ params }: { params: { slug: string } }) {
  return [{ title: `${params.slug} | MEDISPACE` }, { name: 'description', content: `Chi tiết sản phẩm ${params.slug}` }]
}

export default function ProductDetail() {
  return <ProductDetailPage />
}
