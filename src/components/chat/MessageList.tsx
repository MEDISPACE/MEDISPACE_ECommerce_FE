import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Message } from '../../types/chat'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { ThumbsUp, ThumbsDown, Bot, Stethoscope, Info, AlertTriangle, ArrowRight, MessageCircle, X, ZoomIn } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { MarkdownMessage } from './MarkdownMessage'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  currentUserRole: 'customer' | 'pharmacist'
  isLoading?: boolean
  typingUserId?: string
  isAiTyping?: boolean
  streamingMessageText?: string
  streamError?: string
  onRetryStream?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
  onRequestHuman?: () => void
  onSuggestClick?: (content: string) => void
  onFeedbackClick?: (messageId: string, feedback: 'up' | 'down') => void
  suggestions?: { label: string; text: string }[] // Task 2.4: dynamic suggestions
}

// Default suggestions — dùng khi API không trả về hoặc lỗi
const DEFAULT_SUGGESTIONS = [
  { label: 'Tư vấn bệnh cảm cúm', text: 'Tôi muốn tư vấn về triệu chứng và thuốc điều trị cảm cúm' },
  { label: 'Kiểm tra tác dụng phụ thuốc', text: 'Paracetamol liều lượng dùng thế nào và có tác dụng phụ gì không?' },
  { label: 'Quy trình chăm sóc da mụn', text: 'Tư vấn các bước chăm sóc da mụn và sản phẩm phù hợp' },
  { label: 'Bổ sung vitamin nào tốt nhất?', text: 'Tôi nên bổ sung vitamin và khoáng chất nào cho người trưởng thành?' },
]

// Skeleton Loading Component (Task 2.5)
function MessageSkeleton() {
  return (
    <div className='flex-1 min-h-0 flex flex-col gap-4 p-4 bg-gray-50 animate-pulse'>
      {/* Skeleton tin nhắn từ AI (bên trái) */}
      <div className='flex items-end gap-2 max-w-[75%]'>
        <div className='w-8 h-8 rounded-full bg-gray-200 flex-shrink-0' />
        <div className='flex flex-col gap-1.5 flex-1'>
          <div className='h-4 bg-gray-200 rounded-xl w-[80%]' />
          <div className='h-4 bg-gray-200 rounded-xl w-[60%]' />
          <div className='h-3 bg-gray-100 rounded w-[30%] mt-1' />
        </div>
      </div>
      {/* Skeleton tin nhắn từ user (bên phải) */}
      <div className='flex items-end gap-2 max-w-[60%] ml-auto flex-row-reverse'>
        <div className='w-8 h-8 rounded-full bg-gray-200 flex-shrink-0' />
        <div className='flex flex-col gap-1.5 items-end flex-1'>
          <div className='h-4 bg-[#BFDBFE] rounded-xl w-full' />
          <div className='h-3 bg-gray-100 rounded w-[40%] mt-1' />
        </div>
      </div>
      {/* Skeleton tin nhắn từ AI (bên trái) */}
      <div className='flex items-end gap-2 max-w-[80%]'>
        <div className='w-8 h-8 rounded-full bg-gray-200 flex-shrink-0' />
        <div className='flex flex-col gap-1.5 flex-1'>
          <div className='h-4 bg-gray-200 rounded-xl w-[90%]' />
          <div className='h-4 bg-gray-200 rounded-xl w-[70%]' />
          <div className='h-4 bg-gray-200 rounded-xl w-[40%]' />
          <div className='h-3 bg-gray-100 rounded w-[30%] mt-1' />
        </div>
      </div>
    </div>
  )
}

