import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCommunityService, mockAdminCommunityService, mockUseAuth, mockUseSocketContext } = vi.hoisted(() => ({
  mockCommunityService: {
    listVideoEvents: vi.fn(),
    getVideoEvent: vi.fn(),
    registerVideoEvent: vi.fn(),
    joinVideoEvent: vi.fn(),
    listVideoEventQuestions: vi.fn(),
    submitVideoEventQuestion: vi.fn(),
  },
  mockAdminCommunityService: {
    listRooms: vi.fn(),
    listVideoEvents: vi.fn(),
    listVideoEventRegistrations: vi.fn(),
    listVideoEventQuestions: vi.fn(),
    createVideoEvent: vi.fn(),
    startVideoEvent: vi.fn(),
    endVideoEvent: vi.fn(),
    cancelVideoEvent: vi.fn(),
    updateVideoEventQuestion: vi.fn(),
  },
  mockUseAuth: vi.fn(),
  mockUseSocketContext: vi.fn(),
}))

vi.mock('~/services/communityService', () => ({
  default: mockCommunityService,
  communityService: mockCommunityService,
  adminCommunityService: mockAdminCommunityService,
}))

vi.mock('~/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('~/contexts/SocketContext', () => ({
  useSocketContext: mockUseSocketContext,
}))

vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({ children }: { children: React.ReactNode }) => <div data-testid='livekit-room'>{children}</div>,
  VideoConference: () => <div data-testid='video-conference'>Video conference</div>,
}))

