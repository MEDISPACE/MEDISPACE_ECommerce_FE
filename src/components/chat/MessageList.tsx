import { useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Message } from '../../types/chat'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2 } from 'lucide-react'

interface MessageListProps {
    messages: Message[]
    currentUserId: string
    currentUserRole: 'customer' | 'pharmacist'
    isLoading?: boolean
    typingUserId?: string
    onLoadMore?: () => void
    hasMore?: boolean
}

export function MessageList({
    messages,
    currentUserId,
    currentUserRole,
    isLoading,
    typingUserId,
    onLoadMore,
    hasMore
}: MessageListProps) {
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
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Đang tải tin nhắn...</p>
                </div>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có tin nhắn</h3>
                    <p className="text-gray-600">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4"
            style={{ scrollBehavior: 'smooth' }}
        >
            {/* Load more indicator */}
            {hasMore && (
                <div className="text-center py-2">
                    <button
                        onClick={onLoadMore}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Tải thêm tin nhắn
                    </button>
                </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
                const isOwnMessage = message.senderId === currentUserId
                const prevMessage = index > 0 ? messages[index - 1] : null
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

                // Check if this is the last message in a consecutive group from same sender
                const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId

                // Check if we need a date separator
                const showDateSeparator = !prevMessage ||
                    new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString()

                const formatDateSeparator = (date: Date) => {
                    if (isToday(date)) return 'Hôm nay'
                    if (isYesterday(date)) return 'Hôm qua'
                    return format(date, 'dd/MM/yyyy', { locale: vi })
                }

                return (
                    <div key={message._id}>
                        {/* Date separator */}
                        {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {formatDateSeparator(new Date(message.createdAt))}
                                </div>
                            </div>
                        )}

                        {/* Message */}
                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}>
                            {/* Message bubble */}
                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                <div
                                    className={`rounded-2xl px-4 py-2 ${isOwnMessage
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-900'
                                        } shadow-sm`}
                                >
                                    {/* Image message */}
                                    {message.type === 'image' && message.imageUrl && (
                                        <img
                                            src={message.imageUrl}
                                            alt="Sent image"
                                            className="max-w-xs rounded-lg mb-2"
                                        />
                                    )}

                                    {/* Text content */}
                                    {message.content && (
                                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    )}
                                </div>

                                {/* Timestamp - only show for last message in group */}
                                {isLastInGroup && (
                                    <span className="text-xs text-gray-500 mt-1 px-1">
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Typing indicator */}
            {typingUserId && typingUserId !== currentUserId && (
                <div className="flex items-end gap-2">
                    <Avatar className="w-8 h-8 bg-green-100">
                        <AvatarFallback className="text-green-600">DS</AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
        </div>
    )
}
