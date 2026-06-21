'use client';

import { StateBoundary } from '@/components/state-boundary';
import type { AsyncState } from '@/lib/async-state';
import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface Column<T> {
  /** Stable key; also the default accessor for cell content and sorting. */
  key: string;
  /** Header label. */
  header: React.ReactNode;
  /** Render a cell. Defaults to `String(item[key])`. */
  cell?: (item: T) => React.ReactNode;
  /** Make the column sortable. */
  sortable?: boolean;
  /** Value used to sort. Defaults to `item[key]`. */
  sortValue?: (item: T) => string | number;
  /** Text alignment. Default "left". */
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  /** The rows as an async state — wire it straight from your fetcher / useAsync. */
  state: AsyncState<T[]>;
  /** Column definitions. */
  columns: Column<T>[];
  /** Stable key per row. */
  getKey: (item: T) => React.Key;
  /** Accessible name for the table (rendered as a visually-hidden caption). */
  label: string;
  /** Skeleton rows while loading. Default 5. */
  loadingRows?: number;
  /** Custom empty slot. */
  empty?: React.ReactNode;
  className?: string;
}

type Sort = { key: string; dir: 'asc' | 'desc' } | null;

function get<T>(item: T, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function cmp(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function sortRows<T>(rows: T[], sort: Sort, columns: Column<T>[]): T[] {
  if (!sort) return rows;
  const col = columns.find((c) => c.key === sort.key);
  if (!col) return rows;
  const value = col.sortValue ?? ((item: T) => get(item, col.key) as string | number);
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => cmp(value(a), value(b)) * factor);
}

/**
 * A table over an `AsyncState<T[]>` that is state-complete by construction:
 * loading shows skeleton rows, empty/error are handled by the underlying
 * `state-boundary`, and sortable columns expose `aria-sort` plus a polite
 * announcement on every sort change. You describe columns; the table does the rest.
 */
export function DataTable<T>({
  state,
  columns,
  getKey,
  label,
  loadingRows = 5,
  empty,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<Sort>(null);
  const [announce, setAnnounce] = React.useState('');

  const toggleSort = (col: Column<T>) => {
    setSort((prev) => {
      let next: Sort;
      if (!prev || prev.key !== col.key) next = { key: col.key, dir: 'asc' };
      else if (prev.dir === 'asc') next = { key: col.key, dir: 'desc' };
      else next = null; // third activation clears the sort
      const label = typeof col.header === 'string' ? col.header : col.key;
      setAnnounce(
        next
          ? `Sorted by ${label}, ${next.dir === 'asc' ? 'ascending' : 'descending'}`
          : 'Sorting cleared',
      );
      return next;
    });
  };

  const alignClass = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('w-full', className)}>
      {/* Polite live region for sort changes; the boundary announces state changes. */}
      <span
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announce}
      </span>

      <StateBoundary
        state={state}
        labels={{
          success: undefined,
          empty: `No ${label.toLowerCase()}`,
        }}
        loading={
          <SkeletonTable
            columns={columns}
            rows={loadingRows}
            label={label}
            alignClass={alignClass}
          />
        }
        empty={empty}
      >
        {(rows) => {
          const sorted = sortRows(rows, sort, columns);
          return (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">{label}</caption>
                <thead>
                  <tr className="border-b bg-muted/40">
                    {columns.map((col) => {
                      const active = sort?.key === col.key;
                      const ariaSort = !col.sortable
                        ? undefined
                        : active
                          ? sort?.dir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none';
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={ariaSort}
                          className={cn(
                            'px-4 py-2.5 font-medium text-muted-foreground',
                            alignClass(col.align),
                          )}
                        >
                          {col.sortable ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(col)}
                              className="inline-flex items-center gap-1.5 rounded font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {col.header}
                              <SortGlyph dir={active ? sort?.dir : undefined} />
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item) => (
                    <tr key={getKey(item)} className="border-b last:border-0 hover:bg-muted/30">
                      {columns.map((col) => (
                        <td key={col.key} className={cn('px-4 py-3', alignClass(col.align))}>
                          {col.cell ? col.cell(item) : String(get(item, col.key) ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </StateBoundary>
    </div>
  );
}

function SortGlyph({ dir }: { dir?: 'asc' | 'desc' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      {dir === 'asc' ? (
        <path d="M8 14l4-4 4 4" />
      ) : dir === 'desc' ? (
        <path d="M8 10l4 4 4-4" />
      ) : (
        <path d="M8 9l4-4 4 4M8 15l4 4 4-4" strokeOpacity="0.5" />
      )}
    </svg>
  );
}

function SkeletonTable<T>({
  columns,
  rows,
  label,
  alignClass,
}: {
  columns: Column<T>[];
  rows: number;
  label: string;
  alignClass: (a?: Column<T>['align']) => string;
}) {
  return (
    <div
      className="overflow-x-auto rounded-md border"
      aria-busy="true"
      aria-label={`Loading ${label}`}
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b bg-muted/40">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-2.5 font-medium text-muted-foreground',
                  alignClass(col.align),
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-hidden="true">
          {Array.from({ length: rows }).map((_, r) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            <tr key={r} className="border-b last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
