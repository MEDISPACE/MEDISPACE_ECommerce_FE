import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Message } from '../../types/chat'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { ProductCard } from './ProductCard'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  currentUserRole: 'customer' | 'pharmacist'
  isLoading?: boolean
  typingUserId?: string
  isAiTyping?: boolean
  streamingMessageText?: string
  onLoadMore?: () => void
  hasMore?: boolean
  onRequestHuman?: () => void
  onSuggestClick?: (content: string) => void
  onFeedbackClick?: (messageId: string, feedback: 'up' | 'down') => void
  suggestions?: { label: string; text: string }[] // Task 2.4: dynamic suggestions
}

// Default suggestions — dùng khi API không trả về hoặc lỗi
const DEFAULT_SUGGESTIONS = [
  { label: 'Tư vấn bệnh cảm cúm 🤒', text: 'Tôi muốn tư vấn về triệu chứng và thuốc điều trị cảm cúm' },
  { label: 'Kiểm tra tác dụng phụ thuốc 💊', text: 'Paracetamol liều lượng dùng thế nào và có tác dụng phụ gì không?' },
  { label: 'Quy trình chăm sóc da mụn 🧴', text: 'Tư vấn các bước chăm sóc da mụn và sản phẩm phù hợp' },
  { label: 'Bổ sung vitamin nào tốt nhất? 💪', text: 'Tôi nên bổ sung vitamin và khoáng chất nào cho người trưởng thành?' },
]

// Skeleton Loading Component (Task 2.5)
function MessageSkeleton() {
  return (
    <div className='flex-1 flex flex-col gap-4 p-4 bg-gray-50 animate-pulse'>
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
          <div className='h-4 bg-blue-100 rounded-xl w-full' />
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
  }, [messages])

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
            <div className='w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-lg shadow-teal-100/30 animate-pulse-soft'>
              <span className='text-3xl'>🤖</span>
              <span className='absolute inset-0 rounded-full bg-teal-400 opacity-20 animate-ping' />
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
                  className='text-xs bg-white hover:bg-teal-50/40 border border-gray-200 hover:border-teal-200 text-gray-700 hover:text-teal-700 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-left shadow-sm active:scale-[0.98] flex items-center justify-between group'
                >
                  <span className='truncate mr-2'>{s.label}</span>
                  <span className='text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0'>→</span>
                </button>
              ))}
            </div>

            {onRequestHuman && (
              <div className='pt-4 border-t border-gray-200/60'>
                <button
                  onClick={onRequestHuman}
                  className='inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 hover:border-blue-400 rounded-full text-xs font-semibold text-blue-600 hover:text-blue-700 transition-all duration-300 shadow-sm active:scale-95'
                >
                  <span className='text-sm'>👨‍⚕️</span> Gặp Dược sĩ chuyên môn ngay
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
          <div className='w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner'>
            <svg className='w-8 h-8 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
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
      className='flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4'
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className='text-center py-2'>
          <button onClick={onLoadMore} className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
            Tải thêm tin nhắn
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isOwnMessage = message.senderRole === currentUserRole
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
                <div className='bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2 rounded-2xl max-w-[85%] text-center shadow-sm flex items-center justify-center gap-2 font-medium'>
                  <span className='animate-pulse text-blue-500 text-sm'>ℹ️</span>
                  <span>{message.content}</span>
                </div>
              </div>
            ) : (
              /* Message */
              <div className='flex flex-col mb-2'>
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}>
                  {/* Message bubble */}
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    
                    {/* AI Badge */}
                    {!isOwnMessage && message.isAI && (
                      <div className="flex items-center gap-1 mb-1 px-1">
                        <span className="text-[10px] bg-teal-50 border border-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          🤖 Trợ lý Sức khỏe AI
                        </span>
                        {message.aiClassification === 'emergency' && (
                          <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            ⚠️ Cảnh báo khẩn cấp
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : message.isAI
                            ? 'bg-teal-50 border border-teal-100 text-gray-800 rounded-tl-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                      } shadow-sm`}
                    >
                      {/* Product card message */}
                      {message.type === 'product' && message.productRef && (
                        <ProductCard product={message.productRef} isOwnMessage={isOwnMessage} />
                      )}

                      {/* Image message */}
                      {message.type === 'image' && message.imageUrl && (
                        <div
                          className='relative group cursor-pointer'
                          onClick={() => setSelectedImage(message.imageUrl || null)}
                        >
                          <img
                            src={message.imageUrl}
                            alt='Sent image'
                            className={`max-w-xs rounded-lg hover:opacity-90 transition-opacity ${message.content ? 'mb-2' : ''}`}
                          />
                          <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg'>
                            <div className='bg-black/50 p-2 rounded-full text-white'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              >
                                <circle cx='11' cy='11' r='8'></circle>
                                <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
                                <line x1='11' y1='8' x2='11' y2='14'></line>
                                <line x1='8' y1='11' x2='14' y2='11'></line>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text content – ẩn nếu là product card (đã hiển thị trong card) */}
                      {message.content && message.type !== 'product' && (
                        <p className='text-sm whitespace-pre-wrap break-words'>{cleanMessageContent(message.content)}</p>
                      )}
                    </div>

                    {/* Feedback & Timestamp row for AI message */}
                    {!isOwnMessage && message.isAI ? (
                      <div className='flex items-center gap-3 mt-1.5 px-1 w-full flex-wrap'>
                        <span className='text-[10px] text-gray-500'>{formatMessageTime(message.createdAt)}</span>
                        {onRequestHuman && (
                          <button
                            onClick={onRequestHuman}
                            className='text-[10px] text-teal-600 hover:text-teal-700 underline font-semibold transition-colors duration-200'
                          >
                            Chuyển cho Dược sĩ thật →
                          </button>
                        )}
                        {onFeedbackClick && (
                          <div className='flex items-center gap-1.5 ml-auto sm:ml-2'>
                            <button
                              onClick={() => onFeedbackClick(message._id, 'up')}
                              className={`p-1 rounded-md hover:bg-teal-100/50 transition-all duration-200 active:scale-90 ${
                                message.feedback === 'up' ? 'text-blue-600 bg-blue-50/80 border border-blue-100' : 'text-gray-400 hover:text-blue-600'
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
                          className='text-xs bg-white hover:bg-teal-50 border border-teal-100 hover:border-teal-200 text-teal-700 px-3.5 py-1.5 rounded-full transition-all duration-200 font-semibold shadow-sm hover:shadow active:scale-95'
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
          <div className='relative flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full flex-shrink-0 shadow-sm'>
            <span className="text-sm">🤖</span>
          </div>
          <div className='bg-teal-50 border border-teal-100 rounded-2xl px-4 py-2.5 shadow-sm max-w-[85%]'>
            {streamingMessageText ? (
              <p className='text-sm whitespace-pre-wrap break-words text-gray-800'>
                {cleanMessageContent(streamingMessageText)}
                <span className='inline-block w-1.5 h-4 ml-1 bg-teal-600 animate-pulse align-middle'></span>
              </p>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-xs text-teal-800 font-medium'>Trợ lý AI đang soạn câu trả lời</span>
                <div className='flex gap-1 items-center h-3'>
                  <span className='w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
                  <span className='w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
                  <span className='w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
                </div>
              </div>
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
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='18' y1='6' x2='6' y2='18'></line>
              <line x1='6' y1='6' x2='18' y2='18'></line>
            </svg>
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
