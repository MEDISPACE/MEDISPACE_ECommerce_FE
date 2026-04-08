import { useState, useEffect, useCallback, useId } from 'react'
import {
    MessageCircle, BarChart3, List, Search, Filter,
    X, Loader2, RefreshCw, CheckCircle, AlertCircle,
    Clock, Users, MessageSquare, ArrowRightLeft, User
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { MessageList } from '../chat/MessageList'
import { apiClient } from '~/services/apiClient'
import { format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Message } from '~/types/chat'
import { useSocketContext } from '~/contexts/SocketContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatStats {
    totalConversations: number
    activeConversations: number
    closedConversations: number
    unassignedConversations: number
    todayStats: { newConversations: number; closedConversations: number; messages: number }
    topPharmacists: Array<{
        pharmacistId: string
        conversationCount: number
        pharmacist: { firstName: string; lastName: string; avatar?: string; isOnline?: boolean }
    }>
}

interface AdminConversation {
    _id: string
    status: 'active' | 'closed'
    customerId: string
    pharmacistId?: string
    lastMessage?: string
    lastMessageAt?: string
    messageCount: number
    createdAt: string
    unreadCount: { customer: number; pharmacist: number }
    customer: { _id: string; firstName: string; lastName: string; avatar?: string; email?: string; isOnline?: boolean }
    pharmacist?: { _id: string; firstName: string; lastName: string; avatar?: string; isOnline?: boolean }
}

interface Pharmacist {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
    isOnline?: boolean
}

// ─── Utils ───────────────────────────────────────────────────────────────────

const formatTime = (ts?: string) => {
    if (!ts) return ''
    const d = new Date(ts)
    if (isToday(d)) return format(d, 'HH:mm', { locale: vi })
    if (isYesterday(d)) return 'Hôm qua'
    return format(d, 'dd/MM/yyyy', { locale: vi })
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: number; sub?: string; color: string
}) {
    return (
        <div className={`bg-white rounded-xl p-5 border-l-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('border-', 'bg-')}`}>
                    <Icon className="w-5 h-5 text-gray-600" />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    )
}

// ─── Transfer Modal ──────────────────────────────────────────────────────────

