'use client';

import * as React from 'react';

export type ValidatorStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error';

export interface UseAsyncValidatorResult {
  status: ValidatorStatus;
  /** The message for the `invalid` and `error` statuses; otherwise null. */
  message: string | null;
}

export interface UseAsyncValidatorOptions {
  /** Debounce before hitting the server, in ms. Default 400. */
  debounceMs?: number;
  /** Pause checking (e.g. until another field is filled). Default true. */
  enabled?: boolean;
}

/**
 * Validate a value against the server as the user types — debounced, with the
 * checking / valid / invalid / error states the UI needs.
 *
 *   const username = form.values.username;
 *   const check = useAsyncValidator(username, async (v) =>
 *     (await api.usernameTaken(v)) ? 'That username is taken' : null,
 *   );
 *   // check.status: 'checking' → 'invalid' (check.message) | 'valid'
 *
 * `validate` resolves `null` (or an empty string) when the value is fine, or a
 * message string when it isn't; a rejection becomes the `error` status. An empty
 * value, or `enabled: false`, sits at `idle`. Out-of-order responses are ignored,
 * so a fast edit never gets overwritten by a slow earlier check.
 */
export function useAsyncValidator(
  value: string,
  validate: (value: string) => Promise<string | null>,
  options: UseAsyncValidatorOptions = {},
): UseAsyncValidatorResult {
  const { debounceMs = 400, enabled = true } = options;
  const [state, setState] = React.useState<UseAsyncValidatorResult>({
    status: 'idle',
    message: null,
  });

  const runId = React.useRef(0);
  const validateRef = React.useRef(validate);
  validateRef.current = validate;

  React.useEffect(() => {
    if (!enabled || value === '') {
      runId.current++; // cancel any in-flight check
      setState({ status: 'idle', message: null });
      return;
    }

    const id = ++runId.current;
    setState({ status: 'checking', message: null });

    const timer = setTimeout(() => {
      validateRef.current(value).then(
        (result) => {
          if (id !== runId.current) return;
          setState(
            result == null || result === ''
              ? { status: 'valid', message: null }
              : { status: 'invalid', message: result },
          );
        },
        (err: unknown) => {
          if (id !== runId.current) return;
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Validation failed',
          });
        },
      );
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, enabled, debounceMs]);

  return state;
}
