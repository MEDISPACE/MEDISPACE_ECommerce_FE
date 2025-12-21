import { SearchResultsPage } from '~/components/search'

export function meta() {
  return [
    { title: 'Kết quả tìm kiếm | MEDISPACE' },
    { name: 'description', content: 'Kết quả tìm kiếm sản phẩm trên MEDISPACE' },
  ]
}

export default function SearchRoute() {
  return <SearchResultsPage />
}
