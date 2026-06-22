'use client';

import type { AsyncState, AsyncStatus } from '@/lib/async-state';
import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const DEFAULT_LABELS: Record<AsyncStatus, string> = {
  idle: '',
  loading: 'Loading…',
  empty: 'No results',
  error: 'Something went wrong',
  success: 'Content loaded',
};

export interface StateBoundaryProps<T> {
  /** The async state to render. */
  state: AsyncState<T>;
  /** Render the resolved value. Only called in the `success` state. */
  children: (data: T) => React.ReactNode;
  /** Visual shown while loading. Defaults to a skeleton block. */
  loading?: React.ReactNode;
  /** Visual shown when the result is empty. */
  empty?: React.ReactNode;
  /** Visual shown on error. Receives the error and an optional retry callback. */
  error?: (error: Error, retry?: () => void) => React.ReactNode;
  /** Override the screen-reader announcement for any state. */
  labels?: Partial<Record<AsyncStatus, string>>;
  className?: string;
}

/**
 * Maps an `AsyncState<T>` onto the matching slot and handles the accessibility
 * concerns most components skip:
 *
 *  - a polite live region announces every state transition to screen readers
 *  - `aria-busy` is set while loading
 *  - focus moves to the retry control when an error appears
 *
 * This is the primitive that makes every ibirdui component "state-complete".
 */
export function StateBoundary<T>({
  state,
  children,
  loading,
  empty,
  error,
  labels,
  className,
}: StateBoundaryProps<T>) {
  const label = labels?.[state.status] ?? DEFAULT_LABELS[state.status];
  const retryRef = React.useRef<HTMLButtonElement>(null);

  // Move focus to the retry button when we enter the error state, so keyboard
  // and screen-reader users land on the actionable control.
  React.useEffect(() => {
    if (state.status === 'error') retryRef.current?.focus();
  }, [state.status]);

  return (
    <div
      className={cn('ibirdui-state-boundary', className)}
      aria-busy={state.status === 'loading' || undefined}
    >
      {/* Polite live region: announced, not seen. */}
      <span role="status" aria-live="polite" className="sr-only">
        {label}
      </span>

      {state.status === 'loading' && (loading ?? <DefaultSkeleton />)}

      {state.status === 'empty' && (empty ?? <DefaultEmpty>{label}</DefaultEmpty>)}

      {state.status === 'error' &&
        (error ? (
          error(state.error, state.retry)
        ) : (
          <DefaultError ref={retryRef} message={state.error.message || label} retry={state.retry} />
        ))}

      {state.status === 'success' && children(state.data)}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

function DefaultEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

const DefaultError = React.forwardRef<HTMLButtonElement, { message: string; retry?: () => void }>(
  function DefaultError({ message, retry }, ref) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
      >
        <p>{message}</p>
        {retry && (
          <button
            ref={ref}
            type="button"
            onClick={retry}
            className="inline-flex items-center rounded-md border border-destructive/40 px-3 py-1.5 font-medium transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            Try again
          </button>
        )}
      </div>
    );
  },
);