vi.mock('@livekit/components-styles', () => ({}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import { CommunityVideoEventsPage } from '~/components/community/CommunityVideoEventsPage'
import { CommunityVideoEventDetailPage } from '~/components/community/CommunityVideoEventDetailPage'
import { AdminCommunityVideoEventsPage } from '~/components/admin/AdminCommunityVideoEventsPage'
import { toast } from 'sonner'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderWithProviders(ui: React.ReactElement, initialPath = '/') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderDetail(eventId = 'event-1') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[`/community/video-events/${eventId}`]}>
        <Routes>
          <Route path='/community/video-events/:eventId' element={<CommunityVideoEventDetailPage />} />
          <Route path='/login' element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const event = {
  _id: 'event-1',
  roomId: 'room-1',
  title: 'Diabetes care workshop',
  description: 'Community knowledge sharing.',
  agenda: 'Intro and Q&A',
  visibility: 'public',
  status: 'scheduled',
  scheduledStartAt: new Date(Date.now() + 3_600_000).toISOString(),
  scheduledEndAt: new Date(Date.now() + 7_200_000).toISOString(),
  registrationCount: 3,
  capacity: 50,
  room: { _id: 'room-1', name: 'Diabetes Room', slug: 'diabetes', visibility: 'public' },
}

describe('Community Video Events UI component tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { _id: 'user-1' } })
    mockUseSocketContext.mockReturnValue({
      joinCommunityVideoEvent: vi.fn(),
      leaveCommunityVideoEvent: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })
    mockCommunityService.listVideoEvents.mockResolvedValue({ items: [event], page: 1, limit: 30, total: 1 })
    mockCommunityService.getVideoEvent.mockResolvedValue(event)
    mockCommunityService.listVideoEventQuestions.mockResolvedValue({ items: [], page: 1, limit: 50, total: 0 })
    mockCommunityService.registerVideoEvent.mockResolvedValue({ eventId: event._id, status: 'registered' })
    mockCommunityService.joinVideoEvent.mockResolvedValue({ token: 'mock-token', wsUrl: 'wss://livekit.test', provider: 'livekit', role: 'attendee', expiresAt: new Date().toISOString() })
    mockAdminCommunityService.listRooms.mockResolvedValue([{ _id: 'room-1', name: 'Diabetes Room', status: 'active' }])
    mockAdminCommunityService.listVideoEvents.mockResolvedValue({ items: [event], page: 1, limit: 50, total: 1 })
    mockAdminCommunityService.listVideoEventRegistrations.mockResolvedValue({ items: [], page: 1, limit: 50, total: 0 })
    mockAdminCommunityService.listVideoEventQuestions.mockResolvedValue({ items: [], page: 1, limit: 80, total: 0 })
  })

  it('renders public listing with event details, search input, and register action', async () => {
    renderWithProviders(<CommunityVideoEventsPage />, '/community/video-events')

    expect(await screen.findByText('Diabetes care workshop')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tìm hội thảo')).toBeInTheDocument()
    expect(screen.getByText('3/50')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng ký/i })).toBeInTheDocument()
  })

  it('redirects unauthenticated listing registration to login', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null })
    renderWithProviders(
      <Routes>
        <Route path='/community/video-events' element={<CommunityVideoEventsPage />} />
        <Route path='/login' element={<div>Login page</div>} />
      </Routes>,
      '/community/video-events',
    )

    await user.click(await screen.findByRole('button', { name: /đăng ký/i }))
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('shows login gate on detail page for anonymous users', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null })
    renderDetail()

    expect(screen.getByText('Bạn cần đăng nhập để xem hội thảo')).toBeInTheDocument()
  })

  it('renders event detail, Q&A panel, disclaimer, and disabled join before live', async () => {
    renderDetail()

    expect(await screen.findByText('Diabetes care workshop')).toBeInTheDocument()
    expect(screen.getByText('Q&A đã kiểm duyệt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /chưa live/i })).toBeDisabled()
  })

  it('renders LiveKit shell after accepting disclaimer and joining live event', async () => {
    const user = userEvent.setup()
    mockCommunityService.getVideoEvent.mockResolvedValue({ ...event, status: 'live', viewerRegistration: { status: 'registered' } })
    renderDetail()

    await screen.findByText('Diabetes care workshop')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /tham gia hội thảo/i }))

    expect(await screen.findByTestId('livekit-room')).toBeInTheDocument()
    expect(screen.getByTestId('video-conference')).toBeInTheDocument()
  })

  it('blocks placeholder LiveKit server URLs before mounting LiveKit', async () => {
    const user = userEvent.setup()
    mockCommunityService.getVideoEvent.mockResolvedValue({ ...event, status: 'live', viewerRegistration: { status: 'registered' } })
    mockCommunityService.joinVideoEvent.mockResolvedValue({
      token: 'mock-token',
      wsUrl: 'wss://your-livekit-server.com',
      provider: 'livekit',
      role: 'attendee',
      expiresAt: new Date().toISOString(),
    })

    renderDetail()

    await screen.findByText('Diabetes care workshop')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /tham gia hội thảo/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('LiveKit chưa được cấu hình đúng')))
    expect(screen.queryByTestId('livekit-room')).not.toBeInTheDocument()
  })

  it('submits a valid question and clears the input', async () => {
    const user = userEvent.setup()
    mockCommunityService.submitVideoEventQuestion.mockResolvedValue({ question: { _id: 'q1', status: 'pending' }, moderation: {} })
    renderDetail()

    const input = await screen.findByPlaceholderText('Nhập câu hỏi cho dược sĩ...')
    await user.type(input, 'Can I take this medicine with food?')
    await user.click(screen.getByRole('button', { name: /gửi câu hỏi/i }))

    await waitFor(() => expect(mockCommunityService.submitVideoEventQuestion).toHaveBeenCalled())
  })

  it('renders admin event dashboard with lifecycle and Q&A controls', async () => {
    mockAdminCommunityService.listVideoEventQuestions.mockResolvedValue({
      items: [{ _id: 'q1', content: 'Question to moderate', status: 'pending', pinned: false }],
      page: 1,
      limit: 80,
      total: 1,
    })
    renderWithProviders(<AdminCommunityVideoEventsPage />, '/admin/video-events')

    expect(await screen.findByText('Hội thảo cộng đồng')).toBeInTheDocument()
    expect(await screen.findByText('Diabetes care workshop')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Diabetes care workshop'))
    expect(await screen.findByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /duyệt/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ẩn/i })).toBeInTheDocument()
  })
})
