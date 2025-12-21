import { ReportsAnalyticsPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Báo cáo & Phân tích | MEDISPACE Admin' },
    { name: 'description', content: 'Xem báo cáo và phân tích dữ liệu' },
  ]
}

export default function ReportsRoute() {
  return <ReportsAnalyticsPage />
}
