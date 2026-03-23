import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Message } from '../../types/chat'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2 } from 'lucide-react'
import { ProductCard } from './ProductCard'

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
                                    {/* Product card message */}
                                    {message.type === 'product' && message.productRef && (
                                        <ProductCard
                                            product={message.productRef}
                                            isOwnMessage={isOwnMessage}
                                        />
                                    )}

                                    {/* Image message */}
                                    {message.type === 'image' && message.imageUrl && (
                                        <div
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedImage(message.imageUrl || null)}
                                        >
                                            <img
                                                src={message.imageUrl}
                                                alt="Sent image"
                                                className={`max-w-xs rounded-lg hover:opacity-90 transition-opacity ${message.content ? 'mb-2' : ''}`}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                <div className="bg-black/50 p-2 rounded-full text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text content – ẩn nếu là product card (đã hiển thị trong card) */}
                                    {message.content && message.type !== 'product' && (
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

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full view"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
