'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type Side = 'top' | 'bottom' | 'left' | 'right';

const SIDE: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
};

export interface TooltipProps {
  /** The tip text/content. */
  content: React.ReactNode;
  /** The single interactive element the tip describes. */
  children: React.ReactElement;
  /** Which side of the trigger to show on. Default "top". */
  side?: Side;
  /** Delay before showing, in ms. Default 300. */
  delay?: number;
  className?: string;
}

/**
 * An accessible tooltip shown on hover and on keyboard focus. The tip is a
 * `role="tooltip"` wired to the trigger via `aria-describedby`, so screen-reader
 * users hear it too — not just mouse users. It appears after a short delay,
 * hides on blur / mouse-leave / Escape, and respects that focus tooltips should
 * show instantly.
 *
 *   <Tooltip content="Saved automatically">
 *     <button>Save</button>
 *   </Tooltip>
 *
 * `children` must be a single focusable element (a button, link, etc.) so the
 * tip can attach to it and be reachable by keyboard.
 */
export function Tooltip({ content, children, side = 'top', delay = 300, className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipId = React.useId();

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = (immediate: boolean) => {
    clear();
    if (immediate || delay <= 0) setVisible(true);
    else timer.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    clear();
    setVisible(false);
  };

  // Clear any pending show-timer on unmount.
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const child = React.Children.only(children);
  const trigger = React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
    'aria-describedby': visible ? tipId : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      (child.props as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter?.(e);
      show(false);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (child.props as { onMouseLeave?: (e: React.MouseEvent) => void }).onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      (child.props as { onFocus?: (e: React.FocusEvent) => void }).onFocus?.(e);
      show(true);
    },
    onBlur: (e: React.FocusEvent) => {
      (child.props as { onBlur?: (e: React.FocusEvent) => void }).onBlur?.(e);
      hide();
    },
  });

  return (
    <span
      className={cn('relative inline-block', className)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') hide();
      }}
    >
      {trigger}
      {visible && (
        <span
          role="tooltip"
          id={tipId}
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-xs rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md',
            SIDE[side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
