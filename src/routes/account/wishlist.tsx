export function meta() {
  return [{ title: 'Danh sách yêu thích | MEDISPACE' }, { name: 'description', content: 'Sản phẩm yêu thích của bạn' }]
}

import { WishlistPage } from '../../components/account/WishlistPage'

export default function AccountWishlist() {
  return <WishlistPage />
}
