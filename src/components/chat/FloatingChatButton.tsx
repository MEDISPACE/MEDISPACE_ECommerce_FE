import { useState, useEffect } from 'react'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ChatWindow } from './ChatWindow'
import { chatService } from '~/services/chatService'
import { useAuth } from '~/contexts/AuthContext'
import { useSocket } from '~/hooks/useSocket'
import type { Conversation } from '~/types/chat'
import { toast } from 'sonner'

export function FloatingChatWidget() {
    const { user, isAuthenticated } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Only show for customers
    const isCustomer = user?.role === 0

    // Socket integration for real-time updates
    const { isConnected } = useSocket({
        onNewMessage: (message) => {
            {/* Unread counting disabled
            if (!isOpen || isMinimized) {
                setUnreadCount(prev => prev + 1)
            }
            */}

            // Reload conversation if it's the current one
            if (conversation && message.conversationId === conversation._id) {
                // The ChatWindow component will handle adding the message
                // We just need to update the conversation metadata
                setConversation(prev => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        lastMessage: message.content,
                        lastMessageAt: message.createdAt
                    }
                })
            }
        }
    })

    // Load conversation when opening
    useEffect(() => {
        if (!isAuthenticated || !isCustomer || !isOpen) return

        const loadConversation = async () => {
            try {
                setIsLoading(true)
                const response = await chatService.getConversations({ page: 1, limit: 1 })

                if (response.conversations.length > 0) {
                    setConversation(response.conversations[0])
                    setUnreadCount(response.conversations[0].unreadCount.customer || 0)
                } else {
                    setConversation(null)
                }
            } catch (error: any) {

                setConversation(null)
            } finally {
                setIsLoading(false)
            }
        }

        if (!conversation) {
            loadConversation()
        }
    }, [isAuthenticated, isCustomer, isOpen])

    // Load unread count when closed
    useEffect(() => {
        if (!isAuthenticated || !isCustomer || isOpen) return

        const loadUnreadCount = async () => {
            try {
                const response = await chatService.getConversations({ page: 1, limit: 1 })
                if (response.conversations.length > 0) {
                    setUnreadCount(response.conversations[0].unreadCount.customer || 0)
                }
            } catch (error) {
                // Silently fail
            }
        }

        loadUnreadCount()
        const interval = setInterval(loadUnreadCount, 60000)
        return () => clearInterval(interval)
    }, [isAuthenticated, isCustomer, isOpen])

    if (!isAuthenticated || !isCustomer) {
        return null
    }

    const handleToggle = () => {
        if (isMinimized) {
            setIsMinimized(false)
            setUnreadCount(0) // Reset unread when un-minimizing
        } else {
            if (!isOpen) {
                setUnreadCount(0) // Reset unread when opening
            }
            setIsOpen(!isOpen)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setIsMinimized(false)
    }

    const handleMinimize = () => {
        setIsMinimized(true)
    }

    // Create new conversation (shared inbox - no pharmacist selection)
    const handleCreateConversation = async () => {
        try {
            setIsLoading(true)
            const newConv = await chatService.getOrCreateConversation()
            setConversation(newConv)
            toast.success('Đã kết nối với dược sĩ')
        } catch (error: any) {

            toast.error(error?.message || 'Không thể tạo cuộc trò chuyện')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Chat Widget Window */}
            {isOpen && !isMinimized && (
                <div className="fixed bottom-24 right-6 z-50 w-[90vw] sm:w-[360px] h-[80vh] sm:h-[550px] max-h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-blue-100 flex flex-col overflow-hidden slide-up-animation">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <div>
                                <h3 className="font-semibold text-sm">Chat với Dược sĩ</h3>
                                <p className="text-xs opacity-90">Tư vấn trực tuyến</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMinimize}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Đang tải...</p>
                                </div>
                            </div>
                        ) : conversation ? (
                            <ChatWindow
                                conversation={conversation}
                                currentUserId={user?._id || ''}
                                currentUserRole="customer"
                                showHeader={false}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Bắt đầu trò chuyện</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Gửi tin nhắn cho dược sĩ để được tư vấn.<br />
                                    Dược sĩ sẽ trả lời khi có thời gian.
                                </p>
                                <Button
                                    onClick={handleCreateConversation}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
                                >
                                    Bắt đầu chat
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Minimized State */}
            {isOpen && isMinimized && (
                <div
                    className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-xl px-4 py-3 cursor-pointer hover:shadow-2xl transition-shadow"
                    onClick={() => setIsMinimized(false)}
                >
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">Chat với Dược sĩ</span>
                        <Maximize2 className="w-4 h-4 ml-2" />
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={handleToggle}
                    className="relative w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition-all duration-300 hover:scale-110 animate-float"
                    aria-label="Chat với dược sĩ"
                >
                    {isOpen && !isMinimized ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <>
                            <MessageCircle className="w-6 h-6" />

                            {/* Unread count badge removed as requested */}
                            {/* 
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full border-2 border-white min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                            */}

                            <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
                        </>
                    )}
                </Button>
            </div>

            {/* Custom CSS */}
            <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .slide-up-animation {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
        </>
    )
}
