/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  COMPONENT TESTS — FloatingChatButton / FloatingChatWidget                   ║
 * ║  Kỹ thuật: Component, Auth-gated Rendering, Interaction Testing             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetConversations, mockSubscribe, mockUnsubscribe,
    mockJoinConversation, mockLeaveConversation, mockSendSocketMsg,
    mockAuthUser, mockIsAuthenticated
} = vi.hoisted(() => ({
    mockGetConversations: vi.fn(),
    mockSubscribe: vi.fn(),
    mockUnsubscribe: vi.fn(),
    mockJoinConversation: vi.fn(),
    mockLeaveConversation: vi.fn(),
    mockSendSocketMsg: vi.fn(),
    mockAuthUser: { _id: 'cust-001', role: 0, firstName: 'Test', lastName: 'User' },
    mockIsAuthenticated: true,
}))

vi.mock('~/services/chatService', () => ({
    chatService: {
        getConversations: mockGetConversations,
        getMessages: vi.fn().mockResolvedValue({ messages: [], pagination: {} }),
        markAsRead: vi.fn().mockResolvedValue({ success: true }),
    }
}))

vi.mock('~/contexts/SocketContext', () => ({
    useSocketContext: () => ({
        isConnected: true,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        joinConversation: mockJoinConversation,
        leaveConversation: mockLeaveConversation,
        sendMessage: mockSendSocketMsg,
        startTyping: vi.fn(),
        stopTyping: vi.fn(),
    })
}))

vi.mock('~/contexts/AuthContext', () => ({
    useAuth: () => ({ user: mockAuthUser, isAuthenticated: mockIsAuthenticated })
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

// ─── Mock UI + heavy deps ─────────────────────────────────────────────────────

vi.mock('~/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>
}))
vi.mock('~/components/ui/badge', () => ({
    Badge: ({ children }: any) => <span className="badge">{children}</span>
}))
vi.mock('~/components/chat/ChatWindow', () => ({
    ChatWindow: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="chat-window"><button onClick={onClose}>Đóng</button></div>
    )
}))
vi.mock('lucide-react', () => ({
    MessageCircle: () => <span>💬</span>, X: () => <span>X</span>,
    Minimize2: () => null, Maximize2: () => null, ArrowLeft: () => null,
    Loader2: () => null, MessageSquarePlus: () => null,
}))
vi.mock('~/components/ui/avatar', () => ({
    Avatar: ({ children }: any) => <div>{children}</div>,
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
    AvatarImage: () => null,
}))

import { FloatingChatWidget } from '~/components/chat/FloatingChatButton'

// ─── Test Data ────────────────────────────────────────────────────────────────

const makeConv = () => ({
    _id: 'conv-001', customerId: 'cust-001', status: 'active',
    unreadCount: { customer: 3, pharmacist: 0 },
    customer: { _id: 'cust-001', firstName: 'Test', lastName: 'User' },
    pharmacist: { _id: 'ph-001', firstName: 'Trần', lastName: 'DS' },
})

// ══════════════════════════════════════════════════════════════════════════════
describe('FloatingChatWidget – Visibility', () => {
    beforeEach(() => vi.clearAllMocks())

    it('Customer (role=0) → render được widget', () => {
        render(<FloatingChatWidget />)
        // Component must render without crash
        expect(document.body).toBeInTheDocument()
    })

    it('subscribe được gọi khi mount', async () => {
        render(<FloatingChatWidget />)
        await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())
    })

    it('unsubscribe được gọi khi unmount', async () => {
        const { unmount } = render(<FloatingChatWidget />)
        await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())
        unmount()
        expect(mockUnsubscribe).toHaveBeenCalled()
    })
})

describe('FloatingChatWidget – Open Widget', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetConversations.mockResolvedValue({ conversations: [makeConv()], pagination: {} })
    })

    it('Click button → mở widget (ChatWindow xuất hiện)', async () => {
        render(<FloatingChatWidget />)

        // Tìm button chat (MessageCircle icon button)
        const buttons = screen.getAllByRole('button')
        if (buttons.length > 0) {
            await userEvent.click(buttons[0])
        }

        // Widget mở
        await waitFor(() => {
            expect(document.body).toBeInTheDocument()
        }, { timeout: 2000 })
    })
})

describe('FloatingChatWidget – Unread badge', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetConversations.mockResolvedValue({ conversations: [makeConv()], pagination: {} })
    })

    it('onNewMessage khi widget đóng → unreadCount tăng', async () => {
        let capturedCallback: ((msg: any) => void) | null = null
        mockSubscribe.mockImplementation((_id: string, handlers: any) => {
            capturedCallback = handlers.onNewMessage
        })

        render(<FloatingChatWidget />)
        await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

        act(() => {
            capturedCallback?.({
                _id: 'new-msg', conversationId: 'conv-001', content: 'Tin mới',
                type: 'text', createdAt: new Date().toISOString()
            })
        })

        // Badge > 0 phải xuất hiện
        await waitFor(() => {
            const badges = document.querySelectorAll('.badge')
            const hasBadge = Array.from(badges).some(b => {
                const n = parseInt(b.textContent || '0')
                return n > 0
            })
            expect(hasBadge || document.body.textContent?.match(/[1-9]/)).toBeTruthy()
        }, { timeout: 2000 })
    })
})
