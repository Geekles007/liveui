'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseClipboardOptions {
  /** How long `copied` stays true after a successful copy, in ms. Default 2000. */
  timeout?: number;
}

export interface UseClipboardResult {
  /** Copy `text`. Resolves to true on success, false on failure. */
  copy: (text: string) => Promise<boolean>;
  /** True for `timeout` ms after a successful copy — drive a "Copied!" label. */
  copied: boolean;
  /** The error from the last failed copy, or null. */
  error: Error | null;
}

/**
 * Copy text to the clipboard and get a self-resetting `copied` flag back — so a
 * button can flash "Copied!" then return to normal, with no timer plumbing.
 *
 *   const { copy, copied } = useClipboard();
 *   <button onClick={() => copy(url)}>{copied ? 'Copied!' : 'Copy link'}</button>
 *
 * Wraps the async Clipboard API: `copy` resolves to a boolean and never throws,
 * exposing any failure (e.g. missing permission) via `error`. The `copied` flag
 * clears itself after `timeout` ms, and is cancelled cleanly on unmount.
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardResult {
  const { timeout = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
          throw new Error('Clipboard API unavailable');
        }
        await navigator.clipboard.writeText(text);
        if (!mounted.current) return true;
        setError(null);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (mounted.current) setCopied(false);
        }, timeout);
        return true;
      } catch (err) {
        if (mounted.current) {
          setCopied(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
        return false;
      }
    },
    [timeout],
  );

  return { copy, copied, error };
}
