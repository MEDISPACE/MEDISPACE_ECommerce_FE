import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import type { Conversation, Message } from '../../types/chat'
import { chatService } from '../../services/chatService'
import { useSocketContext } from '../../contexts/SocketContext'
import { toast } from 'sonner'

interface ChatWindowProps {
    conversation: Conversation
    currentUserId: string
    currentUserRole: 'customer' | 'pharmacist'
    onClose?: () => void
    onNewConversation?: () => void
    showHeader?: boolean
}

export function ChatWindow({
    conversation,
    currentUserId,
    currentUserRole,
    onClose,
    onNewConversation,
    showHeader = true
}: ChatWindowProps) {
    const id = useId() // unique subscriber id
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [typingUserId, setTypingUserId] = useState<string | null>(null)
    const [isClosed, setIsClosed] = useState(conversation.status === 'closed')
    // FIX: dùng useRef thay useState cho timeout
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const {
        isConnected,
        joinConversation,
        leaveConversation,
        sendMessage: sendSocketMessage,
        startTyping,
        stopTyping,
        subscribe,
        unsubscribe
    } = useSocketContext()

    // Get other user info
    const otherUser = currentUserRole === 'customer' ? conversation.pharmacist : conversation.customer
    const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Người dùng'

    // Subscribe to socket events – chỉ xử lý message của conversation này
    useEffect(() => {
        subscribe(id, {
            onNewMessage: (message: Message) => {
                if (message.conversationId !== conversation._id) return
                setMessages((prev) => {
                    if (prev.some(m => m._id === message._id)) return prev
                    return [...prev, message]
                })
            },
            onUserTyping: (data) => {
                if (data.conversationId !== conversation._id || data.userId === currentUserId) return
                setTypingUserId(data.userId)
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000)
            },
            onUserStopTyping: (data) => {
                if (data.conversationId === conversation._id) {
                    setTypingUserId(null)
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                }
            },
            onConversationClosed: (data) => {
                if (data.conversationId === conversation._id) {
                    setIsClosed(true)
                }
            },
            onError: (error) => {
                if (!error.message.includes('connect')) toast.error(error.message)
            }
        })
        return () => {
            unsubscribe(id)
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        }
    }, [id, conversation._id, currentUserId, subscribe, unsubscribe])

    // Load messages
    const loadMessages = useCallback(async (pageNum = 1) => {
        try {
            setIsLoading(true)
            const response = await chatService.getMessages({
                conversationId: conversation._id,
                page: pageNum,
                limit: 50
            })
            if (pageNum === 1) {
                setMessages(response.messages)
            } else {
                setMessages((prev) => [...response.messages, ...prev])
            }
            setHasMore(response.pagination.page < response.pagination.totalPages)
            setPage(pageNum)
        } catch {
            toast.error('Không thể tải tin nhắn')
        } finally {
            setIsLoading(false)
        }
    }, [conversation._id])

    const handleLoadMore = () => {
        if (!isLoading && hasMore) loadMessages(page + 1)
    }

    // Send message
    const handleSendMessage = async (content: string, imageUrl?: string, productRef?: import('~/types/chat').ProductRef) => {
        try {
            if (isConnected) {
                if (productRef) {
                    sendSocketMessage({
                        conversationId: conversation._id,
                        content: content || `Dược sĩ giới thiệu: ${productRef.name}`,
                        type: 'product',
                        productRef
                    })
                } else {
                    sendSocketMessage({
                        conversationId: conversation._id,
                        content,
                        type: imageUrl ? 'image' : 'text',
                        imageUrl
                    })
                }
            } else {
                // Fallback HTTP khi socket mất
                const message = await chatService.sendMessage({
                    conversationId: conversation._id,
                    content,
                    type: productRef ? 'product' : imageUrl ? 'image' : 'text',
                    imageUrl,
                    productRef
                })
                setMessages((prev) => [...prev, message])
            }
        } catch {
            toast.error('Không thể gửi tin nhắn')
        }
    }

    const handleTyping = () => isConnected && startTyping(conversation._id)
    const handleStopTyping = () => isConnected && stopTyping(conversation._id)

    // Join/leave conversation room
    useEffect(() => {
        if (isConnected) joinConversation(conversation._id)
        return () => { if (isConnected) leaveConversation(conversation._id) }
    }, [isConnected, conversation._id, joinConversation, leaveConversation])

    // Load initial messages
    useEffect(() => { loadMessages(1) }, [loadMessages])

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
                    limit: 20
                })
                if (response.messages?.length > 0) {
                    setMessages(prev => {
                        const newMsgs = response.messages.filter(
                            r => !prev.some(l => l._id === r._id)
                        )
                        if (newMsgs.length === 0) return prev
                        return [...prev, ...newMsgs].sort(
                            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        )
                    })
                }
            } catch { /* silent */ }
        }, 5000)

        return () => clearInterval(interval)
    }, [isConnected, conversation._id])

    return (
        <div className="flex flex-col h-full bg-white">
            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isLoading={isLoading}
                typingUserId={typingUserId || undefined}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
            />
            {isClosed ? (
                <div className="flex-shrink-0 px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Cuộc hội thoại đã được đóng.</span>
                    {currentUserRole === 'customer' && (
                        <button
                            onClick={onNewConversation || (() => setIsClosed(false))}
                            className="ml-auto text-blue-600 hover:underline text-xs font-medium"
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
                    disabled={!isConnected}
                    placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
                    currentUserRole={currentUserRole}
                />
            )}
        </div>
    )
}
