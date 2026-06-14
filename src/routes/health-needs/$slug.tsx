import { HealthNeedDetailPage } from '~/components/health-needs'

export function meta() {
  return [
    { title: 'Nhu cầu sức khỏe | MEDISPACE' },
    { name: 'description', content: 'Xem sản phẩm gợi ý, bài viết liên quan và lưu ý khi mua theo nhu cầu sức khỏe.' },
  ]
}

export default function HealthNeedDetailRoute() {
  return <HealthNeedDetailPage />
}
