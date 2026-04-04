import { AdminCampaignPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Chiến dịch giảm giá | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý chiến dịch và khuyến mãi tự động' },
  ]
}

export default function AdminCampaignsRoute() {
  return <AdminCampaignPage />
}
