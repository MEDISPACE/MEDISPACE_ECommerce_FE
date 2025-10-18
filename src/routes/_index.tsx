import { HomePage } from '~/components/home/HomePage'

export function meta() {
  return [
    { title: 'MEDISPACE - Nhà thuốc trực tuyến #1 Việt Nam' },
    {
      name: 'description',
      content: 'Mua thuốc trực tuyến an toàn, tiện lợi. Giao hàng nhanh, tư vấn miễn phí từ dược sĩ chuyên nghiệp.',
    },
  ]
}

export default function Index() {
  return <HomePage />
}
