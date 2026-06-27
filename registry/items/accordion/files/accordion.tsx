'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface AccordionItemProps {
  /** The header label, rendered inside the disclosure button. */
  title: React.ReactNode;
  /**
   * Panel content. Pass a function to defer creating it until the panel is first
   * opened — so any fetch inside only runs on expand.
   */
  children: React.ReactNode | (() => React.ReactNode);
  disabled?: boolean;
}

/**
 * Declares one accordion section. It renders nothing on its own — {@link
 * Accordion} reads its props and orchestrates the headers and panels.
 */
export function AccordionItem(_props: AccordionItemProps): React.ReactNode {
  return null;
}

export interface AccordionProps {
  children: React.ReactNode;
  /** Allow several panels open at once. Default false (one at a time). */
  multiple?: boolean;
  /** Panels open on first render, by index. */
  defaultOpen?: number[];
  className?: string;
}

function isItem(node: React.ReactNode): node is React.ReactElement<AccordionItemProps> {
  return React.isValidElement(node) && node.type === AccordionItem;
}

/**
 * An accordion of disclosure panels with lazily-loaded content. Each panel is
 * mounted only when first opened, then kept alive — so an in-panel fetch runs
 * once, on expand. Implements the ARIA disclosure pattern: each header is a
 * `<button aria-expanded aria-controls>` paired with a `role="region"` panel,
 * and ↑/↓ move between headers with Home/End jumping to the ends.
 *
 *   <Accordion>
 *     <AccordionItem title="Shipping"><Shipping /></AccordionItem>
 *     <AccordionItem title="Returns">{() => <Returns />}</AccordionItem>
 *   </Accordion>
 */
export function Accordion({
  children,
  multiple = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const items = React.useMemo(() => React.Children.toArray(children).filter(isItem), [children]);
  const baseId = React.useId();
  const headerId = (i: number) => `${baseId}-header-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;

  const [open, setOpen] = React.useState<Set<number>>(() => new Set(defaultOpen));
  const [mounted, setMounted] = React.useState<Set<number>>(() => new Set(defaultOpen));
  const headerRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const toggle = (i: number) => {
    setMounted((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
    setOpen((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const nextEnabled = (from: number, dir: 1 | -1): number => {
    const n = items.length;
    for (let step = 1; step <= n; step++) {
      const i = (from + dir * step + n * step) % n;
      if (!items[i].props.disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let target: number | null = null;
    if (e.key === 'ArrowDown') target = nextEnabled(i, 1);
    else if (e.key === 'ArrowUp') target = nextEnabled(i, -1);
    else if (e.key === 'Home') target = nextEnabled(-1, 1);
    else if (e.key === 'End') target = nextEnabled(0, -1);
    if (target === null) return;
    e.preventDefault();
    headerRefs.current[target]?.focus();
  };

  return (
    <div className={cn('divide-y rounded-md border', className)}>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const { disabled, title } = item.props;
        const content = mounted.has(i)
          ? typeof item.props.children === 'function'
            ? (item.props.children as () => React.ReactNode)()
            : item.props.children
          : null;
        return (
          <div key={headerId(i)}>
            <h3 className="m-0">
              <button
                ref={(el) => {
                  headerRefs.current[i] = el;
                }}
                type="button"
                id={headerId(i)}
                aria-expanded={isOpen}
                aria-controls={panelId(i)}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={() => !disabled && toggle(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  disabled
                    ? 'cursor-not-allowed text-muted-foreground/50'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <span>{title}</span>
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
                  className={cn(
                    'shrink-0 transition-transform motion-reduce:transition-none',
                    isOpen && 'rotate-180',
                  )}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </h3>
            <div
              role="region"
              id={panelId(i)}
              aria-labelledby={headerId(i)}
              hidden={!isOpen}
              className="px-4 py-3 text-sm text-foreground"
            >
              {content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
