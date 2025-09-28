import NotFoundPage from '../pages/NotFound'

export function meta() {
  return [
    { title: 'Không tìm thấy trang | MEDISPACE' },
    { name: 'description', content: 'Trang bạn tìm kiếm không tồn tại' },
  ]
}

export default function NotFound() {
  return <NotFoundPage />
}
