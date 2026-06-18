# Community Video Events Playwright E2E Suite

## 1. Required Test Environment Setup

Run the backend and frontend locally before executing the suite.

```bash
cd ../MEDISPACE_ECommerce_BE
npm install
npm run seed:e2e
npm run dev

cd ../MEDISPACE_ECommerce_FE
npm install
npm run dev
```

The suite uses the existing global setup at `tests/e2e/global-setup.ts` to log in seeded users and write storage states to `tests/e2e/.auth`.

## 2. Required Test Data

The backend seed must provide these accounts:

| Fixture | Default email | Purpose |
|---|---|---|
| `admin` | `e2e.admin@medispace.local` | Creates rooms/events, starts/ends/cancels sessions, moderates Q&A. |
| `registeredUser` | `e2e.customer@medispace.local` | Registers, joins, submits questions. |
| `host` | `e2e.customer2@medispace.local` | Secondary user for capacity, visibility, realtime and negative auth cases. |
| `guest` | none | Anonymous browser/API requests. |

Each test creates its own community room and video event through API helpers. Tests do not depend on event state created by another test.

## 3. Environment Variables Needed

| Variable | Purpose | Example |
|---|---|---|
| `E2E_BASE_URL` | Frontend base URL used by Playwright pages. | `http://localhost:3000` |
| `E2E_API_URL` | Backend API base URL used by request helpers. | `http://localhost:8000` |
| `E2E_ADMIN_EMAIL` | Admin seed email override. | `e2e.admin@medispace.local` |
| `E2E_ADMIN_PASSWORD` | Admin seed password override. | `Admin123!aA` |
| `E2E_CUSTOMER_EMAIL` | Main customer seed email override. | `e2e.customer@medispace.local` |
| `E2E_CUSTOMER_PASSWORD` | Main customer seed password override. | `Customer123!aA` |
| `E2E_CUSTOMER2_EMAIL` | Secondary customer seed email override. | `e2e.customer2@medispace.local` |
| `E2E_CUSTOMER2_PASSWORD` | Secondary customer seed password override. | `Customer123!aA` |

LiveKit should not be contacted by E2E tests. UI tests mock the join response where a browser would otherwise create a real LiveKit connection.

## 4. Playwright Config Notes

`playwright.config.ts` uses:

- `testDir: './tests'` so this suite can live at `tests/community-events` beside existing E2E specs.
- `baseURL` from `E2E_BASE_URL`.
- `timeout: 120_000` for multi-user realtime flows.
- existing global setup to create auth storage state.

## Run Locally

Run the full Community Video Events Playwright suite:

```bash
npx playwright test tests/community-events
```

Run only visual UI/UX screenshot tests:

```bash
npx playwright test tests/community-events/11.visual-ui-ux.spec.ts
```

Update approved visual snapshots after reviewing screenshots:

```bash
npx playwright test tests/community-events/11.visual-ui-ux.spec.ts --update-snapshots
```

Run backend functional tests for business rules:

```bash
cd ../MEDISPACE_ECommerce_BE
npx vitest run src/tests/communityVideoEvents.services.test.ts
```

Run frontend component/UI tests:

```bash
cd ../MEDISPACE_ECommerce_FE
npx vitest run src/tests/communityVideoEvents.ui.test.tsx
```

Run one file:

```bash
npx playwright test tests/community-events/04.livekit-join.spec.ts
```

Run headed for debugging:

```bash
npx playwright test tests/community-events --headed
```

## Run In CI

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test tests/community-events --reporter=list
```

## Required `data-testid` Contract

The suite intentionally uses test IDs, not CSS classes or translated text. The UI must expose these selectors for browser-level tests to pass:

| Area | Required test IDs |
|---|---|
| Admin event form | `admin-video-events-page`, `event-title-input`, `event-description-input`, `event-start-input`, `event-end-input`, `event-capacity-input`, `create-event-submit`, `admin-event-list`, `event-status-scheduled` |
| Public listing | `video-events-list`, `register-event-btn`, `attendee-count` |
| Event detail | `event-detail-page`, `event-title`, `medical-disclaimer-checkbox`, `join-event-btn`, `leave-event-btn`, `session-ended-message`, `event-live-notification` |
| LiveKit room shell | `video-room`, `mic-toggle-btn`, `camera-toggle-btn`, `reconnection-indicator` |
| Q&A | `qa-panel`, `question-input`, `question-character-count`, `submit-question-btn`, `question-status-pending`, `question-<questionId>` |
| Admin Q&A | `approve-question-btn`, `hide-question-btn`, `answer-question-btn`, `pin-question-btn` |

## Files

- `fixtures/users.ts` loads seeded users from `tests/e2e/.auth/sessions.json`.
- `fixtures/events.ts` builds scheduled/draft/live/cancelled/ended event payloads.
- `fixtures/questions.ts` builds question payloads.
- `helpers/auth.ts` creates authenticated browser contexts.
- `helpers/event.ts` contains API setup and action helpers.
- `helpers/socket.ts` contains realtime wait helpers.

## Test Pyramid Coverage

| Layer | Files | Purpose |
|---|---|---|
| Backend functional/service | `MEDISPACE_ECommerce_BE/src/tests/communityVideoEvents.services.test.ts` | Business rules: create validation, capacity race guard, registration, LiveKit token payload, Q&A moderation fallback, visibility filtering, reminders. |
| Frontend component/UI | `MEDISPACE_ECommerce_FE/src/tests/communityVideoEvents.ui.test.tsx` | Fast jsdom validation of listing/detail/admin UI states, Q&A controls, LiveKit shell rendering. |
| Playwright E2E/API | `tests/community-events/01-10.*.spec.ts` | Browser + API coverage for roles, lifecycle, registration, Q&A, realtime, reminders, access control, edge cases. |
| Playwright visual UI/UX | `tests/community-events/11.visual-ui-ux.spec.ts` | Screenshot verification for desktop/mobile listing, event detail, live pre-join, and admin dashboard. |
