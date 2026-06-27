'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface MenuItemProps {
  children: React.ReactNode;
  /** Run when the item is chosen (click or Enter/Space). The menu then closes. */
  onSelect?: () => void;
  disabled?: boolean;
}

/**
 * Declares one menu action. It renders nothing on its own — {@link DropdownMenu}
 * reads its props and orchestrates roving focus and selection.
 */
export function MenuItem(_props: MenuItemProps): React.ReactNode {
  return null;
}

/** A divider between groups of items. Renders nothing on its own. */
export function MenuSeparator(): React.ReactNode {
  return null;
}

type Entry = { kind: 'item'; props: MenuItemProps } | { kind: 'separator' };

function isMenuItem(node: React.ReactNode): node is React.ReactElement<MenuItemProps> {
  return React.isValidElement(node) && node.type === MenuItem;
}
function isSeparator(node: React.ReactNode): boolean {
  return React.isValidElement(node) && node.type === MenuSeparator;
}

export interface DropdownMenuProps {
  /** Trigger button content. */
  label: React.ReactNode;
  /** `MenuItem` / `MenuSeparator` children. */
  children: React.ReactNode;
  /** Which edge of the trigger the menu aligns to. Default "start". */
  align?: 'start' | 'end';
  className?: string;
  /** Classes for the trigger button. */
  triggerClassName?: string;
}

/**
 * An actions menu that opens under a button — the ARIA menu pattern, done right.
 * The trigger advertises `aria-haspopup` / `aria-expanded`; the list is a
 * `role="menu"` of `role="menuitem"` buttons with roving tabindex. Open with
 * click, Enter, Space or ↓ (↑ opens on the last item); ↑/↓ move, Home/End jump,
 * Escape closes and restores focus to the trigger, and a click outside dismisses.
 *
 *   <DropdownMenu label="Actions">
 *     <MenuItem onSelect={() => edit()}>Edit</MenuItem>
 *     <MenuItem onSelect={() => share()}>Share</MenuItem>
 *     <MenuSeparator />
 *     <MenuItem onSelect={() => remove()} disabled>Delete</MenuItem>
 *   </DropdownMenu>
 */
export function DropdownMenu({
  label,
  children,
  align = 'start',
  className,
  triggerClassName,
}: DropdownMenuProps) {
  const entries = React.useMemo<Entry[]>(
    () =>
      React.Children.toArray(children).flatMap((node) => {
        if (isMenuItem(node)) return [{ kind: 'item', props: node.props } as Entry];
        if (isSeparator(node)) return [{ kind: 'separator' } as Entry];
        return [];
      }),
    [children],
  );

  const [open, setOpen] = React.useState(false);
  // Entry index of the active (focused) item, or -1 when none.
  const [active, setActive] = React.useState(-1);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const triggerId = React.useId();
  const menuId = React.useId();

  const enabled = React.useMemo(
    () => entries.flatMap((e, i) => (e.kind === 'item' && !e.props.disabled ? [i] : [])),
    [entries],
  );

  const openMenu = (toIndex: number) => {
    setActive(toIndex);
    setOpen(true);
  };
  const closeMenu = (restoreFocus: boolean) => {
    setOpen(false);
    setActive(-1);
    if (restoreFocus) triggerRef.current?.focus();
  };

  // Move focus to the active item whenever it changes while open.
  React.useEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus();
  }, [open, active]);

  // Dismiss on a click outside the trigger or the menu.
  // biome-ignore lint/correctness/useExhaustiveDependencies: this effect only wires/unwires the listener per open; closeMenu is stable enough to omit.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) closeMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const step = (dir: 1 | -1) => {
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(active);
    const nextPos = pos === -1 ? (dir === 1 ? 0 : enabled.length - 1) : pos + dir;
    const clamped = (nextPos + enabled.length) % enabled.length;
    setActive(enabled[clamped]);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu(enabled[0] ?? -1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu(enabled[enabled.length - 1] ?? -1);
    }
  };

  const select = (entryIndex: number) => {
    const entry = entries[entryIndex];
    if (entry?.kind !== 'item' || entry.props.disabled) return;
    entry.props.onSelect?.();
    closeMenu(true);
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        step(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        step(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(enabled[0] ?? -1);
        break;
      case 'End':
        e.preventDefault();
        setActive(enabled[enabled.length - 1] ?? -1);
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        e.preventDefault();
        closeMenu(true);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(active);
        break;
    }
  };

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu(false) : openMenu(enabled[0] ?? -1))}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          triggerClassName,
        )}
      >
        {label}
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          id={menuId}
          aria-labelledby={triggerId}
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-background p-1 shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {entries.map((entry, i) => {
            if (entry.kind === 'separator') {
              // <hr> carries the implicit separator role for assistive tech.
              // biome-ignore lint/suspicious/noArrayIndexKey: entries are a stable, render-derived list
              return <hr key={`sep-${i}`} className="my-1 h-px border-0 bg-border" />;
            }
            const isActive = i === active;
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: entries are a stable, render-derived list
                key={`item-${i}`}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={isActive ? 0 : -1}
                aria-disabled={entry.props.disabled || undefined}
                onClick={() => select(i)}
                onMouseEnter={() => !entry.props.disabled && setActive(i)}
                className={cn(
                  'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none',
                  entry.props.disabled
                    ? 'cursor-not-allowed text-muted-foreground/50'
                    : 'text-foreground focus:bg-muted',
                )}
              >
                {entry.props.children}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
