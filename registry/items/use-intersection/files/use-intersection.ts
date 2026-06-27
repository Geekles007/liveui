'use client';

import { useEffect, useState } from 'react';

export interface UseIntersectionOptions {
  /** Margin around the root, e.g. "200px" to fire before the element is on screen. */
  rootMargin?: string;
  /** Visibility ratio(s) that trigger a callback. Default 0. */
  threshold?: number | number[];
  /** Scroll container to test against. Default the viewport. */
  root?: Element | Document | null;
  /** Stop observing after the first time it becomes visible. Default false. */
  once?: boolean;
}

export interface UseIntersectionResult<T extends Element> {
  /** Attach to the element you want to watch: `<div ref={ref} />`. */
  ref: (node: T | null) => void;
  /** Whether the element is currently intersecting the root. */
  isIntersecting: boolean;
  /** The latest raw entry, for ratio / bounding-rect details. */
  entry: IntersectionObserverEntry | null;
}

/**
 * Know when an element enters the viewport, via `IntersectionObserver`. The
 * engine behind lazy-loading, infinite scroll and reveal-on-scroll — extracted
 * from `infinite-list` so you can reuse it anywhere.
 *
 *   const { ref, isIntersecting } = useIntersection({ rootMargin: '200px' });
 *   return <div ref={ref}>{isIntersecting && <HeavyChart />}</div>;
 *
 * Uses a callback ref, so it attaches the observer as soon as the node mounts
 * (no timing races). SSR-safe: it no-ops where `IntersectionObserver` is absent.
 * Pass `once` to disconnect after the first reveal.
 */
export function useIntersection<T extends Element = Element>(
  options: UseIntersectionOptions = {},
): UseIntersectionResult<T> {
  const { rootMargin, threshold, root, once = false } = options;
  const [node, setNode] = useState<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  // Serialise the threshold so an inline array doesn't re-create the observer
  // on every render.
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : threshold;

  // biome-ignore lint/correctness/useExhaustiveDependencies: threshold is tracked via thresholdKey to keep an inline array stable.
  useEffect(() => {
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const next = entries[entries.length - 1];
        if (!next) return;
        setEntry(next);
        if (next.isIntersecting && once) observer.disconnect();
      },
      { rootMargin, threshold, root: root ?? null },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin, thresholdKey, root, once]);

  return { ref: setNode, isIntersecting: entry?.isIntersecting ?? false, entry };
}
