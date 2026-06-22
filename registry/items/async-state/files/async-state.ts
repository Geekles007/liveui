/**
 * The async contract every everstate component speaks.
 *
 * A component never invents its own loading / error / empty handling — it accepts
 * an `AsyncState<T>` and renders the matching slot. Model the five real-world
 * states of any async UI once, here, and reuse everywhere.
 *
 * This file is type-only at the type level and has zero runtime dependencies, so
 * it is safe to copy into any project (browser, server, RSC).
 */

/** The five names a piece of async data can be in, as a plain string union. */
export type AsyncStatus = 'idle' | 'loading' | 'empty' | 'error' | 'success';

/**
 * A discriminated union: the `status` field is the discriminant, and each member
 * carries exactly the data that makes sense for it — and nothing else. TypeScript
 * uses `status` to "narrow" the type, so `data` only exists on `success` and
 * `error`/`retry` only exist on `error`. That makes illegal states unrepresentable.
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; error: Error; retry?: () => void }
  | { status: 'success'; data: T };

// --- Constructors -----------------------------------------------------------
// Tiny helpers so callers write `success(data)` instead of the full object
// literal. They return `AsyncState<never>` for the data-less variants so they
// stay assignable to `AsyncState<T>` for any T.

export const idle = (): AsyncState<never> => ({ status: 'idle' });
export const loading = (): AsyncState<never> => ({ status: 'loading' });
export const empty = (): AsyncState<never> => ({ status: 'empty' });
export const error = (e: Error, retry?: () => void): AsyncState<never> => ({
  status: 'error',
  error: e,
  retry,
});
export const success = <T>(data: T): AsyncState<T> => ({ status: 'success', data });

// --- Type guards ------------------------------------------------------------
// Each returns a TypeScript type predicate, so inside an `if (isSuccess(s))`
// block the compiler knows `s.data` exists.

export const isIdle = <T>(s: AsyncState<T>): s is { status: 'idle' } => s.status === 'idle';
export const isLoading = <T>(s: AsyncState<T>): s is { status: 'loading' } =>
  s.status === 'loading';
export const isEmpty = <T>(s: AsyncState<T>): s is { status: 'empty' } => s.status === 'empty';
export const isError = <T>(
  s: AsyncState<T>,
): s is { status: 'error'; error: Error; retry?: () => void } => s.status === 'error';
export const isSuccess = <T>(s: AsyncState<T>): s is { status: 'success'; data: T } =>
  s.status === 'success';

// --- match ------------------------------------------------------------------

/** One handler per variant. The compiler forces you to cover all five. */
export interface AsyncHandlers<T, R> {
  idle: () => R;
  loading: () => R;
  empty: () => R;
  error: (error: Error, retry?: () => void) => R;
  success: (data: T) => R;
}

/**
 * Exhaustive pattern match over an `AsyncState`. This is the primitive that a
 * component like `state-boundary` uses to pick which slot to render — pass a
 * handler for each state and `match` runs the one that applies.
 *
 *   match(users, {
 *     idle: () => null,
 *     loading: () => <Skeleton />,
 *     empty: () => <Empty />,
 *     error: (e, retry) => <ErrorCard error={e} onRetry={retry} />,
 *     success: (data) => <List data={data} />,
 *   });
 *
 * Because the `switch` is exhaustive, adding a sixth variant to `AsyncState`
 * would make this fail to compile until you handle it — the compiler keeps every
 * consumer honest.
 */
export function match<T, R>(state: AsyncState<T>, handlers: AsyncHandlers<T, R>): R {
  switch (state.status) {
    case 'idle':
      return handlers.idle();
    case 'loading':
      return handlers.loading();
    case 'empty':
      return handlers.empty();
    case 'error':
      return handlers.error(state.error, state.retry);
    case 'success':
      return handlers.success(state.data);
  }
}

// --- fromResult -------------------------------------------------------------

export interface FromResultOptions<T> {
  /** Force the error state regardless of `data`. */
  error?: Error;
  /** Decide whether a resolved value should render the dedicated empty slot. */
  isEmpty?: (data: T) => boolean;
}

/**
 * Normalize a fetched value into an `AsyncState`. A resolved-but-empty value
 * (empty array, null) becomes the dedicated `empty` state; `undefined` is treated
 * as still-loading. Wire it straight onto a fetcher:
 *
 *   const state = fromResult(data, { error });
 */
export function fromResult<T>(
  data: T | undefined,
  options: FromResultOptions<T> = {},
): AsyncState<T> {
  if (options.error) return { status: 'error', error: options.error };
  if (data === undefined) return { status: 'loading' };
  const isEmptyFn = options.isEmpty ?? defaultIsEmpty;
  return isEmptyFn(data) ? { status: 'empty' } : { status: 'success', data };
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  return data == null;
}
