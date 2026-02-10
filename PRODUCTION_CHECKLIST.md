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
- [ ] **4. TypeScript interfaces / eliminate `any` types**
- [ ] **5. AbortController on API fetches**

## Production Polish (Code)

- [x] **Custom 404 page**
- [x] **Open Graph + SEO metadata**
- [x] **Security headers**
- [x] **Loading states**
- [x] **PostHog reverse proxy** — Rewrites in next.config.ts route `/ingest/*` through own domain. Bypasses ad blockers.
- [x] **Image type declarations** — `src/types/images.d.ts` for .webp/.png/.jpg/.svg imports.

## High Priority (Code)

- [x] **6. Replace `alert()` / `confirm()`** — Replaced with Dialog components in BookingCardDropdown, assets page, BookingDetailDialog, calendar-views.
- [ ] **7. Input validation on API routes**
- [ ] **8. Refresh token rotation**
- [ ] **9. Hardcoded colors**

## Medium Priority (Code)

- [ ] **10. CSRF protection**
- [ ] **11. Session timeout**
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
