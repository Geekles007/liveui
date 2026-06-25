'use client';

import type { UseFormReturn } from '@/hooks/use-form';
import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface AsyncFormProps<T extends Record<string, unknown>>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** A form returned by `useForm`. */
  form: UseFormReturn<T>;
  children: React.ReactNode;
}

/**
 * The `<form>` companion to `useForm`. It submits through the form, surfaces the
 * form-level `submitError` as a `role="alert"`, and — the part most forms skip —
 * moves focus to the first invalid field (or the form error) after a failed
 * submit, so keyboard and screen-reader users land on what needs fixing.
 *
 *   <AsyncForm form={form} aria-label="Sign up">
 *     <Field label="Email" error={form.errors.email}>
 *       <input {...form.register('email')} />
 *     </Field>
 *     <AsyncButton type="submit" disabled={form.submitting}>Sign up</AsyncButton>
 *   </AsyncForm>
 *
 * Native validation is turned off (`noValidate`) so your validation and the
 * announcements own the experience.
 */
export function AsyncForm<T extends Record<string, unknown>>({
  form,
  children,
  className,
  ...rest
}: AsyncFormProps<T>) {
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    await form.handleSubmit(e);
    // After the errors render, land focus on the first thing to fix.
    requestAnimationFrame(() => {
      const target =
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        formRef.current?.querySelector<HTMLElement>('[data-form-error]');
      target?.focus();
    });
  };

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-4', className)}
      {...rest}
    >
      {form.submitError && (
        <div
          data-form-error
          role="alert"
          tabIndex={-1}
          className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive outline-none"
        >
          {form.submitError}
        </div>
      )}
      {children}
    </form>
  );
}
