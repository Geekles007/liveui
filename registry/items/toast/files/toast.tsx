'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type ToastType = 'loading' | 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: React.ReactNode;
  /** ms before auto-dismiss. `loading` toasts never auto-dismiss. */
  duration: number;
}

// --- store (module-level pub/sub, no dependency) ----------------------------

const EMPTY: Toast[] = [];
let toasts: Toast[] = EMPTY;
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  for (const l of listeners) l();
}
function set(next: Toast[]) {
  toasts = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return toasts;
}

let counter = 0;
const uid = () => `t${++counter}`;

function scheduleDismiss(id: string, duration: number) {
  if (duration === Number.POSITIVE_INFINITY) return;
  clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => dismiss(id), duration),
  );
}

function add(type: ToastType, message: React.ReactNode, duration?: number): string {
  const id = uid();
  const d =
    duration ?? (type === 'loading' ? Number.POSITIVE_INFINITY : type === 'error' ? 6000 : 4000);
  set([...toasts, { id, type, message, duration: d }]);
  scheduleDismiss(id, d);
  return id;
}

function patch(id: string, next: { type: ToastType; message: React.ReactNode; duration?: number }) {
  let found = false;
  set(
    toasts.map((t) => {
      if (t.id !== id) return t;
      found = true;
      return {
        ...t,
        type: next.type,
        message: next.message,
        duration: next.duration ?? t.duration,
      };
    }),
  );
  if (found) {
    const d = next.duration ?? (next.type === 'loading' ? Number.POSITIVE_INFINITY : 4000);
    scheduleDismiss(id, d);
  }
}

export function dismiss(id: string) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  set(toasts.filter((t) => t.id !== id));
}

function dismissAll() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  set(EMPTY);
}

export interface PromiseMessages<T> {
  loading: React.ReactNode;
  success: React.ReactNode | ((value: T) => React.ReactNode);
  error: React.ReactNode | ((error: unknown) => React.ReactNode);
}

/**
 * Fire-and-forget notifications, plus a promise-aware helper that walks a promise
 * through loading → success / error on its own — the AsyncState idea, applied to
 * transient feedback. Render `<Toaster />` once near your app root.
 *
 *   toast.success("Saved");
 *   toast.promise(api.save(form), {
 *     loading: "Saving…", success: "Saved", error: "Could not save",
 *   });
 */
export const toast = Object.assign(
  (message: React.ReactNode, duration?: number) => add('info', message, duration),
  {
    success: (message: React.ReactNode, duration?: number) => add('success', message, duration),
    error: (message: React.ReactNode, duration?: number) => add('error', message, duration),
    info: (message: React.ReactNode, duration?: number) => add('info', message, duration),
    loading: (message: React.ReactNode) => add('loading', message),
    dismiss,
    dismissAll,
    promise<T>(promise: Promise<T>, messages: PromiseMessages<T>): Promise<T> {
      const id = add('loading', messages.loading);
      promise.then(
        (value) => {
          const m =
            typeof messages.success === 'function' ? messages.success(value) : messages.success;
          patch(id, { type: 'success', message: m });
        },
        (err: unknown) => {
          const m = typeof messages.error === 'function' ? messages.error(err) : messages.error;
          patch(id, { type: 'error', message: m });
        },
      );
      return promise;
    },
  },
);

// --- <Toaster /> ------------------------------------------------------------

const ICONS: Record<ToastType, React.ReactNode> = {
  loading: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="motion-safe:animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5M12 16h.01" />
    </svg>
  ),
  info: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
};

const ICON_COLOR: Record<ToastType, string> = {
  loading: 'text-muted-foreground',
  success: 'text-primary',
  error: 'text-destructive',
  info: 'text-muted-foreground',
};

export interface ToasterProps {
  /** Corner to anchor the stack. Default "bottom-right". */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/** Mount once near the root. Renders the live toast stack. */
export function Toaster({ position = 'bottom-right' }: ToasterProps) {
  const items = React.useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const pos = cn(
    'fixed z-[100] flex w-[min(92vw,360px)] flex-col gap-2 p-4',
    position.includes('top') ? 'top-0' : 'bottom-0',
    position.includes('right') ? 'right-0' : 'left-0',
    position.includes('bottom') ? 'flex-col-reverse' : '',
  );

  return (
    <section aria-label="Notifications" className={pos}>
      {items.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          aria-live={t.type === 'error' ? 'assertive' : 'polite'}
          className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg motion-safe:animate-in"
        >
          <span className={cn('mt-0.5 flex-none', ICON_COLOR[t.type])}>{ICONS[t.type]}</span>
          <div className="flex-1 text-foreground">{t.message}</div>
          {t.type !== 'loading' && (
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="flex-none text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
