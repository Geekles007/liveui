'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// --- date helpers (no dependency) -------------------------------------------
const DAY = 24 * 60 * 60 * 1000;
const isoKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const sameDay = (a: Date, b: Date) => isoKey(a) === isoKey(b);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const dayLabel = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
const fieldLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Six weeks (42 days) starting on the Sunday on/before the 1st — stable layout. */
function monthGrid(view: Date): Date[][] {
  const first = startOfMonth(view);
  const start = addDays(first, -first.getDay());
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i * 1)));
  }
  return weeks;
}

export interface DatePickerProps {
  /** Selected date (controlled), or null. */
  value: Date | null;
  onChange: (date: Date) => void;
  /** Accessible name and trigger label. */
  label: string;
  placeholder?: string;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  className?: string;
}

/**
 * A keyboard-accessible date picker: a trigger button opens a calendar dialog
 * with a `role="grid"` of days. It implements the ARIA calendar pattern —
 * roving tabindex, arrow keys move by day, Home/End jump to the week edges,
 * PageUp/PageDown change month, Enter/Space select, Escape closes and returns
 * focus to the trigger.
 *
 *   <DatePicker value={date} onChange={setDate} label="Due date" />
 */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Pick a date',
  min,
  max,
  disabled = false,
  className,
}: DatePickerProps) {
  const today = React.useMemo(() => new Date(), []);
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<Date>(startOfMonth(value ?? today));
  const [focused, setFocused] = React.useState<Date>(value ?? today);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const gridId = React.useId();

  const outOfRange = (d: Date) =>
    (min != null && d < new Date(min.getFullYear(), min.getMonth(), min.getDate())) ||
    (max != null && d > new Date(max.getFullYear(), max.getMonth(), max.getDate()));

  const openCalendar = () => {
    const start = value ?? today;
    setView(startOfMonth(start));
    setFocused(start);
    setOpen(true);
  };

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const moveFocus = (next: Date) => {
    setFocused(next);
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(startOfMonth(next));
    }
  };

  const select = (d: Date) => {
    if (outOfRange(d)) return;
    onChange(d);
    close(true);
  };

  // Move DOM focus to the focused day whenever it changes while open.
  React.useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-day="${isoKey(focused)}"]`)?.focus();
  }, [open, focused]);

  // Dismiss on click outside.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case 'ArrowRight':
        next = addDays(focused, 1);
        break;
      case 'ArrowLeft':
        next = addDays(focused, -1);
        break;
      case 'ArrowDown':
        next = addDays(focused, 7);
        break;
      case 'ArrowUp':
        next = addDays(focused, -7);
        break;
      case 'Home':
        next = addDays(focused, -focused.getDay());
        break;
      case 'End':
        next = addDays(focused, 6 - focused.getDay());
        break;
      case 'PageUp':
        next = addMonths(focused, -1);
        break;
      case 'PageDown':
        next = addMonths(focused, 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(focused);
        return;
      case 'Escape':
        e.preventDefault();
        close(true);
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close(false) : openCalendar())}
        className="flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={cn(!value && 'text-muted-foreground')}>
          {value ? fieldLabel(value) : placeholder}
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute z-10 mt-1 w-72 rounded-md border bg-background p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView(addMonths(view, -1))}
              className="rounded p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span aria-live="polite" className="text-sm font-medium">
              {monthLabel(view)}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView(addMonths(view, 1))}
              className="rounded p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* biome-ignore lint/a11y/useSemanticElements: an ARIA grid is the calendar pattern; a <table> can't carry the roving-tabindex day buttons cleanly. */}
          <div
            ref={gridRef}
            role="grid"
            id={gridId}
            aria-label={monthLabel(view)}
            onKeyDown={onGridKeyDown}
          >
            <div role="row" tabIndex={-1} className="grid grid-cols-7">
              {WEEKDAYS.map((wd) => (
                <span
                  key={wd}
                  role="columnheader"
                  className="py-1 text-center text-xs text-muted-foreground"
                >
                  {wd}
                </span>
              ))}
            </div>
            {monthGrid(view).map((week) => (
              <div role="row" tabIndex={-1} key={isoKey(week[0])} className="grid grid-cols-7">
                {week.map((day) => {
                  const inMonth = day.getMonth() === view.getMonth();
                  const isSelected = value != null && sameDay(day, value);
                  const isFocused = sameDay(day, focused);
                  const isToday = sameDay(day, today);
                  const disabledDay = outOfRange(day);
                  return (
                    <div role="gridcell" tabIndex={-1} key={isoKey(day)} aria-selected={isSelected}>
                      <button
                        type="button"
                        data-day={isoKey(day)}
                        tabIndex={isFocused ? 0 : -1}
                        disabled={disabledDay}
                        aria-label={dayLabel(day)}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => select(day)}
                        className={cn(
                          'aspect-square w-full rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40',
                          !inMonth && 'text-muted-foreground/50',
                          isSelected
                            ? 'bg-primary font-medium text-primary-foreground'
                            : 'hover:bg-muted',
                          isToday && !isSelected && 'font-semibold text-primary',
                        )}
                      >
                        {day.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
