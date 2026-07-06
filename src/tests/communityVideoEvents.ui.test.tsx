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
    joinRoom: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    getLiveKitDiagnostics: vi.fn(),
  },
  mockAdminCommunityService: {
    listRooms: vi.fn(),
    listVideoEvents: vi.fn(),
    listVideoEventRegistrations: vi.fn(),
    createVideoEvent: vi.fn(),
    startVideoEvent: vi.fn(),
    endVideoEvent: vi.fn(),
    cancelVideoEvent: vi.fn(),
    listVideoEventParticipants: vi.fn(),
    muteVideoEventParticipant: vi.fn(),
    kickVideoEventParticipant: vi.fn(),
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
import { AdminCommunityVideoEventsPage, buildAdminVideoEventCreatePayload } from '~/components/admin/AdminCommunityVideoEventsPage'
import { BreadcrumbProvider } from '~/contexts/BreadcrumbContext'
import { toast } from 'sonner'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderWithProviders(ui: React.ReactElement, initialPath = '/') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <BreadcrumbProvider>
        <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
      </BreadcrumbProvider>
    </QueryClientProvider>,
  )
}

function renderDetail(eventId = 'event-1') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <BreadcrumbProvider>
        <MemoryRouter initialEntries={[`/community/video-events/${eventId}`]}>
          <Routes>
            <Route path='/community/video-events/:eventId' element={<CommunityVideoEventDetailPage />} />
            <Route path='/login' element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </BreadcrumbProvider>
    </QueryClientProvider>,
  )
}

