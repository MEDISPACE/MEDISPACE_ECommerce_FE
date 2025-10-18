import { ProductsListingPage } from '~/components/products'

export function meta() {
  return [
    { title: 'Tất cả sản phẩm | MEDISPACE' },
    { name: 'description', content: 'Danh sách tất cả thuốc và thiết bị y tế tại MEDISPACE' },
  ]
}

export default function Products() {
  return <ProductsListingPage />
}
