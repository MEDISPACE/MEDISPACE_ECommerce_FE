import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import type { Conversation, Message } from '../../types/chat'
import { chatService } from '../../services/chatService'
import { useSocketContext } from '../../contexts/SocketContext'
import { toast } from 'sonner'
import { LockKeyhole } from 'lucide-react'

interface ChatWindowProps {
  conversation: Conversation
  currentUserId: string
  currentUserRole: 'customer' | 'pharmacist'
  onClose?: () => void
  onNewConversation?: () => void
  showHeader?: boolean
  aiMode?: boolean
  setAiMode?: (mode: boolean) => void
}

const normalizeForMatching = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const isOperationalOfflineMessage = (message: Message) => {
  if (!message.isAI || !message.content) return false

  const content = normalizeForMatching(message.content)
  const mentionsPharmacistOffline =
    content.includes('duoc si') &&
    (content.includes('khong online') || content.includes('dang offline') || content.includes('offline'))
  const exposesFallback =
    content.includes('tro ly ai se tiep tuc ho tro') ||
    content.includes('toi se tiep tuc ho tro') ||
    content.includes('de lai loi nhan') ||
    content.includes('so dien thoai') ||
    content.includes('sdt')

  return mentionsPharmacistOffline && exposesFallback
}

const visibleChatMessages = (messages: Message[]) => messages.filter((message) => !isOperationalOfflineMessage(message))

