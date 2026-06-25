'use client';

import { Skeleton, SkeletonText } from '@/components/skeleton';
import { StateBoundary } from '@/components/state-boundary';
import type { AsyncState } from '@/lib/async-state';
import type * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface DetailViewProps<T> {
  /**
   * The record as an async state. The `empty` status reads as "not found" — map
   * a missing record to it (e.g. `data ? success(data) : empty()`).
   */
  state: AsyncState<T>;
  /** Render the resolved record. Only called in the success state. */
  children: (data: T) => React.ReactNode;
  /** Accessible name for the region, and the noun used in announcements. */
  label: string;
  /** Custom loading content. Defaults to a title + paragraph skeleton. */
  loading?: React.ReactNode;
  /** Custom not-found content for the empty status. */
  notFound?: React.ReactNode;
  className?: string;
}

/**
 * A single-record view that is "state-complete" by construction: a skeleton
 * while it loads, a not-found panel when the record is missing, error + retry,
 * and screen-reader announcements — all via the StateBoundary primitive. You
 * only ever write the resolved record.
 *
 *   <DetailView state={order} label="Order">
 *     {(o) => <OrderSummary order={o} />}
 *   </DetailView>
 *
 * Treats the `empty` status as "not found", so a missing record gets a clear,
 * announced panel instead of a blank screen.
 */
export function DetailView<T>({
  state,
  children,
  label,
  loading,
  notFound,
  className,
}: DetailViewProps<T>) {
  return (
    <StateBoundary
      state={state}
      labels={{ success: `${label} loaded`, empty: `${label} not found` }}
      loading={loading ?? <DetailSkeleton />}
      empty={notFound ?? <NotFound label={label} />}
    >
      {(data) => (
        <section aria-label={label} className={cn('space-y-4', className)}>
          {children(data)}
        </section>
      )}
    </StateBoundary>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-7 w-1/2" />
      <SkeletonText lines={4} />
    </div>
  );
}

function NotFound({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {label} not found.
    </div>
  );
}
