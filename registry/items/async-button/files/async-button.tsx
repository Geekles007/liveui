'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface AsyncButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /**
   * Click handler. If it returns a promise, the button owns the pending state:
   * it disables itself, shows a spinner and sets aria-busy until it settles.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown;
  /** Shown next to the spinner while pending. Defaults to the children. */
  pendingLabel?: React.ReactNode;
  /** Announced to screen readers when the action fails. Default "Action failed". */
  errorLabel?: string;
}

/**
 * A button that owns its own pending and error state. Give it an `onClick` that
 * returns a promise and it will, for the duration of that promise:
 *
 *  - set `disabled` and `aria-busy` so it can't be double-submitted,
 *  - render a spinner (decorative, `aria-hidden`),
 *  - announce success / failure through a polite live region.
 *
 * It never tracks state you can see leak out — one click in, the button manages
 * the rest. Errors are swallowed for UI purposes but re-announced; throw-handling
 * (logging, toasts) stays the caller's job via the returned promise.
 */
export const AsyncButton = React.forwardRef<HTMLButtonElement, AsyncButtonProps>(
  function AsyncButton(
    {
      onClick,
      children,
      pendingLabel,
      errorLabel = 'Action failed',
      className,
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const [pending, setPending] = React.useState(false);
    const [announce, setAnnounce] = React.useState('');
    const mounted = React.useRef(true);
    React.useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (pending || !onClick) {
        onClick?.(event);
        return;
      }
      const result = onClick(event);
      // Only take over when the handler is actually async.
      if (!result || typeof (result as Promise<unknown>).then !== 'function') return;

      setPending(true);
      setAnnounce('');
      Promise.resolve(result).then(
        () => {
          if (!mounted.current) return;
          setPending(false);
          setAnnounce('Done');
        },
        () => {
          if (!mounted.current) return;
          setPending(false);
          setAnnounce(errorLabel);
        },
      );
    };

    return (
      <button
        ref={ref}
        type={type}
        onClick={handleClick}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...rest}
      >
        {pending && (
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
        <span>{pending ? (pendingLabel ?? children) : children}</span>
        {/* Polite live region: announced, not seen. */}
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
