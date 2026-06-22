import { Toaster, toast } from '@/components/toast';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  act(() => toast.dismissAll());
  cleanup();
});

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('toast', () => {
  it('renders a success toast as a polite status with no violations', async () => {
    const { container } = render(<Toaster />);
    act(() => {
      toast.success('Saved');
    });
    const t = await screen.findByText('Saved');
    expect(t.closest('[role="status"]')).not.toBeNull();
    await expectNoViolations(container);
  });

  it('renders an error toast as an assertive alert', async () => {
    render(<Toaster />);
    act(() => {
      toast.error('Could not save');
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
  });

  it('promise() walks loading → success', async () => {
    render(<Toaster />);
    const d = deferred<void>();
    act(() => {
      toast.promise(d.promise, { loading: 'Saving…', success: 'Saved', error: 'Failed' });
    });
    expect(await screen.findByText('Saving…')).toBeInTheDocument();

    await act(async () => {
      d.resolve();
      await d.promise;
    });
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(screen.queryByText('Saving…')).not.toBeInTheDocument();
  });

  it('promise() walks loading → error on rejection', async () => {
    render(<Toaster />);
    const d = deferred<void>();
    act(() => {
      toast.promise(d.promise, {
        loading: 'Saving…',
        success: 'Saved',
        error: (e) => `Failed: ${e}`,
      });
    });
    await act(async () => {
      d.reject('boom');
      await d.promise.catch(() => {});
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed: boom');
  });

  it('dismisses on the close button', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('Bye');
    });
    await screen.findByText('Bye');
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    await waitFor(() => expect(screen.queryByText('Bye')).not.toBeInTheDocument());
  });
});
