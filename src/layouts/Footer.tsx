import React from 'react'
import { Link } from 'react-router'
import {
  Package,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Shield,
  Truck,
  Clock,
  Award,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className='bg-white border-t'>
      {/* Trust Indicators */}
      <div className='bg-gradient-to-r from-blue-50 to-cyan-50 py-8'>
        <div className='container mx-auto px-6'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <Shield className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <p className='font-medium text-gray-900'>Thuốc chính hãng</p>
                <p className='text-sm text-gray-600'>100% authentic</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center'>
                <Truck className='w-5 h-5 text-cyan-600' />
              </div>
              <div>
                <p className='font-medium text-gray-900'>Giao hàng nhanh</p>
                <p className='text-sm text-gray-600'>1-2 ngày</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <Clock className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <p className='font-medium text-gray-900'>Hỗ trợ 24/7</p>
                <p className='text-sm text-gray-600'>Luôn sẵn sàng</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center'>
                <Award className='w-5 h-5 text-cyan-600' />
              </div>
              <div>
                <p className='font-medium text-gray-900'>Uy tín hàng đầu</p>
                <p className='text-sm text-gray-600'>5+ năm kinh nghiệm</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className='py-12'>
        <div className='container mx-auto px-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {/* Company Info */}
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center'>
                  <Package className='h-4 w-4 text-white' />
                </div>
                <span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'>
                  MEDISPACE
                </span>
              </div>

              <p className='text-gray-600 text-sm leading-relaxed'>
                Nhà thuốc trực tuyến hàng đầu Việt Nam, cung cấp thuốc chính hãng và dịch vụ chăm sóc sức khỏe tận tâm
                cho mọi gia đình.
              </p>

              <div className='flex space-x-3'>
                <a
                  href='#'
                  className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors'
                >
                  <Facebook className='w-4 h-4 text-blue-600' />
                </a>
                <a
                  href='#'
                  className='w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center hover:bg-cyan-200 transition-colors'
                >
                  <Twitter className='w-4 h-4 text-cyan-600' />
                </a>
                <a
                  href='#'
                  className='w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors'
                >
                  <Instagram className='w-4 h-4 text-pink-600' />
                </a>
                <a
                  href='#'
                  className='w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors'
                >
                  <Youtube className='w-4 h-4 text-red-600' />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-gray-900'>Liên kết nhanh</h3>
              <ul className='space-y-2'>
                <li>
                  <Link to='/' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to='/products' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to='/categories' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Danh mục thuốc
                  </Link>
                </li>
                <li>
                  <Link to='/prescription' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Kê đơn online
                  </Link>
                </li>
                <li>
                  <Link to='/consultation' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Tư vấn trực tuyến
                  </Link>
                </li>
                <li>
                  <Link to='/blog' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Blog sức khỏe
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-gray-900'>Chăm sóc khách hàng</h3>
              <ul className='space-y-2'>
                <li>
                  <Link to='/support' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Trung tâm hỗ trợ
                  </Link>
                </li>
                <li>
                  <Link to='/shipping' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Chính sách giao hàng
                  </Link>
                </li>
                <li>
                  <Link to='/returns' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Đổi trả & Hoàn tiền
                  </Link>
                </li>
                <li>
                  <Link to='/privacy' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link to='/terms' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link to='/faq' className='text-gray-600 hover:text-blue-600 transition-colors text-sm'>
                    Câu hỏi thường gặp
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-gray-900'>Liên hệ</h3>
              <div className='space-y-3'>
                <div className='flex items-start space-x-3'>
                  <MapPin className='w-4 h-4 text-gray-400 mt-1 flex-shrink-0' />
                  <div>
                    <p className='text-sm text-gray-600'>
                      01 Đường Võ Văn Ngân
                      <br />
                      Thủ Đức, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-3'>
                  <Phone className='w-4 h-4 text-gray-400 flex-shrink-0' />
                  <a href='tel:1900123456' className='text-sm text-gray-600 hover:text-blue-600'>
                    1900 123 456
                  </a>
                </div>

                <div className='flex items-center space-x-3'>
                  <Mail className='w-4 h-4 text-gray-400 flex-shrink-0' />
                  <a href='mailto:support@medispace.com' className='text-sm text-gray-600 hover:text-blue-600'>
                    support@medispace.com
                  </a>
                </div>
              </div>

              {/* Download Apps */}
              <div className='pt-4'>
                <p className='text-sm font-medium text-gray-900 mb-2'>Tải ứng dụng</p>
                <div className='space-y-2'>
                  <a href='#' className='block'>
                    <img
                      src='https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg'
                      alt='Get it on Google Play'
                      className='h-8'
                    />
                  </a>
                  <a href='#' className='block'>
                    <img
                      src='https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'
                      alt='Download on App Store'
                      className='h-8'
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t bg-gray-50'>
        <div className='container mx-auto px-6 py-4'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0'>
            <p className='text-sm text-gray-600'>© 2024 MEDISPACE. Tất cả các quyền được bảo lưu.</p>

            <div className='flex items-center space-x-4'>
              <p className='text-xs text-gray-500'>Giấy phép kinh doanh dược: 123456/GP-YHCT</p>
              <div className='flex space-x-2'>
                <img
                  src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=32&h=20&fit=crop&crop=center'
                  alt='Bộ Y tế'
                  className='h-5'
                />
                <img
                  src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=32&h=20&fit=crop&crop=center'
                  alt='FDA'
                  className='h-5'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
