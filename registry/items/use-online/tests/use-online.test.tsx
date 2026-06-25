// Resolved via the vitest aliases (registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `ibirdui add`.
import { useOnline } from '@/hooks/use-online';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** jsdom's navigator.onLine is a getter; redefine it per test. */
function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

afterEach(() => {
  setOnLine(true);
  vi.restoreAllMocks();
});

describe('useOnline', () => {
  it('reflects navigator.onLine on first render', () => {
    setOnLine(true);
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
  });

  it('starts false when the browser already reports offline', () => {
    setOnLine(false);
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(false);
  });

  it('flips on the offline event and back on the online event', () => {
    setOnLine(true);
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('removes both listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnline());
    unmount();
    expect(remove).toHaveBeenCalledWith('online', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
