import { ProductDetailPage } from '../../components/products/ProductDetailPage'

export function meta({ params }: { params: { slug: string } }) {
  return [{ title: `Sản phẩm | MEDISPACE` }, { name: 'description', content: `Chi tiết sản phẩm` }]
}

export default function ProductDetail() {
  return <ProductDetailPage />
}
