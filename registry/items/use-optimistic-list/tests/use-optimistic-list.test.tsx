// Resolved via the vitest aliases (registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `ibirdui add`.
import { useOptimisticList } from '@/hooks/use-optimistic-list';
import { success } from '@/lib/async-state';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

interface Todo {
  id: number;
  title: string;
  done?: boolean;
}

/** A promise we settle by hand to control the commit window. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const base: Todo[] = [
  { id: 1, title: 'Buy milk' },
  { id: 2, title: 'Walk dog' },
];

function renderList(initial = base) {
  return renderHook(({ src }) => useOptimisticList(src), {
    initialProps: { src: success(initial) },
  });
}

describe('useOptimisticList', () => {
  it('passes the source list through untouched', () => {
    const { result } = renderList();
    expect(result.current[0]).toEqual(base);
  });

  it('also accepts a plain array source', () => {
    const { result } = renderHook(() => useOptimisticList(base));
    expect(result.current[0]).toHaveLength(2);
  });

  it('adds optimistically and keeps the item when the commit resolves', async () => {
    const d = deferred<void>();
    const { result } = renderList();

    let p!: Promise<void>;
    act(() => {
      p = result.current[1].add({ id: 3, title: 'Read book' }, () => d.promise);
    });
    // visible immediately, before the commit settles
    expect(result.current[0].map((t) => t.id)).toEqual([1, 2, 3]);

    await act(async () => {
      d.resolve();
      await p;
    });
    expect(result.current[0].map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('reverts the add and rethrows when the commit rejects', async () => {
    const d = deferred<void>();
    const { result } = renderList();

    let p!: Promise<void>;
    act(() => {
      p = result.current[1].add({ id: 3, title: 'Read book' }, () => d.promise);
    });
    expect(result.current[0]).toHaveLength(3);

    await act(async () => {
      d.reject(new Error('save failed'));
      await expect(p).rejects.toThrow('save failed');
    });
    expect(result.current[0].map((t) => t.id)).toEqual([1, 2]);
  });

  it('removes optimistically and restores the item when the commit rejects', async () => {
    const d = deferred<void>();
    const { result } = renderList();

    let p!: Promise<void>;
    act(() => {
      p = result.current[1].remove(1, () => d.promise);
    });
    expect(result.current[0].map((t) => t.id)).toEqual([2]);

    await act(async () => {
      d.reject(new Error('nope'));
      await expect(p).rejects.toThrow('nope');
    });
    expect(result.current[0].map((t) => t.id)).toEqual([1, 2]);
  });

  it('patches an item optimistically and rolls back on a rejected commit', async () => {
    const d = deferred<void>();
    const { result } = renderList();

    let p!: Promise<void>;
    act(() => {
      p = result.current[1].update(2, { done: true }, () => d.promise);
    });
    expect(result.current[0].find((t) => t.id === 2)?.done).toBe(true);

    await act(async () => {
      d.reject(new Error('x'));
      await expect(p).rejects.toThrow('x');
    });
    expect(result.current[0].find((t) => t.id === 2)?.done).toBeUndefined();
  });

  it('applies a commit-less mutation as a pure local change', () => {
    const { result } = renderList();
    act(() => {
      result.current[1].remove(1);
    });
    expect(result.current[0].map((t) => t.id)).toEqual([2]);
  });

  it('drops a settled overlay (no duplicate) once the source reflects it', async () => {
    const { result, rerender } = renderList();

    // Optimistic add with no commit → settled immediately.
    act(() => {
      result.current[1].add({ id: 3, title: 'Read book' });
    });
    expect(result.current[0]).toHaveLength(3);

    // The source refetches and now contains the added item.
    rerender({ src: success([...base, { id: 3, title: 'Read book' }]) });

    await waitFor(() => expect(result.current[0]).toHaveLength(3));
    expect(result.current[0].map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('exposes a stable mutators object across renders', () => {
    const { result, rerender } = renderList();
    const first = result.current[1];
    rerender({ src: success(base) });
    expect(result.current[1]).toBe(first);
  });
});
