# Admin Guide

This document explains the **Admin** features (Audit Logs, Add Guest modal, CSV export, rate limits) and how to run tests and capture screenshots for documentation.

## Quick access
- Admin page: `GET /admin` (open in browser while running the dev server).

---

## Audit Logs Viewer 🔎

What it shows:
- Paginated list of admin actions with time, admin email, action, target table/id, IP, device-id and a "View" button for Before/After JSON.

How to use:
1. Click **Open audit logs** on the Admin page.
2. Use the **Filter admin email** and **Filter action** inputs to narrow results, then click **Filter**.
3. Click **View** on a row to open a detail modal with `before` and `after` JSON.

Screenshot: `docs/screenshots/admin-audit-logs.png` (capture: show filters filled + detail modal open)

Notes:
- If fetch fails, a short alert is shown.
- Pagination uses `limit` and `offset` query params; the UI shows "Showing X of Y logs".

---

## Add Guest Modal ➕

Purpose: Add a guest to an existing RSVP from the Admin page.

How to use:
1. While logged into Admin, find the RSVP and click **Add guest**.
2. The modal focuses the **First name** input and supports keyboard navigation (Tab). Use **Save** to submit.
3. Validation:
   - First/last name are required.
   - Names capped at 64 characters.
4. On success, the modal closes and the RSVP list updates.

Screenshot: `docs/screenshots/add-guest-modal.png` (capture: modal open with filled values)

Troubleshooting:
- If the save fails, an inline error message is shown in the modal and it remains open.

Planned UX polish (already scheduled): focus trap, Escape-to-close, subtle open/close animation, and improved validation messages.

---

## Export CSV & Email backup 📤

- Use **Export CSV** to download a CSV with current filter options; the download triggers via a blob link.
- Use **Send backup (email)** to queue an email with the CSV attached.

Troubleshooting:
- If the server responds with an error, an alert is shown containing the server message.

Screenshot: `docs/screenshots/export-csv.png` (capture: filters set, Export CSV clicked)

---

## Reset Rate Limits ⚠️

- Enter an email in the input to reset/view rate limits for that email.
- Leave the input blank and confirm to clear ALL rate limits (dangerous).
- "View rate limits" will show an alert with the returned rate-limit data.

Screenshot: `docs/screenshots/reset-rate-limits.png` (capture: example email and results alert)

---

## Running tests (local) 🧪

Unit tests (Vitest):

```
npm run test:unit
```

Playwright E2E tests:

```
npx playwright test
# or if configured in package.json
npm run test:e2e
```

Notes for E2E reliability:
- Tests set a unique `x-device-id` header to avoid device-level rate limits in the suite.
- The Playwright config uses `webServer` to start the app automatically during test runs.

---

## How to capture screenshots for docs
1. Start the dev server: `npm run dev`.
2. Open the Admin page (`/admin`).
3. Reproduce the UI state (modal open, audit detail open, filters set).
4. Take a screenshot using your OS or the browser's devtools.
5. Save the file to `docs/screenshots/` with the suggested filename (see placeholders above).
6. Commit the file and update the screenshot references here if needed.

---

## Misc notes
- Admin APIs require the admin `password` (entered on the Admin page). Keep this secret.
- For automation, tests set unique `__device_id` values in `localStorage` to avoid hitting layered rate limits during tests.

---

## Next steps (UX polish)
Planned improvements to start next:
- Add focus trap and Escape-to-close to the Add Guest modal.
- Improve keyboard accessibility and ARIA roles for critical admin controls.
- Add subtle open/close animations and success toasts for actions such as "Guest added".

---

If you'd like, I can create the screenshot images now (using a headless browser capture) or you can capture them on your machine and I'll wire them into the docs. Let me know which you prefer.
