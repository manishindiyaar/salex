import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@salex/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
  test: {
    setupFiles: ['./src/test/setup-env.ts'],
  },
});
