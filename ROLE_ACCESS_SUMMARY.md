# Role & Access Summary

## 1) Role access to pages

- **All authenticated roles**: `/home`, `/bookings`, `/multicalendar`.
- **Admin + Manager**: `/assets`, `/subcontractors` (visible in sidebar).
- **Subcontractor**:
  - Assets/Subcontractors are hidden in sidebar.
  - Home quick-access hides the `Subcontractor` card.
  - Direct navigation to `/assets` and `/subcontractors` is blocked at page level and redirected to `/home`.

## 2) Unauthenticated pages

- Public: `/`, `/sentry-example-page`.
- Auth flow pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/set-password`.
- Dashboard routes require auth session (`/(dashboard)` guarded by middleware + dashboard layout redirect).
- Note: role-specific blocking is currently enforced at page/UI level (not centrally in middleware).

## 3) Role powers

- **Admin / Manager**
  - Confirm / deny / cancel / complete / reschedule bookings.
  - See warning when confirming a booking that auto-denies competing pending requests.
  - Can assign subcontractor during booking creation.
  - Can invite subcontractors.
  - Can manage assets (create/update/delete UI paths).
- **Subcontractor**
  - Creates booking requests as **pending**.
  - Can reschedule/cancel/delete their own bookings based on status.
  - Can reschedule denied bookings (own booking).
  - Cannot invite subcontractors or assign bookings to other subs.
