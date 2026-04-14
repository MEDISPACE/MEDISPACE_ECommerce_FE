import { useState, useEffect, useCallback, useId, useRef } from 'react'
import { MessageCircle, Search, Loader2, RotateCcw, Inbox, User, CheckCircle } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ChatWindow } from '../chat/ChatWindow'
import { ConversationList } from '../chat/ConversationList'
import { chatService } from '~/services/chatService'
import { useAuth } from '~/contexts/AuthContext'
import { useSocketContext } from '~/contexts/SocketContext'
import type { Conversation } from '~/types/chat'
import { toast } from 'sonner'

type TabType = 'pending' | 'mine'

export function PharmacistChatPage() {
  const id = useId()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [isAssigning, setIsAssigning] = useState(false)

  // Dùng ref để onNewMessage không bị stale closure với selectedConversation
  const selectedConversationRef = useRef<Conversation | null>(null)
  const handleSelectConversation = useCallback((conv: Conversation | null) => {
    setSelectedConversation(conv)
    selectedConversationRef.current = conv
    // Clear badge ngay khi dược sĩ chọn conversation
    if (conv) {
      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: { ...c.unreadCount, pharmacist: 0 } } : c)),
      )
    }
  }, [])

  const { subscribe, unsubscribe, isConnected } = useSocketContext()

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await chatService.getConversations({ page: 1, limit: 100, status: 'active' })
      setConversations(response.conversations)
    } catch {
      toast.error('Không thể tải danh sách trò chuyện')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Socket events
  useEffect(() => {
    subscribe(id, {
      onNewMessage: (message) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c._id === message.conversationId)
          if (idx === -1) {
            loadConversations()
            return prev
          }
          const updated = [...prev]
          const isViewing = selectedConversationRef.current?._id === message.conversationId
          const conv = { ...updated[idx], lastMessage: message.content, lastMessageAt: message.createdAt }
          // Tăng unread chỉ khi không xem conversation này VÀ tin nhắn từ khách hàng
          if (!isViewing && message.senderRole === 'customer') {
            conv.unreadCount = {
              ...conv.unreadCount,
              pharmacist: (conv.unreadCount?.pharmacist || 0) + 1,
            }
          } else if (isViewing) {
            // Đang xem → clear badge ngay
            conv.unreadCount = { ...conv.unreadCount, pharmacist: 0 }
          }
          updated.splice(idx, 1)
          return [conv, ...updated]
        })
      },
      // (3.5) Cập nhật conversation khi được assign
      onConversationAssigned: ({ conversationId, pharmacistId }) => {
        setConversations((prev) => prev.map((c) => (c._id === conversationId ? { ...c, pharmacistId } : c)))
        // Nếu mình là người được assign → chuyển sang tab "Của tôi"
        if (pharmacistId === user?._id) {
          setActiveTab('mine')
          toast.success('Bạn đã được phân công một cuộc tư vấn mới!')
        }
      },
      // Admin đóng conversation → xóa khỏi danh sách
      onConversationClosed: ({ conversationId }) => {
        setConversations((prev) => prev.filter((c) => c._id !== conversationId))
        setSelectedConversation((prev) => {
          if (prev?._id === conversationId) {
            toast.info('Cuộc hội thoại đang xem đã bị admin đóng.')
            return null
          }
          return prev
        })
      },
      // Admin chuyển conversation sang dược sĩ khác
      onConversationTransferred: ({ conversationId, newPharmacistId, oldPharmacistId }) => {
        const isOldPharmacist = oldPharmacistId === user?._id
        const isNewPharmacist = newPharmacistId === user?._id

        if (isOldPharmacist) {
          // Mình bị transfer ra → xóa khỏi inbox ngay lập tức
          setConversations((prev) => prev.filter((c) => c._id !== conversationId))
          setSelectedConversation((prev) => {
            if (prev?._id === conversationId) {
              toast.info('Cuộc hội thoại đã được chuyển sang dược sĩ khác.')
              return null
            }
            return prev
          })
        } else if (isNewPharmacist) {
          // Mình được nhận conversation mới → reload để lấy thông tin đầy đủ
          loadConversations()
          toast.success('Bạn được chuyển giao một cuộc tư vấn mới!')
          setActiveTab('mine')
        }
      },
    })
    return () => unsubscribe(id)
  }, [id, subscribe, unsubscribe, loadConversations, selectedConversation, user?._id])

  useEffect(() => {
    loadConversations()
    // Poll 30s chỉ khi socket mất kết nối
    if (isConnected) return
    const iv = setInterval(loadConversations, 30000)
    return () => clearInterval(iv)
  }, [loadConversations, isConnected])

  // (3.5) Dược sĩ tự nhận conversation
  const handleAssign = async (conversationId: string) => {
    try {
      setIsAssigning(true)
      await chatService.assignConversation(conversationId)
      // Cập nhật local state
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, pharmacistId: user?._id || '' } : c)),
      )
      setActiveTab('mine')
      toast.success('Đã nhận cuộc tư vấn thành công')
    } catch (error: any) {
      toast.error(error?.message || 'Không thể nhận cuộc tư vấn')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await chatService.deleteConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c._id !== conversationId))
      if (selectedConversation?._id === conversationId) setSelectedConversation(null)
      toast.success('Đã xóa cuộc trò chuyện')
    } catch (error: any) {
      toast.error(error?.message || 'Không thể xóa cuộc trò chuyện')
    }
  }

  // Filter theo tab và search
  // Ẩn conversation rỗng (chưa có tin nhắn) từ mọi tab
  const hasMessages = (c: Conversation) => !!(c.lastMessage || c.lastMessageAt)
  // Option A: "Chờ xử lý" = chưa assign + đã assign nhưng pharmacist offline
  const pendingConversations = conversations.filter(
    (c) =>
      hasMessages(c) &&
      c.status === 'active' &&
      (!c.pharmacistId || (c.pharmacist && !c.pharmacist.isOnline && c.pharmacistId !== user?._id)),
  )
  const myConversations = conversations.filter(
    (c) => hasMessages(c) && c.status === 'active' && c.pharmacistId === user?._id,
  )

  const getFilteredList = () => {
    const list = activeTab === 'pending' ? pendingConversations : myConversations
    return list.filter((conv) => {
      const name = `${conv.customer?.firstName} ${conv.customer?.lastName}`.toLowerCase()
      return name.includes(searchQuery.toLowerCase())
    })
  }

  const filteredConversations = getFilteredList()

  return (
    <div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-hidden'>
        {/* Sidebar – Conversation List */}
        <div className='lg:col-span-1 bg-white rounded-lg shadow-lg border-2 border-blue-100 flex flex-col h-full overflow-hidden'>
          {/* Header */}
          <div className='p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-500 flex-shrink-0'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold text-white flex items-center'>
                <MessageCircle className='w-5 h-5 mr-2' />
                Tin nhắn
              </h2>
              <button
                onClick={loadConversations}
                className='p-1.5 hover:bg-white/20 rounded-lg transition-colors'
                title='Làm mới'
              >
                <RotateCcw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Tabs: Chờ xử lý / Của tôi */}
            <div className='flex gap-1 mb-3 bg-white/20 rounded-lg p-1'>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                <Inbox className='w-3.5 h-3.5' />
                Chờ xử lý
                {pendingConversations.length > 0 && (
                  <Badge className='bg-red-500 text-white text-xs px-1.5 py-0 h-4 ml-1'>
                    {pendingConversations.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                <User className='w-3.5 h-3.5' />
                Của tôi
                {myConversations.length > 0 && (
                  <span className='ml-1 text-xs opacity-80'>({myConversations.length})</span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                type='text'
                placeholder='Tìm khách hàng...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 bg-white h-9 text-sm'
              />
            </div>
          </div>

          {/* List */}
          <div className='flex-1 overflow-y-auto min-h-0'>
            {isLoading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-center'>
                  <Loader2 className='w-8 h-8 animate-spin text-blue-600 mx-auto mb-2' />
                  <p className='text-gray-600 text-sm'>Đang tải...</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-center p-6'>
                <div className='w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3'>
                  {activeTab === 'pending' ? (
                    <Inbox className='w-7 h-7 text-blue-400' />
                  ) : (
                    <CheckCircle className='w-7 h-7 text-blue-400' />
                  )}
                </div>
                <p className='text-gray-500 text-sm'>
                  {activeTab === 'pending'
                    ? 'Không có cuộc trò chuyện nào chờ xử lý'
                    : 'Bạn chưa nhận cuộc trò chuyện nào'}
                </p>
              </div>
            ) : /* Tab "Chờ xử lý" – show assign button; Tab "Của tôi" – show delete button */
            activeTab === 'pending' ? (
              <div className='divide-y divide-gray-100'>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`p-3 hover:bg-blue-50 transition-colors ${
                      selectedConversation?._id === conv._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className='flex items-center gap-2 mb-1'>
                      <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>
                        {conv.customer?.firstName?.charAt(0) || 'K'}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm text-gray-900 truncate'>
                          {conv.customer?.firstName} {conv.customer?.lastName}
                        </p>
                        <p className='text-xs text-gray-500 truncate'>{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                      </div>
                    </div>
                    {/* Option A: cảnh báo nếu đã assign nhưng pharmacist offline */}
                    {conv.pharmacistId && conv.pharmacist && !conv.pharmacist.isOnline && (
                      <p className='text-xs text-amber-600 bg-amber-50 rounded px-2 py-0.5 mb-2 flex items-center gap-1'>
                        ⚠️ Dược sĩ phụ trách đang offline – có thể tiếp nhận
                      </p>
                    )}
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleSelectConversation(conv)}
                        className='flex-1 h-7 text-xs border-blue-200 text-blue-600'
                      >
                        Xem
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleAssign(conv._id)}
                        disabled={isAssigning}
                        className='flex-1 h-7 text-xs bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                      >
                        {isAssigning ? <Loader2 className='w-3 h-3 animate-spin' /> : '✓ Nhận tư vấn'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                currentUserId={user?._id || ''}
                currentUserRole='pharmacist'
                selectedConversationId={selectedConversation?._id}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className='lg:col-span-2 h-full overflow-hidden'>
          {selectedConversation ? (
            <div className='h-full bg-white rounded-lg shadow-lg border-2 border-blue-100 flex flex-col overflow-hidden'>
              <div className='p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold'>
                    {selectedConversation.customer?.firstName?.charAt(0) || 'K'}
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      {selectedConversation.customer?.firstName} {selectedConversation.customer?.lastName}
                    </h3>
                    <p className='text-sm text-gray-500'>Khách hàng</p>
                  </div>
                </div>
                {/* Nút nhận tư vấn ngay trong chat window nếu chưa assign */}
                {!selectedConversation.pharmacistId && (
                  <Button
                    size='sm'
                    onClick={() => handleAssign(selectedConversation._id)}
                    disabled={isAssigning}
                    className='bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs'
                  >
                    {isAssigning ? <Loader2 className='w-3 h-3 animate-spin mr-1' /> : null}
                    Nhận tư vấn này
                  </Button>
                )}
                {selectedConversation.pharmacistId === user?._id && (
                  <span className='text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium flex items-center gap-1'>
                    <CheckCircle className='w-3 h-3' /> Đang phụ trách
                  </span>
                )}
              </div>
              <div className='flex-1 min-h-0'>
                <ChatWindow
                  conversation={selectedConversation}
                  currentUserId={user?._id || ''}
                  currentUserRole='pharmacist'
                  showHeader={false}
                />
              </div>
            </div>
          ) : (
            <div className='h-full bg-white rounded-lg shadow-lg border-2 border-blue-100 flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <MessageCircle className='w-10 h-10 text-blue-600' />
                </div>
                <h3 className='text-xl font-medium text-gray-900 mb-2'>Chọn một cuộc trò chuyện</h3>
                <p className='text-gray-600 text-sm'>
                  {activeTab === 'pending'
                    ? 'Nhận một cuộc tư vấn từ danh sách bên trái'
                    : 'Chọn cuộc tư vấn của bạn từ danh sách'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
