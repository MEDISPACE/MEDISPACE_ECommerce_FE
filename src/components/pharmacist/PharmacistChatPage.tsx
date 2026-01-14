import { useState, useEffect } from 'react'
import { MessageCircle, Search, Loader2, RotateCcw } from 'lucide-react'
import { Input } from '../ui/input'
import { ChatWindow } from '../chat/ChatWindow'
import { ConversationList } from '../chat/ConversationList'
import { chatService } from '~/services/chatService'
import { useAuth } from '~/contexts/AuthContext'
import { useSocket } from '~/hooks/useSocket'
import type { Conversation } from '~/types/chat'
import { toast } from 'sonner'

// Removed space-y-6
export function PharmacistChatPage() {
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Socket integration for real-time updates
    const { isConnected } = useSocket({
        onNewMessage: (message) => {
            // Update conversation list when new message arrives
            setConversations(prev => {
                const conversationIndex = prev.findIndex(c => c._id === message.conversationId)

                if (conversationIndex === -1) {
                    // New conversation - reload the list
                    loadConversations()
                    return prev
                }

                // Update existing conversation
                const updatedConversations = [...prev]
                const conversation = { ...updatedConversations[conversationIndex] }

                // Update lastMessage (it's a string, not an object)
                conversation.lastMessage = message.content
                conversation.lastMessageAt = message.createdAt

                // Removed unread counting logic as requested
                /*
                // Update unread count if message is from customer (not from pharmacist)
                if (message.senderRole === 'customer') {
                    conversation.unreadCount = {
                        ...conversation.unreadCount,
                        pharmacist: (conversation.unreadCount?.pharmacist || 0) + 1
                    }
                }
                */

                // Remove from current position
                updatedConversations.splice(conversationIndex, 1)

                // Add to top
                updatedConversations.unshift(conversation)

                return updatedConversations
            })
        }
    })

    // Load conversations function
    const loadConversations = async () => {
        try {
            setIsLoading(true)
            const response = await chatService.getConversations({ page: 1, limit: 50 })
            setConversations(response.conversations)
        } catch (error) {

            toast.error('Không thể tải danh sách trò chuyện')
        } finally {
            setIsLoading(false)
        }
    }

    // Load conversations on mount
    useEffect(() => {
        loadConversations()

        // Auto-refresh every 30 seconds as fallback
        const interval = setInterval(loadConversations, 30000)
        return () => clearInterval(interval)
    }, [])

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv => {
        const customerName = `${conv.customer?.firstName} ${conv.customer?.lastName}`.toLowerCase()
        return customerName.includes(searchQuery.toLowerCase())
    })

    // Handle delete conversation
    const handleDeleteConversation = async (conversationId: string) => {
        try {
            await chatService.deleteConversation(conversationId)

            // Remove from list
            setConversations(prev => prev.filter(c => c._id !== conversationId))

            // Clear selection if deleted conversation was selected
            if (selectedConversation?._id === conversationId) {
                setSelectedConversation(null)
            }

            toast.success('Đã xóa cuộc trò chuyện')
        } catch (error: any) {

            toast.error(error?.message || 'Không thể xóa cuộc trò chuyện')
        }
    }

    return (
        // Removed space-y-6 as we want a fixed container
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-hidden">
                {/* Conversations List */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow-lg border-2 border-blue-100 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-500 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Tin nhắn
                            </h2>
                            <button
                                onClick={async () => {
                                    setIsLoading(true)
                                    try {
                                        const response = await chatService.getConversations({ page: 1, limit: 50 })
                                        setConversations(response.conversations)
                                        toast.success('Đã làm mới')
                                    } catch (error) {
                                        toast.error('Không thể tải lại')
                                    } finally {
                                        setIsLoading(false)
                                    }
                                }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title="Làm mới"
                            >
                                <RotateCcw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Tìm khách hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Đang tải...</p>
                                </div>
                            </div>
                        ) : (
                            <ConversationList
                                conversations={filteredConversations}
                                currentUserId={user?._id || ''}
                                currentUserRole="pharmacist"
                                selectedConversationId={selectedConversation?._id}
                                onSelectConversation={setSelectedConversation}
                                onDeleteConversation={handleDeleteConversation}
                            />
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2 h-full overflow-hidden">
                    {selectedConversation ? (
                        <div className="h-full bg-white rounded-lg shadow-lg border-2 border-blue-100 flex flex-col overflow-hidden">
                            {/* Customer Info Header */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {selectedConversation.customer?.firstName?.charAt(0) || 'K'}
                                    </div>
                                    <div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {selectedConversation.customer?.firstName} {selectedConversation.customer?.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-500">Khách hàng</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0">
                                <ChatWindow
                                    conversation={selectedConversation}
                                    currentUserId={user?._id || ''}
                                    currentUserRole="pharmacist"
                                    showHeader={false}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-lg shadow-lg border-2 border-blue-100 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Chọn một cuộc trò chuyện</h3>
                                <p className="text-gray-600">
                                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
