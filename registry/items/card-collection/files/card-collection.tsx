'use client';

import { Skeleton } from '@/components/skeleton';
import { StateBoundary } from '@/components/state-boundary';
import type { AsyncState } from '@/lib/async-state';
import type * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface CardCollectionProps<T> {
  /** The grid data as an async state — wire it straight from your fetcher. */
  state: AsyncState<T[]>;
  /** Render a single card. */
  children: (item: T, index: number) => React.ReactNode;
  /** Stable key for each card. */
  getKey: (item: T, index: number) => React.Key;
  /** Accessible name for the collection. */
  label: string;
  /** Number of columns. Default 3. */
  columns?: number;
  /** Number of skeleton cards shown while loading. Default 6. */
  skeletonCount?: number;
  /** Custom empty-state content. */
  empty?: React.ReactNode;
  className?: string;
}

/**
 * A gallery of cards that is "state-complete" by construction: loading skeletons
 * shaped like cards, a dedicated empty slot, error + retry, and a screen-reader
 * announcement of the result count — all handled by the StateBoundary primitive.
 * You only ever write the happy-path card.
 *
 *   <CardCollection state={photos} label="Photos" getKey={(p) => p.id}>
 *     {(p) => <PhotoCard photo={p} />}
 *   </CardCollection>
 */
export function CardCollection<T>({
  state,
  children,
  getKey,
  label,
  columns = 3,
  skeletonCount = 6,
  empty,
  className,
}: CardCollectionProps<T>) {
  const count = state.status === 'success' ? state.data.length : 0;
  const gridStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };

  return (
    <StateBoundary
      state={state}
      labels={{
        success: `${count} ${count === 1 ? 'result' : 'results'}`,
        empty: `No ${label.toLowerCase()}`,
      }}
      loading={<SkeletonCards count={skeletonCount} style={gridStyle} />}
      empty={empty}
    >
      {(items) => (
        <ul aria-label={label} className={cn('grid gap-4', className)} style={gridStyle}>
          {items.map((item, index) => (
            <li key={getKey(item, index)}>{children(item, index)}</li>
          ))}
        </ul>
      )}
    </StateBoundary>
  );
}

function SkeletonCards({ count, style }: { count: number; style: React.CSSProperties }) {
  return (
    <ul className="grid gap-4" style={style} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
        <li key={i}>
          <Skeleton className="h-40 w-full rounded-lg" />
        </li>
      ))}
    </ul>
  );
}
