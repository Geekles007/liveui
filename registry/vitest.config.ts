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
      '@/hooks/use-online': itemFile('use-online/files/use-online.ts'),
      '@/hooks/use-optimistic-list': itemFile('use-optimistic-list/files/use-optimistic-list.ts'),
      '@/components/async-button': itemFile('async-button/files/async-button.tsx'),
      '@/components/skeleton': itemFile('skeleton/files/skeleton.tsx'),
      '@/components/state-boundary': itemFile('state-boundary/files/state-boundary.tsx'),
      '@/components/empty-state': itemFile('empty-state/files/empty-state.tsx'),
      '@/components/error-state': itemFile('error-state/files/error-state.tsx'),
      '@/components/avatar': itemFile('avatar/files/avatar.tsx'),
      '@/components/data-list': itemFile('data-list/files/data-list.tsx'),
      '@/components/data-table': itemFile('data-table/files/data-table.tsx'),
      '@/components/card-collection': itemFile('card-collection/files/card-collection.tsx'),
      '@/components/detail-view': itemFile('detail-view/files/detail-view.tsx'),
      '@/components/async-combobox': itemFile('async-combobox/files/async-combobox.tsx'),
      '@/components/command-palette': itemFile('command-palette/files/command-palette.tsx'),
      '@/components/file-upload': itemFile('file-upload/files/file-upload.tsx'),
      '@/components/toast': itemFile('toast/files/toast.tsx'),
      '@/components/confirm-dialog': itemFile('confirm-dialog/files/confirm-dialog.tsx'),
      '@/components/sheet': itemFile('sheet/files/sheet.tsx'),
      '@/components/pagination': itemFile('pagination/files/pagination.tsx'),
      '@/components/infinite-list': itemFile('infinite-list/files/infinite-list.tsx'),
      '@/components/tabs': itemFile('tabs/files/tabs.tsx'),
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
