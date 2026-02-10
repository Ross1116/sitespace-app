# Production Readiness Checklist

## Critical

- [x] **1. Remove secrets from git / add `.env.example`** — `.env` was never committed. Created `.env.example` with placeholder values, added `!.env.example` exception to `.gitignore`.
- [x] **2. CI/CD pipeline** — Vercel handles builds. Added `tsc --noEmit` to build script so type errors fail the deploy.
- [x] **3. Error boundaries** — Added `error.tsx` for `(dashboard)` and `(auth)` route groups. Both report to Sentry with retry UI. `global-error.tsx` already existed.
- [ ] **4. TypeScript interfaces / eliminate `any` types** — Create shared `src/types/` directory, replace `any` throughout.
- [ ] **5. AbortController on API fetches** — Add cleanup to `useEffect` hooks making API calls.

## High Priority

- [ ] **6. Replace `alert()` / `confirm()`** — Use existing `AlertDialog` component in `BookingCardDropdown.tsx`.
- [ ] **7. Input validation on API routes** — Add Zod schemas to `signin`, `refresh` routes.
- [ ] **8. Refresh token rotation** — `/api/auth/refresh` should store new refresh token from backend.
- [ ] **9. Hardcoded colors** — Replace hex values with CSS variables from `globals.css`.

## Medium Priority

- [ ] **10. CSRF protection** — Add Origin header checking on POST endpoints.
- [ ] **11. Session timeout** — Auto-logout after extended inactivity.
- [ ] **12. Accessibility gaps** — `aria-label` on icon buttons, semantic HTML, keyboard nav.
- [ ] **13. `Math.random()` → `crypto.getRandomValues()`** — Fix password generation in `InviteSubForm.tsx`.
- [ ] **14. Password strength on register** — Add complexity requirements matching reset-password page.