const cleanMessageContent = (content: string) => {
  if (!content) return ''
  const index = content.search(/\[GỢI\s*Ý\]:/i)
  if (index !== -1) {
    return content.substring(0, index).trim()
  }
  const partialMatch = content.search(/\[GỢ[IÝ\s:]*$/i)
  if (partialMatch !== -1) {
    return content.substring(0, partialMatch).trim()
  }
  return content
}

export function MessageList({
  messages,
  currentUserId,
  currentUserRole,
  isLoading,
  typingUserId,
  isAiTyping,
  streamingMessageText,
  streamError,
  onRetryStream,
  onLoadMore,
  hasMore,
  onRequestHuman,
  onSuggestClick,
  onFeedbackClick,
  suggestions, // Task 2.4
}: MessageListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessageText])

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)

    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: vi })
    } else if (isYesterday(date)) {
      return `Hôm qua ${format(date, 'HH:mm', { locale: vi })}`
    } else {
      return format(date, 'dd/MM HH:mm', { locale: vi })
    }
  }

  const getInitials = (role: string) => {
    return role === 'customer' ? 'KH' : 'DS'
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current || !onLoadMore || !hasMore) return

    const { scrollTop } = messagesContainerRef.current

    // Load more when scrolled to top
    if (scrollTop === 0) {
      onLoadMore()
    }
  }

  if (isLoading && messages.length === 0) {
    return <MessageSkeleton /> // Task 2.5: skeleton thay vì spinner đơn giản
  }

  if (messages.length === 0) {
    // 1. AI Chat Empty State (has onSuggestClick)
    if (onSuggestClick) {
      return (
        <div className='flex-1 flex flex-col items-center justify-center bg-gray-50 p-4 overflow-y-auto min-h-0'>
          <div className='text-center w-full max-w-[320px] my-auto'>
            <div className='w-16 h-16 bg-[#0A2463] text-white rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg shadow-[#0A2463]/15 animate-pulse-soft'>
              <Bot className='w-8 h-8' />
              <span className='absolute inset-0 rounded-full bg-[#1E40AF] opacity-20 animate-ping' />
            </div>
            <h3 className='text-lg font-bold text-gray-900 mb-1.5'>Trợ lý Sức khỏe AI</h3>
            <p className='text-xs text-gray-500 mb-5 leading-relaxed'>
              Chào bạn! Tôi có thể tư vấn các vấn đề sức khỏe, cách dùng thuốc hoặc chăm sóc cá nhân. Hãy đặt câu hỏi vào ô chat bên dưới hoặc chọn gợi ý:
            </p>
            
            {/* Quick Action Suggestion Cards — Task 2.4: dùng suggestions prop với fallback */}
            <div className='flex flex-col gap-2 mb-6'>
              {(suggestions || DEFAULT_SUGGESTIONS).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestClick(s.text)}
                  className='text-xs bg-white hover:bg-[#F0F6FF] border border-gray-200 hover:border-[#BFDBFE] text-gray-700 hover:text-[#0A2463] px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-left shadow-sm active:scale-[0.98] flex items-center justify-between group'
                >
                  <span className='truncate mr-2'>{s.label}</span>
                  <ArrowRight className='w-3.5 h-3.5 text-gray-300 group-hover:text-[#1E40AF] transition-colors flex-shrink-0' />
                </button>
              ))}
            </div>

            {onRequestHuman && (
              <div className='pt-4 border-t border-gray-200/60'>
                <button
                  onClick={onRequestHuman}
                  className='inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#BFDBFE] hover:border-[#1E40AF] rounded-full text-xs font-semibold text-[#0A2463] hover:text-[#1E40AF] transition-all duration-300 shadow-sm active:scale-95'
                >
                  <Stethoscope className='w-3.5 h-3.5' /> Gặp Dược sĩ chuyên môn ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    // 2. Human Pharmacist Empty State
    return (
      <div className='flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 overflow-y-auto min-h-0'>
        <div className='text-center w-full max-w-[280px] my-auto'>
          <div className='w-16 h-16 bg-[#F0F6FF] border border-[#BFDBFE] rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner'>
            <MessageCircle className='w-8 h-8 text-[#0A2463]' />
          </div>
          <h3 className='text-lg font-bold text-gray-900 mb-1'>Tư vấn Dược sĩ</h3>
          <p className='text-xs text-gray-500 leading-relaxed'>
            Dược sĩ chuyên môn đang sẵn sàng hỗ trợ bạn. Gửi tin nhắn hoặc đơn thuốc để bắt đầu trò chuyện trực tiếp.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className='flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4 space-y-4'
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className='text-center py-2'>
          <button onClick={onLoadMore} className='text-sm text-[#1E40AF] hover:text-[#0A2463] font-medium'>
            Tải thêm tin nhắn
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isOwnMessage = message.senderRole === currentUserRole
        const messageTextClassName = isOwnMessage
          ? '!text-white [color:white]'
          : message.isAI
            ? 'text-gray-800'
            : 'text-gray-900'
        const displayContent =
          message.type === 'product'
            ? message.senderRole === 'pharmacist'
              ? 'Dược sĩ giới thiệu sản phẩm này:'
              : 'Sản phẩm được chia sẻ:'
            : message.content
        const prevMessage = index > 0 ? messages[index - 1] : null
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

        // Check if this is the last message in a consecutive group from same sender
        const isLastInGroup = !nextMessage || nextMessage.senderRole !== message.senderRole

        // Check if we need a date separator
        const showDateSeparator =
          !prevMessage || new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString()

        const formatDateSeparator = (date: Date) => {
          if (isToday(date)) return 'Hôm nay'
          if (isYesterday(date)) return 'Hôm qua'
          return format(date, 'dd/MM/yyyy', { locale: vi })
        }

        return (
          <div key={message._id}>
            {/* Date separator */}
            {showDateSeparator && (
              <div className='flex items-center justify-center my-4'>
                <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
                  {formatDateSeparator(new Date(message.createdAt))}
                </div>
              </div>
            )}

            {/* System message */}
            {message.type === 'system' ? (
              <div className='flex items-center justify-center my-3'>
                <div className='bg-[#F0F6FF] border border-[#BFDBFE] text-[#0A2463] text-xs px-4 py-2 rounded-2xl max-w-[85%] text-center shadow-sm flex items-center justify-center gap-2 font-medium'>
                  <Info className='w-3.5 h-3.5 text-[#1E40AF] flex-shrink-0' />
                  <span>{message.content}</span>
                </div>
              </div>
            ) : (
              /* Message */
              <div className='flex flex-col mb-2'>
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}>
                  {/* Message bubble */}
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                    
                    {/* AI Badge */}
                    {!isOwnMessage && message.isAI && (
                      <div className="flex items-center gap-1 mb-1 px-1">
                        <span className="text-[10px] bg-[#F0F6FF] border border-[#BFDBFE] text-[#0A2463] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Bot className='w-3 h-3' /> Trợ lý Sức khỏe AI
                        </span>
                        {message.aiClassification === 'emergency' && (
                          <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-semibold animate-pulse flex items-center gap-1">
                            <AlertTriangle className='w-3 h-3' /> Cảnh báo khẩn cấp
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      data-chat-tone={isOwnMessage ? 'own' : undefined}
                      style={isOwnMessage ? { color: '#ffffff', WebkitTextFillColor: '#ffffff' } : undefined}
                      className={`rounded-2xl ${
                        // Ảnh thuần (không có text): không cần padding — ảnh fit khít bubble
                        message.type === 'image' && !message.content
                          ? 'p-0 overflow-hidden'
                          : 'px-4 py-2'
                      } ${
                        isOwnMessage
                          ? 'bg-[#0A2463] !text-white [color:white] rounded-tr-none'
                          : message.isAI
                            ? 'bg-[#F0F6FF] border border-[#BFDBFE] text-gray-800 rounded-tl-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                      } shadow-sm`}
                    >
                      {/* Image message — giới hạn kích thước như Zalo/Messenger */}
                      {message.type === 'image' && message.imageUrl && (
                        <div
                          className='relative group cursor-pointer rounded-xl overflow-hidden'
                          style={{ maxWidth: 200, maxHeight: 200 }}
                          onClick={() => setSelectedImage(message.imageUrl || null)}
                        >
                          <img
                            src={message.imageUrl}
                            alt='Sent image'
                            className={`w-full h-full object-cover transition-opacity group-hover:opacity-90 ${message.content ? 'mb-2' : ''}`}
                            style={{ maxWidth: 200, maxHeight: 200, display: 'block' }}
                          />
                          {/* Zoom hint on hover */}
                          <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 rounded-xl'>
                            <div className='bg-black/50 p-1.5 rounded-full text-white'>
                              <ZoomIn className='w-4 h-4' />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text content */}
                      {displayContent && (
                        message.isAI ? (
                          // AI messages: render markdown đẹp với cấu trúc rõ ràng
                          <MarkdownMessage
                            content={cleanMessageContent(displayContent)}
                            className={`py-0.5 ${messageTextClassName}`}
                          />
                        ) : (
                          // User messages: plain text
                          <p className={`text-sm whitespace-pre-wrap break-words ${messageTextClassName}`}>
                            {displayContent}
                          </p>
                        )
                      )}
                    </div>

                    {message.type === 'product' && message.productRef && (
                      <div className={`mt-2 flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <ProductCard product={message.productRef} isOwnMessage={isOwnMessage} variant='attachment' />
                      </div>
                    )}

                    {/* Feedback & Timestamp row for AI message */}
                    {!isOwnMessage && message.isAI ? (
                      <div className='flex items-center gap-3 mt-1.5 px-1 w-full flex-wrap'>
                        <span className='text-[10px] text-gray-500'>{formatMessageTime(message.createdAt)}</span>
                        {onRequestHuman && (
                          <button
                            onClick={onRequestHuman}
                            className='text-[10px] text-[#1E40AF] hover:text-[#0A2463] underline font-semibold transition-colors duration-200'
                          >
                            Chuyển cho Dược sĩ thật
                          </button>
                        )}
                        {onFeedbackClick && (
                          <div className='flex items-center gap-1.5 ml-auto sm:ml-2'>
                            <button
                              onClick={() => onFeedbackClick(message._id, 'up')}
                              className={`p-1 rounded-md hover:bg-[#F0F6FF] transition-all duration-200 active:scale-90 ${
                                message.feedback === 'up' ? 'text-[#1E40AF] bg-[#F0F6FF] border border-[#BFDBFE]' : 'text-gray-400 hover:text-[#1E40AF]'
                              }`}
                              title='Hữu ích'
                            >
                              <ThumbsUp className='w-3.5 h-3.5' />
                            </button>
                            <button
                              onClick={() => onFeedbackClick(message._id, 'down')}
                              className={`p-1 rounded-md hover:bg-red-50 transition-all duration-200 active:scale-90 ${
                                message.feedback === 'down' ? 'text-red-500 bg-red-50/80 border border-red-100' : 'text-gray-400 hover:text-red-500'
                              }`}
                              title='Chưa hữu ích'
                            >
                              <ThumbsDown className='w-3.5 h-3.5' />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Human message timestamp - only show for last message in group */
                      isLastInGroup && (
                        <div className='flex items-center gap-2 mt-1 px-1'>
                          <span className='text-[10px] text-gray-500'>{formatMessageTime(message.createdAt)}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Horizontal carousel of products for AI messages */}
                {!isOwnMessage && message.suggestedProducts && message.suggestedProducts.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2.5 w-full scrollbar-hide px-1 mt-1 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {message.suggestedProducts.map((prod) => (
                      <ProductCard key={prod.productId} product={prod} isOwnMessage={false} />
                    ))}
                  </div>
                )}

                {/* Dynamic Suggestion Chips */}
                {index === messages.length - 1 &&
                  message.isAI &&
                  message.suggestedQuestions &&
                  message.suggestedQuestions.length > 0 &&
                  !isAiTyping &&
                  !streamingMessageText &&
                  onSuggestClick && (
                    <div className='flex flex-wrap gap-2 mt-2 px-1 w-full max-w-[85%]'>
                      {message.suggestedQuestions.map((question, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => onSuggestClick(question)}
                          className='text-xs bg-white hover:bg-[#F0F6FF] border border-[#BFDBFE] hover:border-[#1E40AF] text-[#0A2463] px-3.5 py-1.5 rounded-full transition-all duration-200 font-semibold shadow-sm hover:shadow active:scale-95'
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )
      })}

      {/* Typing indicator */}
      {typingUserId && typingUserId !== currentUserId && (
        <div className='flex items-end gap-2'>
          <Avatar className='w-8 h-8 bg-green-100'>
            <AvatarFallback className='text-green-600'>DS</AvatarFallback>
          </Avatar>
          <div className='bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm'>
            <div className='flex gap-1'>
              <span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
              <span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
              <span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* AI Typing indicator / Streaming Message */}
      {(isAiTyping || streamingMessageText) && (
        <div className='flex items-end gap-2 slide-up-animation'>
          <div className='relative flex items-center justify-center w-8 h-8 bg-[#0A2463] text-white rounded-full flex-shrink-0 shadow-sm'>
            <Bot className='w-4 h-4' />
          </div>
          <div className='bg-[#F0F6FF] border border-[#BFDBFE] rounded-2xl px-4 py-2.5 shadow-sm max-w-[85%] min-w-0 break-words'>
            {streamingMessageText ? (
              <div className='py-0.5'>
                <MarkdownMessage
                  content={cleanMessageContent(streamingMessageText)}
                />
                <span className='inline-block w-1.5 h-3.5 ml-0.5 bg-[#1E40AF] animate-pulse align-middle rounded-sm' />
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-xs text-[#0A2463] font-medium'>Trợ lý AI đang soạn câu trả lời</span>
                <div className='flex gap-1 items-center h-3'>
                  <span className='w-1.5 h-1.5 bg-[#1E40AF] rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
                  <span className='w-1.5 h-1.5 bg-[#1E40AF] rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
                  <span className='w-1.5 h-1.5 bg-[#1E40AF] rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {streamError && (
        <div className='flex items-start gap-2'>
          <div className='relative flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 rounded-full flex-shrink-0 border border-red-100'>
            <AlertTriangle className='w-4 h-4' />
          </div>
          <div className='bg-white border border-red-100 rounded-2xl px-4 py-2.5 shadow-sm max-w-[85%] min-w-0'>
            <p className='text-xs text-red-600 break-words'>{streamError}</p>
            {onRetryStream && (
              <button
                type='button'
                onClick={onRetryStream}
                className='mt-2 text-xs font-semibold text-[#1E40AF] hover:text-[#0A2463] underline'
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200'
          onClick={() => setSelectedImage(null)}
        >
          <button
            className='absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors'
            onClick={() => setSelectedImage(null)}
          >
            <X className='w-6 h-6' />
          </button>
          <img
            src={selectedImage}
            alt='Full view'
            className='max-w-full max-h-full object-contain rounded-lg shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
