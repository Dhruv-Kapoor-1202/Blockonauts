import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const engineSource = fileURLToPath(new URL('../packages/engine/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@commander/engine': engineSource } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    // The shared engine fixture resolves content files with `new URL(..., import.meta.url)`, which
    // Vite's web transform rewrites into an HTTP asset URL; the SSR transform leaves it alone.
    testTransformMode: { ssr: ['**/*.test.{ts,tsx}'] },
  },
});
