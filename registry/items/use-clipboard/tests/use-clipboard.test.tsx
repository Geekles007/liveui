import { useClipboard } from '@/hooks/use-clipboard';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mockClipboard(writeText: (t: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => vi.restoreAllMocks());

describe('useClipboard', () => {
  beforeEach(() => vi.useRealTimers());

  it('copies text and flips copied to true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const { result } = renderHook(() => useClipboard());

    let ok!: boolean;
    await act(async () => {
      ok = await result.current.copy('hello');
    });

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('resets copied after the timeout', async () => {
    vi.useFakeTimers();
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useClipboard({ timeout: 1000 }));

    await act(async () => {
      await result.current.copy('hi');
    });
    expect(result.current.copied).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.copied).toBe(false);
    vi.useRealTimers();
  });

  it('reports a failure via error and returns false', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const { result } = renderHook(() => useClipboard());

    let ok!: boolean;
    await act(async () => {
      ok = await result.current.copy('x');
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    await waitFor(() => expect(result.current.error?.message).toBe('denied'));
  });
});
