import { defineConfig } from 'vitest/config';

// Standalone Vitest config (kept separate from the Vite build config). The unit
// suite targets the pure utility modules, so a Node environment is sufficient.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
