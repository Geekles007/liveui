'use client';

import { Skeleton } from '@/components/skeleton';
import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** First letters of the first two words, uppercased: "Ada Lovelace" → "AL". */
function initialsFrom(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

type Status = 'loading' | 'loaded' | 'error';

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Image URL. When absent or it fails to load, the fallback is shown. */
  src?: string;
  /** The person's name — drives the initials and the accessible label. */
  name?: string;
  /** Accessible name for the image. Defaults to `name`. */
  alt?: string;
  /** Diameter in pixels. Default 40. */
  size?: number;
  /** Custom fallback (e.g. a custom glyph). Defaults to initials, then a person icon. */
  fallback?: React.ReactNode;
}

/**
 * A profile image that degrades gracefully: a `skeleton` while the image loads,
 * the image once it's ready, and the person's initials if there's no image or
 * it fails to load.
 *
 *   <Avatar src={user.avatar} name={user.name} />
 *
 * Accessibility: when the image renders it carries `alt` (defaulting to `name`).
 * The initials fallback is exposed as `role="img"` labelled with `name`, so the
 * person is announced either way. With no `name` and no `src` it's purely
 * decorative and hidden from assistive tech.
 */
export function Avatar({ src, name, alt, size = 40, fallback, className, style, ...rest }: AvatarProps) {
  const [status, setStatus] = React.useState<Status>(src ? 'loading' : 'error');

  // Reset the load lifecycle whenever the source changes.
  React.useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  const showFallback = !src || status === 'error';
  const label = alt ?? name;
  const initials = name ? initialsFrom(name) : '';

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted align-middle',
        className,
      )}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {showFallback ? (
        <FallbackContent label={label} initials={initials} size={size} fallback={fallback} />
      ) : (
        <>
          {status === 'loading' && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-full" />
          )}
          {/* biome-ignore lint/a11y/useAltText: alt is supplied via the alt attribute below */}
          <img
            src={src}
            alt={label ?? ''}
            width={size}
            height={size}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            className={cn(
              'h-full w-full object-cover transition-opacity',
              status === 'loaded' ? 'opacity-100' : 'opacity-0',
            )}
          />
        </>
      )}
    </span>
  );
}

function FallbackContent({
  label,
  initials,
  size,
  fallback,
}: {
  label?: string;
  initials: string;
  size: number;
  fallback?: React.ReactNode;
}) {
  const content =
    fallback ??
    (initials ? (
      <span
        aria-hidden="true"
        className="font-medium text-muted-foreground"
        style={{ fontSize: Math.round(size * 0.4) }}
      >
        {initials}
      </span>
    ) : (
      <PersonIcon size={size} />
    ));

  // With a name we expose the avatar as a labelled image; otherwise it's
  // decorative and skipped by screen readers.
  return label ? (
    <span role="img" aria-label={label} className="contents">
      {content}
    </span>
  ) : (
    content
  );
}

/** A neutral person glyph used when there's no image and no name. Decorative. */
function PersonIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      width={Math.round(size * 0.6)}
      height={Math.round(size * 0.6)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
