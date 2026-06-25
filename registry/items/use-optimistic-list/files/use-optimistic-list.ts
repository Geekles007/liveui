'use client';

import type { AsyncState } from '@/lib/async-state';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Key = string | number;

/** A pending overlay on top of the source list, keyed for de-duplication. */
type Op<T> =
  | { type: 'add'; key: Key; item: T; settled: boolean }
  | { type: 'remove'; key: Key; settled: boolean }
  | { type: 'update'; key: Key; patch: Partial<T>; settled: boolean };

export interface UseOptimisticListOptions<T> {
  /** Stable identity for an item. Defaults to `item.id`. */
  getKey?: (item: T) => Key;
}

export interface OptimisticMutators<T> {
  /**
   * Append `item` immediately. If `commit` is given, await it and revert the
   * add (re-throwing) if it rejects.
   */
  add: (item: T, commit?: () => Promise<unknown>) => Promise<void>;
  /**
   * Remove the item with `key` immediately. If `commit` is given, await it and
   * restore the item (re-throwing) if it rejects.
   */
  remove: (key: Key, commit?: () => Promise<unknown>) => Promise<void>;
  /**
   * Patch the item with `key` immediately. If `commit` is given, await it and
   * roll back the patch (re-throwing) if it rejects.
   */
  update: (key: Key, patch: Partial<T>, commit?: () => Promise<unknown>) => Promise<void>;
}

function baseFrom<T>(source: AsyncState<T[]> | T[]): T[] {
  if (Array.isArray(source)) return source;
  return source.status === 'success' ? source.data : [];
}

/**
 * Mutate a list optimistically. Changes show on screen the instant you call a
 * mutator; if you pass a `commit` that rejects, the change is rolled back
 * automatically and the error re-thrown so you can surface it.
 *
 *   const [items, mutate] = useOptimisticList(todos.state);
 *   mutate.add(draft, () => api.todos.create(draft));     // shows instantly
 *   mutate.remove(id, () => api.todos.delete(id));        // reverts on error
 *
 * Overlays settle on their own: once the source list refetches and reflects a
 * committed change, the matching overlay is dropped, so the server stays the
 * source of truth. Pass a plain array as the source if you don't use AsyncState.
 */
export function useOptimisticList<T>(
  source: AsyncState<T[]> | T[],
  options: UseOptimisticListOptions<T> = {},
): [T[], OptimisticMutators<T>] {
  const getKeyRef = useRef<(item: T) => Key>(() => '' as Key);
  getKeyRef.current = options.getKey ?? ((item: T) => (item as unknown as { id: Key }).id);

  const base = baseFrom(source);
  const [ops, setOps] = useState<Op<T>[]>([]);

  // Guard against settling/reverting after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // When the source catches up to a committed change, drop the settled overlays
  // so the server remains authoritative. Keyed on the base's identity signature.
  const baseSignature = base.map((item) => getKeyRef.current(item)).join('|');
  // biome-ignore lint/correctness/useExhaustiveDependencies: baseSignature is the derived trigger for "the source changed".
  useEffect(() => {
    setOps((prev) => (prev.some((o) => o.settled) ? prev.filter((o) => !o.settled) : prev));
  }, [baseSignature]);

  const items = useMemo(() => {
    const getKey = getKeyRef.current;
    const removed = new Set(ops.filter((o) => o.type === 'remove').map((o) => o.key));
    const patches = new Map(
      ops.flatMap((o) => (o.type === 'update' ? [[o.key, o.patch] as const] : [])),
    );

    const result = base
      .filter((item) => !removed.has(getKey(item)))
      .map((item) => {
        const patch = patches.get(getKey(item));
        return patch ? { ...item, ...patch } : item;
      });

    // Append optimistic adds whose key isn't already present in the source.
    const present = new Set(result.map(getKey));
    for (const o of ops) {
      if (o.type === 'add' && !present.has(o.key)) result.push(o.item);
    }
    return result;
  }, [base, ops]);

  const settle = useCallback((key: Key) => {
    if (!mounted.current) return;
    setOps((prev) => prev.map((o) => (o.key === key ? { ...o, settled: true } : o)));
  }, []);

  const drop = useCallback((key: Key) => {
    if (!mounted.current) return;
    setOps((prev) => prev.filter((o) => o.key !== key));
  }, []);

  // Replace any existing overlay for a key, so the latest intent wins.
  const put = useCallback((op: Op<T>) => {
    setOps((prev) => [...prev.filter((o) => o.key !== op.key), op]);
  }, []);

  const run = useCallback(
    (key: Key, commit?: () => Promise<unknown>): Promise<void> => {
      if (!commit) return Promise.resolve();
      return Promise.resolve(commit()).then(
        () => settle(key),
        (err) => {
          drop(key);
          throw err;
        },
      );
    },
    [settle, drop],
  );

  const mutate = useMemo<OptimisticMutators<T>>(
    () => ({
      add: (item, commit) => {
        const key = getKeyRef.current(item);
        put({ type: 'add', key, item, settled: !commit });
        return run(key, commit);
      },
      remove: (key, commit) => {
        put({ type: 'remove', key, settled: !commit });
        return run(key, commit);
      },
      update: (key, patch, commit) => {
        put({ type: 'update', key, patch, settled: !commit });
        return run(key, commit);
      },
    }),
    [put, run],
  );

  return [items, mutate];
}
