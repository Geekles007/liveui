'use client';

import type { AsyncState } from '@/lib/async-state';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Controls a single live subscription. The subscribe function receives one and
 * pushes the stream's events through it; ibirdui turns those into AsyncState.
 */
export interface StreamController<T> {
  /** Append one value. The first value flips the state from loading to success. */
  emit: (value: T) => void;
  /** Replace the whole buffer at once — e.g. a snapshot before live deltas. */
  set: (values: T[]) => void;
  /** Move to the error state and stop accepting values. retry() re-subscribes. */
  error: (err: unknown) => void;
  /** Signal the stream ended. With no values received, it becomes `empty`. */
  close: () => void;
}

/**
 * Open a subscription wired to `controller`. Return a cleanup function (called on
 * unmount, retry, or a deps change) — the same shape as an `addEventListener`
 * pair, an `EventSource`, or a `WebSocket` teardown.
 */
export type StreamSubscribe<T> = (controller: StreamController<T>) => undefined | (() => void);

export interface UseStreamOptions<T> {
  /** Skip subscribing until this turns true (e.g. wait for an id). Default true. */
  enabled?: boolean;
  /** Seed the buffer before the first value arrives. */
  initial?: T[];
  /** Keep only the most recent N values — a sliding window for busy feeds. */
  limit?: number;
}

export interface UseStreamResult<T> {
  /** The live buffer as an AsyncState — hand it to StreamingList or any list. */
  state: AsyncState<T[]>;
  /** Tear down and re-subscribe. Wired into the error variant's retry(). */
  retry: () => void;
}

/**
 * Subscribe to a stream of values (Server-Sent Events, a WebSocket, a Firestore
 * listener…) and get back a fully typed `AsyncState<T[]>` that fills in as events
 * arrive — so a live feed gets the same loading / empty / error handling as a
 * one-shot fetch.
 *
 *   const feed = useStream<Event>((s) => {
 *     const es = new EventSource('/feed');
 *     es.onmessage = (e) => s.emit(JSON.parse(e.data));
 *     es.onerror = () => s.error(new Error('stream dropped'));
 *     return () => es.close();
 *   });
 *   <StreamingList state={feed.state} label="Activity" getKey={(e) => e.id}>
 *     {(event) => <EventRow event={event} />}
 *   </StreamingList>
 *
 * The buffer lives outside React state, so rapid bursts each append cleanly. The
 * subscription re-opens whenever an item in `deps` changes (same contract as
 * `useEffect`), and any value that lands after teardown is ignored, so a fast
 * retry never gets clobbered by a stale connection.
 */
export function useStream<T>(
  subscribe: StreamSubscribe<T>,
  deps: unknown[] = [],
  options: UseStreamOptions<T> = {},
): UseStreamResult<T> {
  const { enabled = true, initial, limit } = options;
  const [state, setState] = useState<AsyncState<T[]>>({ status: 'idle' });

  // Bumping this re-triggers the effect for a manual retry.
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((n) => n + 1), []);

  // Read the latest subscribe fn without it being part of the effect triggers.
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  // Guards against values arriving after unmount or from a stale subscription.
  const runId = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are the caller-provided trigger list, by design (same contract as useEffect).
  useEffect(() => {
    if (!enabled) return;
    const id = ++runId.current;

    // The buffer lives in the closure so each value appends to the previous one,
    // independent of React's state batching.
    let buffer: T[] = initial ? [...initial] : [];
    setState(buffer.length ? { status: 'success', data: buffer } : { status: 'loading' });

    const live = () => id === runId.current;
    const cap = (next: T[]) => (limit != null && next.length > limit ? next.slice(-limit) : next);

    const controller: StreamController<T> = {
      emit(value) {
        if (!live()) return;
        buffer = cap([...buffer, value]);
        setState({ status: 'success', data: buffer });
      },
      set(values) {
        if (!live()) return;
        buffer = cap([...values]);
        setState(buffer.length ? { status: 'success', data: buffer } : { status: 'loading' });
      },
      error(err) {
        if (!live()) return;
        runId.current++; // invalidate: ignore anything that lands after the error
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ status: 'error', error, retry });
      },
      close() {
        if (!live()) return;
        if (buffer.length === 0) setState({ status: 'empty' });
      },
    };

    const cleanup = subscribeRef.current(controller);

    return () => {
      runId.current++; // ignore any late values from this subscription
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  return { state, retry };
}
