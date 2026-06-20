'use client';

import { StateBoundary } from '@/components/state-boundary';
import type { AsyncState } from '@/lib/async-state';
import type * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface DataListProps<T> {
  /** The list data as an async state — wire it straight from your fetcher. */
  state: AsyncState<T[]>;
  /** Render a single row. */
  children: (item: T, index: number) => React.ReactNode;
  /** Stable key for each row. */
  getKey: (item: T, index: number) => React.Key;
  /** Accessible name for the list. */
  label: string;
  /** Number of skeleton rows shown while loading. */
  skeletonCount?: number;
  /** Custom empty-state content. */
  empty?: React.ReactNode;
  className?: string;
}

/**
 * A list that is "state-complete" by construction: loading skeletons shaped like
 * real rows, a dedicated empty slot, error + retry, and a screen-reader
 * announcement of the result count — all handled by the StateBoundary primitive.
 * You only ever write the happy-path row.
 */
export function DataList<T>({
  state,
  children,
  getKey,
  label,
  skeletonCount = 3,
  empty,
  className,
}: DataListProps<T>) {
  const count = state.status === 'success' ? state.data.length : 0;

  return (
    <StateBoundary
      state={state}
      labels={{
        success: `${count} ${count === 1 ? 'result' : 'results'}`,
        empty: `No ${label.toLowerCase()}`,
      }}
      loading={<SkeletonRows count={skeletonCount} />}
      empty={empty}
    >
      {(items) => (
        <ul aria-label={label} className={cn('divide-y rounded-md border', className)}>
          {items.map((item, index) => (
            <li key={getKey(item, index)} className="px-4 py-3">
              {children(item, index)}
            </li>
          ))}
        </ul>
      )}
    </StateBoundary>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="divide-y rounded-md border" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
        <li key={i} className="px-4 py-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}
