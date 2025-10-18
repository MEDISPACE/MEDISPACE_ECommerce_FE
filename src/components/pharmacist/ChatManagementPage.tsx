import { useState } from 'react'
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  MoreVertical,
  Eye,
  Archive,
  Star,
  Pill,
} from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { toast } from 'sonner'
import { getChatStatusBadge, getPriorityBadge } from '../../utils/badgeUtils'

interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerAvatar?: string
  customerPhone: string
  status: 'active' | 'waiting' | 'resolved' | 'archived'
  priority: 'normal' | 'high' | 'urgent'
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  tags: string[]
  createdAt: string
  prescriptionId?: string
  isStarred: boolean
}

const mockConversations: Conversation[] = [
  {
    id: 'CHAT001',
    customerId: 'C001',
    customerName: 'Nguyễn Văn A',
    customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    customerPhone: '0901234567',
    status: 'active',
    priority: 'urgent',
    lastMessage: 'Thuốc này tôi uống lúc nào là tốt nhất ạ?',
    lastMessageTime: '2025-01-15T14:30:00Z',
    unreadCount: 3,
    tags: ['Tư vấn thuốc', 'Khẩn cấp'],
    createdAt: '2025-01-15T14:15:00Z',
    prescriptionId: 'RX001',
    isStarred: true,
  },
  {
    id: 'CHAT002',
    customerId: 'C002',
    customerName: 'Trần Thị B',
    customerPhone: '0987654321',
    status: 'waiting',
    priority: 'high',
    lastMessage: 'Tôi bị dị ứng với thuốc này, có thể thay thế không?',
    lastMessageTime: '2025-01-15T14:25:00Z',
    unreadCount: 2,
    tags: ['Dị ứng', 'Thay thuốc'],
    createdAt: '2025-01-15T13:45:00Z',
    prescriptionId: 'RX002',
    isStarred: false,
  },
  {
    id: 'CHAT003',
    customerId: 'C003',
    customerName: 'Lê Văn C',
    customerPhone: '0912345678',
    status: 'active',
    priority: 'normal',
    lastMessage: 'Cảm ơn dược sĩ đã tư vấn. Tôi hiểu rồi ạ.',
    lastMessageTime: '2025-01-15T14:20:00Z',
    unreadCount: 0,
    tags: ['Tư vấn chung'],
    createdAt: '2025-01-15T12:30:00Z',
    isStarred: false,
  },
  {
    id: 'CHAT004',
    customerId: 'C004',
    customerName: 'Phạm Thị D',
    customerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    customerPhone: '0923456789',
    status: 'resolved',
    priority: 'normal',
    lastMessage: 'Đã nhận được thuốc. Cảm ơn bạn!',
    lastMessageTime: '2025-01-15T11:00:00Z',
    unreadCount: 0,
    tags: ['Hoàn thành'],
    createdAt: '2025-01-15T09:15:00Z',
    prescriptionId: 'RX003',
    isStarred: false,
  },
  {
    id: 'CHAT005',
    customerId: 'C005',
    customerName: 'Võ Văn E',
    customerPhone: '0934567890',
    status: 'waiting',
    priority: 'high',
    lastMessage: 'Xin chào, tôi cần tư vấn về thuốc huyết áp',
    lastMessageTime: '2025-01-15T13:50:00Z',
    unreadCount: 1,
    tags: ['Huyết áp'],
    createdAt: '2025-01-15T13:50:00Z',
    isStarred: false,
  },
  {
    id: 'CHAT006',
    customerId: 'C006',
    customerName: 'Đỗ Thị F',
    customerPhone: '0945678901',
    status: 'archived',
    priority: 'normal',
    lastMessage: 'Cảm ơn dược sĩ nhiều lắm!',
    lastMessageTime: '2025-01-14T16:30:00Z',
    unreadCount: 0,
    tags: ['Đã lưu trữ'],
    createdAt: '2025-01-14T10:00:00Z',
    isStarred: false,
  },
]

