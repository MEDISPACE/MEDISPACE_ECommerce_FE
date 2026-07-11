# MediSpace E-Commerce Frontend

Frontend web application for MediSpace, a digital pharmacy platform combining pharmaceutical e-commerce, prescription upload and OCR review, pharmacist consultation, AI chat, HealthHub content, community discussion, loyalty, coupons, and video health events.

This repository contains the customer storefront, account portal, pharmacist workspace, and admin console.

## Overview

MediSpace FE is built with React Router 7, React 19, TypeScript, Tailwind CSS, Radix UI, Socket.IO Client, TanStack Query, and LiveKit UI components. It communicates with the Node.js backend API and the realtime chat/video stack through HTTP, Socket.IO, and LiveKit WebRTC.

```text
Customer / Pharmacist / Admin
        |
        v
React Router FE  --->  Node.js API / Socket.IO  --->  MongoDB, Redis, Typesense
        |                         |
        |                         +-- OCR, ML Recommendation, Chat AI services
        |
        +-- LiveKit WebRTC for video health events
```

## Authors

- Tran Nguyen Quoc Bao
- Nguyen Huu Thong

## Main Features

- Product catalog: product listing, categories, brands, search, product detail, related products, and wishlist.
- Cart and checkout: cart management, coupons, loyalty points, order placement, payment result pages, and order tracking.
- Prescription flow: upload prescription image, call OCR scan API, review extracted medicines, submit prescription, and view prescription status.
- Chat: floating chat widget, AI chat entry, pharmacist chat, conversation history, image messages, and Socket.IO realtime updates.
- Account portal: profile, addresses, orders, returns, prescriptions, coupons, loyalty, rewards, reviews, notifications, settings, and payment methods.
- HealthHub: health articles, categories, search, health checker, and health-needs landing pages.
- Community: rooms, threads, replies, reactions, reports, appeals, moderation states, and video event pages.
- Live health events: event listing, registration, event detail, chat messages, and LiveKit video room integration.
- Pharmacist workspace: dashboard, prescription review, create order, patient history, drug database, chat, articles, settings, notifications, and returns.
- Admin console: dashboard, products, categories, brands, orders, returns, customers, pharmacists, prescriptions, reports, articles, community, video events, moderation, coupons, loyalty, notifications, and settings.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | React 19, React Router 7 |
| Language | TypeScript |
| Styling | Tailwind CSS, Radix UI, lucide-react, class-variance-authority |
| Data fetching | Axios, TanStack Query |
| Realtime | Socket.IO Client |
| Video events | LiveKit React Components |
| Forms and validation | react-hook-form, Zod |
| Charts and dashboards | Recharts |
| Testing | Vitest, Playwright |
| Runtime/deploy | React Router build, Nginx Docker image |

## Key Source Structure

```text
src/
├── routes.ts                         # React Router route map
├── routes/                           # Customer, account, admin, pharmacist, health, community routes
├── components/                       # Shared UI and feature components
├── services/                         # API service wrappers used by pages/components
├── lib/api/                          # Typed API helpers for core flows
├── contexts/                         # Auth, cart, socket, breadcrumb contexts
├── hooks/                            # Shared React hooks
├── types/                            # Frontend domain types
└── assets/                           # Logos and payment/shipping assets
```

## Important Routes

| Area | Routes |
| --- | --- |
| Public/customer | `/`, `/products`, `/products/:slug`, `/categories`, `/search`, `/cart`, `/cart/checkout`, `/upload-prescription` |
| Account | `/account`, `/account/orders`, `/account/prescriptions`, `/account/returns`, `/account/loyalty`, `/account/rewards`, `/account/wishlist` |
| HealthHub | `/health`, `/health/search`, `/health/checker`, `/health/article/:slug`, `/health-needs` |
| Community | `/community`, `/community/:roomId`, `/community/:roomId/t/:threadId`, `/community/video-events` |
| Pharmacist | `/pharmacist/dashboard`, `/pharmacist/prescriptions`, `/pharmacist/chat`, `/pharmacist/drug-database`, `/pharmacist/articles` |
| Admin | `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/prescriptions`, `/admin/community`, `/admin/video-events`, `/admin/moderation`, `/admin/coupons`, `/admin/loyalty` |

## Environment Variables

Create `.env.local` for local development.

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL used by the browser | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `replace-with-google-client-id` |
| `VITE_GOOGLE_REDIRECT_URI` | Backend OAuth callback URL | `http://localhost:8000/users/oauth/google` |
| `VITE_LIVEKIT_WS_URL` | LiveKit WebSocket URL for video events | `wss://livekit.example.com` |

Do not commit real production secrets or private OAuth credentials.

## Local Development

```bash
npm install
npm run dev
```

The React Router dev server runs on the port configured by the project, commonly `http://localhost:3001`.

The frontend expects the backend to be available at `VITE_API_URL`. For the full local stack, run the backend and Python services from their own repositories or use the backend Docker Compose stack.

## Build and Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Optional E2E commands:

```bash
npm run test:e2e
npm run test:product
npm run test:blog
```

## Docker Deployment

The Dockerfile builds the React Router client and serves static assets through Nginx.

```bash
docker build \
  --build-arg VITE_API_URL=https://api.example.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=replace-with-google-client-id \
  --build-arg VITE_GOOGLE_REDIRECT_URI=https://api.example.com/users/oauth/google \
  -t medispace-fe .

docker run -p 3000:80 medispace-fe
```

In production, this image is normally orchestrated from the backend repository's Docker Compose file together with backend, Redis, Typesense, OCR, ML, and Chat AI services.

## Current Integration Status

- Backend API integration is active through `src/services` and `src/lib/api`.
- Socket.IO chat integration is active through socket context/hooks and chat components.
- OCR upload flow is available through prescription upload screens and `/prescriptions/scan` API calls.
- Recommendation sections consume backend recommendation endpoints, which in turn call the ML service with fallbacks.
- LiveKit UI is wired for community video events when backend LiveKit credentials and `VITE_LIVEKIT_WS_URL` are configured.
- Admin/pharmacist/customer role-based screens exist in separate route groups.

## Notes for Maintainers

- Keep API response mapping in service files close to backend contract changes.
- When adding production-only variables, expose only `VITE_*` values needed by the browser.
- For UX changes in checkout, loyalty, prescription, or chat flows, verify both desktop and mobile layouts because these flows share account/admin/customer surfaces.
- Avoid hardcoded business rules in the UI when a backend config endpoint already exists, especially for loyalty and coupon behavior.
