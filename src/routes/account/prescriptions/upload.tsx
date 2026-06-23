import { UploadPrescriptionPage } from '~/components/prescription'

export function meta() {
  return [
    { title: 'Upload đơn thuốc | MEDISPACE' },
    { name: 'description', content: 'Upload đơn thuốc để mua thuốc theo đơn' },
  ]
}

export default function PrescriptionUpload() {
  return (
    <div data-testid='prescription-upload-form'>
      <UploadPrescriptionPage />
    </div>
  )
}
