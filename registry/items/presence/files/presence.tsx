'use client';

import { Avatar } from '@/components/avatar';
import type * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface PresenceUser {
  /** Stable identity for the person. */
  id: string | number;
  /** Display name — drives the avatar initials and the accessible label. */
  name: string;
  /** Optional avatar image URL. */
  src?: string;
}

export interface PresenceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Who is online right now. Keep it in sync over your realtime channel. */
  users: PresenceUser[];
  /** Max avatars before collapsing the rest into a "+N" chip. Default 5. */
  max?: number;
  /** Avatar diameter in pixels. Default 32. */
  size?: number;
}

/**
 * Show who is online right now as a row of overlapping avatars with a live
 * count. Feed it the current set of users from your realtime channel (a
 * presence subscription, `useStream`, etc.) and it stacks them, collapses the
 * overflow into a "+N" chip, and announces the count politely as people come
 * and go.
 *
 *   <Presence users={online} />
 *
 * Accessibility: the avatars sit in a labelled list and each is announced by
 * name (via `avatar`'s role=img). A polite live region re-announces the summary
 * whenever the count changes, so screen-reader users hear "5 people online"
 * without the row stealing focus.
 */
export function Presence({ users, max = 5, size = 32, className, ...rest }: PresenceProps) {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;
  const count = users.length;
  const summary =
    count === 0 ? 'No one online' : `${count} ${count === 1 ? 'person' : 'people'} online`;

  return (
    <div className={cn('flex items-center gap-3', className)} {...rest}>
      {count > 0 && (
        <ul aria-label="People online" className="flex -space-x-2">
          {shown.map((user) => (
            <li key={user.id} className="rounded-full ring-2 ring-background">
              <Avatar src={user.src} name={user.name} size={size} />
            </li>
          ))}
          {overflow > 0 && (
            <li
              aria-label={`${overflow} more`}
              className="inline-flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background"
              style={{ width: size, height: size }}
            >
              <span aria-hidden="true">+{overflow}</span>
            </li>
          )}
        </ul>
      )}
      {/* Visible summary, hidden from AT — the live region below owns the announcement. */}
      <span aria-hidden="true" className="text-sm text-muted-foreground">
        {summary}
      </span>
      {/* Polite live region: re-announced whenever the count changes. */}
      <span role="status" aria-live="polite" className="sr-only">
        {summary}
      </span>
    </div>
  );
}
