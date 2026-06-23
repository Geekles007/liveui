import { ConfirmDialog, confirm } from '@/components/confirm-dialog';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('confirm-dialog', () => {
  it('opens an accessible alertdialog and focuses confirm, no axe violations', async () => {
    const { container } = render(<ConfirmDialog />);
    act(() => {
      confirm({ title: 'Delete project?', description: 'This cannot be undone.' });
    });
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete project?');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus());
    await expectNoViolations(container);
  });

  it('resolves true on confirm (no action)', async () => {
    render(<ConfirmDialog />);
    let result: boolean | undefined;
    act(() => {
      confirm({ title: 'Sure?' }).then((r) => {
        result = r;
      });
    });
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(result).toBe(true));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('resolves false on cancel', async () => {
    render(<ConfirmDialog />);
    let result: boolean | undefined;
    act(() => {
      confirm({ title: 'Sure?' }).then((r) => {
        result = r;
      });
    });
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(result).toBe(false));
  });

  it('runs the action with pending state, then closes on success', async () => {
    render(<ConfirmDialog />);
    const d = deferred<void>();
    const action = vi.fn(() => d.promise);
    let result: boolean | undefined;
    act(() => {
      confirm({ title: 'Delete?', action }).then((r) => {
        result = r;
      });
    });
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled());
    expect(action).toHaveBeenCalledOnce();

    await act(async () => {
      d.resolve();
      await d.promise;
    });
    await waitFor(() => expect(result).toBe(true));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open and shows the error when the action fails', async () => {
    render(<ConfirmDialog />);
    const d = deferred<void>();
    act(() => {
      confirm({ title: 'Delete?', action: () => d.promise });
    });
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await act(async () => {
      d.reject(new Error('Server exploded'));
      await d.promise.catch(() => {});
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
  });
});

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}
