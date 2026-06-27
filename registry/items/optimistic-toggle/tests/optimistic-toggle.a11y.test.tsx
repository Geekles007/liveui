import { OptimisticToggle } from '@/components/optimistic-toggle';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('OptimisticToggle accessibility', () => {
  it('exposes a labelled toggle button reflecting pressed', async () => {
    const { container } = render(
      <OptimisticToggle pressed={false} onToggle={() => Promise.resolve()} label="Like" />,
    );
    const button = screen.getByRole('button', { name: 'Like' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await expectNoViolations(container);
  });

  it('flips optimistically the instant it is pressed', () => {
    render(
      <OptimisticToggle pressed={false} onToggle={() => new Promise(() => {})} label="Like" />,
    );
    const button = screen.getByRole('button', { name: 'Like' });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('rolls back and announces when the commit rejects', async () => {
    const onToggle = vi.fn(() => Promise.reject(new Error('nope')));
    render(<OptimisticToggle pressed={false} onToggle={onToggle} label="Like" />);
    const button = screen.getByRole('button', { name: 'Like' });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByRole('status')).toHaveTextContent("Couldn't save");
  });

  it('settles the overlay when the pressed prop catches up', async () => {
    const onToggle = vi.fn(() => Promise.resolve());
    const { rerender } = render(
      <OptimisticToggle pressed={false} onToggle={onToggle} label="Like" />,
    );
    const button = screen.getByRole('button', { name: 'Like' });

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    // Server confirms; the prop now matches the optimistic value.
    rerender(<OptimisticToggle pressed={true} onToggle={onToggle} label="Like" />);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
