'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** Selected values (controlled). */
  value: string[];
  onChange: (values: string[]) => void;
  /** Accessible name and trigger label. */
  label: string;
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Choose several options from a list. A trigger button opens a popover of
 * checkboxes; the button summarises the selection. Built on native checkboxes in
 * a labelled group, so the multi-selection is conveyed correctly to assistive
 * tech without a custom listbox.
 *
 *   <MultiSelect options={tags} value={selected} onChange={setSelected} label="Tags" />
 *
 * Keyboard: the trigger opens/closes with Enter/Space, Escape closes and returns
 * focus to it, a click outside dismisses; the checkboxes use their native
 * keyboard behaviour.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelId = React.useId();

  const close = React.useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Dismiss on a click outside the whole control.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} selected`;

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onKeyDown={(e) => e.key === 'Escape' && open && close(true)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={cn('truncate', selectedLabels.length === 0 && 'text-muted-foreground')}>
          {summary}
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
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-background p-1 shadow-lg"
        >
          {options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex-1">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
