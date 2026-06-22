'use client';

import { type AsyncState, match } from '@/lib/async-state';
import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface AsyncComboboxProps<T> {
  /** Fetch matching options for the current query. Debounced for you. */
  load: (query: string) => Promise<T[]>;
  /** Visible label for an option (also written into the input on select). */
  getLabel: (item: T) => string;
  /** Stable key per option. */
  getKey: (item: T) => React.Key;
  /** Called when an option is chosen. */
  onSelect?: (item: T) => void;
  /** Accessible name for the input. */
  label: string;
  placeholder?: string;
  /** Debounce before firing `load`, in ms. Default 250. */
  debounceMs?: number;
  className?: string;
}

/**
 * A combobox that fetches its options as you type — debounced, with loading,
 * empty and error states rendered inside the listbox. Implements the ARIA 1.2
 * combobox pattern: `role="combobox"` input wired to a `role="listbox"` popup via
 * `aria-controls` / `aria-expanded`, with the highlighted option tracked through
 * `aria-activedescendant` (focus stays in the input). Full keyboard support:
 * ↓/↑ move, Enter selects, Esc closes.
 */
export function AsyncCombobox<T>({
  load,
  getLabel,
  getKey,
  onSelect,
  label,
  placeholder,
  debounceMs = 250,
  className,
}: AsyncComboboxProps<T>) {
  const baseId = React.useId();
  const listId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(-1);
  const [state, setState] = React.useState<AsyncState<T[]>>({ status: 'idle' });

  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const runId = React.useRef(0);
  const blurTimer = React.useRef<ReturnType<typeof setTimeout>>();

  const run = React.useCallback(
    (q: string) => {
      const id = ++runId.current;
      if (!q.trim()) {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'loading' });
      load(q).then(
        (items) => {
          if (id !== runId.current) return;
          setState(items.length ? { status: 'success', data: items } : { status: 'empty' });
          setActive(items.length ? 0 : -1);
        },
        (err: unknown) => {
          if (id !== runId.current) return;
          setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) });
        },
      );
    },
    [load],
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(q), debounceMs);
  };

  const options = state.status === 'success' ? state.data : [];

  const choose = (item: T) => {
    onSelect?.(item);
    setQuery(getLabel(item));
    setOpen(false);
    setState({ status: 'idle' });
    runId.current++; // cancel any in-flight request
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      if (options.length) setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (options.length) setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter') {
      if (open && options[active]) {
        e.preventDefault();
        choose(options[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      clearTimeout(blurTimer.current);
    };
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        value={query}
        placeholder={placeholder}
        onChange={onInput}
        onFocus={() => query && setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {open && state.status !== 'idle' && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg"
        >
          {match(state, {
            idle: () => null,
            loading: () => (
              <div
                aria-busy="true"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground"
              >
                <svg
                  width="14"
                  height="14"
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
                Searching…
              </div>
            ),
            empty: () => (
              <div className="px-3 py-2.5 text-sm text-muted-foreground">No results</div>
            ),
            error: (err) => (
              <div
                role="alert"
                className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-destructive"
              >
                <span>{err.message || 'Something went wrong'}</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => run(query)}
                  className="rounded border border-destructive/40 px-2 py-0.5 text-xs font-medium hover:bg-destructive/10"
                >
                  Retry
                </button>
              </div>
            ),
            success: (items) => (
              <>
                {items.map((item, i) => (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard nav is centralized on the combobox input via aria-activedescendant, not per option.
                  <div
                    key={getKey(item)}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn(
                      'cursor-pointer px-3 py-2 text-sm',
                      i === active ? 'bg-muted text-foreground' : 'text-foreground',
                    )}
                  >
                    {getLabel(item)}
                  </div>
                ))}
              </>
            ),
          })}
        </div>
      )}
    </div>
  );
}