export function ChatWindow({
  conversation,
  currentUserId,
  currentUserRole,
  onClose,
  onNewConversation,
  showHeader = true,
  aiMode = false,
  setAiMode,
}: ChatWindowProps) {
  const id = useId() // unique subscriber id
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [streamingMessageText, setStreamingMessageText] = useState<string>('')
  const [streamError, setStreamError] = useState<string | null>(null)
  const lastAiMessageRef = useRef<{ content: string; imageUrl?: string; productRef?: import('~/types/chat').ProductRef } | null>(null)
  const [isClosed, setIsClosed] = useState(conversation.status === 'closed')
  // FIX: dùng useRef thay useState cho timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const aiTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const conversationIdRef = useRef(conversation._id)

  useEffect(() => {
    conversationIdRef.current = conversation._id
  }, [conversation._id])

  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    subscribe,
    unsubscribe,
    requestHuman,
  } = useSocketContext()

  // Get other user info
  const otherUser = currentUserRole === 'customer' ? conversation.pharmacist : conversation.customer
  const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Người dùng'

  // Subscribe to socket events – chỉ xử lý message của conversation này
  useEffect(() => {
    subscribe(id, {
      onNewMessage: (message: Message) => {
        if (message.conversationId !== conversationIdRef.current) return
        
        // Turn off AI typing indicator when receiving a message from AI / pharmacist
        if (message.isAI || message.senderRole === 'pharmacist') {
          setIsAiTyping(false)
          setStreamingMessageText('')
          setStreamError(null)
          if (aiTypingTimeoutRef.current) {
            clearTimeout(aiTypingTimeoutRef.current)
            aiTypingTimeoutRef.current = null
          }
        }

        if (isOperationalOfflineMessage(message)) return

        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev
          return [...prev, message]
        })
      },
      onMessageStreamStart: (data) => {
        if (data.conversationId !== conversationIdRef.current) return
        setIsAiTyping(true)
        setStreamingMessageText('')
        setStreamError(null)
      },
      onMessageStreamChunk: (data) => {
        if (data.conversationId !== conversationIdRef.current) return
        setIsAiTyping(true)
        setStreamError(null)
        setStreamingMessageText((prev) => prev + data.content)
      },
      onMessageStreamDone: (data) => {
        if (data.conversationId !== conversationIdRef.current) return
        setIsAiTyping(false)
        setStreamingMessageText('')
        setStreamError(null)
        if (aiTypingTimeoutRef.current) {
          clearTimeout(aiTypingTimeoutRef.current)
          aiTypingTimeoutRef.current = null
        }
      },
      onMessageStreamError: (data) => {
        if (data.conversationId !== conversationIdRef.current) return
        setIsAiTyping(false)
        setStreamingMessageText('')
        setStreamError(data.message || 'Phản hồi AI bị gián đoạn')
        if (aiTypingTimeoutRef.current) {
          clearTimeout(aiTypingTimeoutRef.current)
          aiTypingTimeoutRef.current = null
        }
      },
      onUserTyping: (data) => {
        if (data.conversationId !== conversationIdRef.current || data.userId === currentUserId) return
        setTypingUserId(data.userId)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000)
      },
      onUserStopTyping: (data) => {
        if (data.conversationId === conversationIdRef.current) {
          setTypingUserId(null)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        }
      },
      onConversationClosed: (data) => {
        if (data.conversationId === conversationIdRef.current) {
          setIsClosed(true)
        }
      },
      onError: (error) => {
        if (!error.message.includes('connect')) toast.error(error.message)
      },
    })
    return () => {
      unsubscribe(id)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (aiTypingTimeoutRef.current) clearTimeout(aiTypingTimeoutRef.current)
    }
  }, [id, currentUserId, subscribe, unsubscribe])

  // Load messages
  const loadMessages = useCallback(
    async (pageNum = 1) => {
      try {
        setIsLoading(true)
        const response = await chatService.getMessages({
          conversationId: conversation._id,
          page: pageNum,
          limit: 50,
        })
        const filteredMessages = visibleChatMessages(response.messages)
        if (pageNum === 1) {
          setMessages(filteredMessages)
        } else {
          setMessages((prev) => [...filteredMessages, ...prev])
        }
        setHasMore(response.pagination.page < response.pagination.totalPages)
        setPage(pageNum)
      } catch {
        toast.error('Không thể tải tin nhắn')
      } finally {
        setIsLoading(false)
      }
    },
    [conversation._id],
  )

  const handleLoadMore = () => {
    if (!isLoading && hasMore) loadMessages(page + 1)
  }

  const handleSendMessage = async (
    content: string,
    imageUrl?: string,
    productRef?: import('~/types/chat').ProductRef,
  ) => {
    try {
      if (aiMode && currentUserRole === 'customer') {
        lastAiMessageRef.current = { content, imageUrl, productRef }
        setStreamError(null)
        setIsAiTyping(true)
        if (aiTypingTimeoutRef.current) clearTimeout(aiTypingTimeoutRef.current)
        aiTypingTimeoutRef.current = setTimeout(() => {
          setIsAiTyping(false)
        }, 60000) // Fallback timeout of 60s
      }

      if (isConnected) {
        if (productRef) {
          sendSocketMessage({
            conversationId: conversation._id,
            content: content || `Dược sĩ giới thiệu: ${productRef.name}`,
            type: 'product',
            productRef,
          })
        } else {
          sendSocketMessage({
            conversationId: conversation._id,
            content,
            type: imageUrl ? 'image' : 'text',
            imageUrl,
          })
        }
      } else {
        // Fallback HTTP khi socket mất
        const message = await chatService.sendMessage({
          conversationId: conversation._id,
          content,
          type: productRef ? 'product' : imageUrl ? 'image' : 'text',
          imageUrl,
          productRef,
        })
        setMessages((prev) => [...prev, message])
      }
    } catch {
      setIsAiTyping(false)
      if (aiTypingTimeoutRef.current) {
        clearTimeout(aiTypingTimeoutRef.current)
        aiTypingTimeoutRef.current = null
      }
      toast.error('Không thể gửi tin nhắn')
    }
  }

  const handleRetryStream = useCallback(() => {
    const last = lastAiMessageRef.current
    if (!last) return
    setStreamError(null)
    handleSendMessage(last.content, last.imageUrl, last.productRef)
  }, [conversation._id, isConnected, aiMode, currentUserRole])

  const handleTyping = () => isConnected && startTyping(conversation._id)
  const handleStopTyping = () => isConnected && stopTyping(conversation._id)

  // Join/leave conversation room
  useEffect(() => {
    if (isConnected) joinConversation(conversation._id)
    return () => {
      if (isConnected) leaveConversation(conversation._id)
    }
  }, [isConnected, conversation._id, joinConversation, leaveConversation])

  // Load initial messages
  useEffect(() => {
    setMessages([])
    setPage(1)
    setHasMore(false)
    setIsClosed(conversation.status === 'closed')
    setIsAiTyping(false)
    setStreamError(null)
    if (aiTypingTimeoutRef.current) {
      clearTimeout(aiTypingTimeoutRef.current)
      aiTypingTimeoutRef.current = null
    }
    loadMessages(1)
  }, [conversation._id, conversation.status, loadMessages])

  // FIX 3.6: markAsRead khi component mount (user đang xem)
  useEffect(() => {
    if (isConnected) {
      chatService.markAsRead(conversation._id).catch(() => {})
    }
  }, [conversation._id, isConnected])

  // FIX: Polling CHỈ chạy khi socket không kết nối được
  useEffect(() => {
    if (isConnected) return // Không cần poll khi socket đang live

    const interval = setInterval(async () => {
      try {
        const response = await chatService.getMessages({
          conversationId: conversation._id,
          page: 1,
          limit: 20,
        })
        if (response.messages?.length > 0) {
          setMessages((prev) => {
            const newMsgs = visibleChatMessages(response.messages).filter((r) => !prev.some((l) => l._id === r._id))
            if (newMsgs.length === 0) return prev
            return [...prev, ...newMsgs].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            )
          })
        }
      } catch {
        /* silent */
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isConnected, conversation._id])

  const handleRequestHuman = useCallback(() => {
    if (isConnected) {
      requestHuman(conversation._id)
    }
  }, [isConnected, conversation._id, requestHuman])

  const handleFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    try {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, feedback } : msg))
      )
      await chatService.sendFeedback(messageId, feedback)
      toast.success('Cảm ơn phản hồi của bạn!')
    } catch {
      toast.error('Không thể gửi phản hồi lúc này')
    }
  }

  return (
    <div className='flex flex-col h-full min-h-0 bg-white'>
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        isLoading={isLoading}
        typingUserId={typingUserId || undefined}
        isAiTyping={isAiTyping}
        streamingMessageText={streamingMessageText}
        streamError={streamError || undefined}
        onRetryStream={streamError ? handleRetryStream : undefined}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        onRequestHuman={aiMode ? handleRequestHuman : undefined}
        onSuggestClick={aiMode ? handleSendMessage : undefined}
        onFeedbackClick={handleFeedback}
      />
      {isClosed ? (
        <div className='flex-shrink-0 px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-500'>
          <LockKeyhole className='w-4 h-4 text-gray-400 flex-shrink-0' />
          <span>Cuộc hội thoại đã được đóng.</span>
          {currentUserRole === 'customer' && (
            <button
              onClick={onNewConversation || (() => setIsClosed(false))}
              className='ml-auto text-[#1E40AF] hover:text-[#0A2463] hover:underline text-xs font-medium'
            >
              Tư vấn mới
            </button>
          )}
        </div>
      ) : (
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          disabled={false}
          placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối realtime, tin nhắn vẫn gửi được...'}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  )
}
