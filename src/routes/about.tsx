import { AboutUsPage } from '~/components/info'

export function meta() {
  return [
    { title: 'Về chúng tôi | MEDISPACE' },
    { name: 'description', content: 'Thông tin về MEDISPACE - Nhà thuốc trực tuyến uy tín' },
  ]
}

export default function AboutRoute() {
  return <AboutUsPage />
}
