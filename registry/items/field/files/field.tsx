'use client';

import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface FieldProps {
  /** Visible label, linked to the control via htmlFor. */
  label: React.ReactNode;
  /** The single form control — input, select, textarea, or any custom one. */
  children: React.ReactElement<{
    id?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
  }>;
  /** Error message. When set, the control is marked invalid and announced. */
  error?: string;
  /** Helper text under the label. */
  description?: React.ReactNode;
  /** Marks the control required and shows a marker on the label. */
  required?: boolean;
  className?: string;
}

/**
 * Wires a label, a control, an optional description and an error message into
 * one accessible block — the boilerplate every form field needs but most skip:
 *
 *  - the `<label>` is tied to the control via `htmlFor` / `id`,
 *  - `aria-describedby` points at the description and the error,
 *  - `aria-invalid` and `aria-required` track the state,
 *  - the error is a polite alert, announced when it appears.
 *
 * Pass exactly one control as the child; Field injects the wiring onto it:
 *
 *   <Field label="Email" error={form.errors.email} description="Work address">
 *     <input {...form.register('email')} />
 *   </Field>
 */
export function Field({ label, children, error, description, required, className }: FieldProps) {
  const id = React.useId();
  const descId = `${id}-desc`;
  const errId = `${id}-err`;

  const child = React.Children.only(children);
  const describedBy =
    [description ? descId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;

  const control = React.cloneElement(child, {
    id: child.props.id ?? id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={child.props.id ?? id} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {control}

      {error && (
        <p id={errId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
