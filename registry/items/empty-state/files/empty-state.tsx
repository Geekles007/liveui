'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The headline — say what is missing in plain words. */
  title: React.ReactNode;
  /** Optional supporting line under the title. */
  description?: React.ReactNode;
  /**
   * Decorative glyph shown above the title. Defaults to a simple tray icon.
   * Pass `null` to render no icon at all.
   */
  icon?: React.ReactNode;
  /** Primary action — e.g. a button that creates the first item. */
  action?: React.ReactNode;
}

/**
 * A considered "there's nothing here yet" panel: an optional icon, a title, an
 * optional description and an optional primary action. Built to drop straight
 * into a `state-boundary`'s `empty` slot, but works anywhere.
 *
 *   <EmptyState
 *     title="No projects yet"
 *     description="Create your first project to get started."
 *     action={<button>New project</button>}
 *   />
 *
 * It imposes no live region or role of its own — the surrounding boundary owns
 * the "No results" announcement; this is just the visible panel.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center',
        className,
      )}
      {...props}
    >
      {icon !== null && (
        <span aria-hidden="true" className="text-muted-foreground">
          {icon ?? <DefaultIcon />}
        </span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** A neutral tray glyph used when no `icon` is supplied. Decorative. */
function DefaultIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13h4l2 3h6l2-3h4" />
      <path d="M5 13V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" />
    </svg>
  );
}
