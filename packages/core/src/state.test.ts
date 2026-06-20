import { describe, expect, it } from 'vitest';
import { type AsyncState, error, fromResult, loading, success } from './index.js';

describe('async state constructors', () => {
  it('builds discriminated states', () => {
    expect(loading()).toEqual({ status: 'loading' });
    expect(success([1, 2])).toEqual({ status: 'success', data: [1, 2] });
    const e = new Error('boom');
    expect(error(e)).toEqual({ status: 'error', error: e });
  });
});

describe('fromResult', () => {
  it('treats undefined as loading', () => {
    expect(fromResult<number[]>(undefined).status).toBe('loading');
  });

  it('treats an empty array as the empty state', () => {
    expect(fromResult([]).status).toBe('empty');
  });

  it('treats null as the empty state', () => {
    expect(fromResult(null).status).toBe('empty');
  });

  it('passes a populated value through as success', () => {
    const state = fromResult([1, 2, 3]);
    expect(state.status).toBe('success');
    if (state.status === 'success') expect(state.data).toEqual([1, 2, 3]);
  });

  it('prefers an explicit error', () => {
    const state: AsyncState<number[]> = fromResult([1], { error: new Error('x') });
    expect(state.status).toBe('error');
  });

  it('honours a custom isEmpty predicate', () => {
    const state = fromResult({ rows: [] }, { isEmpty: (d) => d.rows.length === 0 });
    expect(state.status).toBe('empty');
  });
});
