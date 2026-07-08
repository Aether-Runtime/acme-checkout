import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // The HTTP layer (src/app.ts, src/server.ts) is exercised end to end by the
      // Playwright suite, so unit coverage tracks the domain modules only.
      include: [
        'src/auth.ts',
        'src/checkout.ts',
        'src/payments.ts',
        'src/store.ts',
        'src/webhooks/**',
      ],
      reporter: ['text', 'lcov'],
    },
  },
});
