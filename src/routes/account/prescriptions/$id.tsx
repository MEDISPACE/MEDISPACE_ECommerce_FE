import { PrescriptionDetailPage } from '~/components/account/PrescriptionDetailPage'

export function meta({ params }: { params: { id: string } }) {
  return [{ title: `Đơn thuốc #${params.id} | MEDISPACE` }, { name: 'description', content: 'Theo dõi trạng thái đơn thuốc của bạn' }]
}

export default function PrescriptionDetailRoute() {
  return <PrescriptionDetailPage />
}
