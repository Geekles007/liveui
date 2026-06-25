'use client';

import { useSyncExternalStore } from 'react';

/** Subscribe to the browser's connectivity events; returns the cleanup fn. */
function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  // There is no network to probe during SSR. Assume online so the first paint
  // never flashes an offline state that hydration would immediately correct.
  return true;
}

/**
 * Track the browser's online/offline status reactively.
 *
 *   const online = useOnline();
 *   if (!online) return <OfflineBanner />;
 *
 * Backed by `useSyncExternalStore`, so it is SSR-safe (assumes online on the
 * server) and free of tearing across concurrent renders.
 *
 * Note: it reports the browser's own `navigator.onLine` signal. That flag means
 * "the device has a network connection", not "the internet is reachable" — a
 * machine on a captive-portal Wi-Fi can read as online. Treat it as a fast,
 * best-effort hint, and confirm real reachability with an actual request when it
 * matters.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