function TransferModal({ conversation, onClose, onTransferred }: {
    conversation: AdminConversation
    onClose: () => void
    onTransferred: () => void
}) {
    const [pharmacists, setPharmacists] = useState<Pharmacist[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isTransferring, setIsTransferring] = useState(false)
    const [selectedId, setSelectedId] = useState('')

    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        apiClient.get<{ result: { users: Pharmacist[] } }>('/admin/users', {
            params: { role: '1', limit: 50, page: 1 }
        }).then(r => {
            setPharmacists(r.data.result?.users || [])
        }).catch((err) => {
            console.error('[TransferModal]', err)
            setLoadError(true)
            toast.error('Không thể tải danh sách dược sĩ')
        }).finally(() => setIsLoading(false))
    }, [])

    const handleTransfer = async () => {
        if (!selectedId) return
        try {
            setIsTransferring(true)
            await apiClient.patch(`/admin/chats/conversations/${conversation._id}/transfer`, {
                pharmacistId: selectedId
            })
            toast.success('Đã chuyển cuộc trò chuyện thành công')
            onTransferred()
            onClose()
        } catch {
            toast.error('Không thể chuyển cuộc trò chuyện')
        } finally {
            setIsTransferring(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        Chuyển đến dược sĩ khác
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-sm text-gray-500 mb-4">
                        Khách: <strong>{conversation.customer.firstName} {conversation.customer.lastName}</strong>
                    </p>
                    {isLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                    ) : loadError ? (
                        <p className="text-sm text-red-500 text-center py-4">Không thể tải danh sách dược sĩ</p>
                    ) : pharmacists.filter(p => p._id !== conversation.pharmacistId).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Không có dược sĩ khác để chuyển</p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {pharmacists.filter(p => p._id !== conversation.pharmacistId).map(p => (
                                <label
                                    key={p._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${selectedId === p._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                >
                                    <input
                                        type="radio" name="pharmacist" value={p._id}
                                        checked={selectedId === p._id}
                                        onChange={() => setSelectedId(p._id)}
                                        className="sr-only"
                                    />
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={p.avatar || undefined} />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                            {p.firstName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 p-5 border-t">
                    <Button variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={!selectedId || isTransferring}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    >
                        {isTransferring ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Chuyển
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function ConversationDetailPanel({ conversation, onClose, onAction }: {
    conversation: AdminConversation
    onClose: () => void
    onAction: () => void
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isClosing, setIsClosing] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        apiClient.get<{ result: { messages: Message[] } }>(
            `/admin/chats/conversations/${conversation._id}/messages`,
            { params: { limit: 100 } }
        ).then(r => {
            setMessages(r.data.result?.messages || [])
        }).catch(() => toast.error('Không thể tải tin nhắn'))
            .finally(() => setIsLoading(false))
    }, [conversation._id])

    const handleClose = async () => {
        if (!confirm('Đóng cuộc trò chuyện này?')) return
        try {
            setIsClosing(true)
            await apiClient.patch(`/admin/chats/conversations/${conversation._id}/close`)
            toast.success('Đã đóng cuộc trò chuyện')
            onAction()
            onClose()
        } catch {
            toast.error('Không thể đóng cuộc trò chuyện')
        } finally {
            setIsClosing(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                        <AvatarImage src={conversation.customer.avatar || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {conversation.customer.firstName[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-sm text-gray-900">
                            {conversation.customer.firstName} {conversation.customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{conversation.customer.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${conversation.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {conversation.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                    </Badge>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Pharmacist info */}
            {conversation.pharmacist && (
                <div className="px-4 py-2 bg-blue-50 border-b flex items-center gap-2 text-xs text-blue-700 flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                    Dược sĩ: <strong>{conversation.pharmacist.firstName} {conversation.pharmacist.lastName}</strong>
                    <span className={`ml-auto w-2 h-2 rounded-full ${conversation.pharmacist.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {conversation.pharmacist.isOnline ? 'Online' : 'Offline'}
                </div>
            )}

            {/* Messages (read-only) */}
            <div className="flex-1 flex flex-col min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        {/* Legend cho admin */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b text-xs text-gray-500 flex-shrink-0">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                                Khách: {conversation.customer.firstName} {conversation.customer.lastName}
                            </span>
                            <span className="flex items-center gap-1.5">
                                Dược sĩ: {conversation.pharmacist ? `${conversation.pharmacist.firstName} ${conversation.pharmacist.lastName}` : 'Chưa phân công'}
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                            </span>
                        </div>
                        <MessageList
                            messages={messages}
                            currentUserId={conversation.pharmacistId || ''}
                            currentUserRole="pharmacist"
                            isLoading={false}
                        />
                    </>
                )}
            </div>

            {/* Actions */}
            {conversation.status === 'active' && (
                <div className="p-3 border-t flex gap-2 flex-shrink-0 bg-gray-50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTransfer(true)}
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                        <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Chuyển dược sĩ
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleClose}
                        disabled={isClosing}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                        {isClosing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                        Đóng hội thoại
                    </Button>
                </div>
            )}

            {showTransfer && (
                <TransferModal
                    conversation={conversation}
                    onClose={() => setShowTransfer(false)}
                    onTransferred={onAction}
                />
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabType = 'overview' | 'conversations'

export function AdminChatPage() {
    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [stats, setStats] = useState<ChatStats | null>(null)
    const [conversations, setConversations] = useState<AdminConversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<AdminConversation | null>(null)
    const [isLoadingStats, setIsLoadingStats] = useState(true)
    const [isLoadingList, setIsLoadingList] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const loadStats = useCallback(async () => {
        try {
            setIsLoadingStats(true)
            const r = await apiClient.get<{ result: ChatStats }>('/admin/chats/stats')
            setStats(r.data.result)
        } catch {
            toast.error('Không thể tải thống kê chat')
        } finally {
            setIsLoadingStats(false)
        }
    }, [])

    const loadConversations = useCallback(async (p = 1) => {
        try {
            setIsLoadingList(true)
            const r = await apiClient.get<{ result: { conversations: AdminConversation[]; pagination: { totalPages: number } } }>(
                '/admin/chats/conversations',
                {
                    params: {
                        page: p, limit: 15,
                        status: statusFilter === 'all' ? undefined : statusFilter,
                        search: search || undefined
                    }
                }
            )
            setConversations(r.data.result.conversations)
            setTotalPages(r.data.result.pagination.totalPages)
            setPage(p)
        } catch {
            toast.error('Không thể tải danh sách hội thoại')
        } finally {
            setIsLoadingList(false)
        }
    }, [statusFilter, search])

    useEffect(() => { loadStats() }, [loadStats])

    useEffect(() => {
        if (activeTab === 'conversations') loadConversations(1)
    }, [activeTab, loadConversations])

    // Socket realtime: admin nhận conversation mới, đóng, chuyển → reload
    const socketId = useId()
    const { subscribe, unsubscribe } = useSocketContext()
    useEffect(() => {
        subscribe(socketId, {
            onConversationNew: () => {
                // Conversation mới có tin nhắn đầu tiên → reload và refresh stats
                if (activeTab === 'conversations') loadConversations(1)
                loadStats()
            },
            onConversationClosed: () => {
                if (activeTab === 'conversations') loadConversations(page)
                loadStats()
            },
            onConversationTransferred: () => {
                if (activeTab === 'conversations') loadConversations(page)
                loadStats()
            }
        })
        return () => unsubscribe(socketId)
    }, [socketId, subscribe, unsubscribe, activeTab, loadConversations, loadStats, page])

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-7 h-7 text-blue-600" />
                        Quản lý Chat
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Giám sát và quản lý các cuộc tư vấn của dược sĩ</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { loadStats(); if (activeTab === 'conversations') loadConversations(1) }}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Làm mới
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {([
                    { id: 'overview', icon: BarChart3, label: 'Tổng quan' },
                    { id: 'conversations', icon: List, label: 'Danh sách' }
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Overview ─────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {isLoadingStats ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : stats ? (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard icon={MessageSquare} label="Tổng hội thoại" value={stats.totalConversations} color="border-blue-500" />
                                <StatCard icon={CheckCircle} label="Đang hoạt động" value={stats.activeConversations} color="border-green-500" />
                                <StatCard icon={AlertCircle} label="Chưa có dược sĩ" value={stats.unassignedConversations} sub="Cần phân công" color="border-amber-500" />
                                <StatCard icon={Clock} label="Đã đóng hôm nay" value={stats.todayStats.closedConversations} sub={`${stats.todayStats.newConversations} mới • ${stats.todayStats.messages} tin nhắn`} color="border-gray-400" />
                            </div>

                            {/* Top Pharmacists */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Top Dược sĩ đang hoạt động
                                </h2>
                                {stats.topPharmacists.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                                ) : (
                                    <div className="space-y-3">
                                        {stats.topPharmacists.map((item, idx) => (
                                            <div key={item.pharmacistId} className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-400 w-5">{idx + 1}</span>
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={item.pharmacist.avatar || undefined} />
                                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                        {item.pharmacist.firstName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.pharmacist.firstName} {item.pharmacist.lastName}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${item.pharmacist.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                        {item.conversationCount} cuộc
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* ── Tab: Conversations ────────────────────────────────── */}
            {activeTab === 'conversations' && (
                <div className={`grid gap-4 ${selectedConversation ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`} style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>
                    {/* List Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        {/* Filters */}
                        <div className="p-4 border-b space-y-3 flex-shrink-0">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm theo tên khách..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && loadConversations(1)}
                                        className="pl-9 h-9 text-sm"
                                    />
                                </div>
                                <Button size="sm" onClick={() => loadConversations(1)} className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex gap-1">
                                {(['all', 'active', 'closed'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {s === 'all' ? 'Tất cả' : s === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Conversation Rows */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {isLoadingList ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
                                    <p className="text-gray-500 text-sm">Không có cuộc hội thoại nào</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {conversations.map(conv => (
                                        <button
                                            key={conv._id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${selectedConversation?._id === conv._id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar className="w-9 h-9 flex-shrink-0">
                                                    <AvatarImage src={conv.customer.avatar || undefined} />
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs">
                                                        {conv.customer.firstName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {conv.customer.firstName} {conv.customer.lastName}
                                                        </p>
                                                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate mb-1">{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`text-xs px-1.5 py-0 ${conv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {conv.status === 'active' ? 'Active' : 'Closed'}
                                                        </Badge>
                                                        {conv.pharmacist ? (
                                                            <span className="text-xs text-gray-400 truncate">
                                                                DS: {conv.pharmacist.firstName} {conv.pharmacist.lastName}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-amber-600 font-medium">⚠ Chưa phân công</span>
                                                        )}
                                                        <span className="text-xs text-gray-400 ml-auto">{conv.messageCount} tin</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t flex-shrink-0">
                                <Button variant="outline" size="sm" onClick={() => loadConversations(page - 1)} disabled={page <= 1} className="h-8 text-xs">Trước</Button>
                                <span className="text-xs text-gray-500">Trang {page} / {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => loadConversations(page + 1)} disabled={page >= totalPages} className="h-8 text-xs">Tiếp</Button>
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    {selectedConversation && (
                        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden flex flex-col h-full">
                            <ConversationDetailPanel
                                conversation={selectedConversation}
                                onClose={() => setSelectedConversation(null)}
                                onAction={() => { loadConversations(page); loadStats() }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
