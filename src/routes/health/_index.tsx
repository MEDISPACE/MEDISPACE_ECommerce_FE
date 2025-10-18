import { HealthCornerPage } from '~/components/health'

export function meta() {
  return [
    { title: 'Góc sức khỏe | MEDISPACE' },
    { name: 'description', content: 'Kiến thức và thông tin chăm sóc sức khỏe' },
  ]
}

export default function HealthRoute() {
  return <HealthCornerPage />
}
