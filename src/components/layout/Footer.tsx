import { Phone, Mail, MapPin, Facebook, Youtube, Zap } from 'lucide-react'
import { Link } from 'react-router'
import medispaceLogo from '../../assets/MEDISPACE_Logo_Final.png'

export function Footer() {
  return (
    <footer className='bg-white border-t border-gray-200 mt-16'>
      {/* Main footer */}
      <div className='max-w-7xl mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Company info */}
          <div>
            <Link to='/' className='inline-block mb-4'>
              <img
                src={medispaceLogo}
                alt='MEDISPACE - Sức khỏe trong tầm tay'
                className='h-10 w-auto object-contain'
              />
            </Link>
            <p className='text-gray-600 mb-4'>
              Nền tảng dược phẩm trực tuyến hàng đầu Việt Nam. Cung cấp thuốc chất lượng, giao hàng nhanh và tư vấn dược
              sĩ chuyên nghiệp.
            </p>
            <div className='flex gap-3'>
              <a
                href='#'
                className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors'
              >
                <Facebook className='w-4 h-4' />
              </a>
              <a
                href='#'
                className='w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors'
              >
                <Youtube className='w-4 h-4' />
              </a>
              <a
                href='#'
                className='w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors'
              >
                <Zap className='w-4 h-4' />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className='font-semibold text-gray-900 mb-4'>Liên kết nhanh</h4>
            <ul className='space-y-2'>
              <li>
                <Link to='/about' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to='/stores' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Hệ thống nhà thuốc
                </Link>
              </li>
              <li>
                <Link to='/careers' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to='/health' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Tin tức sức khỏe
                </Link>
              </li>
              <li>
                <Link to='/consultation' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Tư vấn trực tuyến
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className='font-semibold text-gray-900 mb-4'>Hỗ trợ khách hàng</h4>
            <ul className='space-y-2'>
              <li>
                <Link to='/help' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to='/shipping' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Chính sách giao hàng
                </Link>
              </li>
              <li>
                <Link to='/returns' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Đổi trả & Hoàn tiền
                </Link>
              </li>
              <li>
                <Link to='/warranty' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link to='/privacy' className='text-gray-600 hover:text-primary-500 transition-colors'>
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className='font-semibold text-gray-900 mb-4'>Liên hệ</h4>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Phone className='w-5 h-5 text-primary-500' />
                <span className='text-gray-600'>1800 6928</span>
              </div>
              <div className='flex items-center gap-2'>
                <Mail className='w-5 h-5 text-primary-500' />
                <span className='text-gray-600'>support@medispace.vn</span>
              </div>
              <div className='flex items-start gap-2'>
                <MapPin className='w-5 h-5 text-primary-500 mt-0.5' />
                <span className='text-gray-600'>
                  123 Đường ABC, Quận 1,
                  <br />
                  TP. Hồ Chí Minh, Việt Nam
                </span>
              </div>
            </div>

            <div className='mt-6'>
              <h5 className='font-medium text-gray-900 mb-2'>Giờ hoạt động</h5>
              <p className='text-gray-600 text-sm'>
                Thứ 2 - Chủ nhật: 7:00 - 22:00
                <br />
                Tư vấn trực tuyến 24/7
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className='border-t border-gray-200 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-600 text-sm'>© 2025 MediSpace. Tất cả quyền được bảo lưu.</p>
            <div className='flex gap-6 mt-4 md:mt-0'>
              <Link to='/terms' className='text-gray-600 hover:text-primary-500 text-sm transition-colors'>
                Điều khoản sử dụng
              </Link>
              <Link to='/privacy' className='text-gray-600 hover:text-primary-500 text-sm transition-colors'>
                Chính sách bảo mật
              </Link>
              <Link to='/cookies' className='text-gray-600 hover:text-primary-500 text-sm transition-colors'>
                Chính sách Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
