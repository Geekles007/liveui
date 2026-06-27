'use client';

import { useOnline } from '@/hooks/use-online';
import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface OfflineBannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Message shown while offline. */
  message?: React.ReactNode;
  /** Message flashed briefly when the connection returns. Set null to skip it. */
  reconnectedMessage?: React.ReactNode | null;
  /** How long the reconnected note stays, in ms. Default 3000. */
  reconnectedDuration?: number;
}

/**
 * A banner that appears on its own the moment the browser goes offline — the
 * first real consumer of `use-online`. It renders nothing while connected, an
 * assertive alert while offline, and (optionally) a brief polite "back online"
 * note when the connection returns.
 *
 *   <OfflineBanner />
 *
 * It returns a plain block so you can place it anywhere; add positioning via
 * `className`, e.g. `className="sticky top-0 z-50"` for a page-wide strip.
 *
 * Accessibility: the offline state is a `role="alert"` so assistive tech is told
 * immediately; the reconnected note is a polite `role="status"` so it doesn't
 * interrupt. Backed by `useSyncExternalStore`, it's SSR-safe and renders nothing
 * on the server (assumed online).
 */
export function OfflineBanner({
  message = "You're offline. Some changes may not be saved.",
  reconnectedMessage = 'Back online',
  reconnectedDuration = 3000,
  className,
  ...rest
}: OfflineBannerProps) {
  const online = useOnline();
  const [reconnected, setReconnected] = React.useState(false);
  const wasOffline = React.useRef(false);

  React.useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setReconnected(false);
      return;
    }
    if (!wasOffline.current || reconnectedMessage == null) return;
    wasOffline.current = false;
    setReconnected(true);
    const timer = setTimeout(() => setReconnected(false), reconnectedDuration);
    return () => clearTimeout(timer);
  }, [online, reconnectedMessage, reconnectedDuration]);

  if (!online) {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive',
          className,
        )}
        {...rest}
      >
        <OfflineIcon />
        <span>{message}</span>
      </div>
    );
  }

  if (reconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-2 border-b border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground',
          className,
        )}
        {...rest}
      >
        <OnlineIcon />
        <span>{reconnectedMessage}</span>
      </div>
    );
  }

  return null;
}

function OfflineIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 2 20 20" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
      <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
      <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
      <path d="M5 13a10 10 0 0 1 5.24-2.76" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}
