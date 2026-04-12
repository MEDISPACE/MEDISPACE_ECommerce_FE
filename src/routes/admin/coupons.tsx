import { CouponManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý Coupon | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý mã giảm giá và khuyến mãi' },
  ]
}

export default function AdminCouponsRoute() {
  return <CouponManagementPage />
}
