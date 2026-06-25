'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

/** First / last / current ± siblingCount, with ellipses standing in for the gaps. */
function getPageItems(page: number, pageCount: number, siblingCount: number): PageItem[] {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, two ellipses
  if (totalNumbers >= pageCount) return range(1, pageCount);

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, pageCount);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < pageCount - 2;
  const edgeCount = 3 + 2 * siblingCount;

  if (!showLeftDots && showRightDots) {
    return [...range(1, edgeCount), 'end-ellipsis', pageCount];
  }
  if (showLeftDots && !showRightDots) {
    return [1, 'start-ellipsis', ...range(pageCount - edgeCount + 1, pageCount)];
  }
  return [1, 'start-ellipsis', ...range(leftSibling, rightSibling), 'end-ellipsis', pageCount];
}

const ARROW_CLS =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Requested a new page (already clamped to 1..pageCount). */
  onPageChange: (page: number) => void;
  /** Neighbours shown either side of the current page. Default 1. */
  siblingCount?: number;
  /** Disable every control, e.g. while the next page loads. */
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * A numbered pager over a known page count: Previous / Next plus page buttons
 * with ellipses for the gaps. Rendered as a labelled `<nav>`; the current page
 * carries `aria-current="page"`, and the page change is announced through a
 * polite live region.
 *
 *   <Pagination page={page} pageCount={pages} onPageChange={setPage} />
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  disabled = false,
  label = 'Pagination',
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const items = getPageItems(page, pageCount, siblingCount);
  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), pageCount);
    if (next !== page) onPageChange(next);
  };

  return (
    <nav aria-label={label} className={cn('flex items-center gap-1', className)}>
      {/* Polite live region: announced, not seen. */}
      <span role="status" aria-live="polite" className="sr-only">
        Page {page} of {pageCount}
      </span>

      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={ARROW_CLS}
      >
        ‹
      </button>

      <ul className="flex items-center gap-1">
        {items.map((item) => {
          if (item === 'start-ellipsis' || item === 'end-ellipsis') {
            return (
              <li key={item} aria-hidden="true" className="px-2 text-sm text-muted-foreground">
                …
              </li>
            );
          }
          const isCurrent = item === page;
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => go(item)}
                disabled={disabled}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                  isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {item}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={disabled || page >= pageCount}
        aria-label="Next page"
        className={ARROW_CLS}
      >
        ›
      </button>
    </nav>
  );
}

export interface LoadMoreProps {
  /** Load the next batch. */
  onLoadMore: () => void;
  /** Whether a load is in flight — disables the button and shows a spinner. */
  loading?: boolean;
  /** Whether there's another batch to load. When false, nothing renders. */
  hasMore?: boolean;
  /** Button text. Default "Load more". */
  label?: string;
  /** Announced while loading. Default "Loading more…". */
  loadingLabel?: string;
  className?: string;
}

/**
 * The "Load more" companion to {@link Pagination} for append-style lists: a
 * single button that owns its busy state. While `loading`, it disables itself,
 * sets `aria-busy`, shows a spinner and announces progress; when `hasMore` is
 * false it renders nothing.
 *
 *   <LoadMore onLoadMore={fetchNext} loading={loading} hasMore={hasMore} />
 */
export function LoadMore({
  onLoadMore,
  loading = false,
  hasMore = true,
  label = 'Load more',
  loadingLabel = 'Loading more…',
  className,
}: LoadMoreProps) {
  if (!hasMore) return null;
  return (
    <button
      type="button"
      onClick={onLoadMore}
      disabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {loading && (
        <svg
          aria-hidden="true"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          className="motion-safe:animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {label}
      {/* Polite live region: announced, not seen. */}
      <span role="status" aria-live="polite" className="sr-only">
        {loading ? loadingLabel : ''}
      </span>
    </button>
  );
}
