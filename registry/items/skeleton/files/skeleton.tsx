'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * A single placeholder block shaped like the content that's loading. Decorative
 * by construction:
 *
 *  - `aria-hidden` so screen readers skip it — the surrounding region (e.g.
 *    `state-boundary`) owns the "Loading…" announcement, never the skeleton.
 *  - the pulse animation is disabled under `prefers-reduced-motion`.
 *
 * Size it with utility classes, exactly like a `<div>`:
 *
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-10 w-10 rounded-full" />
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of placeholder lines. Default 3. */
  lines?: number;
}

/**
 * A stack of line-shaped skeletons for paragraph / list placeholders. The last
 * line is shorter so it reads like real prose. Wrapped in a single
 * `aria-hidden` group rather than hiding each line individually.
 */
export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder lines
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-1/2' : 'w-full')}
        />
      ))}
    </div>
  );
}
