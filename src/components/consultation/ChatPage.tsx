import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Settings, X } from 'lucide-react'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { mockProducts } from '../../utils/mockData'
import { ChatBubble } from './ChatBubble'
import { ChatInput } from './ChatInput'
import { PharmacistInfo } from './PharmacistInfo'

interface ChatMessage {
  id: string
  type: 'text' | 'image' | 'prescription' | 'order' | 'system'
  content: string
  timestamp: Date
  sender: 'user' | 'pharmacist' | 'system'
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  attachments?: {
    type: 'image' | 'document' | 'prescription' | 'order'
    url: string
    name: string
    id?: string
  }[]
  metadata?: {
    orderId?: string
    prescriptionId?: string
    amount?: number
    rating?: number
  }
}

interface QuickResponse {
  text: string
}

interface Attachment {
  type: 'image' | 'document' | 'prescription' | 'order'
  url: string
  name: string
  id?: string
}

const mockPharmacist = {
  id: 'pharmacist-1',
  name: 'Nguyễn Văn B',
  avatar: '/images/pharmacist-avatar.jpg',
  license: 'PC123456',
  experience: '8 năm',
  specialties: ['Tim mạch', 'Tiểu đường'],
  rating: 4.9,
  totalReviews: 234,
  isOnline: true,
  responseTime: 'Trong vòng 5 phút',
  languages: ['Tiếng Việt', 'English'],
  education: 'Thạc sĩ Dược học - ĐH Y Dược TP.HCM',
  location: 'TP. Hồ Chí Minh',
}

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'text' as const,
    content: 'Chào bạn! Tôi là dược sĩ Nguyễn Văn B. Tôi có thể hỗ trợ gì cho bạn hôm nay?',
    timestamp: new Date(Date.now() - 10 * 60000),
    sender: 'pharmacist' as const,
    status: 'read' as const,
  },
  {
    id: '2',
    type: 'text' as const,
    content: 'Chào dược sĩ! Tôi cần tư vấn về đơn thuốc',
    timestamp: new Date(Date.now() - 9 * 60000),
    sender: 'user' as const,
    status: 'read' as const,
  },
]

const mockPrescriptions = [
  {
    id: 'DT001234',
    status: 'processing' as const,
    doctor: 'Trần Văn C',
    date: '15/04/2025',
  },
]

const mockOrders = [
  {
    id: 'DH001235',
    total: 450000,
    itemCount: 3,
    status: 'pending' as const,
  },
]