export function ChatManagementPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerPhone.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter

    // Tab filtering
    let matchesTab = true
    if (activeTab === 'active') matchesTab = conv.status === 'active'
    else if (activeTab === 'waiting') matchesTab = conv.status === 'waiting'
    else if (activeTab === 'resolved') matchesTab = conv.status === 'resolved'
    else if (activeTab === 'starred') matchesTab = conv.isStarred

    return matchesSearch && matchesStatus && matchesPriority && matchesTab
  })

  // Get statistics
  const getStats = () => {
    const total = conversations.length
    const active = conversations.filter((c) => c.status === 'active').length
    const waiting = conversations.filter((c) => c.status === 'waiting').length
    const unread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

    return { total, active, waiting, unread }
  }

  const stats = getStats()

  // Actions
  const handleOpenChat = (conversationId: string) => {
    window.location.href = `/consultation/chat/${conversationId}`
  }

  const handleToggleStar = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, isStarred: !conv.isStarred } : conv)),
    )
    toast.success('Đã cập nhật')
  }

  const handleArchive = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, status: 'archived' } : conv)),
    )
    toast.success('Đã lưu trữ cuộc hội thoại')
  }

  const handleResolve = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, status: 'resolved' } : conv)),
    )
    toast.success('Đã đánh dấu là đã giải quyết')
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    
      <div className='space-y-6'>
        {/* Header */}
        <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-6'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <h1 className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                Quản lý tư vấn trực tuyến
              </h1>
              <p className='text-gray-600 mt-1'>Theo dõi và trả lời các cuộc hội thoại với khách hàng</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
            <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <MessageSquare className='w-5 h-5 text-blue-600' />
                  <span className='text-sm text-blue-800'>Tổng số</span>
                </div>
                <p className='text-2xl text-blue-900'>{stats.total}</p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  <span className='text-sm text-green-800'>Đang tư vấn</span>
                </div>
                <p className='text-2xl text-green-900'>{stats.active}</p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Clock className='w-5 h-5 text-yellow-600' />
                  <span className='text-sm text-yellow-800'>Chờ phản hồi</span>
                </div>
                <p className='text-2xl text-yellow-900'>{stats.waiting}</p>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-red-50 to-red-100 border-red-200'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <AlertCircle className='w-5 h-5 text-red-600' />
                  <span className='text-sm text-red-800'>Tin chưa đọc</span>
                </div>
                <p className='text-2xl text-red-900'>{stats.unread}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs & Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
          <div className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-4'>
            <TabsList className='grid w-full grid-cols-5 bg-blue-50'>
              <TabsTrigger value='all'>Tất cả</TabsTrigger>
              <TabsTrigger value='active'>Đang tư vấn</TabsTrigger>
              <TabsTrigger value='waiting'>Chờ phản hồi</TabsTrigger>
              <TabsTrigger value='resolved'>Đã giải quyết</TabsTrigger>
              <TabsTrigger value='starred'>Đánh dấu</TabsTrigger>
            </TabsList>

            {/* Search & Filters */}
            <div className='flex flex-col md:flex-row gap-4 mt-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Tìm theo tên, SĐT, tin nhắn...'
                    className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-40 border-2 border-blue-200 focus:border-blue-500'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Đang tư vấn</SelectItem>
                  <SelectItem value='waiting'>Chờ phản hồi</SelectItem>
                  <SelectItem value='resolved'>Đã giải quyết</SelectItem>
                  <SelectItem value='archived'>Lưu trữ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className='w-32 border-2 border-blue-200 focus:border-blue-500'>
                  <SelectValue placeholder='Độ ưu tiên' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='urgent'>Khẩn cấp</SelectItem>
                  <SelectItem value='high'>Ưu tiên</SelectItem>
                  <SelectItem value='normal'>Bình thường</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversation List */}
          <div className='space-y-3'>
            {filteredConversations.length === 0 ? (
              <Card className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
                <CardContent className='p-12 text-center'>
                  <MessageSquare className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                  <h3 className='text-lg text-gray-900 mb-2'>Không tìm thấy cuộc hội thoại</h3>
                  <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className='bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 hover:shadow-xl transition-all cursor-pointer'
                  onClick={() => handleOpenChat(conv.id)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-4'>
                      {/* Avatar */}
                      <Avatar className='w-12 h-12'>
                        <AvatarImage src={conv.customerAvatar} />
                        <AvatarFallback>{conv.customerName.charAt(0)}</AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <h3 className='text-gray-900'>{conv.customerName}</h3>
                            {getChatStatusBadge(conv.status)}
                            {getPriorityBadge(conv.priority)}
                            {conv.unreadCount > 0 && (
                              <Badge className='bg-red-500 text-white'>{conv.unreadCount} mới</Badge>
                            )}
                          </div>
                          <span className='text-xs text-gray-500 whitespace-nowrap ml-2'>
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>

                        <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                          <Phone className='w-4 h-4' />
                          <span>{conv.customerPhone}</span>
                          {conv.prescriptionId && (
                            <>
                              <span className='text-gray-300'>•</span>
                              <Pill className='w-4 h-4 text-blue-600' />
                              <span className='text-blue-600'>#{conv.prescriptionId}</span>
                            </>
                          )}
                        </div>

                        <p className='text-sm text-gray-700 truncate mb-2'>{conv.lastMessage}</p>

                        <div className='flex items-center gap-2 flex-wrap'>
                          {conv.tags.map((tag, index) => (
                            <Badge key={index} variant='outline' className='text-xs'>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStar(conv.id)
                          }}
                        >
                          <Star className={`w-4 h-4 ${conv.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant='ghost' size='sm'>
                              <MoreVertical className='w-4 h-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenChat(conv.id)
                              }}
                            >
                              <Eye className='w-4 h-4 mr-2' />
                              Mở chat
                            </DropdownMenuItem>
                            {conv.status !== 'resolved' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResolve(conv.id)
                                }}
                              >
                                <CheckCircle className='w-4 h-4 mr-2' />
                                Đánh dấu đã giải quyết
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleArchive(conv.id)
                              }}
                            >
                              <Archive className='w-4 h-4 mr-2' />
                              Lưu trữ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </Tabs>
      </div>
    
  )
}
