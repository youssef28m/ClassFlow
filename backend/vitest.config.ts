import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://classflow:classflow@localhost:5432/classflow_test',
      JWT_SECRET: 'test-only-secret-0123456789abcdef0123456789abcdef',
      JWT_REFRESH_SECRET: 'test-only-refresh-secret-0123456789abcdef012345',
    },
  },
});