export function ChatPage() {
  const [searchParams] = useSearchParams()
  const productSlug = searchParams.get('product')
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Find product if specified
  const product = productSlug ? mockProducts.find((p) => p.slug === productSlug) : null

  // Note: UniversalBreadcrumb automatically adds "Trang chủ" with showHomeLink=true
  // So we only need to specify additional breadcrumb items here
  const breadcrumbItems = [{ label: 'Tư vấn dược sĩ' }]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content: string, attachments?: File[]) => {
    try {
      if (!content.trim() && (!attachments || attachments.length === 0)) return

      const newMessage = {
        id: Date.now().toString(),
        type: 'text' as const,
        content: content,
        timestamp: new Date(),
        sender: 'user' as const,
        status: 'sent' as const,
        attachments: attachments?.map((file) => ({
          type: file.type.includes('image') ? ('image' as const) : ('document' as const),
          url: URL.createObjectURL(file),
          name: file.name,
        })),
      }

      setMessages((prev) => [...prev, newMessage])

      // Simple response simulation
      setTimeout(() => {
        setIsTyping(false)
        const pharmacistReply = {
          id: (Date.now() + 1).toString(),
          type: 'text' as const,
          content: 'Cảm ơn bạn. Tôi sẽ tư vấn cho bạn ngay.',
          timestamp: new Date(),
          sender: 'pharmacist' as const,
          status: 'sent' as const,
        }
        setMessages((prev) => [...prev, pharmacistReply])
      }, 1000)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSendQuickResponse = (response: QuickResponse) => {
    handleSendMessage(response.text)
  }

  const handleAttachmentClick = (attachment: Attachment) => {
    // Open attachment in new tab or download
    window.open(attachment.url, '_blank')
  }

  const handleOrderClick = (orderId: string) => {
    // Navigate to order detail page
    window.location.href = `/account/orders/${orderId}`
  }

  const handlePharmacistCall = () => {
    toast.info('Đang kết nối cuộc gọi', {
      description: 'Dược sĩ sẽ gọi lại cho bạn trong vài phút. Vui lòng giữ máy.',
      duration: 5000,
    })
  }

  const handlePharmacistEmail = () => {
    toast.success('Đã gửi email', {
      description: 'Dược sĩ sẽ trả lời email của bạn trong vòng 24 giờ.',
      duration: 4000,
    })
  }

  const handleRatePharmacist = () => {
    toast.success('Cảm ơn đánh giá của bạn!', {
      description: 'Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ.',
      duration: 3000,
    })
  }

  const handleReportPharmacist = () => {
    toast.warning('Báo cáo đã được gửi', {
      description: 'Chúng tôi sẽ xem xét và phản hồi trong vòng 48 giờ.',
      duration: 5000,
    })
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
        <UniversalBreadcrumb items={breadcrumbItems} />
        {/* Chat Header */}
        <Card className='mb-6 bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
          <CardHeader className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>👨‍⚕️</div>
                <div>
                  <h3 className='font-medium text-blue-900'>Dược sĩ {mockPharmacist.name}</h3>
                  <div className='flex items-center gap-2 text-sm'>
                    <div className='w-2 h-2 bg-emerald-500 rounded-full' />
                    <span className='text-emerald-600'>Đang hoạt động</span>
                    <span className='text-gray-400'>•</span>
                    <span className='text-gray-600'>Chứng chỉ: #{mockPharmacist.license}</span>
                    <span className='text-gray-400'>•</span>
                    <Badge variant='secondary' className='text-xs'>
                      ⭐ {mockPharmacist.rating}/5 ({mockPharmacist.totalReviews} đánh giá)
                    </Badge>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm'>
                  <Settings className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm'>
                  <X className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Chat Interface */}
          <div className='lg:col-span-3'>
            <Card className='h-[600px] flex flex-col bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
              {/* Messages Area */}
              <CardContent className='flex-1 overflow-y-auto p-6 space-y-4'>
                {/* Product context if specified */}
                {product && (
                  <Alert className='border-blue-200 bg-blue-50'>
                    <AlertDescription>
                      <div className='flex items-center gap-3'>
                        <img src={product.image} alt={product.name} className='w-12 h-12 object-cover rounded border' />
                        <div>
                          <p className='font-medium'>Tư vấn về: {product.name}</p>
                          <p className='text-sm text-gray-600'>{product.brand}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Messages */}
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    pharmacistInfo={mockPharmacist}
                    onAttachmentClick={handleAttachmentClick}
                    onOrderClick={handleOrderClick}
                  />
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className='flex justify-start'>
                    <div className='flex items-center gap-2'>
                      <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>👨‍⚕️</div>
                      <div className='bg-gray-100 rounded-lg px-4 py-2'>
                        <div className='flex space-x-1'>
                          <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                          <div
                            className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                            style={{ animationDelay: '0.1s' }}
                          />
                          <div
                            className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                            style={{ animationDelay: '0.2s' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className='border-t border-blue-100'>
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onSendQuickResponse={handleSendQuickResponse}
                  placeholder='Nhập tin nhắn...'
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <PharmacistInfo
              pharmacist={mockPharmacist}
              prescriptions={mockPrescriptions}
              orders={mockOrders}
              onCall={handlePharmacistCall}
              onEmail={handlePharmacistEmail}
              onRate={handleRatePharmacist}
              onReport={handleReportPharmacist}
            />
          </div>
        </div>
      </div>
  )
}
