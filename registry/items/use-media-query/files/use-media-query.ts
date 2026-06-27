'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface UseMediaQueryOptions {
  /** Value returned during SSR and the first client render. Default false. */
  defaultState?: boolean;
}

/**
 * Track whether a CSS media query currently matches, reactively — for
 * responsive behaviour in JS (mobile vs desktop, `prefers-reduced-motion`,
 * `prefers-color-scheme`, …).
 *
 *   const isDesktop = useMediaQuery('(min-width: 768px)');
 *   const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 *
 * Backed by `useSyncExternalStore`, so it is SSR-safe (returns `defaultState` on
 * the server) and free of tearing across concurrent renders. It re-renders only
 * when the match actually flips.
 */
export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}): boolean {
  const { defaultState = false } = options;

  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query],
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => defaultState;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
