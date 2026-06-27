'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface OptimisticToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'> {
  /** The server's current pressed state — the source of truth. */
  pressed: boolean;
  /**
   * Commit the toggle. Receives the next value. If it returns a promise that
   * rejects, the button rolls back to `pressed` and announces the failure.
   */
  onToggle: (next: boolean) => Promise<unknown> | unknown;
  /** Accessible action label, e.g. "Like". */
  label: string;
  /** Optional trailing content, e.g. a like count. */
  children?: React.ReactNode;
  /** Announced to screen readers when the toggle fails. Default "Couldn't save". */
  errorLabel?: string;
}

/**
 * A like / favourite button that flips the instant you press it and rolls back
 * if the server refuses — the single-value showcase of the optimistic pattern
 * behind `use-optimistic-list`.
 *
 *   <OptimisticToggle pressed={liked} onToggle={() => api.like(id)} label="Like" />
 *
 * Press it and the pressed state changes immediately, before `onToggle`
 * resolves. On success the optimistic overlay is kept until the `pressed` prop
 * catches up (so the server stays authoritative); on rejection it reverts and a
 * polite live region announces the error.
 *
 * Accessibility: it's a real toggle button with `aria-pressed`, so the state is
 * announced ("Like, pressed"). `aria-busy` is set while the commit is in flight.
 */
export const OptimisticToggle = React.forwardRef<HTMLButtonElement, OptimisticToggleProps>(
  function OptimisticToggle(
    {
      pressed,
      onToggle,
      label,
      children,
      errorLabel = "Couldn't save",
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    // null = no overlay, follow the server prop; otherwise show the optimistic value.
    const [optimistic, setOptimistic] = React.useState<boolean | null>(null);
    const [pending, setPending] = React.useState(false);
    const [announce, setAnnounce] = React.useState('');

    const mounted = React.useRef(true);
    React.useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    // When the server truth catches up, drop the overlay so it stays authoritative.
    // biome-ignore lint/correctness/useExhaustiveDependencies: the point is to settle whenever `pressed` changes.
    React.useEffect(() => {
      setOptimistic(null);
    }, [pressed]);

    const value = optimistic ?? pressed;

    const handleClick = () => {
      const next = !value;
      setOptimistic(next);
      setAnnounce('');

      const result = onToggle(next);
      // A synchronous handler leaves the overlay until the parent updates `pressed`.
      if (!result || typeof (result as Promise<unknown>).then !== 'function') return;

      setPending(true);
      Promise.resolve(result).then(
        () => {
          if (!mounted.current) return;
          setPending(false);
          // Keep the optimistic value; the `pressed`-change effect settles it.
        },
        () => {
          if (!mounted.current) return;
          setPending(false);
          setOptimistic(null); // roll back to the server truth
          setAnnounce(errorLabel);
        },
      );
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-pressed={value}
        aria-busy={pending || undefined}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          value
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:bg-muted',
          className,
        )}
        {...rest}
      >
        <HeartIcon filled={value} />
        {children != null && <span>{children}</span>}
        {/* Polite live region: only speaks on failure. */}
        <span
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {announce}
        </span>
      </button>
    );
  },
);

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}
