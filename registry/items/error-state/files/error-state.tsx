'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The error to surface. A string is shown as-is; an Error shows its message. */
  error: Error | string;
  /** Retry callback. When provided, renders a focusable retry button. */
  onRetry?: () => void;
  /** Headline above the message. Default "Something went wrong". */
  title?: React.ReactNode;
  /** Label for the retry button. Default "Try again". */
  retryLabel?: string;
  /**
   * Move focus to the retry button on mount. Set this when the panel appears as
   * the result of a state transition (e.g. a boundary's `error` slot) so
   * keyboard and screen-reader users land on the actionable control. Default
   * false, so a panel rendered on initial page load never steals focus.
   */
  autoFocus?: boolean;
}

/**
 * A clear "something went wrong" panel with an optional retry button and an
 * expandable technical-details disclosure. Built to drop into a
 * `state-boundary`'s `error` slot, but works anywhere:
 *
 *   <StateBoundary
 *     state={users}
 *     error={(err, retry) => <ErrorState error={err} onRetry={retry} autoFocus />}
 *   >
 *     {(data) => <UserList users={data} />}
 *   </StateBoundary>
 *
 * The container is a `role="alert"`, so assistive tech is told the moment it
 * appears — no extra wiring from the caller.
 */
export function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
  retryLabel = 'Try again',
  autoFocus = false,
  className,
  ...props
}: ErrorStateProps) {
  const retryRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (autoFocus) retryRef.current?.focus();
  }, [autoFocus]);

  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive',
        className,
      )}
      {...props}
    >
      <p className="font-medium">{title}</p>
      {message && <p className="text-destructive/90">{message}</p>}

      {stack && (
        <details className="w-full text-xs text-destructive/80">
          <summary className="cursor-pointer select-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
            Technical details
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-destructive/5 p-2">
            {stack}
          </pre>
        </details>
      )}

      {onRetry && (
        <button
          ref={retryRef}
          type="button"
          onClick={onRetry}
          className="inline-flex items-center rounded-md border border-destructive/40 px-3 py-1.5 font-medium transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
