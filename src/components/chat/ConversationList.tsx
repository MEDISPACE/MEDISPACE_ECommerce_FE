import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Circle, MessageCircle, Trash2 } from 'lucide-react'
import type { Conversation } from '../../types/chat'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'

interface ConversationListProps {
    conversations: Conversation[]
    currentUserId: string
    currentUserRole: 'customer' | 'pharmacist'
    selectedConversationId?: string
    onSelectConversation: (conversation: Conversation) => void
    onDeleteConversation?: (conversationId: string) => void
    isLoading?: boolean
}

export function ConversationList({
    conversations,
    currentUserId,
    currentUserRole,
    selectedConversationId,
    onSelectConversation,
    onDeleteConversation,
    isLoading
}: ConversationListProps) {
    const formatTime = (timestamp?: string) => {
        if (!timestamp) return ''

        const date = new Date(timestamp)

        if (isToday(date)) {
            return format(date, 'HH:mm', { locale: vi })
        } else if (isYesterday(date)) {
            return 'Hôm qua'
        } else {
            return format(date, 'dd/MM/yyyy', { locale: vi })
        }
    }

    const getUnreadCount = (conversation: Conversation) => {
        return currentUserRole === 'customer'
            ? conversation.unreadCount.customer
            : conversation.unreadCount.pharmacist
    }

    const getOtherUser = (conversation: Conversation) => {
        return currentUserRole === 'customer' ? conversation.pharmacist : conversation.customer
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có cuộc trò chuyện</h3>
                <p className="text-gray-600 text-sm">
                    {currentUserRole === 'customer'
                        ? 'Bắt đầu trò chuyện với dược sĩ để được tư vấn'
                        : 'Chưa có khách hàng nào liên hệ'}
                </p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation)
                const unreadCount = getUnreadCount(conversation)
                const isSelected = conversation._id === selectedConversationId
                const isOnline = otherUser?.isOnline || false
                const otherUserName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Người dùng'

                return (
                    <div
                        key={conversation._id}
                        className={`relative group w-full p-4 flex items-start gap-3 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                    >
                        <button
                            onClick={() => onSelectConversation(conversation)}
                            className="flex-1 flex items-start gap-3 text-left"
                        >
                            {/* Avatar with online status */}
                            <div className="relative flex-shrink-0">
                                <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-500">
                                    <AvatarImage src={otherUser?.avatar} />
                                    <AvatarFallback className="text-white font-medium">
                                        {otherUserName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <Circle
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
                                        }`}
                                />
                            </div>

                            {/* Conversation info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`font-medium truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {otherUserName}
                                    </h4>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                        {formatTime(conversation.lastMessageAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p
                                        className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                                            }`}
                                    >
                                        {conversation.lastMessage || 'Chưa có tin nhắn'}
                                    </p>
                                    {unreadCount > 0 && (
                                        <Badge className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Delete button - only show on hover */}
                        {onDeleteConversation && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
                                        onDeleteConversation(conversation._id)
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-lg"
                                title="Xóa cuộc trò chuyện"
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
