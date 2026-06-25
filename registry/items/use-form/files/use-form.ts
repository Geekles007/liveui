'use client';

import * as React from 'react';

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export type FormTouched<T> = Partial<Record<keyof T, boolean>>;

/**
 * Throw this from `onSubmit` (or reject with it) to map a server response onto
 * fields and/or a form-level message. A plain Error's message becomes the
 * form-level `submitError`.
 */
export interface SubmitError<T> {
  message?: string;
  fields?: FormErrors<T>;
}

export interface FieldBinding {
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onBlur: () => void;
}

export interface UseFormOptions<T extends Record<string, unknown>> {
  /** Starting values; also what `reset()` returns to. */
  initialValues: T;
  /** Synchronous validation run on submit (and after blur once touched). */
  validate?: (values: T) => FormErrors<T>;
  /** Submit handler. Reject/throw a SubmitError to surface field/form errors. */
  onSubmit: (values: T) => unknown;
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  values: T;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  /** True while `onSubmit` is in flight — wire it to your submit button. */
  submitting: boolean;
  /** Form-level error from a rejected submit (not tied to a field). */
  submitError: string | null;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setFieldError: (name: keyof T, message: string) => void;
  setErrors: (errors: FormErrors<T>) => void;
  reset: () => void;
  /** Spread onto a `field` control: `<input {...form.register('email')} />`. */
  register: (name: keyof T) => FieldBinding;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

function hasErrors<T>(errors: FormErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * The "traffic light" of a form: it tracks values, errors and the submit
 * lifecycle so you never wire pending/error state by hand.
 *
 *   const form = useForm({
 *     initialValues: { email: '' },
 *     validate: (v) => (v.email ? {} : { email: 'Required' }),
 *     onSubmit: (v) => api.signup(v),
 *   });
 *
 *   <form onSubmit={form.handleSubmit}>
 *     <Field label="Email" error={form.errors.email}>
 *       <input {...form.register('email')} />
 *     </Field>
 *     <AsyncButton type="submit" disabled={form.submitting}>Sign up</AsyncButton>
 *   </form>
 *
 * On submit it validates, then awaits `onSubmit`. A rejected submit carrying
 * `{ fields }` is mapped back onto the matching fields; anything else becomes the
 * form-level `submitError`.
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrorsState] = React.useState<FormErrors<T>>({});
  const [touched, setTouched] = React.useState<FormTouched<T>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const validateRef = React.useRef(validate);
  validateRef.current = validate;

  const setValue = React.useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as it's edited.
    setErrorsState((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const setFieldError = React.useCallback((name: keyof T, message: string) => {
    setErrorsState((prev) => ({ ...prev, [name]: message }));
  }, []);

  const setErrors = React.useCallback((next: FormErrors<T>) => {
    setErrorsState(next);
  }, []);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrorsState({});
    setTouched({});
    setSubmitError(null);
    setSubmitting(false);
  }, [initialValues]);

  const register = React.useCallback(
    (name: keyof T): FieldBinding => ({
      name: String(name),
      value: String(values[name] ?? ''),
      onChange: (e) => setValue(name, e.target.value as T[keyof T]),
      onBlur: () => {
        setTouched((prev) => ({ ...prev, [name]: true }));
        const next: FormErrors<T> = validateRef.current?.(values) ?? {};
        if (next[name]) setErrorsState((prev) => ({ ...prev, [name]: next[name] }));
      },
    }),
    [values, setValue],
  );

  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setSubmitError(null);

      const allTouched = Object.keys(values).reduce<FormTouched<T>>((acc, k) => {
        acc[k as keyof T] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      const validationErrors = validateRef.current?.(values) ?? {};
      if (hasErrors(validationErrors)) {
        setErrorsState(validationErrors);
        return;
      }
      setErrorsState({});

      setSubmitting(true);
      try {
        await onSubmit(values);
        if (mounted.current) setSubmitting(false);
      } catch (err) {
        if (!mounted.current) return;
        setSubmitting(false);
        const se = err as SubmitError<T> & { message?: string };
        if (se?.fields) {
          setErrorsState(se.fields);
          if (se.message) setSubmitError(se.message);
        } else {
          setSubmitError(se?.message || 'Something went wrong');
        }
      }
    },
    [values, onSubmit],
  );

  return {
    values,
    errors,
    touched,
    submitting,
    submitError,
    setValue,
    setFieldError,
    setErrors,
    reset,
    register,
    handleSubmit,
  };
}
