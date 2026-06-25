// Resolved via the vitest aliases (registry/vitest.config.ts).
import { useAsyncValidator } from '@/hooks/async-validator';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const opts = { debounceMs: 10 };

describe('useAsyncValidator', () => {
  it('sits idle for an empty value', () => {
    const { result } = renderHook(() => useAsyncValidator('', async () => null, opts));
    expect(result.current.status).toBe('idle');
  });

  it('goes checking → valid', async () => {
    const validate = vi.fn(async () => null);
    const { result } = renderHook(() => useAsyncValidator('ada', validate, opts));
    expect(result.current.status).toBe('checking');
    await waitFor(() => expect(result.current.status).toBe('valid'));
    expect(result.current.message).toBeNull();
  });

  it('reports invalid with the returned message', async () => {
    const { result } = renderHook(() =>
      useAsyncValidator('taken', async () => 'That username is taken', opts),
    );
    await waitFor(() => expect(result.current.status).toBe('invalid'));
    expect(result.current.message).toBe('That username is taken');
  });

  it('reports error when the check rejects', async () => {
    const { result } = renderHook(() =>
      useAsyncValidator('x', async () => Promise.reject(new Error('offline')), opts),
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.message).toBe('offline');
  });

  it('ignores out-of-order responses (only the latest value wins)', async () => {
    const validate = vi.fn(async (v: string) => (v === 'final' ? null : 'stale'));
    const { result, rerender } = renderHook(({ v }) => useAsyncValidator(v, validate, opts), {
      initialProps: { v: 'first' },
    });
    rerender({ v: 'final' });
    await waitFor(() => expect(result.current.status).toBe('valid'));
  });

  it('stays idle while disabled', () => {
    const validate = vi.fn(async () => null);
    const { result } = renderHook(() =>
      useAsyncValidator('ada', validate, { ...opts, enabled: false }),
    );
    expect(result.current.status).toBe('idle');
    expect(validate).not.toHaveBeenCalled();
  });
});
