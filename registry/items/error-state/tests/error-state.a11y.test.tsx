import { ErrorState } from '@/components/error-state';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    // jsdom has no layout engine; colour-contrast can't be evaluated here.
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('ErrorState accessibility & behaviour', () => {
  it('renders as a role=alert so it is announced on appearance', () => {
    render(<ErrorState error="Could not load users" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load users');
  });

  it('shows the message from an Error object', () => {
    render(<ErrorState error={new Error('network down')} />);
    expect(screen.getByText('network down')).toBeInTheDocument();
  });

  it('renders a retry button only when onRetry is given, and calls it', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState error="boom" />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<ErrorState error="boom" onRetry={onRetry} retryLabel="Reload" />);
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('focuses the retry button on mount when autoFocus is set', () => {
    render(<ErrorState error="boom" onRetry={() => {}} autoFocus />);
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
  });

  it('does not steal focus by default', () => {
    render(<ErrorState error="boom" onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Try again' })).not.toHaveFocus();
  });

  it('exposes an Error stack inside a collapsed details disclosure', () => {
    const err = new Error('boom');
    err.stack = 'Error: boom\n  at somewhere';
    const { container } = render(<ErrorState error={err} />);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details).toHaveTextContent('at somewhere');
  });

  it('shows no details disclosure for a plain string error', () => {
    const { container } = render(<ErrorState error="just a message" />);
    expect(container.querySelector('details')).toBeNull();
  });

  it('has no axe violations with a retry button', async () => {
    const { container } = render(<ErrorState error="boom" onRetry={() => {}} />);
    await expectNoViolations(container);
  });
});
