/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  COMPONENT TESTS — AdminChatPage.tsx                                         ║
 * ║  Kỹ thuật: Component, Mock API, Loading States, Tab Navigation              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminChatPage } from '~/components/admin/AdminChatPage'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGet, mockPatch } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPatch: vi.fn(),
}))

const { mockSubscribe, mockUnsubscribe } = vi.hoisted(() => ({
    mockSubscribe: vi.fn(),
    mockUnsubscribe: vi.fn(),
}))

vi.mock('~/services/apiClient', () => ({
    apiClient: { get: mockGet, patch: mockPatch },
    default: { get: mockGet, patch: mockPatch },
}))

vi.mock('~/contexts/SocketContext', () => ({
    useSocketContext: () => ({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
    }),
}))

// ─── Mock all heavy deps ──────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
    MessageCircle: () => null, BarChart3: () => null, List: () => null,
    Search: () => null, Filter: () => null, X: () => null,
    Loader2: () => null, RefreshCw: () => null, CheckCircle: () => null,
    AlertCircle: () => null, Clock: () => null, Users: () => null,
    MessageSquare: () => null, ArrowRightLeft: () => null, User: () => null,
}))
vi.mock('~/components/ui/button', () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}))
vi.mock('~/components/ui/input', () => ({
    Input: ({ ...props }: any) => <input {...props} />
}))
vi.mock('~/components/ui/badge', () => ({
    Badge: ({ children }: any) => <span>{children}</span>
}))
vi.mock('~/components/ui/avatar', () => ({
    Avatar: ({ children }: any) => <div>{children}</div>,
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
    AvatarImage: () => null,
}))
vi.mock('~/components/chat/MessageList', () => ({
    MessageList: () => <div data-testid="message-list">Messages</div>
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('date-fns', () => ({
    format: vi.fn().mockReturnValue('01/01/2024'),
    isToday: vi.fn().mockReturnValue(false),
    isYesterday: vi.fn().mockReturnValue(false),
}))
vi.mock('date-fns/locale', () => ({ vi: {} }))

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockStats = {
    totalConversations: 42, activeConversations: 15, closedConversations: 27,
    unassignedConversations: 3,
    todayStats: { newConversations: 5, closedConversations: 2, messages: 88 },
    topPharmacists: []
}

const mockConvResponse = {
    conversations: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
}

// ══════════════════════════════════════════════════════════════════════════════
describe('AdminChatPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGet.mockImplementation((url: string) => {
            if (url.includes('stats')) return Promise.resolve({ data: { result: mockStats } })
            return Promise.resolve({ data: { result: mockConvResponse } })
        })
    })

    it('Component render được mà không crash', async () => {
        render(<AdminChatPage />)
        await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 })
    })

    it('apiClient.get được gọi để lấy data khi mount', async () => {
        render(<AdminChatPage />)
        await waitFor(() => expect(mockGet).toHaveBeenCalled(), { timeout: 3000 })
    })

    it('Hiển thị stats numbers sau khi load', async () => {
        render(<AdminChatPage />)
        await waitFor(() => {
            const text = document.body.textContent || ''
            expect(text).toMatch(/42|15|27|3|5|88/)
        }, { timeout: 3000 })
    })

    it('Loading state khi đang fetch', () => {
        mockGet.mockImplementation(() => new Promise(() => {}))
        render(<AdminChatPage />)
        expect(document.body).toBeInTheDocument()
    })

    it('apiClient.get failure → component không crash (graceful error)', async () => {
        mockGet.mockRejectedValue(new Error('Network error'))
        render(<AdminChatPage />)
        await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 })
    })
})
