'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface TagInputProps {
  /** The current tags (controlled). */
  value: string[];
  /** Called with the next tags whenever one is added or removed. */
  onChange: (tags: string[]) => void;
  /** Accessible name for the text input. */
  label: string;
  placeholder?: string;
  /** Maximum number of tags. */
  max?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * A field where you build a list of tags one at a time: type and press Enter (or
 * comma) to add, Backspace on an empty input to remove the last, or the ✕ on any
 * tag. Duplicates and blanks are ignored.
 *
 *   <TagInput value={tags} onChange={setTags} label="Tags" />
 *
 * Accessibility: the tags are a labelled list, each with a "Remove {tag}" button;
 * additions and removals are announced through a polite live region; the input
 * keeps a native `<input>`.
 */
export function TagInput({
  value,
  onChange,
  label,
  placeholder,
  max,
  disabled = false,
  className,
}: TagInputProps) {
  const [draft, setDraft] = React.useState('');
  const [announce, setAnnounce] = React.useState('');
  const atMax = max != null && value.length >= max;

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || atMax || value.includes(tag)) return;
    onChange([...value, tag]);
    setAnnounce(`Added ${tag}`);
    setDraft('');
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
    setAnnounce(`Removed ${tag}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {value.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5" aria-label={`${label} tags`}>
          {value.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm text-foreground"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${tag}`}
                  className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg
                    aria-hidden="true"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <input
        type="text"
        aria-label={label}
        value={draft}
        placeholder={atMax ? undefined : placeholder}
        disabled={disabled || atMax}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        className="min-w-24 flex-1 bg-transparent px-1.5 py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />

      {/* Polite live region: announced, not seen. */}
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
    </div>
  );
}
