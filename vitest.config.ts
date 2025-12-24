import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}','src/**/__tests__/**/*.test.{ts,tsx}'],
  },
});
