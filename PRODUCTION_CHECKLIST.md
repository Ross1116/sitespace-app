# Production Readiness Checklist

## Infrastructure & Deployment

- [x] **Custom domain** — sitespace.com.au configured
- [x] **Production environment variables** — Set in Vercel
- [x] **Production backend URL** — Railway production
- [x] **SSL/HTTPS** — Vercel default

## Critical (Code)

- [x] **1. Remove secrets from git / add `.env.example`** — `.env` was never committed. Created `.env.example` with placeholder values, added `!.env.example` exception to `.gitignore`.
- [x] **2. CI/CD pipeline** — Vercel handles builds. Added `tsc --noEmit` to build script so type errors fail the deploy.
- [x] **3. Error boundaries** — Added `error.tsx` for `(dashboard)` and `(auth)` route groups. Both report to Sentry with retry UI. `global-error.tsx` already existed.
- [ ] **4. TypeScript interfaces / eliminate `any` types** — Create shared `src/types/` directory, replace `any` throughout.
- [ ] **5. AbortController on API fetches** — Add cleanup to `useEffect` hooks making API calls.

## Production Polish (Code)

- [x] **Custom 404 page** — `src/app/not-found.tsx` with link back to dashboard.
- [x] **Open Graph + SEO metadata** — OG tags, Twitter card, title template in `layout.tsx`.
- [x] **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` in `next.config.ts`.
- [x] **Loading states** — `loading.tsx` for `(dashboard)` and `(auth)` route groups for smooth route transitions.

## High Priority (Code)

- [ ] **6. Replace `alert()` / `confirm()`** — Use existing `AlertDialog` component in `BookingCardDropdown.tsx`.
- [ ] **7. Input validation on API routes** — Add Zod schemas to `signin`, `refresh` routes.
- [ ] **8. Refresh token rotation** — `/api/auth/refresh` should store new refresh token from backend.
- [ ] **9. Hardcoded colors** — Replace hex values with CSS variables from `globals.css`.

## Medium Priority (Code)

- [ ] **10. CSRF protection** — Add Origin header checking on POST endpoints.
- [ ] **11. Session timeout** — Auto-logout after extended inactivity.
- [ ] **12. Accessibility gaps** — `aria-label` on icon buttons, semantic HTML, keyboard nav.
- [ ] **13. `Math.random()` → `crypto.getRandomValues()`** — Fix password generation in `InviteSubForm.tsx`.
- [ ] **14. Password strength on register** — Add complexity requirements matching reset-password page.

## Non-Code

- [ ] **Privacy Policy page** — Required for PostHog/session recording (EU/GDPR).
- [ ] **Terms of Service page**
- [ ] **Cookie consent banner** — Required for PostHog session recording in EU/UK.
- [ ] **Sentry alert rules** — Configure notifications so errors don't go unnoticed.
- [ ] **Uptime monitoring** — BetterUptime, Vercel checks, or similar.
