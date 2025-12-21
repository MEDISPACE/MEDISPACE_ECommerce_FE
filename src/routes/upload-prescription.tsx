import { UploadPrescriptionPage } from '~/components/prescription'

export function meta() {
  return [{ title: 'Upload đơn thuốc | MEDISPACE' }, { name: 'description', content: 'Tải lên đơn thuốc để đặt hàng' }]
}

export default function UploadPrescriptionRoute() {
  return <UploadPrescriptionPage />
}
