import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Runs the a11y tests that ship inside each item. The `@/...` aliases mirror the
 * import paths a consumer gets after `ibirdui add`, so the tests exercise the exact
 * files we publish.
 */
const itemFile = (p: string) => fileURLToPath(new URL(`./items/${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@/lib/async-state': itemFile('async-state/files/async-state.ts'),
      '@/hooks/use-async': itemFile('use-async/files/use-async.ts'),
      '@/components/async-button': itemFile('async-button/files/async-button.tsx'),
      '@/components/state-boundary': itemFile('state-boundary/files/state-boundary.tsx'),
      '@/components/data-list': itemFile('data-list/files/data-list.tsx'),
      '@/components/data-table': itemFile('data-table/files/data-table.tsx'),
      '@/components/async-combobox': itemFile('async-combobox/files/async-combobox.tsx'),
    },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['items/**/tests/**/*.test.{ts,tsx}'],
  },
});
