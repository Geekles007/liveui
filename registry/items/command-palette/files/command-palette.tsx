'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface Command {
  /** Stable id. */
  id: string;
  /** Visible label, and the primary thing the query matches against. */
  label: string;
  /** Extra terms to match on, beyond the label. */
  keywords?: string;
  /** Optional group header. Keep commands of the same group contiguous. */
  group?: string;
  /** Right-aligned hint, e.g. "⌘P". Decorative. */
  shortcut?: string;
  /** Decorative leading icon. */
  icon?: React.ReactNode;
  /** Run when chosen. The palette closes first, then this fires. */
  onSelect: () => void;
}

export interface CommandPaletteProps {
  /** The commands to search. Filtered client-side as the user types. */
  commands: Command[];
  /** Controlled open state. Omit to let the palette manage its own. */
  open?: boolean;
  /** Notified whenever the palette wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Enable the global ⌘K / Ctrl+K toggle. Default true. */
  shortcut?: boolean;
  /** Accessible name for the dialog and listbox. Default "Command palette". */
  label?: string;
  placeholder?: string;
  /** Shown when nothing matches. Default "No results". */
  emptyMessage?: string;
  className?: string;
}

function matches(command: Command, query: string): boolean {
  const haystack = `${command.label} ${command.keywords ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

/**
 * A ⌘K command palette: a modal combobox over a list of commands, filtered as
 * you type. Implements the ARIA combobox-in-dialog pattern — a `role="dialog"`
 * with `aria-modal`, a `role="combobox"` input wired to a `role="listbox"` via
 * `aria-controls`, the highlighted command tracked through `aria-activedescendant`
 * (focus stays in the input), and a polite result-count announcement. Full
 * keyboard support: ⌘K toggles, ↓/↑ move, Enter runs, Esc closes; focus is
 * restored to wherever it was when the palette closes.
 *
 *   <CommandPalette commands={commands} />
 *
 * Need server-backed results? Make `commands` reactive — e.g. derive it from a
 * `useAsync` search keyed on the query — and pass the resolved list in.
 */
export function CommandPalette({
  commands,
  open,
  onOpenChange,
  shortcut = true,
  label = 'Command palette',
  placeholder = 'Type a command or search…',
  emptyMessage = 'No results',
  className,
}: CommandPaletteProps) {
  const baseId = React.useId();
  const listId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = isControlled ? open : internalOpen;

  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Global ⌘K / Ctrl+K toggle.
  React.useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut, isOpen, setOpen]);

  // On open: reset, capture focus to the input, and remember where to return it.
  React.useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActive(0);
    restoreRef.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      restoreRef.current?.focus?.();
    };
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => matches(c, q)) : commands;
  }, [commands, query]);

  // Keep the active index in range as the result set shrinks.
  React.useEffect(() => {
    setActive((i) => (i >= filtered.length ? 0 : i));
  }, [filtered.length]);

  // Keep the highlighted option scrolled into view.
  React.useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current?.querySelector(`#${CSS.escape(optionId(active))}`);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
    // optionId is derived from baseId (stable); active/isOpen are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isOpen]);

  if (!isOpen) return null;

  const choose = (command: Command | undefined) => {
    if (!command) return;
    setOpen(false);
    command.onSelect();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length) setActive((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length) setActive((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (filtered.length) setActive(filtered.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      // The input is the only focusable element; keep focus inside.
      e.preventDefault();
    }
  };

  let lastGroup: string | undefined;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the overlay backdrop is a click-to-dismiss convenience; all keyboard interaction lives on the input.
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] motion-safe:animate-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          'w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl',
          className,
        )}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={filtered.length ? optionId(active) : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />

        {/* Polite live region: announced, not seen. */}
        <span role="status" aria-live="polite" className="sr-only">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>

        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="max-h-[50vh] overflow-auto p-1"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            filtered.map((command, i) => {
              const header =
                command.group && command.group !== lastGroup ? (
                  <div
                    key={`group-${command.group}`}
                    role="presentation"
                    className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground"
                  >
                    {command.group}
                  </div>
                ) : null;
              lastGroup = command.group;

              return (
                <React.Fragment key={command.id}>
                  {header}
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard nav is centralized on the combobox input via aria-activedescendant. */}
                  <div
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(command)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm',
                      i === active ? 'bg-muted text-foreground' : 'text-foreground',
                    )}
                  >
                    {command.icon && (
                      <span aria-hidden="true" className="text-muted-foreground">
                        {command.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{command.label}</span>
                    {command.shortcut && (
                      <kbd className="text-xs text-muted-foreground">{command.shortcut}</kbd>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
