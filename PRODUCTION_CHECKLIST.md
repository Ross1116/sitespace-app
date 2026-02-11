# Production Readiness Checklist

## Done

- [x] **Infrastructure** — Custom domain (sitespace.com.au), Vercel deployment, Railway backend, SSL, CI/CD, domain email, Sentry uptime monitoring, staging backend
- [x] **Security** — CSRF protection, refresh token rotation, session timeout (30-min inactivity), input validation (Zod + path traversal), HTTPS-only cookies, secrets out of git
- [x] **Data fetching** — SWR across all pages (Bookings, Assets, Subcontractors, Home, Multicalendar, CreateBookingForm). Shared cache, request deduplication, auto-revalidation. Replaced all manual fetch/cache/localStorage patterns.
- [x] **Error handling** — Error boundaries, Dialog components (replaced all native `alert()`/`confirm()`), loading states, custom 404
- [x] **TypeScript** — Eliminated `any` types, proper interfaces throughout
- [x] **SEO & analytics** — Open Graph metadata, security headers, PostHog reverse proxy (bypasses ad blockers)
- [x] **Auth UX** — Password strength validation on register, secure random generation for invites
- [x] **Accessibility** — aria-labels on icon buttons, keyboard navigation, input labels, contrast fixes
- [x] **Performance** — React.memo on list cards, passive event listeners, AbortController on fetches

## Remaining

- [ ] **Database backups** — Need automated daily backups on Railway
- [ ] **Legal pages** — Privacy Policy (required under Australian Privacy Act) + Terms of Service
- [ ] **Cookie consent banner** — Required for PostHog session recording
- [ ] **Sentry alert rules** — Configure error/performance notifications
- [ ] **Support channel** — How users report issues
- [ ] **Final testing round** — Cross-browser + mobile testing
- [ ] **Soft launch** — Invite real users, monitor Sentry/PostHog, fix what breaks
