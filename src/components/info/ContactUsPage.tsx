import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Facebook, Instagram, Youtube } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

export function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const breadcrumbItems = [{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ' }]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    // Submit
    try {
      const { contactService } = await import('~/services/contactService')
      await contactService.sendMessage(formData)

      toast.success('Đã gửi tin nhắn thành công! Chúng tôi sẽ phản hồi trong 24h', {
        icon: <Send className='w-5 h-5 text-green-600' />,
      })

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      toast.error('Có lỗi xảy ra', { description: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.' })
    }
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa chỉ văn phòng',
      content: '123 Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
      color: 'from-[#0A2463] to-[#1E40AF]',
      link: 'https://maps.google.com',
    },
    {
      icon: Phone,
      title: 'Điện thoại',
      content: 'Hotline: 1900 1234\nHỗ trợ: 028 1234 5678',
      color: 'from-[#0A2463] to-[#1E40AF]',
      link: 'tel:19001234',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'support@medispace.vn\ninfo@medispace.vn',
      color: 'from-green-500 to-emerald-500',
      link: 'mailto:support@medispace.vn',
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      content: 'Thứ 2 - Thứ 7: 8:00 - 20:00\nChủ nhật: 8:00 - 18:00',
      color: 'from-[#0A2463] to-[#1E40AF]',
    },
  ]

  const branches = [
    {
      name: 'MEDISPACE Quận 1',
      address: '456 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      phone: '028 1234 5678',
      hours: '8:00 - 22:00',
    },
    {
      name: 'MEDISPACE Quận 7',
      address: '123 Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP.HCM',
      phone: '028 8765 4321',
      hours: '8:00 - 22:00',
    },
    {
      name: 'MEDISPACE Hà Nội',
      address: '789 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
      phone: '024 3456 7890',
      hours: '8:00 - 21:00',
    },
  ]

  return (
    <div className='max-w-7xl mx-auto px-4 py-12 space-y-12'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Hero Section */}
      <div className='text-center space-y-4 animate-slide-in-up'>
        <h1 className='bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] bg-clip-text text-transparent'>
          Liên hệ với chúng tôi
        </h1>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với MEDISPACE qua các kênh dưới đây.
        </p>
      </div>

      {/* Contact Info Cards */}
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {contactInfo.map((info, index) => (
          <Card
            key={index}
            className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] hover:shadow-xl transition-all group animate-slide-in-up'
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className='p-6 text-center space-y-4'>
              <div
                className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
              >
                <info.icon className='w-8 h-8 text-white' />
              </div>
              <div>
                <h3 className='text-blue-900 mb-2'>{info.title}</h3>
                <p className='text-sm text-gray-600 whitespace-pre-line leading-relaxed'>{info.content}</p>
              </div>
              {info.link && (
                <a
                  href={info.link}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-block text-sm text-[#1E40AF] hover:text-[#0A2463] hover:underline'
                >
                  Xem chi tiết →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content: Form + Map */}
      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Contact Form */}
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] animate-slide-in-left'>
          <CardHeader className='bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF]'>
            <CardTitle className='flex items-center gap-3 text-blue-900'>
              <MessageCircle className='w-6 h-6' />
              Gửi tin nhắn cho chúng tôi
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Họ và tên *</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Nhập họ và tên của bạn'
                  className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                />
              </div>

              <div className='grid md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='email'>Email *</Label>
                  <Input
                    id='email'
                    type='email'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder='your@email.com'
                    className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                  />
                </div>

                <div>
                  <Label htmlFor='phone'>Số điện thoại *</Label>
                  <Input
                    id='phone'
                    type='tel'
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder='0901234567'
                    className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='subject'>Chủ đề *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'>
                    <SelectValue placeholder='Chọn chủ đề' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='general'>Câu hỏi chung</SelectItem>
                    <SelectItem value='order'>Hỗ trợ đơn hàng</SelectItem>
                    <SelectItem value='product'>Thông tin sản phẩm</SelectItem>
                    <SelectItem value='consultation'>Tư vấn dược sĩ</SelectItem>
                    <SelectItem value='complaint'>Góp ý / Khiếu nại</SelectItem>
                    <SelectItem value='partnership'>Hợp tác kinh doanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='message'>Nội dung *</Label>
                <Textarea
                  id='message'
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder='Nhập nội dung tin nhắn của bạn...'
                  rows={6}
                  className='border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
                />
              </div>

              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-[#0A2463] to-[#1E40AF] hover:from-[#071A49] hover:to-[#0A2463] text-white shadow-lg gap-2'
              >
                <Send className='w-5 h-5' />
                Gửi tin nhắn
              </Button>

              <p className='text-xs text-gray-500 text-center'>Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc</p>
            </form>

            {/* Chat Section */}
            <div className='mt-8 pt-6 border-t border-[#E8EDF5]'>
              <div className='flex items-start gap-4 p-4 bg-[#F0F6FF] rounded-xl'>
                <div className='p-2 bg-white rounded-full shadow-sm'>
                  <MessageCircle className='w-6 h-6 text-[#1E40AF]' />
                </div>
                <div>
                  <h4 className='font-semibold text-blue-900 mb-1'>Cần hỗ trợ ngay?</h4>
                  <p className='text-sm text-gray-600 mb-3'>
                    Dược sĩ của chúng tôi đang trực tuyến để giải đáp thắc mắc của bạn.
                  </p>
                  <Button
                    variant='outline'
                    className='bg-white border-[#BFDBFE] text-[#1E40AF] hover:bg-[#0A2463] hover:text-white transition-colors'
                    onClick={() => {
                      // Trigger global event or just direct user
                      const chatBtn = document.querySelector(
                        'button[aria-label="Chat với dược sĩ"]',
                      ) as HTMLButtonElement | null
                      if (chatBtn) {
                        chatBtn.click()
                      } else {
                        toast.info('Vui lòng tìm biểu tượng chat ở góc phải màn hình')
                      }
                    }}
                  >
                    Chat ngay
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map & Quick Links */}
        <div className='min-w-0 space-y-6 animate-slide-in-up'>
          {/* Map */}
          <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] overflow-hidden'>
            <div className='relative h-96'>
              <ImageWithFallback
                src='https://images.unsplash.com/photo-1553267570-2df1b89ba855?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
                alt='MEDISPACE Location'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent'></div>
              <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
                <h3 className='text-white mb-2'>Văn phòng chính</h3>
                <p className='text-sm text-blue-100'>123 Nguyễn Văn Linh, Quận 7, TP.HCM</p>
                <Button
                  asChild
                  variant='outline'
                  className='mt-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20'
                >
                  <a href='https://maps.google.com' target='_blank' rel='noopener noreferrer'>
                    <MapPin className='w-4 h-4 mr-2' />
                    Xem bản đồ
                  </a>
                </Button>
              </div>
            </div>
          </Card>

          {/* Social Media */}
          <Card className='bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF] border border-[#BFDBFE]'>
            <CardHeader>
              <CardTitle className='text-blue-900'>Kết nối với chúng tôi</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <p className='text-gray-700'>
                Theo dõi MEDISPACE trên mạng xã hội để cập nhật tin tức và ưu đãi mới nhất!
              </p>
              <div className='flex gap-3'>
                <a
                  href='https://facebook.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 px-4 py-2 bg-[#0A2463] text-white rounded-lg hover:bg-[#071A49] transition-colors'
                >
                  <Facebook className='w-5 h-5' />
                  Facebook
                </a>
                <a
                  href='https://instagram.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0A2463] to-[#1E40AF] text-white rounded-lg hover:from-[#071A49] hover:to-[#0A2463] transition-colors'
                >
                  <Instagram className='w-5 h-5' />
                  Instagram
                </a>
                <a
                  href='https://youtube.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                >
                  <Youtube className='w-5 h-5' />
                  Youtube
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Branches */}
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='bg-gradient-to-r from-[#0A2463] to-[#1E40AF] bg-clip-text text-transparent mb-4'>
            Hệ thống chi nhánh
          </h2>
          <p className='text-gray-600'>Ghé thăm các cửa hàng MEDISPACE gần bạn</p>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          {branches.map((branch, index) => (
            <Card
              key={index}
              className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] hover:shadow-xl transition-all animate-slide-in-up'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className='p-6 space-y-3'>
                <h3 className='text-blue-900'>{branch.name}</h3>
                <div className='space-y-2 text-sm text-gray-600'>
                  <div className='flex items-start gap-2'>
                    <MapPin className='w-4 h-4 text-[#1E40AF] mt-0.5 flex-shrink-0' />
                    <span>{branch.address}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-green-600 flex-shrink-0' />
                    <a href={`tel:${branch.phone}`} className='hover:text-[#1E40AF] hover:underline'>
                      {branch.phone}
                    </a>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-[#1E40AF] flex-shrink-0' />
                    <span>{branch.hours}</span>
                  </div>
                </div>
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  className='w-full border-2 border-[#BFDBFE] text-[#1E40AF] hover:bg-[#F0F6FF]'
                >
                  <a href='https://maps.google.com' target='_blank' rel='noopener noreferrer'>
                    <MapPin className='w-4 h-4 mr-2' />
                    Chỉ đường
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Link */}
      <Card className='bg-gradient-to-r from-[#0A2463] via-[#1E40AF] to-[#3B82F6] text-white text-center'>
        <CardContent className='p-8 space-y-4'>
          <h2 className='text-white'>Có thắc mắc?</h2>
          <p className='text-blue-50 text-lg max-w-2xl mx-auto'>
            Tham khảo trang Câu hỏi thường gặp để tìm câu trả lời nhanh chóng
          </p>
          <Button asChild className='bg-white text-[#1E40AF] hover:bg-[#F0F6FF]'>
            <a href='/faq'>Xem câu hỏi thường gặp →</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
