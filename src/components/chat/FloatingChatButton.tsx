import { useState, useEffect, useId, useRef } from 'react'
import { MessageCircle, X, Minimize2, Maximize2, ArrowLeft, Loader2, MessageSquarePlus, Bot, Stethoscope } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ChatWindow } from './ChatWindow'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { chatService } from '~/services/chatService'
import { cn } from '~/utils/lib'
import { useAuth } from '../../contexts/AuthContext'
import { useSocketContext } from '../../contexts/SocketContext'
import type { Conversation } from '../../types/chat'
import { toast } from 'sonner'

export function FloatingChatWidget() {
  const id = useId()
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const isCustomer = user?.role === 0
  const canShow = !user || user.role === 0

  const [aiMode, setAiMode] = useState(true)

  // FIX 3.1: dùng context thay useSocket()
  const { subscribe, unsubscribe, requestHuman, joinConversation } = useSocketContext()

  // Sử dụng Refs để lưu giữ thông tin mới nhất tránh race conditions / re-subscribe liên tục
  const conversationRef = useRef<Conversation | null>(conversation)
  const isOpenRef = useRef(isOpen)
  const isMinimizedRef = useRef(isMinimized)

  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    isMinimizedRef.current = isMinimized
  }, [isMinimized])

  // FIX 3.6: subscribe để nhận unread count khi widget đóng
  useEffect(() => {
    subscribe(id, {
      onNewMessage: (message) => {
        const currentConv = conversationRef.current
        if (currentConv && message.conversationId === currentConv._id) {
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  pharmacistId: message.senderRole === 'pharmacist' && !message.isAI ? message.senderId : prev.pharmacistId
                }
              : prev,
          )
          // Chỉ đặt aiMode dựa trên type của cuộc hội thoại hiện tại
          if (currentConv.type === 'ai' && message.isAI) {
            setAiMode(true)
          } else if (currentConv.type === 'pharmacist') {
            setAiMode(false)
          }
        }
        // Tăng unread nếu widget đang đóng hoặc minimize
        if (!isOpenRef.current || isMinimizedRef.current) {
          setUnreadCount((prev) => prev + 1)
        }
      },
      onConversationAssigned: async ({ conversationId, pharmacistId }) => {
        const currentConv = conversationRef.current
        if (currentConv && currentConv._id === conversationId) {
          try {
            const updated = await chatService.getConversationById(conversationId)
            setConversation(updated)
            setAiMode(false)
          } catch {
            setConversation((prev) => (prev ? { ...prev, type: 'pharmacist', pharmacistId } : prev))
            setAiMode(false)
          }
        }
      }
    })
    return () => unsubscribe(id)
  }, [id, subscribe, unsubscribe])

  // Load conversation khi mở widget — chỉ lấy active conversation theo độ ưu tiên: Dược sĩ -> AI
  useEffect(() => {
    if (!isAuthenticated || !isCustomer || !isOpen) {
      if (!isOpen) {
        setConversation(null) // Reset khi đóng widget để lần sau load lại từ đầu
      }
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)
        // 1. Tìm cuộc trò chuyện với dược sĩ đang hoạt động trước
        const pharmRes = await chatService.getConversations({ page: 1, limit: 1, status: 'active', type: 'pharmacist' })
        if (pharmRes.conversations.length > 0) {
          const conv = pharmRes.conversations[0]
          setConversation(conv)
          setUnreadCount(conv.unreadCount.customer || 0)
          setAiMode(false)
          return
        }

        // 2. Nếu không có, tìm cuộc trò chuyện với AI đang hoạt động
        const aiRes = await chatService.getConversations({ page: 1, limit: 1, status: 'active', type: 'ai' })
        if (aiRes.conversations.length > 0) {
          const conv = aiRes.conversations[0]
          setConversation(conv)
          setUnreadCount(conv.unreadCount.customer || 0)
          setAiMode(true)
          return
        }

        setConversation(null)
      } catch {
        setConversation(null)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isOpen, isAuthenticated, isCustomer])

  // unread count được cập nhật realtime qua subscribe onNewMessage ở trên

  if (!canShow) return null

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false)
      setUnreadCount(0)
    } else {
      if (!isOpen) setUnreadCount(0)
      setIsOpen((o) => !o)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }
  const handleMinimize = () => setIsMinimized(true)

  const handleCreateConversation = async (useAI: boolean) => {
    try {
      setIsActionLoading(true)
      const type = useAI ? 'ai' : 'pharmacist'
      const newConv = await chatService.getOrCreateConversation(type)
      setConversation(newConv)
      setAiMode(useAI)
      
      if (useAI) {
         toast.success('Đã kết nối với Trợ lý Sức khỏe AI')
      } else {
         // Nếu chọn dược sĩ thật, gửi socket request human (để BE gán DS)
         joinConversation(newConv._id)
         requestHuman(newConv._id)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Không thể tạo cuộc trò chuyện')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSwitchToHuman = async () => {
    if (!conversation) return
    try {
      setIsActionLoading(true)
      // Gửi socket event yêu cầu dược sĩ thật cho chính cuộc hội thoại này
      requestHuman(conversation._id)
    } catch (error: any) {
      toast.error(error?.message || 'Không thể chuyển kết nối')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleConfirmReset = async () => {
    if (!conversation) return
    try {
      setIsActionLoading(true)
      await chatService.deleteConversation(conversation._id)
      setConversation(null)
      toast.success('Đã làm mới cuộc trò chuyện')
    } catch (error: any) {
      toast.error(error?.message || 'Không thể làm mới cuộc trò chuyện')
    } finally {
      setIsActionLoading(false)
    }
  }

  const isSupportChooser = isAuthenticated && !conversation && !isLoading
  const isCompactWidget = !isAuthenticated || isSupportChooser

  return (
    <>
      {/* Chat Widget Window */}
      {isOpen && !isMinimized && (
        <div
          className={cn(
            'fixed left-3 right-3 bottom-20 top-[calc(var(--header-height,64px)+0.75rem)] sm:left-auto sm:top-auto sm:right-[88px] sm:bottom-6 z-50 w-auto sm:w-[min(420px,calc(100vw-7rem))] lg:w-[clamp(400px,24vw,440px)] h-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-[#BFDBFE] sm:border-2 flex flex-col overflow-hidden slide-up-animation',
            isSupportChooser
              ? 'sm:h-auto sm:min-h-[460px] sm:max-h-[calc(100dvh-var(--header-height,64px)-2rem)]'
              : isCompactWidget
                ? 'sm:h-[clamp(440px,52dvh,500px)]'
                : 'sm:h-[clamp(480px,66dvh,640px)]',
          )}
        >
          {/* Header */}
          <div className='text-white px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between bg-[#0A2463] flex-shrink-0'>
            <div className='flex items-center gap-3 min-w-0 flex-1 mr-2'>
              {conversation && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setConversation(null)}
                  className='text-white hover:bg-white/20 h-8 w-8 p-0 flex-shrink-0 mr-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
                  title='Quay lại Portal'
                >
                  <ArrowLeft className='w-4 h-4' />
                </Button>
              )}
              {aiMode && conversation ? (
                <div className='relative flex items-center justify-center w-9 h-9 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm shadow-inner flex-shrink-0'>
                  <Bot className='w-5 h-5 text-white' />
                  <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full animate-pulse' />
                </div>
              ) : (
                <div className='relative flex items-center justify-center w-9 h-9 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm flex-shrink-0'>
                  <MessageCircle className='w-5 h-5 text-white' />
                  <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full animate-pulse' />
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <h3 className='font-semibold text-sm truncate leading-tight'>
                  {aiMode && conversation ? 'Trợ lý Sức khỏe AI' : 'Chat với Dược sĩ'}
                </h3>
                <p className='text-xs opacity-90 truncate leading-normal'>
                  {aiMode && conversation ? 'Tư vấn tự động 24/7' : 'Tư vấn trực tuyến'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-1 flex-shrink-0'>
              {conversation && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowConfirmReset(true)}
                  disabled={isActionLoading}
                  className='text-white hover:bg-white/20 h-8 w-8 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
                  title='Tư vấn mới'
                >
                  <MessageSquarePlus className='w-4 h-4' />
                </Button>
              )}
              <Button
                variant='ghost'
                size='sm'
                onClick={handleMinimize}
                className='text-white hover:bg-white/20 h-8 w-8 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
              >
                <Minimize2 className='w-4 h-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClose}
                className='text-white hover:bg-white/20 h-8 w-8 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* AI Info & Transfer Banner */}
          {aiMode && conversation && (
            <div className='bg-[#F0F6FF] border-b border-[#BFDBFE] px-4 py-2 flex items-center justify-between text-xs text-[#0A2463] flex-shrink-0 slide-down-animation'>
              <div className='flex items-center gap-1.5 min-w-0'>
                <span className='w-2 h-2 rounded-full bg-[#1E40AF] animate-pulse flex-shrink-0' />
                <span className='truncate font-medium text-[#0A2463]'>Trợ lý AI đang hoạt động</span>
              </div>
              <button
                onClick={handleSwitchToHuman}
                disabled={isActionLoading}
                className='font-semibold text-[#1E40AF] hover:text-[#0A2463] hover:underline flex items-center gap-1 active:scale-95 transition-all flex-shrink-0 ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]/30 rounded-md'
              >
                {isActionLoading ? (
                  <Loader2 className='w-3 h-3 animate-spin text-[#1E40AF]' />
                ) : (
                  <>
                    <Stethoscope className='w-3.5 h-3.5' />
                    Gặp Dược sĩ
                  </>
                )}
              </button>
            </div>
          )}

          {/* Content */}
          <div className='flex-1 min-h-0 overflow-hidden flex flex-col'>
            {!isAuthenticated ? (
              <div className='flex flex-col items-center justify-center h-full p-6 text-center space-y-4'>
                <div className='w-16 h-16 bg-[#F0F6FF] border border-[#BFDBFE] rounded-full flex items-center justify-center mb-2'>
                  <MessageCircle className='w-8 h-8 text-[#0A2463]' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>Đăng nhập để chat</h3>
                <p className='text-gray-600 text-sm max-w-[240px]'>
                  Bạn cần đăng nhập để được dược sĩ tư vấn và hỗ trợ tốt nhất.
                </p>
                <div className='flex flex-col gap-2 w-full max-w-[200px]'>
                  <a href='/login' className='w-full'>
                    <Button className='w-full bg-[#0A2463] hover:bg-[#1E40AF] text-white'>
                      Đăng nhập ngay
                    </Button>
                  </a>
                  <a href='/register' className='w-full'>
                    <Button variant='outline' className='w-full border-[#BFDBFE] text-[#0A2463] hover:bg-[#F0F6FF]'>
                      Đăng ký tài khoản
                    </Button>
                  </a>
                </div>
              </div>
            ) : isLoading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2463] mx-auto mb-2' />
                  <p className='text-gray-600 text-sm'>Đang tải...</p>
                </div>
              </div>
            ) : conversation ? (
              <ChatWindow
                conversation={conversation}
                currentUserId={user?._id || ''}
                currentUserRole='customer'
                showHeader={false}
                onNewConversation={() => setConversation(null)}
                aiMode={aiMode}
                setAiMode={setAiMode}
              />
            ) : (
              <div className='flex h-full flex-col p-5 text-left sm:p-6'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#BFDBFE] bg-[#F0F6FF] shadow-inner'>
                  <MessageCircle className='h-7 w-7 text-[#0A2463]' />
                </div>
                <h3 className='text-lg font-semibold leading-tight text-gray-900'>Chọn kênh hỗ trợ</h3>
                <p className='mt-2 text-sm leading-relaxed text-gray-500'>Nhận phản hồi nhanh từ AI hoặc kết nối dược sĩ chuyên môn.</p>
                
                <div className='mt-6 flex w-full flex-col gap-3'>
                  <Button
                    onClick={() => handleCreateConversation(true)}
                    disabled={isActionLoading}
                    className='flex h-14 w-full items-center justify-start gap-3 rounded-xl bg-[#0A2463] px-5 text-white shadow-md transition-all duration-200 hover:bg-[#1E40AF] active:scale-[0.98]'
                  >
                    {isActionLoading ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <>
                        <Bot className='h-5 w-5 flex-shrink-0' />
                        <span className='truncate text-sm font-semibold'>Hỏi Trợ lý Sức khỏe AI</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCreateConversation(false)}
                    disabled={isActionLoading}
                    variant='outline'
                    className='flex h-14 w-full items-center justify-start gap-3 rounded-xl border border-[#BFDBFE] bg-white px-5 text-[#0A2463] shadow-sm transition-all duration-200 hover:border-[#1E40AF] hover:bg-[#F0F6FF] active:scale-[0.98]'
                  >
                    {isActionLoading ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <>
                        <Stethoscope className='h-5 w-5 flex-shrink-0' />
                        <span className='truncate text-sm font-semibold'>Gặp Dược sĩ chuyên môn</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className='mt-auto pt-5 text-xs leading-relaxed text-gray-500'>AI phản hồi nhanh 24/7. Dược sĩ sẽ hỗ trợ khi cần tư vấn chuyên môn.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimized State */}
      {isOpen && isMinimized && (
        <div
          className='fixed left-3 right-3 bottom-20 sm:left-auto sm:right-[88px] sm:bottom-6 sm:w-auto z-50 text-white rounded-lg shadow-xl px-4 py-3 cursor-pointer hover:shadow-2xl transition-shadow bg-[#0A2463] hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]/30'
          onClick={() => setIsMinimized(false)}
        >
          <div className='flex items-center justify-center sm:justify-start gap-2'>
            <MessageCircle className='w-5 h-5' />
            <span className='font-medium text-sm'>Chat với Dược sĩ</span>
            <Maximize2 className='w-4 h-4 ml-2' />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className='fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50'>
        <Button
          onClick={handleToggle}
          className='relative w-14 h-14 rounded-full shadow-2xl bg-[#0A2463] hover:bg-[#1E40AF] text-white transition-all duration-300 hover:scale-110 animate-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]/30 focus-visible:ring-offset-2'
          aria-label='Chat với dược sĩ'
        >
          {isOpen && !isMinimized ? (
            <X className='w-6 h-6' />
          ) : (
            <>
              <MessageCircle className='w-6 h-6' />
              {/* FIX 3.6: Bật lại unread badge */}
              {unreadCount > 0 && (
                <Badge className='absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full border-2 border-white min-w-[20px] h-5 flex items-center justify-center animate-pulse'>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              <span className='pointer-events-none absolute inset-1 rounded-full bg-[#1E40AF] opacity-40 animate-ping' />
            </>
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirmReset}
        onOpenChange={setShowConfirmReset}
        title='Làm mới cuộc trò chuyện'
        description={
          aiMode
            ? 'Bạn có chắc chắn muốn làm mới cuộc trò chuyện? Lịch sử chat với AI sẽ được xóa hoàn toàn để bắt đầu cuộc tư vấn mới.'
            : 'Bạn có chắc chắn muốn kết thúc và xóa cuộc trò chuyện này?'
        }
        onConfirm={handleConfirmReset}
        confirmText='Xác nhận'
        cancelText='Bỏ qua'
        variant='default'
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .slide-up-animation { animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-down-animation { animation: slideDown 0.2s ease-out forwards; }
      `}</style>
    </>
  )
}
