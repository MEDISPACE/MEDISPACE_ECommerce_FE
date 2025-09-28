import HomePage from '../pages/Home/HomePage'

export function meta() {
  return [
    { title: 'MEDISPACE - Trang chủ' },
    { name: 'description', content: 'Nền tảng mua thuốc trực tuyến uy tín, an toàn và tiện lợi tại Việt Nam' },
    { name: 'keywords', content: 'mua thuốc online, nhà thuốc trực tuyến, MEDISPACE, thuốc chính hãng' },
  ]
}

export default function Home() {
  return <HomePage />
}
