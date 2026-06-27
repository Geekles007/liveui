// Resolved via the vitest aliases (registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `ibirdui add`.
import { type StreamController, useStream } from '@/hooks/use-stream';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useStream', () => {
  it('starts loading until the first value arrives', () => {
    let ctl!: StreamController<number>;
    const { result } = renderHook(() =>
      useStream<number>((s) => {
        ctl = s;
      }),
    );
    expect(result.current.state.status).toBe('loading');
    expect(typeof ctl.emit).toBe('function');
  });

  it('appends emitted values into the success buffer', () => {
    let ctl!: StreamController<number>;
    const { result } = renderHook(() =>
      useStream<number>((s) => {
        ctl = s;
      }),
    );

    act(() => ctl.emit(1));
    act(() => ctl.emit(2));

    const state = result.current.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') expect(state.data).toEqual([1, 2]);
  });

  it('honours a sliding window via the limit option', () => {
    let ctl!: StreamController<number>;
    const { result } = renderHook(() =>
      useStream<number>(
        (s) => {
          ctl = s;
        },
        [],
        { limit: 2 },
      ),
    );

    act(() => ctl.emit(1));
    act(() => ctl.emit(2));
    act(() => ctl.emit(3));

    const state = result.current.state;
    expect(state.status === 'success' && state.data).toEqual([2, 3]);
  });

  it('moves to error with a retry callback and ignores later values', () => {
    let ctl!: StreamController<number>;
    const { result } = renderHook(() =>
      useStream<number>((s) => {
        ctl = s;
      }),
    );

    act(() => ctl.error(new Error('dropped')));
    const errored = result.current.state;
    expect(errored.status).toBe('error');
    if (errored.status === 'error') {
      expect(errored.error.message).toBe('dropped');
      expect(typeof errored.retry).toBe('function');
    }

    // Values from the dead subscription are ignored.
    act(() => ctl.emit(99));
    expect(result.current.state.status).toBe('error');
  });

  it('becomes empty when the stream closes without any value', () => {
    let ctl!: StreamController<number>;
    const { result } = renderHook(() =>
      useStream<number>((s) => {
        ctl = s;
      }),
    );

    act(() => ctl.close());
    expect(result.current.state.status).toBe('empty');
  });

  it('seeds the buffer from the initial option', () => {
    const { result } = renderHook(() =>
      useStream<number>(() => undefined, [], { initial: [7, 8] }),
    );
    const state = result.current.state;
    expect(state.status === 'success' && state.data).toEqual([7, 8]);
  });

  it('runs the subscription cleanup on unmount', () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() => useStream<number>(() => cleanup));
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
