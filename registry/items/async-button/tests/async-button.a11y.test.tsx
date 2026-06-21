import { AsyncButton } from '@/components/async-button';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

/** A deferred promise we resolve/reject by hand to control the pending window. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('AsyncButton accessibility & behaviour', () => {
  it('has no axe violations at rest', async () => {
    const { container } = render(<AsyncButton>Save</AsyncButton>);
    await expectNoViolations(container);
  });

  it('disables and sets aria-busy while the promise is pending', async () => {
    const d = deferred<void>();
    render(<AsyncButton onClick={() => d.promise}>Save</AsyncButton>);
    const btn = screen.getByRole('button', { name: /save/i });

    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    expect(btn).toHaveAttribute('aria-busy', 'true');

    d.resolve();
    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(btn).not.toHaveAttribute('aria-busy');
  });

  it('ignores extra clicks while pending (no double-submit)', async () => {
    const d = deferred<void>();
    const onClick = vi.fn(() => d.promise);
    render(<AsyncButton onClick={onClick}>Save</AsyncButton>);
    const btn = screen.getByRole('button', { name: /save/i });

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    d.resolve();
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it('announces the error label when the promise rejects', async () => {
    const d = deferred<void>();
    render(
      <AsyncButton onClick={() => d.promise} errorLabel="Could not save">
        Save
      </AsyncButton>,
    );
    const btn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(btn);
    d.reject(new Error('boom'));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not save'));
    expect(btn).not.toBeDisabled();
  });

  it('stays a plain button for synchronous handlers', () => {
    const onClick = vi.fn();
    render(<AsyncButton onClick={onClick}>Go</AsyncButton>);
    const btn = screen.getByRole('button', { name: /go/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
    expect(btn).not.toHaveAttribute('aria-busy');
  });
});
