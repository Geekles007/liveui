'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface TabProps {
  /** The tab's label in the tablist. */
  title: React.ReactNode;
  /**
   * Panel content. Pass a function to defer creating it until the tab is first
   * opened — so any fetch inside only runs on view.
   */
  children: React.ReactNode | (() => React.ReactNode);
  disabled?: boolean;
}

/**
 * Declares one tab. It renders nothing on its own — {@link Tabs} reads its props
 * and orchestrates the tablist and panels.
 */
export function Tab(_props: TabProps): React.ReactNode {
  return null;
}

export interface TabsProps {
  children: React.ReactNode;
  /** Tab selected on first render, by index. Default 0. */
  defaultIndex?: number;
  /** Accessible name for the tablist. */
  label: string;
  /** Notified when the active tab changes. */
  onChange?: (index: number) => void;
  className?: string;
}

function isTab(node: React.ReactNode): node is React.ReactElement<TabProps> {
  return React.isValidElement(node) && node.type === Tab;
}

/**
 * An accessible tabs widget with lazily-loaded panels. Each panel's content is
 * mounted only when its tab is first opened, then kept alive — so switching back
 * is instant and an in-panel fetch runs once, on view.
 *
 *   <Tabs label="Profile sections">
 *     <Tab title="Overview"><Overview /></Tab>
 *     <Tab title="Activity">{() => <Activity />}</Tab>
 *   </Tabs>
 *
 * Implements the ARIA tabs pattern: a `role="tablist"` of `role="tab"` buttons
 * wired to their `role="tabpanel"` via `aria-controls` / `aria-labelledby`, with
 * roving tabindex and automatic activation — ←/→ move between tabs, Home/End
 * jump to the ends.
 */
export function Tabs({ children, defaultIndex = 0, label, onChange, className }: TabsProps) {
  const tabs = React.useMemo(() => React.Children.toArray(children).filter(isTab), [children]);
  const baseId = React.useId();
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;

  const [selected, setSelected] = React.useState(defaultIndex);
  const [mounted, setMounted] = React.useState<Set<number>>(() => new Set([defaultIndex]));
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const select = (i: number) => {
    setSelected(i);
    setMounted((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
    onChange?.(i);
  };

  // Next enabled tab in a direction, wrapping around and skipping disabled ones.
  const nextEnabled = (from: number, dir: 1 | -1): number => {
    const n = tabs.length;
    for (let step = 1; step <= n; step++) {
      const i = (from + dir * step + n * step) % n;
      if (!tabs[i].props.disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    let target: number | null = null;
    if (e.key === 'ArrowRight') target = nextEnabled(selected, 1);
    else if (e.key === 'ArrowLeft') target = nextEnabled(selected, -1);
    else if (e.key === 'Home') target = nextEnabled(-1, 1);
    else if (e.key === 'End') target = nextEnabled(0, -1);
    if (target === null) return;
    e.preventDefault();
    select(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 border-b">
        {tabs.map((tab, i) => {
          const isSelected = i === selected;
          return (
            <button
              key={tabId(i)}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(i)}
              aria-selected={isSelected}
              aria-controls={panelId(i)}
              aria-disabled={tab.props.disabled || undefined}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => !tab.props.disabled && select(i)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tab.props.disabled
                  ? 'cursor-not-allowed border-transparent text-muted-foreground/50'
                  : isSelected
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.props.title}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, i) => {
        const isSelected = i === selected;
        const content = mounted.has(i)
          ? typeof tab.props.children === 'function'
            ? (tab.props.children as () => React.ReactNode)()
            : tab.props.children
          : null;
        return (
          <div
            key={panelId(i)}
            role="tabpanel"
            id={panelId(i)}
            aria-labelledby={tabId(i)}
            hidden={!isSelected}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
