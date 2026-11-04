import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const engineSource = fileURLToPath(new URL('../packages/engine/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@commander/engine': engineSource } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: { target: 'es2022' },
});
