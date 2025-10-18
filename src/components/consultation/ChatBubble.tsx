import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ImageWithFallback } from '../shared/ImageWithFallback'
import { CheckCheck, Clock, Image, FileText, Package, Star } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

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

interface ChatBubbleProps {
  message: ChatMessage
  pharmacistInfo?: {
    name: string
    avatar?: string
    license: string
  }
  onAttachmentClick?: (attachment: {
    type: 'image' | 'document' | 'prescription' | 'order'
    url: string
    name: string
    id?: string
  }) => void
  onOrderClick?: (orderId: string) => void
  className?: string
}

export function ChatBubble({
  message,
  pharmacistInfo,
  onAttachmentClick,
  onOrderClick,
  className = '',
}: ChatBubbleProps) {
  const isFromUser = message.sender === 'user'
  const isFromPharmacist = message.sender === 'pharmacist'
  const isSystem = message.sender === 'system'

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className='w-3 h-3 text-gray-400' />
      case 'sent':
        return <CheckCheck className='w-3 h-3 text-gray-400' />
      case 'delivered':
        return <CheckCheck className='w-3 h-3 text-blue-500' />
      case 'read':
        return <CheckCheck className='w-3 h-3 text-blue-600' />
      default:
        return null
    }
  }

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: vi })
  }

  if (isSystem) {
    return (
      <div className={`flex justify-center my-4 ${className}`}>
        <div className='bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm'>{message.content}</div>
      </div>
    )
  }

  return (
    <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`flex ${isFromUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%] space-x-2`}>
        {/* Avatar for pharmacist */}
        {isFromPharmacist && (
          <Avatar className='w-8 h-8 flex-shrink-0'>
            <AvatarImage src={pharmacistInfo?.avatar} />
            <AvatarFallback className='bg-blue-100 text-blue-600'>👨‍⚕️</AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isFromUser ? 'items-end' : 'items-start'}`}>
          {/* Pharmacist name for first message */}
          {isFromPharmacist && pharmacistInfo && (
            <div className='text-xs text-gray-600 mb-1 flex items-center'>
              <span>Dược sĩ {pharmacistInfo.name}</span>
              <Badge variant='outline' className='ml-2 text-xs'>
                {pharmacistInfo.license}
              </Badge>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`
              relative px-4 py-2 rounded-2xl max-w-full
              ${
                isFromUser
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
              }
            `}
          >
            {/* Text content */}
            {message.content && <div className='mb-2 last:mb-0'>{message.content}</div>}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className='space-y-2'>
                {message.attachments.map((attachment, index) => (
                  <div key={index} className='relative'>
                    {attachment.type === 'image' && (
                      <div
                        className='relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity'
                        onClick={() => onAttachmentClick?.(attachment)}
                      >
                        <ImageWithFallback
                          src={attachment.url}
                          alt={attachment.name}
                          className='max-w-xs max-h-48 object-cover'
                        />
                        <div className='absolute top-2 left-2'>
                          <Badge variant='secondary' className='text-xs'>
                            <Image className='w-3 h-3 mr-1' />
                            {attachment.name}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {attachment.type === 'prescription' && (
                      <div
                        className='p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors'
                        onClick={() => onAttachmentClick?.(attachment)}
                      >
                        <div className='flex items-center space-x-2'>
                          <FileText className='w-5 h-5 text-blue-600' />
                          <div>
                            <div className='font-medium text-blue-900'>{attachment.name}</div>
                            <div className='text-sm text-blue-600'>Đơn thuốc #{attachment.id}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {attachment.type === 'order' && (
                      <div
                        className='p-3 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors'
                        onClick={() => onOrderClick?.(attachment.id || '')}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <Package className='w-5 h-5 text-emerald-600' />
                            <div>
                              <div className='font-medium text-emerald-900'>Đơn hàng #{attachment.id}</div>
                              <div className='text-sm text-emerald-600'>
                                {message.metadata?.amount?.toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          </div>
                          <Button size='sm' className='bg-emerald-600 hover:bg-emerald-700'>
                            Xem đơn hàng
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Rating for completed consultations */}
            {message.metadata?.rating && (
              <div className='mt-2 pt-2 border-t border-blue-400'>
                <div className='flex items-center space-x-1'>
                  <span className='text-sm'>Đánh giá:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= message.metadata!.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timestamp and status */}
          <div
            className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${isFromUser ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <span>{formatTime(message.timestamp)}</span>
            {isFromUser && getStatusIcon()}
          </div>
        </div>

        {/* Avatar for user */}
        {isFromUser && (
          <Avatar className='w-8 h-8 flex-shrink-0'>
            <AvatarFallback className='bg-blue-500 text-white'>👤</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}
