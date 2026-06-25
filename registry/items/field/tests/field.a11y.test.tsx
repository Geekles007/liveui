import { Field } from '@/components/field';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('Field accessibility & behaviour', () => {
  it('links the label to the control', () => {
    render(
      <Field label="Email">
        <input type="email" />
      </Field>,
    );
    // getByLabelText resolves the label↔control association.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('describes the control with the helper text', () => {
    render(
      <Field label="Email" description="We never share it">
        <input type="email" />
      </Field>,
    );
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('We never share it');
  });

  it('marks the control invalid and announces the error', () => {
    render(
      <Field label="Email" error="Email is required">
        <input type="email" />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Email is required');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('sets aria-required when required (marker excluded from the accessible name)', () => {
    render(
      <Field label="Email" required>
        <input type="email" />
      </Field>,
    );
    // The "*" marker is aria-hidden, so the accessible name stays "Email".
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('keeps a control-provided id and links the label to it', () => {
    render(
      <Field label="Email">
        <input id="custom-email" type="email" />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'custom-email');
  });

  it('has no axe violations, with or without an error', async () => {
    const ok = render(
      <Field label="Name" description="Your full name">
        <input type="text" />
      </Field>,
    );
    await expectNoViolations(ok.container);
    cleanup();
    const bad = render(
      <Field label="Name" error="Required" required>
        <input type="text" />
      </Field>,
    );
    await expectNoViolations(bad.container);
  });
});
