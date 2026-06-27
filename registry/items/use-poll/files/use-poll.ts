'use client';

import type { AsyncState } from '@/lib/async-state';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePollOptions<T> {
  /** Time between polls, in ms. Default 5000. */
  interval?: number;
  /** Poll while true; pause while false. Default true. */
  enabled?: boolean;
  /** Run once immediately, then every `interval`. Default true. */
  immediate?: boolean;
  /** Treat a resolved value as the dedicated `empty` state. Default: empty array / null. */
  isEmpty?: (data: T) => boolean;
}

export interface UsePollResult<T> {
  /** The current state, ready to hand to any ibirdui component. */
  state: AsyncState<T>;
  /** Poll now, off-schedule. Also wired into the `error` variant's retry(). */
  refetch: () => void;
  /** Pause polling. */
  stop: () => void;
  /** Resume polling. */
  start: () => void;
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  return data == null;
}

/**
 * Re-run an async fetcher on an interval and get back a typed `AsyncState<T>` —
 * for dashboards, queues and statuses that should refresh on their own. Only the
 * first load shows `loading`; later polls refresh in the background and swap the
 * data in without flashing a spinner, so the screen never blinks.
 *
 *   const jobs = usePoll(() => api.jobs.list(), [], { interval: 3000 });
 *   <DataList state={jobs.state} label="Jobs" getKey={(j) => j.id}>…</DataList>
 *
 * The fetcher re-runs whenever a `deps` entry changes (same contract as
 * `useEffect`). Out-of-order responses are ignored, so a slow poll never
 * overwrites a newer one. Pause/resume with `stop` / `start`, or force a poll
 * with `refetch`.
 */
export function usePoll<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UsePollOptions<T> = {},
): UsePollResult<T> {
  const { interval = 5000, enabled = true, immediate = true, isEmpty = defaultIsEmpty } = options;

  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  const [running, setRunning] = useState(enabled);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const start = useCallback(() => setRunning(true), []);
  const stop = useCallback(() => setRunning(false), []);

  // Read the latest fetcher without making it an effect trigger.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Guards against responses from a superseded poll or after teardown.
  const runId = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are the caller-provided trigger list, by design (same contract as useEffect); isEmpty is read at call time.
  useEffect(() => {
    if (!running) return;

    const tick = (isFirst: boolean) => {
      const id = ++runId.current;
      // Only the first load (with no data yet) shows the spinner; background
      // polls keep the current data until the new result lands.
      if (isFirst) {
        setState((prev) =>
          prev.status === 'success' || prev.status === 'empty' ? prev : { status: 'loading' },
        );
      }
      fetcherRef.current().then(
        (data) => {
          if (id !== runId.current) return;
          setState(isEmpty(data) ? { status: 'empty' } : { status: 'success', data });
        },
        (err: unknown) => {
          if (id !== runId.current) return;
          const error = err instanceof Error ? err : new Error(String(err));
          setState({ status: 'error', error, retry: refetch });
        },
      );
    };

    if (immediate) tick(true);
    const handle = setInterval(() => tick(false), interval);

    return () => {
      runId.current++; // invalidate any in-flight poll from this cycle
      clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, running, interval, immediate]);

  return { state, refetch, stop, start };
}
