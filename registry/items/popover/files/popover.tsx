'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface PopoverProps {
  /** Trigger button content. */
  label: React.ReactNode;
  /** Floating content. */
  children: React.ReactNode;
  /** Visible heading inside the panel; also labels it for assistive tech. */
  title?: React.ReactNode;
  /** Accessible name when there's no visible `title`. Default "Popover". */
  ariaLabel?: string;
  /** Which edge of the trigger the panel aligns to. Default "start". */
  align?: 'start' | 'end';
  className?: string;
  triggerClassName?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A floating panel anchored to a trigger, for rich content shown on click —
 * a form, a colour picker, a details card. Non-modal: it doesn't trap focus or
 * lock the page, but it moves focus into the panel on open, restores it to the
 * trigger on close, and dismisses on Escape or a click outside.
 *
 *   <Popover label="Filters" title="Filter results">
 *     <FilterForm />
 *   </Popover>
 *
 * The panel is a `role="dialog"` labelled by its `title` (or `ariaLabel`), and
 * the trigger advertises `aria-expanded` / `aria-haspopup="dialog"`.
 */
export function Popover({
  label,
  children,
  title,
  ariaLabel = 'Popover',
  align = 'start',
  className,
  triggerClassName,
}: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  // Move focus into the panel on open (first focusable, else the panel itself).
  React.useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node).focus();
  }, [open]);

  // Dismiss on a click outside the trigger or the panel.
  // biome-ignore lint/correctness/useExhaustiveDependencies: this effect only wires/unwires the listener per open; close is stable enough to omit.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          triggerClassName,
        )}
      >
        {label}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : ariaLabel}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              close(true);
            }
          }}
          className={cn(
            'absolute z-50 mt-1 w-72 rounded-md border border-border bg-background p-4 text-sm text-foreground shadow-md outline-none',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {title && (
            <h2 id={titleId} className="mb-2 text-sm font-semibold text-foreground">
              {title}
            </h2>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
