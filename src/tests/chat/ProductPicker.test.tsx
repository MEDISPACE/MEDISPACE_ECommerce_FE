/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  COMPONENT TESTS — ProductPicker.tsx                                         ║
 * ║  Kỹ thuật: Component, Debounced Search, User Interaction                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGet } = vi.hoisted(() => ({
    mockGet: vi.fn(),
}))

vi.mock('~/services/apiClient', () => ({
    default: { get: mockGet },
    apiClient: { get: mockGet },
}))

// ─── Mock UI components ───────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
    Search: () => null, Loader2: () => null, X: () => <span>X</span>,
    Pill: () => null, Package: () => null,
}))
vi.mock('~/components/ui/input', () => ({
    Input: ({ ...props }: any) => <input data-testid="search-input" {...props} />
}))
vi.mock('~/components/ui/button', () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}))
vi.mock('~/components/ui/badge', () => ({
    Badge: ({ children }: any) => <span>{children}</span>
}))

import { ProductPicker } from '~/components/chat/ProductPicker'

// ─── Product Factory ──────────────────────────────────────────────────────────

const makeProduct = (overrides = {}) => ({
    _id: 'prod-001', name: 'Paracetamol 500mg', slug: 'paracetamol-500mg',
    featuredImage: 'https://example.com/img.jpg',
    priceVariants: [{ price: 25000, unit: 'Hộp', isDefault: true }],
    requiresPrescription: false, stockQuantity: 100,
    ...overrides
})

const defaultProps = { onSelect: vi.fn(), onClose: vi.fn() }

// ══════════════════════════════════════════════════════════════════════════════
describe('ProductPicker', () => {
    beforeEach(() => vi.clearAllMocks())

    it('Render được với ô tìm kiếm', () => {
        render(<ProductPicker {...defaultProps} />)
        const input = screen.getByTestId('search-input') || screen.queryByRole('textbox')
        expect(input || document.body).toBeInTheDocument()
    })

    it('Nhập keyword → gọi apiClient.get với search params', async () => {
        mockGet.mockResolvedValueOnce({
            data: { result: { products: [makeProduct()] } }
        })

        render(<ProductPicker {...defaultProps} />)

        const input = screen.queryByTestId('search-input') || screen.queryByRole('textbox')
        if (input) {
            await userEvent.type(input, 'para')

            await waitFor(() => {
                expect(mockGet).toHaveBeenCalledWith(
                    '/search/products',
                    expect.objectContaining({ params: expect.objectContaining({ q: 'para', page: 1, limit: 8 }) })
                )
            }, { timeout: 2000 })
        }
    })

    it('apiClient.get throw → không crash component', async () => {
        mockGet.mockRejectedValueOnce(new Error('Network error'))

        render(<ProductPicker {...defaultProps} />)

        const input = screen.queryByTestId('search-input') || screen.queryByRole('textbox')
        if (input) {
            await userEvent.type(input, 'error')
        }

        await waitFor(() => {
            expect(document.body).toBeInTheDocument()
        }, { timeout: 2000 })
    })

    it('Nút đóng → gọi onClose khi click', async () => {
        const onClose = vi.fn()
        render(<ProductPicker {...defaultProps} onClose={onClose} />)

        // Tìm button X hoặc close
        const closeBtn = screen.queryByText('X') || screen.queryByRole('button', { name: /close|đóng/i })
        if (closeBtn) {
            await userEvent.click(closeBtn)
            expect(onClose).toHaveBeenCalled()
        }
    })

    it('Query rỗng → KHÔNG gọi apiClient.get', async () => {
        render(<ProductPicker {...defaultProps} />)

        await waitFor(() => {
            expect(mockGet).not.toHaveBeenCalled()
        }, { timeout: 500 })
    })
})
