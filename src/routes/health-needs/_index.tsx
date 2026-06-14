import { HealthNeedsPage } from '~/components/health-needs'

export function meta() {
  return [
    { title: 'Nhu cầu sức khỏe | MEDISPACE' },
    { name: 'description', content: 'Chọn nhu cầu sức khỏe để xem sản phẩm gợi ý, bài viết liên quan và lưu ý từ MediSpace.' },
  ]
}

export default function HealthNeedsRoute() {
  return <HealthNeedsPage />
}
