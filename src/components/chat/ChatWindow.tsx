import { useState, useEffect, useCallback } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import type { Conversation, Message } from '../../types/chat'
import { chatService } from '../../services/chatService'
import { useSocket } from '../../hooks/useSocket'
import { toast } from 'sonner'

interface ChatWindowProps {
    conversation: Conversation
    currentUserId: string
    currentUserRole: 'customer' | 'pharmacist'
    onClose?: () => void
    showHeader?: boolean
}

export function ChatWindow({
    conversation,
    currentUserId,
    currentUserRole,
    onClose,
    showHeader = true
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [typingUserId, setTypingUserId] = useState<string | null>(null)
    const typingTimeoutRef = useState<NodeJS.Timeout | null>(null)[0]

    // Get other user info
    const otherUser = currentUserRole === 'customer' ? conversation.pharmacist : conversation.customer
    const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Người dùng'
    const isOnline = otherUser?.isOnline || false

    // Socket.IO integration
    const {
        isConnected,
        joinConversation,
        leaveConversation,
        sendMessage: sendSocketMessage,
        startTyping,
        stopTyping,
        markAsRead
    } = useSocket({
        onNewMessage: (message) => {
            if (message.conversationId === conversation._id) {
                console.log('📨 Received message:', message._id)
                setMessages((prev) => [...prev, message])

                // Mark as read if message is from other user
                if (message.senderId !== currentUserId) {
                    markAsRead(conversation._id)
                }
            }
        },
        onUserTyping: (data) => {
            if (data.conversationId === conversation._id && data.userId !== currentUserId) {
                setTypingUserId(data.userId)

                // Clear existing timeout
                if (typingTimeoutRef) {
                    clearTimeout(typingTimeoutRef)
                }

                // Auto-clear typing after 3 seconds
                setTimeout(() => {
                    setTypingUserId(null)
                }, 3000)
            }
        },
        onUserStopTyping: (data) => {
            if (data.conversationId === conversation._id) {
                setTypingUserId(null)
            }
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })

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
        } catch (error) {
            console.error('Failed to load messages:', error)
            toast.error('Không thể tải tin nhắn')
        } finally {
            setIsLoading(false)
        }
    }, [conversation._id])

    // Load more messages
    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            loadMessages(page + 1)
        }
    }

    // Send message
    const handleSendMessage = async (content: string, imageUrl?: string) => {
        try {
            // Send via Socket.IO for real-time
            if (isConnected) {
                sendSocketMessage({
                    conversationId: conversation._id,
                    content,
                    type: imageUrl ? 'image' : 'text',
                    imageUrl
                })
            } else {
                // Fallback to HTTP if socket not connected
                const message = await chatService.sendMessage({
                    conversationId: conversation._id,
                    content,
                    type: imageUrl ? 'image' : 'text',
                    imageUrl
                })

                // Add message to UI if socket not connected
                setMessages((prev) => [...prev, message])
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('Không thể gửi tin nhắn')
        }
    }

    // Handle typing
    const handleTyping = () => {
        if (isConnected) {
            startTyping(conversation._id)
        }
    }

    const handleStopTyping = () => {
        if (isConnected) {
            stopTyping(conversation._id)
        }
    }

    // Join conversation room on mount
    useEffect(() => {
        if (isConnected) {
            console.log('🔵 Joining conversation room:', conversation._id)
            joinConversation(conversation._id)
        }

        return () => {
            if (isConnected) {
                console.log('🔴 Leaving conversation room:', conversation._id)
                leaveConversation(conversation._id)
            }
        }
    }, [isConnected, conversation._id, joinConversation, leaveConversation])

    // Load initial messages
    useEffect(() => {
        loadMessages(1)
    }, [loadMessages])

    // Mark messages as read when opening chat
    useEffect(() => {
        if (isConnected) {
            markAsRead(conversation._id)
        }
    }, [conversation._id, isConnected, markAsRead])

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Messages */}
            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isLoading={isLoading}
                typingUserId={typingUserId || undefined}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
            />

            {/* Input */}
            <ChatInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onStopTyping={handleStopTyping}
                disabled={!isConnected}
                placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
            />
        </div>
    )
}
