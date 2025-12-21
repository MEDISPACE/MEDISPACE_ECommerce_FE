import { Outlet } from 'react-router'

export function meta() {
  return [
    { title: 'Sản phẩm | MEDISPACE' },
    { name: 'description', content: 'Tìm kiếm và mua thuốc, thiết bị y tế chính hãng tại MEDISPACE' },
  ]
}

export default function ProductsLayout() {
  return (
    <div className='min-h-screen'>
      {/* Future: Breadcrumb */}
      {/* Future: Product filters sidebar */}
      <Outlet />
    </div>
  )
}
