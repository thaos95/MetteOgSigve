End-to-end tests (Playwright)

Install deps & Playwright browsers:

- Option A (recommended): run the setup script (installs dev deps and browsers):

  npm run test:e2e:setup

- Option B: manually install dev dependency and browsers:

  npm install --save-dev @playwright/test
  npx playwright install --with-deps

Run tests:

npm run test:e2e

Run the modal test only:

npm run test:e2e:modal

Run a single test file (useful when developing):

npx playwright test tests/audit-logs.spec.ts

Run a single test by title (focused):

npx playwright test -g "audit logs modal displays recent admin actions and detail view"

Notes:
- Ensure the dev server is running (npm run dev) on http://localhost:3000 or set BASE_URL env.
- Tests will create and delete test RSVPs via the API and assert the duplicate prompt UI flows.
- Required env vars: `BASE_URL` (if not localhost:3000), `ADMIN_PASSWORD` (for admin actions), and `POSTGRES_URL` (if your DB is not available locally as default); set additional test secrets in your environment as needed.
- If you prefer Headed mode, set `headless: false` in `playwright.config.ts` or run interactively.
