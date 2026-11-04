/**
 * Vitest setup: registers the jest-dom matchers, restores Node's `URL` (the shared content fixture
 * resolves files with `fileURLToPath(new URL(...))`, which rejects jsdom's URL class), and cleans
 * the DOM, storage and document classes between tests so every test starts from a blank page.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { URL as NodeURL } from 'node:url';
import { afterEach } from 'vitest';

globalThis.URL = NodeURL as unknown as typeof URL;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.className = '';
  window.history.replaceState(null, '', '/');
});
