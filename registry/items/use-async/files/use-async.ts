'use client';

import type { AsyncState } from '@/lib/async-state';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAsyncOptions<T> {
  /** Skip running until this turns true (e.g. wait for an id). Default true. */
  enabled?: boolean;
  /** Treat a resolved value as the dedicated `empty` state. Default: empty array / null. */
  isEmpty?: (data: T) => boolean;
}

export interface UseAsyncResult<T> {
  /** The current state, ready to hand to any ibirdui component. */
  state: AsyncState<T>;
  /** Re-run the fetcher. Also wired into the `error` variant's retry(). */
  refetch: () => void;
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  return data == null;
}

/**
 * Run an async function and get back a fully typed `AsyncState<T>` — including a
 * `retry` baked into the error variant — so you never assemble the union by hand.
 *
 *   const users = useAsync(() => api.users.list(), []);
 *   // users.state: AsyncState<User[]>
 *   <DataList state={users.state} … />
 *
 * The fetcher re-runs whenever an item in `deps` changes (same contract as
 * `useEffect`). Out-of-order responses are ignored, so a fast retry never gets
 * overwritten by a slow earlier request.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncOptions<T> = {},
): UseAsyncResult<T> {
  const { enabled = true, isEmpty = defaultIsEmpty } = options;
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  // Bumping this re-triggers the effect for a manual refetch.
  const [nonce, setNonce] = useState(0);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  // Guards against setting state after unmount or from a stale request.
  const runId = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are the caller-provided trigger list, by design (same contract as useEffect/useMemo).
  useEffect(() => {
    if (!enabled) return;
    const id = ++runId.current;
    setState({ status: 'loading' });

    fetcher().then(
      (data) => {
        if (id !== runId.current) return; // a newer request superseded this one
        setState(isEmpty(data) ? { status: 'empty' } : { status: 'success', data });
      },
      (err: unknown) => {
        if (id !== runId.current) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ status: 'error', error, retry: refetch });
      },
    );

    return () => {
      // Invalidate the in-flight request on unmount / dep change.
      runId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  return { state, refetch };
}
