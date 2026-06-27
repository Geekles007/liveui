'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce a fast-changing value: returns a copy that only updates once `delay`
 * ms have passed without a new change. Ideal for search inputs, so you fetch on
 * the settled value instead of on every keystroke.
 *
 *   const [query, setQuery] = useState('');
 *   const debounced = useDebounce(query, 300);
 *   const results = useAsync(() => api.search(debounced), [debounced]);
 *
 * Each change resets the timer, so the returned value trails the live one until
 * typing stops. SSR-safe: the first render returns the initial value as-is.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
