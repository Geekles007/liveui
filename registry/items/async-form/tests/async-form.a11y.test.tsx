import { AsyncForm } from '@/components/async-form';
import { Field } from '@/components/field';
import { useForm } from '@/hooks/use-form';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

interface Values {
  email: string;
}

function Harness({ onSubmit }: { onSubmit: (v: Values) => Promise<unknown> }) {
  const form = useForm<Values>({
    initialValues: { email: '' },
    validate: (v) => (v.email ? {} : { email: 'Email is required' }),
    onSubmit,
  });
  return (
    <AsyncForm form={form} aria-label="Sign up">
      <Field label="Email" error={form.errors.email}>
        <input type="email" {...form.register('email')} />
      </Field>
      <button type="submit" disabled={form.submitting}>
        Sign up
      </button>
    </AsyncForm>
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('AsyncForm accessibility & behaviour', () => {
  it('blocks submit on validation error and focuses the first invalid field', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<Harness onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(onSubmit).not.toHaveBeenCalled();
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('submits valid values', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<Harness onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'a@b.co' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.co' }));
  });

  it('shows a form-level alert and focuses it when the server rejects', async () => {
    const onSubmit = vi.fn(() => Promise.reject(new Error('Server is down')));
    render(<Harness onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'a@b.co' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Server is down');
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness onSubmit={() => Promise.resolve()} />);
    await expectNoViolations(container);
  });
});
