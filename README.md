# Sitespace

Your all-in-one site scheduling app. A construction logistics platform for managing bookings, assets, subcontractors, and live calendars across job sites.

Built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Pages & Routes](#pages--routes)
- [Authentication](#authentication)
- [API Proxy Layer](#api-proxy-layer)
- [Key Components](#key-components)
- [Scripts](#scripts)

---

## Features

**Booking Management**

- Create, reschedule, cancel, and track bookings across projects
- Status workflow: Pending → Confirmed → Completed (or Cancelled/Denied)
- Role-based actions (managers approve/deny, subcontractors request/withdraw)
- Booking history sidebar with status change timeline
- Search, filter by status tab, and paginate

**Live Multi-Calendar**

- Day view with hourly time grid across multiple assets simultaneously
- Asset filter sidebar with per-asset booking counts
- Drag-and-drop support via @dnd-kit
- Booking detail popup with inline actions (approve, cancel, reschedule, complete)
- Separate desktop and mobile calendar views
- Section-level error isolation on high-interaction surfaces

**Asset Management**

- Create, edit, and retire site assets (equipment, tools, vehicles)
- Status tracking: Available, In Use, Maintenance, Retired
- Maintenance mode with date ranges
- Sortable and searchable asset list

**Subcontractor Management**

- Invite subcontractors to projects with auto-generated temporary passwords
- Track company, trade specialty, contact info, and active status
- Admin/manager-only access control

**Dashboard**

- Personalized greeting with role badge
- Project switcher with persistence across sessions
- Quick-access stat cards (bookings, assets, subcontractors, calendar)
- Upcoming bookings grouped by month
- Today's schedule mini-calendar

**Authentication & Security**

- JWT-based auth with HTTP-only cookie storage (tokens never touch client JS)
- Automatic token refresh with rotation
- CSRF protection (Origin/Referer validation on all mutations)
- Auth abuse protection (rate limiting on sign-in and public forgot/reset flows)
- 30-minute inactivity session timeout
- Login, register, forgot password, and reset password flows
- Password strength indicator with visual feedback
- Reset/invite token query scrubbing and analytics URL sanitization
- Security headers including CSP + HSTS
- Proxy-based route protection

**General**

- Fully responsive (mobile-first with desktop/mobile component variants)
- SWR data fetching with shared cache, deduplication, and auto-revalidation
- Error boundaries at root and dashboard layout level
- Global API activity loading indicator for in-flight request feedback
- Landing page with hero, features, pricing, and testimonials

---

## Tech Stack

| Category        | Technology                                       |
| --------------- | ------------------------------------------------ |
| Framework       | Next.js 16 (App Router, Turbopack)               |
| Language        | TypeScript 5                                     |
| UI Library      | React 19                                         |
| Styling         | Tailwind CSS 4, CSS Variables (OKLch)            |
| Components      | Radix UI primitives, shadcn/ui (New York style)  |
| Data Fetching   | SWR                                              |
| HTTP Client     | Axios                                            |
| Icons           | Lucide React                                     |
| Dates           | date-fns                                         |
| Drag & Drop     | @dnd-kit                                         |
| Calendar        | react-day-picker + custom full-calendar          |
| Command Palette | cmdk                                             |
| Error Tracking  | Sentry                                           |
| Analytics       | PostHog (reverse-proxied), Vercel Speed Insights |
| Fonts           | Geist Sans & Geist Mono                          |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth route group (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── set-password/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Dashboard route group (with sidebar)
│   │   ├── home/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── multicalendar/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── subcontractors/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signin/route.ts    # Login → sets HTTP-only cookies
│   │   │   ├── me/route.ts        # Session validation + token refresh
│   │   │   ├── signout/route.ts   # Logout → clears cookies
│   │   │   └── refresh/route.ts   # Token refresh with rotation
│   │   ├── proxy/route.ts         # Universal backend proxy + public auth rate limiting
│   │   └── sentry-example-api/route.ts # Fault-injection route (disabled in production)
│   ├── context/
│   │   └── AuthContext.tsx         # Global auth state, session timeout
│   ├── layout.tsx                  # Root layout (AuthProvider, fonts)
│   ├── page.tsx                    # Landing page
│   └── unauthorized/page.tsx
├── components/
│   ├── bookings/                   # Booking list, cards, dropdowns, history
│   ├── multicalendar/              # Calendar views, asset filter, header
│   ├── forms/                      # Create/edit forms for bookings, assets, invites
│   ├── home/                       # Dashboard-specific components
│   ├── landing/                    # Landing page sections
│   ├── ui/                         # shadcn/ui components + custom full-calendar
│   ├── SideNav.tsx                 # Sidebar navigation
│   ├── TopNav.tsx                  # Top navigation bar
│   └── ProtectedRoute.tsx          # Route protection wrapper
├── lib/
│   ├── api.ts                      # Axios client with interceptors
│   ├── rateLimit.ts                # Shared in-memory API rate limiting utility
│   ├── swr.ts                      # Shared SWR fetcher and config
│   ├── bookingHelpers.ts           # Date/time formatting utilities
│   ├── multicalendarHelpers.ts     # Calendar view helpers
│   ├── data.ts                     # App data definitions
│   ├── landingData.ts              # Landing page content
│   └── utils.ts                    # cn() Tailwind class merge utility
├── types/
│   ├── index.ts                    # Shared TypeScript interfaces
│   └── images.d.ts                 # Image module declarations
└── proxy.ts                         # Auth + CSRF proxy
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (or 22+/24+)
- npm, yarn, pnpm, or bun

### Installation

```bash
git clone <repo-url>
cd Frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). Uses Turbopack for fast refresh.

### Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend API URL (required)
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api

# Frontend app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The backend is a Python API deployed on Railway. The `NEXT_PUBLIC_API_URL` should point to the `/api` base path of that service.

---

## Architecture

### Request Flow

```
Browser → Next.js Middleware (auth + CSRF check)
       → React Client Component
       → Axios Client (lib/api.ts)
       → Request Interceptor (rewrites URL to ?path= format)
       → /api/proxy (Next.js API Route)
       → Injects Authorization header from HTTP-only cookie
       → Python Backend API
       → Response flows back (with auto token refresh on 401)
```

### Why a Proxy?

All API calls route through `/api/proxy` instead of hitting the backend directly. This keeps JWT tokens in HTTP-only cookies (invisible to JavaScript, immune to XSS) while still attaching them to every backend request server-side.

### State Management

- **React Context** for authentication state (`AuthContext`)
- **Feature-local context** for callback/state de-drilling in booking and multicalendar interaction chains
- **SWR** for all server data (bookings, assets, subcontractors, projects, profile)
- **localStorage** only for project selection persistence
- No external state library (Redux, Zustand, etc.)

### Data Fetching

All dashboard pages use SWR with a shared config (`src/lib/swr.ts`):

- 5-minute background revalidation interval
- 30-second request deduplication
- Automatic revalidation on tab focus and network reconnection
- Shared cache across components (same key = same data)

---

## Pages & Routes

| Route              | Access        | Description                                          |
| ------------------ | ------------- | ---------------------------------------------------- |
| `/`                | Public        | Landing page (hero, features, pricing, testimonials) |
| `/login`           | Guest only    | Email/password login                                 |
| `/register`        | Guest only    | Account registration with password strength check    |
| `/forgot-password` | Guest only    | Request password reset email                         |
| `/reset-password`  | Guest only    | Set new password via token                           |
| `/set-password`    | Guest only    | Initial password setup (invited users)               |
| `/home`            | Authenticated | Dashboard with stats, upcoming bookings, schedule    |
| `/bookings`        | Authenticated | Booking list with search, tabs, pagination           |
| `/multicalendar`   | Authenticated | Live multi-asset calendar view                       |
| `/assets`          | Admin/Manager | Asset management (CRUD)                              |
| `/subcontractors`  | Admin/Manager | Subcontractor management and invitations             |

### Route Protection

`proxy.ts` handles route protection at the edge:

- Unauthenticated users on protected routes → redirect to `/login`
- Authenticated users on login/register → redirect to `/home`
- JWT expiration checked with 60-second buffer
- CSRF validation (Origin/Referer) on all state-changing `/api/*` requests via the same root middleware

---

## Authentication

### Token Lifecycle

1. **Login** — `POST /api/auth/signin` exchanges credentials for tokens, stored as HTTP-only cookies
   - Access token: 24-hour expiry
   - Refresh token: 7-day expiry
2. **Session check** — `GET /api/auth/me` validates the current session on app init
3. **Auto-refresh** — The proxy automatically refreshes expired access tokens using the refresh token. Both tokens are rotated.
4. **Session timeout** — 30 minutes of inactivity triggers automatic logout
5. **Logout** — `POST /api/auth/signout` clears cookies and session data

### Roles

| Role          | Capabilities                                            |
| ------------- | ------------------------------------------------------- |
| Admin         | Full access to all features                             |
| Manager       | Manage bookings, assets, subcontractors within projects |
| Subcontractor | View/request bookings, manage own bookings              |

---

## API Proxy Layer

All client-side API calls go through the Axios instance in `lib/api.ts`:

```typescript
// This call:
api.get("/bookings/my/upcoming")

// Becomes:
GET /api/proxy?path=/bookings/my/upcoming
```

The proxy at `/api/proxy/route.ts`:

1. Reads the `path` query parameter
2. Validates against path traversal attacks
3. Attaches the `Authorization: Bearer <token>` header from cookies
4. Forwards the request to the Python backend
5. On 401, attempts a token refresh and retries once
6. Returns the response with updated cookies if tokens were refreshed
7. Applies rate limiting on public password flows (`/auth/forgot-password`, `/auth/reset-password`)

**Public endpoints** (`/auth/forgot-password`, `/auth/reset-password`) bypass the auth check.

---

## Key Components

### Bookings

| Component               | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `BookingsPage`          | Main page orchestrator with search, tabs, pagination    |
| `BookingList`           | Renders booking cards with ref-based highlighting       |
| `BookingCardDesktop`    | Desktop booking card (memoized, grid layout)            |
| `BookingCardMobile`     | Mobile booking card (memoized, compact)                 |
| `BookingCardDropdown`   | Action menu (confirm, deny, cancel, reschedule, delete) |
| `BookingHistorySidebar` | Status change timeline (slide-in panel)                 |

### Multi-Calendar

| Component             | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `MulticalendarPage`   | Page layout with sidebar, calendar, and detail panel |
| `CalendarHeader`      | Date navigation, asset selector, controls            |
| `DesktopView`         | Multi-asset hourly time grid with drag-and-drop      |
| `MobileView`          | Single-asset calendar for small screens              |
| `AssetFilter`         | Checkbox list to toggle asset visibility             |
| `BookingDetailDialog` | Booking popup with inline status actions             |

### Forms

| Form                    | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `CreateBookingForm`     | New booking with asset, date, time, subcontractor (useReducer-based) |
| `RescheduleBookingForm` | Change date/time of existing booking                                 |
| `CreateAssetForm`       | New asset with type, code, description                               |
| `UpdateAssetForm`       | Edit asset details, toggle maintenance mode                          |
| `InviteSubForm`         | Invite subcontractor with crypto-secure generated password           |

### Navigation

| Component | Purpose                                               |
| --------- | ----------------------------------------------------- |
| `SideNav` | Fixed sidebar with role-based menu items, collapsible |
| `TopNav`  | Top bar with search, project context, user menu       |

---

## Scripts

| Script     | Command              | Description                     |
| ---------- | -------------------- | ------------------------------- |
| Dev        | `npm run dev`        | Start dev server with Turbopack |
| Build      | `npm run build`      | Production build                |
| Start      | `npm start`          | Start production server         |
| Lint       | `npm run lint`       | Run ESLint                      |
| Test       | `npm test`           | Run Vitest test suite           |
| Test Watch | `npm run test:watch` | Run Vitest in watch mode        |
