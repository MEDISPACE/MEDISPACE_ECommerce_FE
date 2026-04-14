import { AccountReviewsPage } from '~/components/account'

export function meta() {
  return [
    { title: 'Đánh giá của tôi | MEDISPACE' },
    { name: 'description', content: 'Quản lý các đánh giá sản phẩm của bạn' },
  ]
}

export default function AccountReviewsRoute() {
  return <AccountReviewsPage />
}
