'use client';

import { Skeleton } from '@/components/skeleton';
import { StateBoundary } from '@/components/state-boundary';
import type { AsyncState } from '@/lib/async-state';
import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface InfiniteListProps<T> {
  /**
   * The accumulated items as an async state — the first load drives the
   * loading / empty / error states; `state.data` is the full list so far.
   */
  state: AsyncState<T[]>;
  /** Render a single row. */
  children: (item: T, index: number) => React.ReactNode;
  /** Stable key for each row. */
  getKey: (item: T, index: number) => React.Key;
  /** Accessible name for the list. */
  label: string;
  /** Load the next page. Fired when the sentinel scrolls into view. */
  onLoadMore: () => void;
  /** Whether another page exists. When false, the sentinel is removed. Default true. */
  hasMore?: boolean;
  /** Whether a next page is currently loading — shows the footer and announces it. */
  loadingMore?: boolean;
  /** How far ahead of the viewport to start loading. Default "200px". */
  rootMargin?: string;
  /** Number of skeleton rows shown during the first load. Default 5. */
  skeletonCount?: number;
  /** Custom empty-state content. */
  empty?: React.ReactNode;
  /** Shown once everything is loaded (hasMore is false). */
  endMessage?: React.ReactNode;
  className?: string;
}

/**
 * A list that loads the next page on its own as you scroll. The first load runs
 * through the StateBoundary primitive (skeletons, empty slot, error + retry,
 * result-count announcement); after that, an off-screen sentinel triggers
 * `onLoadMore` before you hit the bottom, with a "loading more" footer that's
 * announced to screen readers.
 *
 *   <InfiniteList state={feed} label="Posts" getKey={(p) => p.id}
 *     onLoadMore={fetchNext} hasMore={cursor != null} loadingMore={loading}>
 *     {(post) => <PostRow post={post} />}
 *   </InfiniteList>
 *
 * You accumulate the pages (so `state.data` is the full list); this component
 * owns when to ask for the next one and how to present it.
 */
export function InfiniteList<T>({
  state,
  children,
  getKey,
  label,
  onLoadMore,
  hasMore = true,
  loadingMore = false,
  rootMargin = '200px',
  skeletonCount = 5,
  empty,
  endMessage,
  className,
}: InfiniteListProps<T>) {
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
        <div className={cn('flex flex-col', className)}>
          <ul aria-label={label} aria-busy={loadingMore || undefined} className="divide-y rounded-md border">
            {items.map((item, index) => (
              <li key={getKey(item, index)} className="px-4 py-3">
                {children(item, index)}
              </li>
            ))}
          </ul>

          {/* Mounts only when there's more to fetch and nothing is in flight, so
              a fresh page chains into the next load if the sentinel stays in view. */}
          {hasMore && !loadingMore && <Sentinel onVisible={onLoadMore} rootMargin={rootMargin} />}

          {loadingMore && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
            >
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                className="motion-safe:animate-spin"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Loading more…
            </div>
          )}

          {!hasMore && endMessage && (
            <p className="py-4 text-center text-sm text-muted-foreground">{endMessage}</p>
          )}
        </div>
      )}
    </StateBoundary>
  );
}

/** An off-screen marker that calls `onVisible` whenever it enters the viewport. */
function Sentinel({ onVisible, rootMargin }: { onVisible: () => void; rootMargin?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const cb = React.useRef(onVisible);
  cb.current = onVisible;

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cb.current();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={ref} aria-hidden="true" className="h-px w-full" />;
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="divide-y rounded-md border" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
        <li key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}
