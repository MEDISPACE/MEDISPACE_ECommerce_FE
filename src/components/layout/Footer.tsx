import { Phone, Mail, MapPin, Facebook, Youtube, Shield, BadgeCheck, CreditCard } from 'lucide-react'
import { Link } from 'react-router'
import medispaceLogo from '../../assets/MEDISPACE_Logo_Final.png'
import { PaymentMethodLogo } from '../shared/PaymentMethodDisplay'

const paymentMethods = ['vnpay', 'payos', 'MoMo', 'ZaloPay', 'COD', 'Visa', 'Mastercard']

export function Footer() {
  return (
    <footer className='border-t border-[#E8EDF5] bg-white'>
      <div className='mx-auto max-w-7xl px-4 py-10'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]'>
          <div>
            <Link to='/' className='inline-block mb-4'>
              <img src={medispaceLogo} alt='MEDISPACE - Sức khỏe trong tầm tay' className='h-11 w-auto object-contain' />
            </Link>
            <p className='max-w-md text-sm leading-6 text-[#4B5E7A]'>
              Nhà thuốc trực tuyến được cấp phép hoạt động, hỗ trợ mua thuốc chính hãng, gửi đơn thuốc và tư vấn dược sĩ.
            </p>

            <div className='mt-5 space-y-2 rounded-xl border border-[#E8EDF5] bg-[#F8FAFB] p-4 text-sm text-[#1C2B4A]'>
              <div className='flex items-center gap-2 font-semibold text-[#0A2463]'>
                <Shield className='h-4 w-4' />
                Thông tin pháp lý nhà thuốc
              </div>
              <div>Số GCN: <span className='font-mono font-semibold'>GPP-MS-2026-001</span></div>
              <div>ĐKKD: <span className='font-mono'>0123456789</span></div>
              <div>Địa chỉ: 01 Đường Võ Văn Ngân, phường Thủ Đức, TP. Hồ Chí Minh</div>
              <div className='flex items-center gap-2 text-[#059669]'>
                <BadgeCheck className='h-4 w-4' />
                Được cấp phép bởi cơ quan quản lý y tế có thẩm quyền
              </div>
            </div>
          </div>

          <div>
            <h4 className='font-display font-semibold text-[#0A2463] mb-4'>Về MEDISPACE</h4>
            <ul className='space-y-2 text-sm'>
              <li><Link to='/about' className='text-[#4B5E7A] hover:text-[#0A2463]'>Về chúng tôi</Link></li>
              <li><Link to='/products' className='text-[#4B5E7A] hover:text-[#0A2463]'>Sản phẩm</Link></li>
              <li><Link to='/health' className='text-[#4B5E7A] hover:text-[#0A2463]'>Góc sức khỏe</Link></li>
              <li><Link to='/contact' className='text-[#4B5E7A] hover:text-[#0A2463]'>Tư vấn dược sĩ</Link></li>
              <li><Link to='/upload-prescription' className='text-[#4B5E7A] hover:text-[#0A2463]'>Gửi đơn thuốc</Link></li>
            </ul>
          </div>

          <div>
            <h4 className='font-display font-semibold text-[#0A2463] mb-4'>Chính sách</h4>
            <ul className='space-y-2 text-sm'>
              <li><Link to='/faq' className='text-[#4B5E7A] hover:text-[#0A2463]'>Câu hỏi thường gặp</Link></li>
              <li><Link to='/shipping-policy' className='text-[#4B5E7A] hover:text-[#0A2463]'>Chính sách giao hàng</Link></li>
              <li><Link to='/account/returns' className='text-[#4B5E7A] hover:text-[#0A2463]'>Đổi trả & hoàn tiền</Link></li>
              <li><Link to='/privacy' className='text-[#4B5E7A] hover:text-[#0A2463]'>Chính sách bảo mật</Link></li>
              <li><Link to='/terms' className='text-[#4B5E7A] hover:text-[#0A2463]'>Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          <div>
            <h4 className='font-display font-semibold text-[#0A2463] mb-4'>Liên hệ</h4>
            <div className='space-y-3 text-sm'>
              <a href='tel:18006928' className='flex items-center gap-2 text-[#4B5E7A] hover:text-[#0A2463]'>
                <Phone className='w-5 h-5 text-[#0A2463]' />
                1800 6928
              </a>
              <a href='mailto:support@medispace.vn' className='flex items-center gap-2 text-[#4B5E7A] hover:text-[#0A2463]'>
                <Mail className='w-5 h-5 text-[#0A2463]' />
                support@medispace.vn
              </a>
              <div className='flex items-start gap-2 text-[#4B5E7A]'>
                <MapPin className='w-5 h-5 text-[#0A2463] mt-0.5' />
                <span>01 Đường Võ Văn Ngân, phường Thủ Đức, TP. Hồ Chí Minh</span>
              </div>
            </div>

            <div className='mt-6'>
              <div className='mb-2 flex items-center gap-2 font-display text-sm font-semibold text-[#0A2463]'>
                <CreditCard className='h-4 w-4' />
                Thanh toán hỗ trợ
              </div>
              <div className='flex flex-wrap gap-2'>
                {paymentMethods.map((method) => (
                  <span key={method} className='inline-flex h-8 items-center rounded-md border border-[#E8EDF5] bg-[#F8FAFB] px-2.5 py-1 text-xs font-semibold text-[#1C2B4A]'>
                    {method === 'vnpay' || method === 'payos' ? (
                      <PaymentMethodLogo method={method} className='h-4 w-auto max-w-[64px]' />
                    ) : (
                      method
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-[#E8EDF5] bg-[#F8FAFB]'>
        <div className='mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between'>
          <p className='text-sm text-[#4B5E7A]'>© 2026 MediSpace. Tất cả quyền được bảo lưu.</p>
          <div className='flex flex-wrap items-center gap-3'>
            <a href='https://facebook.com/medispace.vn' className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0A2463] text-white' aria-label='Facebook MediSpace'>
              <Facebook className='h-4 w-4' />
            </a>
            <a href='https://youtube.com/@medispace' className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626] text-white' aria-label='YouTube MediSpace'>
              <Youtube className='h-4 w-4' />
            </a>
            <a href='https://zalo.me/18006928' className='rounded-full bg-[#1E40AF] px-3 py-1.5 text-xs font-bold text-white'>Zalo</a>
            <a href='https://www.tiktok.com/@medispace' className='rounded-full bg-[#111827] px-3 py-1.5 text-xs font-bold text-white'>TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
