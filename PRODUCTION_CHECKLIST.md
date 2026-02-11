Updated:

# Production Readiness Checklist

## Infrastructure & Deployment

- [x] **Custom domain** — sitespace.com.au configured
- [x] **Production environment variables** — Set in Vercel
- [x] **Production backend URL** — Railway production
- [x] **SSL/HTTPS** — Vercel default
- [ ] **Database backups** — Automated daily backups on Railway
- [x] **Staging environment** — Backend done. Frontend too expensive on Vercel.
- [x] **Domain email** — Done
- [x] **Uptime monitoring** — Via Sentry

## Critical (Code)

- [x] **1. Remove secrets from git / add `.env.example`**
- [x] **2. CI/CD pipeline**
- [x] **3. Error boundaries**
- [x] **4. TypeScript interfaces / eliminate `any` types**
- [x] **5. AbortController on API fetches**

## Production Polish (Code)

- [x] **Custom 404 page**
- [x] **Open Graph + SEO metadata**
- [x] **Security headers**
- [x] **Loading states**
- [x] **PostHog reverse proxy** — Rewrites in next.config.ts route `/ingest/*` through own domain. Bypasses ad blockers.
- [x] **Image type declarations** — `src/types/images.d.ts` for .webp/.png/.jpg/.svg imports.

## High Priority (Code)

- [x] **6. Replace `alert()` / `confirm()`** — Replaced with Dialog components in BookingCardDropdown, assets page, BookingDetailDialog, calendar-views.
- [x] **7. Input validation on API routes** — Zod schema on signin, path traversal protection on proxy route.
- [x] **8. Refresh token rotation** — `/api/auth/refresh` now stores rotated refresh_token cookie.
- [x] **9. Hardcoded colors**

## Medium Priority (Code)

- [x] **10. CSRF protection** — Origin/Referer validation middleware on all state-changing `/api/*` requests. Combined with existing `sameSite: lax` cookies.
- [x] **11. Session timeout** — 30-min inactivity auto-logout in AuthContext. Throttled activity listeners (mousemove, keydown, scroll, touch).
- [ ] **12. Accessibility gaps**
- [x] **13. `crypto.getRandomValues()` for password generation** — Fixed in InviteSubForm.tsx.
- [ ] **14. Password strength on register**

## Non-Code

- [ ] **Privacy Policy page** — Required under Australian Privacy Act
- [ ] **Terms of Service page**
- [ ] **Cookie consent banner** — Required for PostHog session recording
- [ ] **Sentry alert rules** — Configure notifications
- [ ] **Support channel** — How users report issues
- [ ] **Final browser/mobile testing round**
- [ ] **Soft launch** — Invite real users, watch Sentry/PostHog, fix what breaks
