End-to-end tests (Playwright)

Install deps & Playwright browsers:

1) npm install --save-dev @playwright/test
2) npx playwright install

Run tests:

npm run test:e2e

Notes:
- Ensure the dev server is running (npm run dev) on http://localhost:3000 or set BASE_URL env.
- Tests will create and delete test RSVPs via the API and assert the duplicate prompt UI flows.
- If you prefer Headed mode, set `headless: false` in `playwright.config.ts` or run interactively.
