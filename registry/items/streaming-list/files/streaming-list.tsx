'use client';

import { StateBoundary } from '@/components/state-boundary';
import type { AsyncState } from '@/lib/async-state';
import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface StreamingListProps<T> {
  /** The live buffer as an async state — wire it from `useStream`. */
  state: AsyncState<T[]>;
  /** Render a single row. */
  children: (item: T, index: number) => React.ReactNode;
  /** Stable key for each row. */
  getKey: (item: T, index: number) => React.Key;
  /** Accessible name for the list. */
  label: string;
  /** Render newest items first (prepend as they arrive). Default false. */
  newestFirst?: boolean;
  /** Number of skeleton rows shown while connecting. */
  skeletonCount?: number;
  /** Custom empty-state content (shown when the stream closes with nothing). */
  empty?: React.ReactNode;
  className?: string;
}

/**
 * A list that fills in live as values stream in — the same state-complete
 * behaviour as `data-list` (skeletons while connecting, a dedicated empty slot,
 * error + retry), but built for data that arrives over time. As new rows land it
 * politely announces "N new items" to screen readers, so assistive-tech users
 * hear the feed move without it stealing focus.
 *
 *   const feed = useStream<Event>(subscribe);
 *   <StreamingList state={feed.state} label="Activity" getKey={(e) => e.id}>
 *     {(event) => <EventRow event={event} />}
 *   </StreamingList>
 */
export function StreamingList<T>({
  state,
  children,
  getKey,
  label,
  newestFirst = false,
  skeletonCount = 3,
  empty,
  className,
}: StreamingListProps<T>) {
  const [announce, setAnnounce] = React.useState('');
  const prevCount = React.useRef(0);

  // Announce the first batch as a count, then each later arrival as a delta.
  React.useEffect(() => {
    if (state.status !== 'success') {
      prevCount.current = 0;
      return;
    }
    const count = state.data.length;
    if (prevCount.current === 0) {
      setAnnounce(`${count} ${count === 1 ? 'item' : 'items'}`);
    } else if (count > prevCount.current) {
      const delta = count - prevCount.current;
      setAnnounce(`${delta} new ${delta === 1 ? 'item' : 'items'}`);
    }
    prevCount.current = count;
  }, [state]);

  // The announcement rides StateBoundary's own polite live region (as the
  // success label) so the feed's movement — "N items", then "M new items" — is
  // spoken without a second, competing live region.
  return (
    <StateBoundary
      state={state}
      labels={{ success: announce, empty: `No ${label.toLowerCase()}` }}
      loading={<SkeletonRows count={skeletonCount} />}
      empty={empty}
    >
      {(items) => {
        const ordered = newestFirst ? [...items].reverse() : items;
        return (
          <ul aria-label={label} className={cn('divide-y rounded-md border', className)}>
            {ordered.map((item, index) => (
              <li key={getKey(item, index)} className="px-4 py-3">
                {children(item, index)}
              </li>
            ))}
          </ul>
        );
      }}
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
