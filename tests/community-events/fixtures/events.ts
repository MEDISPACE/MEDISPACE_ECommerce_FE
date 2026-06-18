export type EventFixtureStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled'

export function futureDate(minutesFromNow: number) {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString()
}

export function eventPayload(overrides: Record<string, unknown> = {}) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
  return {
    title: `E2E Community Video Event ${stamp}`,
    description: `Automation event ${stamp}`,
    agenda: 'Opening, pharmacist knowledge sharing, meeting chat, closing.',
    visibility: 'public',
    status: 'scheduled',
    scheduledStartAt: futureDate(60),
    scheduledEndAt: futureDate(120),
    capacity: 50,
    registrationRequired: true,
    provider: 'livekit',
    tags: ['e2e', 'community-video'],
    materials: [{ title: 'Slides', url: 'https://example.test/slides.pdf' }],
    ...overrides,
  }
}

export const eventStates = {
  draft: () => eventPayload({ status: 'draft' }),
  scheduled: () => eventPayload({ status: 'scheduled' }),
  live: () => eventPayload({ status: 'scheduled' }),
  ended: () => eventPayload({ status: 'scheduled' }),
  cancelled: () => eventPayload({ status: 'scheduled' }),
}
