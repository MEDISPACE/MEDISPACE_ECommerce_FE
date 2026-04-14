import { useState } from 'react'
import { Search, HelpCircle, Package, CreditCard, Truck, FileText, Phone, Shield } from 'lucide-react'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const breadcrumbItems = [{ label: 'Trang chủ', href: '/' }, { label: 'Câu hỏi thường gặp' }]

  const categories = [
    { id: 'all', label: 'Tất cả', icon: HelpCircle, count: 24 },
    { id: 'order', label: 'Đặt hàng', icon: Package, count: 8 },
    { id: 'payment', label: 'Thanh toán', icon: CreditCard, count: 6 },
    { id: 'shipping', label: 'Giao hàng', icon: Truck, count: 5 },
    { id: 'prescription', label: 'Đơn thuốc', icon: FileText, count: 5 },
  ]

  const faqs = [
    {
      category: 'order',
      question: 'Làm thế nào để đặt hàng trên MEDISPACE?',
      answer:
        "Bạn có thể đặt hàng dễ dàng qua 4 bước: 1) Chọn sản phẩm và thêm vào giỏ hàng 2) Xem giỏ hàng và bấm 'Thanh toán' 3) Điền thông tin giao hàng 4) Chọn phương thức thanh toán và hoàn tất đơn hàng. Chúng tôi sẽ xác nhận đơn hàng trong vòng 30 phút.",
    },
    {
      category: 'order',
      question: 'Tôi có thể hủy hoặc thay đổi đơn hàng sau khi đặt không?',
      answer:
        'Có, bạn có thể hủy hoặc thay đổi đơn hàng trong vòng 1 giờ sau khi đặt hàng thành công. Vui lòng liên hệ hotline 1900 1234 hoặc chat với dược sĩ để được hỗ trợ nhanh chóng.',
    },
    {
      category: 'order',
      question: 'Đơn hàng của tôi đang ở đâu?',
      answer:
        "Bạn có thể theo dõi đơn hàng bằng cách: 1) Đăng nhập vào tài khoản 2) Vào 'Tài khoản' > 'Đơn hàng của tôi' 3) Chọn đơn hàng cần kiểm tra. Hệ thống sẽ hiển thị trạng thái và vị trí đơn hàng theo thời gian thực.",
    },
    {
      category: 'order',
      question: 'Thời gian xử lý đơn hàng là bao lâu?',
      answer:
        'Chúng tôi xử lý đơn hàng trong vòng 30 phút - 2 giờ làm việc. Với đơn hàng có thuốc kê đơn, thời gian có thể kéo dài thêm 2-4 giờ để dược sĩ kiểm tra đơn thuốc.',
    },
    {
      category: 'order',
      question: 'Tôi có thể đặt hàng cho người khác không?',
      answer:
        'Có, bạn hoàn toàn có thể đặt hàng và gửi đến địa chỉ của người nhận khác. Vui lòng điền đầy đủ thông tin người nhận tại bước thanh toán.',
    },
    {
      category: 'order',
      question: 'Đơn hàng tối thiểu là bao nhiêu?',
      answer:
        'MEDISPACE không yêu cầu giá trị đơn hàng tối thiểu. Tuy nhiên, đơn hàng dưới 200,000₫ sẽ có phí giao hàng 30,000₫. Đơn hàng từ 200,000₫ trở lên được miễn phí giao hàng.',
    },
    {
      category: 'order',
      question: 'Tôi có thể đổi trả sản phẩm không?',
      answer:
        'Với thuốc và thiết bị y tế, chúng tôi chỉ nhận đổi trả nếu sản phẩm bị lỗi, hư hỏng hoặc giao sai trong vòng 48 giờ kể từ khi nhận hàng. Sản phẩm phải còn nguyên seal, chưa qua sử dụng.',
    },
    {
      category: 'order',
      question: 'Làm sao để theo dõi nhiều đơn hàng cùng lúc?',
      answer:
        "Vào 'Tài khoản' > 'Đơn hàng của tôi' để xem danh sách tất cả đơn hàng. Bạn có thể lọc theo trạng thái, sắp xếp theo thời gian và xem chi tiết từng đơn hàng.",
    },
    {
      category: 'payment',
      question: 'MEDISPACE chấp nhận những phương thức thanh toán nào?',
      answer:
        'Chúng tôi chấp nhận: 1) COD - Thanh toán khi nhận hàng 2) Chuyển khoản ngân hàng 3) Thẻ ATM/Visa/Mastercard 4) Ví điện tử: Momo, ZaloPay, VNPay 5) Quét mã QR Banking.',
    },
    {
      category: 'payment',
      question: 'Thanh toán online có an toàn không?',
      answer:
        'Hoàn toàn an toàn. MEDISPACE sử dụng cổng thanh toán bảo mật quốc tế với mã hóa SSL 256-bit. Thông tin thẻ của bạn không được lưu trữ trên hệ thống của chúng tôi.',
    },
    {
      category: 'payment',
      question: 'Tôi có thể thanh toán sau khi nhận hàng không?',
      answer:
        "Có, bạn có thể chọn phương thức 'Thanh toán khi nhận hàng (COD)'. Phí COD là 10,000₫ cho đơn hàng dưới 500,000₫ và miễn phí cho đơn hàng trên 500,000₫.",
    },
    {
      category: 'payment',
      question: 'Tôi đã thanh toán nhưng chưa nhận được xác nhận?',
      answer:
        'Vui lòng kiểm tra email (kể cả thư mục spam) hoặc tin nhắn SMS. Nếu sau 30 phút vẫn chưa nhận được, liên hệ hotline 1900 1234 với mã giao dịch để được hỗ trợ ngay.',
    },
    {
      category: 'payment',
      question: 'Có thể sử dụng nhiều phương thức thanh toán cho một đơn hàng?',
      answer:
        'Hiện tại chúng tôi chỉ hỗ trợ một phương thức thanh toán cho mỗi đơn hàng. Bạn có thể chọn phương thức phù hợp nhất tại bước thanh toán.',
    },
    {
      category: 'payment',
      question: 'Hoàn tiền mất bao lâu nếu hủy đơn hàng?',
      answer:
        'Với thanh toán online: 5-7 ngày làm việc tiền sẽ được hoàn về tài khoản. Với COD: Không phát sinh phí hủy. Chúng tôi sẽ gửi email xác nhận khi hoàn tiền thành công.',
    },
    {
      category: 'shipping',
      question: 'Thời gian giao hàng là bao lâu?',
      answer:
        'Nội thành TP.HCM/Hà Nội: 2-4 giờ (giao nhanh) hoặc 1-2 ngày (giao tiêu chuẩn). Các tỉnh thành khác: 2-3 ngày làm việc. Khu vực xa trung tâm: 3-5 ngày làm việc.',
    },
    {
      category: 'shipping',
      question: 'Phí giao hàng là bao nhiêu?',
      answer:
        'Miễn phí giao hàng cho đơn từ 200,000₫. Đơn hàng dưới 200,000₫: phí 30,000₫. Giao hàng nhanh (2-4h): thêm 30,000₫. Giao hàng vùng xa: tính theo khoảng cách.',
    },
    {
      category: 'shipping',
      question: 'Tôi không ở nhà khi shipper đến giao hàng?',
      answer:
        'Shipper sẽ gọi điện trước khi giao. Nếu bạn không ở nhà, có thể: 1) Hẹn lại thời gian giao khác 2) Nhờ người thân nhận hộ 3) Giao tại địa chỉ công ty. Vui lòng trả lời điện thoại từ tổng đài.',
    },
    {
      category: 'shipping',
      question: 'Tôi có thể thay đổi địa chỉ giao hàng không?',
      answer:
        'Có, bạn có thể thay đổi địa chỉ trước khi đơn hàng được giao cho shipper (thường trong 1-2 giờ đầu). Liên hệ ngay hotline 1900 1234 hoặc chat với chúng tôi.',
    },
    {
      category: 'shipping',
      question: 'Tôi có thể chọn thời gian giao hàng không?',
      answer:
        'Có, bạn có thể chọn khung giờ giao hàng: Sáng (8h-12h), Chiều (13h-18h), Tối (18h-21h). Lưu ý dịch vụ này chỉ áp dụng tại TP.HCM và Hà Nội.',
    },
    {
      category: 'prescription',
      question: 'Làm thế nào để upload đơn thuốc?',
      answer:
        "Bước 1: Chụp ảnh đơn thuốc rõ nét (đủ chữ ký bác sĩ, dấu phòng khám). Bước 2: Vào 'Tài khoản' > 'Upload đơn thuốc' hoặc upload ngay tại trang sản phẩm kê đơn. Bước 3: Chờ dược sĩ xác nhận (15-30 phút).",
    },
    {
      category: 'prescription',
      question: 'Đơn thuốc cần phải có những thông tin gì?',
      answer:
        'Đơn thuốc hợp lệ phải có: 1) Họ tên, chữ ký và số chứng chỉ hành nghề của bác sĩ 2) Dấu của cơ sở y tế 3) Ngày kê đơn (còn hiệu lực trong 30 ngày) 4) Chẩn đoán bệnh 5) Tên thuốc, liều dùng, số lượng rõ ràng.',
    },
    {
      category: 'prescription',
      question: 'Đơn thuốc của tôi bị từ chối, tại sao?',
      answer:
        'Nguyên nhân thường gặp: Ảnh mờ không đọc được, thiếu chữ ký/dấu bác sĩ, đơn thuốc quá hạn (>30 ngày), thông tin không khớp với đơn đặt hàng. Vui lòng chụp lại hoặc liên hệ dược sĩ để được hướng dẫn.',
    },
    {
      category: 'prescription',
      question: 'Tôi có thể dùng lại đơn thuốc cũ không?',
      answer:
        'Đơn thuốc còn hiệu lực (trong 30 ngày kể từ ngày kê) có thể sử dụng nhiều lần để mua thuốc. Tuy nhiên, mỗi lần mua phải nằm trong tổng số lượng thuốc được kê.',
    },
    {
      category: 'prescription',
      question: 'Tôi có thể mua thuốc kê đơn mà không cần đơn thuốc?',
      answer:
        'Không, theo quy định pháp luật và đạo đức ngành dược, MEDISPACE chỉ bán thuốc kê đơn khi có đơn hợp lệ từ bác sĩ. Điều này để đảm bảo an toàn sức khỏe cho bạn.',
    },
  ]

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const getFAQsByCategory = (categoryId: string) => {
    if (categoryId === 'all') return filteredFAQs
    return filteredFAQs.filter((faq) => faq.category === categoryId)
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-12 space-y-12'>
      <UniversalBreadcrumb items={breadcrumbItems} />
      {/* Hero Section */}
      <div className='text-center space-y-6 animate-slide-in-up'>
        <div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg mb-4'>
          <HelpCircle className='w-10 h-10 text-white' />
        </div>
        <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
          Câu hỏi thường gặp
        </h1>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Tìm câu trả lời nhanh chóng cho những thắc mắc của bạn về MEDISPACE
        </p>

        {/* Search */}
        <div className='max-w-2xl mx-auto'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Tìm kiếm câu hỏi...'
              className='pl-12 pr-4 py-6 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-lg'
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {categories.map((cat, index) => (
          <Card
            key={cat.id}
            className='bg-white/80 backdrop-blur-lg shadow-lg rounded-xl border border-blue-100 hover:shadow-xl transition-all animate-slide-in-up'
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className='p-4 text-center'>
              <div className='w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center'>
                <cat.icon className='w-6 h-6 text-blue-600' />
              </div>
              <p className='text-sm text-gray-700 mb-1'>{cat.label}</p>
              <Badge className='bg-blue-100 text-blue-800 border-blue-200'>{cat.count} câu hỏi</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Content */}
      <Tabs defaultValue='all' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-blue-50 p-2 rounded-xl'>
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className='flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg'
            >
              <cat.icon className='w-4 h-4' />
              <span className='hidden md:inline'>{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className='space-y-4'>
            {getFAQsByCategory(cat.id).length === 0 ? (
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
                <CardContent className='p-12 text-center'>
                  <HelpCircle className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                  <h3 className='text-lg text-gray-900 mb-2'>Không tìm thấy câu hỏi</h3>
                  <p className='text-gray-500'>Thử từ khóa khác hoặc liên hệ với chúng tôi để được hỗ trợ</p>
                </CardContent>
              </Card>
            ) : (
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
                <CardContent className='p-6'>
                  <Accordion type='single' collapsible className='space-y-4'>
                    {getFAQsByCategory(cat.id).map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`item-${index}`}
                        className='border border-blue-100 rounded-lg px-4 data-[state=open]:bg-blue-50'
                      >
                        <AccordionTrigger className='hover:no-underline py-4 text-left'>
                          <div className='flex items-start gap-3 pr-4'>
                            <div className='w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm mt-1'>
                              Q
                            </div>
                            <span className='text-gray-900'>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='pt-2 pb-4 pl-9 text-gray-700 leading-relaxed'>
                          <div className='flex items-start gap-3'>
                            <div className='w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-sm'>
                              A
                            </div>
                            <p>{faq.answer}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Still Have Questions? */}
      <Card className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white'>
        <CardContent className='p-8 text-center space-y-6'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-2'>
            <Phone className='w-8 h-8 text-white' />
          </div>
          <div>
            <h2 className='text-white mb-3'>Vẫn chưa tìm được câu trả lời?</h2>
            <p className='text-blue-50 text-lg max-w-2xl mx-auto'>
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild className='bg-white text-blue-600 hover:bg-blue-50 shadow-lg'>
              <a href='tel:19001234' className='gap-2'>
                <Phone className='w-5 h-5' />
                Gọi hotline: 1900 1234
              </a>
            </Button>
            <Button
              onClick={() => {
                const chatBtn = document.querySelector(
                  'button[aria-label="Chat với dược sĩ"]',
                ) as HTMLButtonElement | null
                if (chatBtn) {
                  chatBtn.click()
                } else {
                  window.location.href = '/contact'
                }
              }}
              variant='outline'
              className='bg-blue-700 text-white border-2 border-white/20 hover:bg-blue-800'
            >
              Chat với dược sĩ
            </Button>
            <Button
              asChild
              variant='outline'
              className='bg-blue-700 text-white border-2 border-white/20 hover:bg-blue-800'
            >
              <a href='/contact' className='gap-2'>
                Gửi tin nhắn
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className='grid md:grid-cols-3 gap-6'>
        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 hover:shadow-xl transition-all'>
          <CardContent className='p-6 text-center space-y-3'>
            <div className='w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center'>
              <Shield className='w-6 h-6 text-blue-600' />
            </div>
            <h3 className='text-blue-900'>Chính sách bảo mật</h3>
            <p className='text-sm text-gray-600'>Tìm hiểu cách chúng tôi bảo vệ thông tin của bạn</p>
            <Button variant='link' className='text-blue-600 hover:text-blue-700'>
              Xem chi tiết →
            </Button>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 hover:shadow-xl transition-all'>
          <CardContent className='p-6 text-center space-y-3'>
            <div className='w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center'>
              <FileText className='w-6 h-6 text-green-600' />
            </div>
            <h3 className='text-blue-900'>Điều khoản sử dụng</h3>
            <p className='text-sm text-gray-600'>Các quy định khi sử dụng dịch vụ MEDISPACE</p>
            <Button variant='link' className='text-blue-600 hover:text-blue-700'>
              Xem chi tiết →
            </Button>
          </CardContent>
        </Card>

        <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 hover:shadow-xl transition-all'>
          <CardContent className='p-6 text-center space-y-3'>
            <div className='w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center'>
              <Truck className='w-6 h-6 text-purple-600' />
            </div>
            <h3 className='text-blue-900'>Chính sách giao hàng</h3>
            <p className='text-sm text-gray-600'>Thông tin về giao hàng và phí vận chuyển</p>
            <Button variant='link' className='text-blue-600 hover:text-blue-700'>
              Xem chi tiết →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
