'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface ConfirmOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive. */
  destructive?: boolean;
  /**
   * Optional async action. When provided, the confirm button owns its pending
   * state: it runs while you wait, and on failure the dialog stays open and shows
   * the error instead of resolving.
   */
  action?: () => Promise<unknown>;
}

interface Pending extends ConfirmOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

// --- store (module-level, no dependency) ------------------------------------

let current: Pending | null = null;
const listeners = new Set<() => void>();
let seq = 0;

function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return current;
}
function set(next: Pending | null) {
  current = next;
  emit();
}

/**
 * Imperatively ask for confirmation. Mount `<ConfirmDialog />` once near your
 * root, then `await confirm(...)` anywhere. Resolves `true` if confirmed,
 * `false` if cancelled. With an `action`, the button manages its own pending and
 * error state — the dialog only closes (and resolves `true`) once the action
 * succeeds.
 *
 *   const ok = await confirm({
 *     title: "Delete project?",
 *     destructive: true,
 *     action: () => api.remove(id),
 *   });
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    set({ ...options, id: ++seq, resolve });
  });
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mount once near the app root. Renders the active confirm dialog, if any. */
export function ConfirmDialog() {
  const pending = React.useSyncExternalStore(subscribe, getSnapshot, () => null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Reset transient state whenever a new request appears, and manage focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run per dialog instance (pending?.id), not on every field.
  React.useEffect(() => {
    if (!pending) return;
    setBusy(false);
    setError(null);
    restoreRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => confirmRef.current?.focus(), 20);
    return () => {
      clearTimeout(t);
      restoreRef.current?.focus?.();
    };
  }, [pending?.id]);

  if (!pending) return null;

  const close = (ok: boolean) => {
    pending.resolve(ok);
    set(null);
  };

  const onConfirm = async () => {
    if (!pending.action) {
      close(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await pending.action();
      close(true);
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !busy) {
      e.preventDefault();
      close(false);
    } else if (e.key === 'Tab') {
      // focus trap
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 motion-safe:animate-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) close(false);
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={pending.description ? descId : undefined}
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {pending.title}
        </h2>
        {pending.description && (
          <p id={descId} className="mt-2 text-sm text-muted-foreground">
            {pending.description}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => close(false)}
            disabled={busy}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {pending.cancelLabel ?? 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
              pending.destructive
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground',
            )}
          >
            {busy && (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
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
            {pending.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
