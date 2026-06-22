// Resolved via the vitest alias (registry/vitest.config.ts), mirroring the
// "@/lib/async-state" path a consumer gets after `ibirdui add`.
import { error, fromResult, isSuccess, loading, match, success } from '@/lib/async-state';
import { describe, expect, it, vi } from 'vitest';

describe('constructors', () => {
  it('build the right discriminated shape', () => {
    expect(loading()).toEqual({ status: 'loading' });
    expect(success([1, 2])).toEqual({ status: 'success', data: [1, 2] });
  });
});

describe('type guards', () => {
  it('narrow the union', () => {
    const s = success(42);
    expect(isSuccess(s)).toBe(true);
    // inside the guard, TypeScript knows `s.data` exists
    if (isSuccess(s)) expect(s.data).toBe(42);
  });
});

describe('match', () => {
  it('runs the handler for the active variant', () => {
    const render = (s: ReturnType<typeof success<number[]>> | ReturnType<typeof loading>) =>
      match(s, {
        idle: () => 'idle',
        loading: () => 'spinner',
        empty: () => 'nothing',
        error: () => 'oops',
        success: (data) => `${data.length} items`,
      });
    expect(render(loading())).toBe('spinner');
    expect(render(success([1, 2, 3]))).toBe('3 items');
  });

  it('passes the retry callback through the error handler', () => {
    const retry = vi.fn();
    const out = match(error(new Error('boom'), retry), {
      idle: () => null,
      loading: () => null,
      empty: () => null,
      error: (_e, r) => r,
      success: () => null,
    });
    out?.();
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe('fromResult', () => {
  it('maps undefined → loading, [] → empty, value → success', () => {
    expect(fromResult<number[]>(undefined).status).toBe('loading');
    expect(fromResult([]).status).toBe('empty');
    expect(fromResult([1]).status).toBe('success');
  });

  it('prefers an explicit error and honours a custom isEmpty', () => {
    expect(fromResult([1], { error: new Error('x') }).status).toBe('error');
    expect(fromResult({ rows: [] }, { isEmpty: (d) => d.rows.length === 0 }).status).toBe('empty');
  });
});
