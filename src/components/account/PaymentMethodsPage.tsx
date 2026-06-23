import { Link } from 'react-router'
import { CreditCard, Lock, ShieldCheck, ShoppingCart } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export function PaymentMethodsPage() {
  return (
    <div className='space-y-6' data-testid='payment-methods-page'>
      <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-blue-800 mb-2'>Phương thức thanh toán</h1>
            <p className='text-gray-600'>Medispace hiện chọn phương thức thanh toán trong từng đơn hàng.</p>
          </div>

          <Link to='/cart/checkout' data-testid='payment-checkout-link'>
            <Button className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white hover:from-[#071A49] hover:to-[#0A2463]'>
              <ShoppingCart className='w-4 h-4 mr-2' />
              Đi tới thanh toán
            </Button>
          </Link>
        </div>
      </div>

      <Card className='border-[#E8EDF5] bg-white/80 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-blue-800'>
            <ShieldCheck className='w-5 h-5' />
            Lưu phương thức thanh toán chưa được bật
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm text-gray-600'>
          <div className='flex gap-3 rounded-lg border border-[#BFDBFE] bg-[#F0F6FF] p-4' data-testid='payment-tokenization-notice'>
            <Lock className='mt-0.5 h-5 w-5 flex-shrink-0 text-[#1E40AF]' />
            <div>
              <p className='font-medium text-gray-900'>Medispace không thu hoặc lưu số thẻ/CVV trong tài khoản.</p>
              <p className='mt-1'>
                Khi thanh toán online, bạn sẽ được chuyển qua luồng thanh toán an toàn của cổng thanh toán được hỗ trợ
                cho từng đơn hàng.
              </p>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-lg border border-[#E8EDF5] p-4'>
              <CreditCard className='mb-3 h-6 w-6 text-[#1E40AF]' />
              <p className='font-medium text-gray-900'>Không lưu thẻ thô</p>
              <p className='mt-1'>Thông tin thẻ chỉ nên được xử lý qua nhà cung cấp thanh toán có tokenization.</p>
            </div>
            <div className='rounded-lg border border-[#E8EDF5] p-4'>
              <ShieldCheck className='mb-3 h-6 w-6 text-green-600' />
              <p className='font-medium text-gray-900'>Thanh toán theo đơn</p>
              <p className='mt-1'>Bạn vẫn có thể chọn COD hoặc thanh toán online trong checkout.</p>
            </div>
            <div className='rounded-lg border border-[#E8EDF5] p-4'>
              <Lock className='mb-3 h-6 w-6 text-gray-600' />
              <p className='font-medium text-gray-900'>Sẵn sàng mở rộng</p>
              <p className='mt-1'>Khi có gateway hỗ trợ lưu token, trang này sẽ hiển thị phương thức đã tokenized.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
