import { usePoll } from '@/hooks/use-poll';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Flush microtasks (promise callbacks) while fake timers are active. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('usePoll', () => {
  it('loads immediately, then succeeds', async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2]);
    const { result } = renderHook(() => usePoll(fetcher, [], { interval: 1000 }));

    expect(result.current.state.status).toBe('loading');
    await flush();
    expect(result.current.state.status).toBe('success');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('re-fetches on each interval without flashing loading', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => usePoll(fetcher, [], { interval: 1000 }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    // Stays in success across the background poll — no loading flash.
    expect(result.current.state.status).toBe('success');
  });

  it('goes to error with a retry callback', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => usePoll(fetcher, [], { interval: 1000 }));
    await flush();

    const state = result.current.state;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.error.message).toBe('boom');
      expect(typeof state.retry).toBe('function');
    }
  });

  it('stops and resumes polling', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => usePoll(fetcher, [], { interval: 1000 }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => result.current.stop());
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1); // paused

    act(() => result.current.start());
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2); // immediate run on resume
  });

  it('treats an empty array as the empty state', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => usePoll(fetcher, [], { interval: 1000 }));
    await flush();
    expect(result.current.state.status).toBe('empty');
  });
});