const event = {
  _id: 'event-1',
  roomId: 'room-1',
  title: 'Diabetes care workshop',
  description: 'Community knowledge sharing.',
  agenda: 'Intro and live chat',
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
      joinCommunityRoom: vi.fn(),
      leaveCommunityRoom: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })
    mockCommunityService.listVideoEvents.mockResolvedValue({ items: [event], page: 1, limit: 30, total: 1 })
    mockCommunityService.getVideoEvent.mockResolvedValue(event)
    mockCommunityService.joinRoom.mockResolvedValue({ roomId: 'room-1', userId: 'user-1', status: 'active' })
    mockCommunityService.listMessages.mockResolvedValue({ items: [], page: 1, limit: 80, total: 0 })
    mockCommunityService.sendMessage.mockResolvedValue({
      message: { _id: 'm1', roomId: 'room-1', senderId: 'user-1', content: 'Can I take this medicine with food?', status: 'visible', createdAt: new Date().toISOString() },
      moderation: {},
    })
    mockCommunityService.registerVideoEvent.mockResolvedValue({ eventId: event._id, status: 'registered' })
    mockCommunityService.joinVideoEvent.mockResolvedValue({ token: 'mock-token', wsUrl: 'wss://livekit.test', provider: 'livekit', role: 'attendee', expiresAt: new Date().toISOString() })
    mockCommunityService.getLiveKitDiagnostics.mockResolvedValue({ configured: true, reachable: true, wsUrl: 'wss://livekit.test', httpUrl: 'https://livekit.test' })
    mockAdminCommunityService.listRooms.mockResolvedValue([{ _id: 'room-1', name: 'Diabetes Room', status: 'active' }])
    mockAdminCommunityService.listVideoEvents.mockResolvedValue({ items: [event], page: 1, limit: 50, total: 1 })
    mockAdminCommunityService.listVideoEventRegistrations.mockResolvedValue({ items: [], page: 1, limit: 50, total: 0 })
    mockAdminCommunityService.listVideoEventParticipants.mockResolvedValue({ eventId: event._id, roomName: 'medispace-event-event-1', participants: [] })
    mockAdminCommunityService.muteVideoEventParticipant.mockResolvedValue({ eventId: event._id, userId: 'user-2', action: 'muted' })
    mockAdminCommunityService.kickVideoEventParticipant.mockResolvedValue({ eventId: event._id, userId: 'user-2', action: 'kicked' })
  })

  it('renders public listing with event details, search input, and direct meeting link', async () => {
    renderWithProviders(<CommunityVideoEventsPage />, '/community/video-events')

    expect(await screen.findByText('Diabetes care workshop')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tìm hội thảo')).toBeInTheDocument()
    expect(screen.getByText(/3\s*\/50 người tham gia/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mở link/i })).toHaveAttribute('href', '/community/video-events/event-1')
    expect(screen.queryByRole('button', { name: /đăng ký/i })).not.toBeInTheDocument()
  })

  it('keeps anonymous listing as a direct link while detail page owns login gate', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null })
    renderWithProviders(
      <Routes>
        <Route path='/community/video-events' element={<CommunityVideoEventsPage />} />
        <Route path='/login' element={<div>Login page</div>} />
      </Routes>,
      '/community/video-events',
    )

    expect(await screen.findByRole('link', { name: /mở link/i })).toHaveAttribute('href', '/community/video-events/event-1')
    expect(screen.queryByRole('button', { name: /đăng ký/i })).not.toBeInTheDocument()
  })

  it('shows login gate on detail page for anonymous users', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null })
    renderDetail()

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders Meet-style prejoin with preview and disabled join before live', async () => {
    renderDetail()

    expect(await screen.findByText('Diabetes care workshop')).toBeInTheDocument()
    expect(screen.getByText('Camera preview')).toBeInTheDocument()
    expect(screen.getByTestId('camera-preview-video')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cuộc họp chưa bắt đầu/i })).toBeDisabled()
  })

  it('renders LiveKit shell after accepting disclaimer and joining live event', async () => {
    const user = userEvent.setup()
    mockCommunityService.getVideoEvent.mockResolvedValue({ ...event, status: 'live', viewerRegistration: { status: 'registered' } })
    renderDetail()

    await screen.findByText('Diabetes care workshop')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /tham gia ngay/i }))

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
    await user.click(screen.getByRole('button', { name: /tham gia ngay/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('LiveKit chưa được cấu hình đúng')))
    expect(screen.queryByTestId('livekit-room')).not.toBeInTheDocument()
  })

  it('sends live chat messages inside the meeting room', async () => {
    const user = userEvent.setup()
    mockCommunityService.getVideoEvent.mockResolvedValue({ ...event, status: 'live', viewerRegistration: { status: 'registered' } })
    renderDetail()

    await screen.findByText('Diabetes care workshop')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /tham gia ngay/i }))

    expect(await screen.findByText('Chat cuộc họp')).toBeInTheDocument()
    const input = await screen.findByPlaceholderText('Nhắn tin cho mọi người...')
    await user.type(input, 'Can I take this medicine with food?')
    await user.click(screen.getByRole('button', { name: /gửi tin nhắn/i }))

    await waitFor(() => expect(mockCommunityService.sendMessage).toHaveBeenCalledWith({ roomId: 'room-1', content: 'Can I take this medicine with food?' }))
  })

  it('renders admin event dashboard with lifecycle controls and direct chat guidance', async () => {
    renderWithProviders(<AdminCommunityVideoEventsPage />, '/admin/video-events')

    expect(await screen.findByText('Hội thảo cộng đồng')).toBeInTheDocument()
    expect(await screen.findByText('Diabetes care workshop')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Diabetes care workshop'))
    expect(await screen.findByRole('button', { name: /bắt đầu/i })).toBeInTheDocument()
    expect(screen.getByText('Chat trực tiếp')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /duyệt/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ẩn/i })).not.toBeInTheDocument()
  })

  it('builds admin create payload without blank optional description', () => {
    const payload = buildAdminVideoEventCreatePayload({
      roomId: 'room-1',
      title: ' New community seminar ',
      description: '   ',
      agenda: '',
      visibility: 'public',
      scheduledStartAt: '2026-07-07T09:00',
      scheduledEndAt: '2026-07-07T10:00',
      capacity: '300',
      tags: '',
    })

    expect(payload).toMatchObject({ roomId: 'room-1', title: 'New community seminar', visibility: 'public' })
    expect(payload).not.toHaveProperty('description')
  })

  it('lets admin mute microphone and kick a live meeting participant', async () => {
    const user = userEvent.setup()
    mockAdminCommunityService.listVideoEvents.mockResolvedValue({ items: [{ ...event, status: 'live' }], page: 1, limit: 50, total: 1 })
    mockAdminCommunityService.listVideoEventParticipants.mockResolvedValue({
      eventId: event._id,
      roomName: 'medispace-event-event-1',
      participants: [
        {
          identity: 'user-2',
          name: 'Nguyen An',
          metadata: { userId: 'user-2', role: 'attendee' },
          tracks: [{ sid: 'TR_AUDIO', name: 'microphone', source: 'microphone', muted: false }],
        },
      ],
    })

    renderWithProviders(<AdminCommunityVideoEventsPage />, '/admin/video-events')

    await screen.findByText('Diabetes care workshop')
    await user.click(screen.getByText('Diabetes care workshop'))

    expect(await screen.findByText('Nguyen An')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /mute/i }))
    await user.click(screen.getByRole('button', { name: /kick/i }))

    await waitFor(() => expect(mockAdminCommunityService.muteVideoEventParticipant).toHaveBeenCalledWith('event-1', 'user-2'))
    await waitFor(() => expect(mockAdminCommunityService.kickVideoEventParticipant).toHaveBeenCalledWith('event-1', 'user-2'))
  })
})
