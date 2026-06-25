'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Side = 'right' | 'left' | 'top' | 'bottom';

/** Where the panel anchors, and the transform it sits at while hidden. */
const SIDE: Record<Side, { anchor: string; hidden: string }> = {
  right: {
    anchor: 'inset-y-0 right-0 h-full w-full max-w-sm border-l',
    hidden: 'translate-x-full',
  },
  left: { anchor: 'inset-y-0 left-0 h-full w-full max-w-sm border-r', hidden: '-translate-x-full' },
  top: { anchor: 'inset-x-0 top-0 w-full max-h-[85vh] border-b', hidden: '-translate-y-full' },
  bottom: { anchor: 'inset-x-0 bottom-0 w-full max-h-[85vh] border-t', hidden: 'translate-y-full' },
};

export interface SheetProps {
  /** Controlled open state. */
  open: boolean;
  /** Requested to open (true) or close (false): Escape, backdrop click, close button. */
  onOpenChange: (open: boolean) => void;
  /** Which edge the panel slides from. Default "right". */
  side?: Side;
  /** Visible heading; also labels the dialog. */
  title?: React.ReactNode;
  /** Supporting line under the title; describes the dialog. */
  description?: React.ReactNode;
  /** Accessible name when there's no visible `title`. Default "Panel". */
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A slide-over panel anchored to any edge of the screen — for detail views,
 * forms and filters. A modal dialog with the accessibility most slide-overs
 * skip: focus moves in on open and is restored on close, focus is trapped while
 * open, Escape and a backdrop click close it, and the body is scroll-locked.
 *
 *   <Sheet open={open} onOpenChange={setOpen} title="Edit profile">
 *     <ProfileForm />
 *   </Sheet>
 *
 * Controlled: you own `open`; the sheet calls `onOpenChange(false)` whenever the
 * user asks to dismiss it. The slide is a CSS transform transition, so it needs
 * no animation plugin and is disabled under prefers-reduced-motion.
 */
export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  title,
  description,
  label = 'Panel',
  children,
  className,
}: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Drives the enter transition: render hidden, then flip to shown next frame.
  const [shown, setShown] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs per open/close, managing focus, scroll lock and the enter transition.
  React.useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => setShown(true));
    const focusT = setTimeout(() => (closeRef.current ?? panelRef.current)?.focus(), 20);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focusT);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const activeEl = document.activeElement;
    if (e.shiftKey && activeEl === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && activeEl === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const cfg = SIDE[side];

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal is handled by the panel's Escape key; the backdrop is a pointer convenience.
    <div
      className="fixed inset-0 z-[100]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300 motion-reduce:transition-none',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          'absolute flex flex-col bg-background shadow-2xl outline-none transition-transform duration-300 ease-out motion-reduce:transition-none',
          cfg.anchor,
          shown ? 'translate-x-0 translate-y-0' : cfg.hidden,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-2 -mt-2 shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
