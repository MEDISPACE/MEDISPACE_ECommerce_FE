import { ProductComparisonPage } from '~/components/products'

export function meta() {
  return [
    { title: 'So sánh sản phẩm | MEDISPACE' },
    { name: 'description', content: 'So sánh các sản phẩm y tế và thuốc' },
  ]
}

export default function ProductCompareRoute() {
  return <ProductComparisonPage />
}
