import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router'
import { MessageCircle, X, Minus, Send, Paperclip, Smile, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'

interface Message {
  id: string
  content: string
  sender: 'pharmacist' | 'user'
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
}

export const FloatingChatWidget: React.FC = () => {
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isOnline] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(2)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Xin chào! Tôi có thể hỗ trợ gì cho bạn?',
      sender: 'pharmacist',
      timestamp: '14:30',
      status: 'read',
    },
    {
      id: '2',
      content: 'Tôi cần tư vấn về thuốc paracetamol',
      sender: 'user',
      timestamp: '14:31',
      status: 'read',
    },
    {
      id: '3',
      content:
        'Paracetamol 500mg dùng để hạ sốt và giảm đau. Bạn có thể cho tôi biết thêm về tình trạng sức khỏe hiện tại không?',
      sender: 'pharmacist',
      timestamp: '14:32',
      status: 'read',
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0)
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // Hide FloatingChatWidget on admin, pharmacist, and auth pages
  const hideOnRoutes = ['/admin', '/pharmacist', '/login', '/register', '/forgot-password']
  const shouldHide = hideOnRoutes.some((route) => location.pathname.startsWith(route))

  if (shouldHide) {
    return null
  }

  const handleToggleWidget = () => {
    if (isOpen) {
      setIsOpen(false)
      setIsMinimized(false)
    } else {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }

    setMessages((prev) => [...prev, message])
    setNewMessage('')

    // Simulate pharmacist typing and response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Cảm ơn bạn đã liên hệ! Tôi sẽ hỗ trợ bạn ngay.',
        sender: 'pharmacist',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      }
      setMessages((prev) => [...prev, response])
    }, 2000)
  }

  const handleQuickResponse = (response: string) => {
    setNewMessage(response)
    inputRef.current?.focus()
  }

  const quickResponses = ['💊 Tư vấn về thuốc', '📋 Hỏi về đơn thuốc', '🤒 Tác dụng phụ', '⏰ Cách sử dụng']

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className='text-gray-400'>✓</span>
      case 'delivered':
        return <span className='text-gray-400'>✓✓</span>
      case 'read':
        return <span className='text-blue-500'>✓✓</span>
      default:
        return null
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className='fixed bottom-6 right-6 z-[9999]'>
          <Button
            onClick={handleToggleWidget}
            className='relative h-[60px] w-[60px] rounded-full bg-gradient-to-r from-[#0066CC] to-[#00BFFF] p-0 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl'
          >
            <MessageCircle className='h-6 w-6 text-white' />
            {unreadCount > 0 && (
              <Badge className='absolute -right-1 -top-1 h-5 min-w-5 animate-pulse bg-red-500 px-1 text-xs text-white'>
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-[9999] w-[380px] transform transition-all duration-300 ease-out slide-up-animation ${
            isMinimized ? 'h-[50px]' : 'h-[500px]'
          } max-md:bottom-20 max-md:right-4 max-md:w-[calc(100vw-32px)]`}
        >
          <div className='h-full rounded-2xl bg-white shadow-2xl border border-blue-100 overflow-hidden'>
            {/* Header */}
            <div className='flex h-[50px] items-center justify-between bg-gradient-to-r from-[#0066CC] to-[#4A90E2] px-4 text-white'>
              <div className='flex items-center gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src='/api/placeholder/32/32' />
                  <AvatarFallback className='bg-white/20 text-white'>DS</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='text-sm font-medium'>Chat với dược sĩ</h3>
                  <p className='text-xs opacity-90'>{isOnline ? '🟢 Đang trực tuyến' : '🔵 Offline'}</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleMinimize}
                  className='h-6 w-6 p-0 text-white hover:bg-white/20'
                >
                  {isMinimized ? <ChevronUp className='h-4 w-4' /> : <Minus className='h-4 w-4' />}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleToggleWidget}
                  className='h-6 w-6 p-0 text-white hover:bg-white/20'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className='h-[350px] max-md:h-[300px]'>
                  <ScrollArea className='h-full p-4'>
                    {messages.length === 0 && (
                      <div className='text-center py-8'>
                        <div className='mb-4'>
                          <h4 className='text-sm font-medium text-gray-900 mb-2'>🎯 Câu hỏi thường gặp:</h4>
                          <div className='grid grid-cols-1 gap-2'>
                            {quickResponses.map((response, index) => (
                              <Button
                                key={index}
                                variant='outline'
                                size='sm'
                                onClick={() => handleQuickResponse(response)}
                                className='justify-start text-left h-auto py-2 px-3 text-xs border-blue-200 hover:bg-blue-50'
                              >
                                {response}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] ${
                            message.sender === 'pharmacist' ? 'flex items-start gap-2' : 'flex flex-col items-end'
                          }`}
                        >
                          {message.sender === 'pharmacist' && (
                            <Avatar className='h-8 w-8 flex-shrink-0'>
                              <AvatarImage src='/api/placeholder/32/32' />
                              <AvatarFallback className='bg-blue-100 text-blue-600'>DS</AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`rounded-2xl px-3 py-2 ${
                              message.sender === 'pharmacist'
                                ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
                                : 'bg-gradient-to-r from-[#0066CC] to-[#00BFFF] text-white rounded-tr-sm'
                            }`}
                          >
                            <p className='text-sm'>{message.content}</p>
                          </div>

                          <div
                            className={`mt-1 flex items-center gap-1 text-xs text-gray-500 ${
                              message.sender === 'user' ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <span>{message.timestamp}</span>
                            {message.sender === 'user' && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className='mb-4 flex justify-start'>
                        <div className='flex items-start gap-2'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src='/api/placeholder/32/32' />
                            <AvatarFallback className='bg-blue-100 text-blue-600'>DS</AvatarFallback>
                          </Avatar>
                          <div className='bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2'>
                            <div className='flex items-center gap-1'>
                              <span className='text-sm text-gray-600 italic'>Dược sĩ đang nhập</span>
                              <div className='flex gap-1'>
                                <div className='h-1 w-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]'></div>
                                <div className='h-1 w-1 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]'></div>
                                <div className='h-1 w-1 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]'></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </div>

                {/* Quick Responses for empty state */}
                {messages.length === 3 && (
                  <div className='px-4 pb-2'>
                    <div className='flex flex-wrap gap-2'>
                      {quickResponses.slice(0, 2).map((response, index) => (
                        <Button
                          key={index}
                          variant='outline'
                          size='sm'
                          onClick={() => handleQuickResponse(response)}
                          className='text-xs h-7 px-2 border-blue-200 hover:bg-blue-50'
                        >
                          {response}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className='h-[100px] border-t border-gray-100 bg-white p-4'>
                  <div className='flex items-center gap-2'>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0 text-gray-500 hover:text-gray-700'>
                      <Paperclip className='h-4 w-4' />
                    </Button>

                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0 text-gray-500 hover:text-gray-700'>
                      <Smile className='h-4 w-4' />
                    </Button>

                    <div className='flex-1'>
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder='Nhập tin nhắn...'
                        className='rounded-full border-2 border-blue-200 focus:border-blue-500 focus:ring-0'
                      />
                    </div>

                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className='h-8 rounded-full bg-gradient-to-r from-[#0066CC] to-[#00BFFF] px-4 hover:from-[#0052A3] hover:to-[#0099CC] disabled:opacity-50'
                    >
                      <Send className='h-4 w-4' />
                    </Button>
                  </div>

                  {isOnline && <p className='mt-2 text-xs text-gray-500 text-center'>Phản hồi trong vài phút</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
