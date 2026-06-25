import { FileUpload } from '@/components/file-upload';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

function makeFile(name: string, size = 100, type = 'image/png') {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
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

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

function dropFiles(zone: HTMLElement, files: File[]) {
  fireEvent.drop(zone, { dataTransfer: { files, types: ['Files'] } });
}

describe('FileUpload accessibility & behaviour', () => {
  it('renders a keyboard-operable dropzone and opens the picker on Enter', () => {
    const { container } = render(<FileUpload upload={() => Promise.resolve()} />);
    const zone = screen.getByRole('button', { name: /drag files/i });
    expect(zone).toHaveAttribute('tabindex', '0');

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(click).toHaveBeenCalledOnce();
  });

  it('uploads a dropped file, reports progress, then settles to success', async () => {
    const d = deferred<{ url: string }>();
    let report!: (pct: number) => void;
    const upload = vi.fn((_file: File, onProgress: (p: number) => void) => {
      report = onProgress;
      return d.promise;
    });
    const onComplete = vi.fn();

    render(<FileUpload upload={upload} onComplete={onComplete} />);
    dropFiles(screen.getByRole('button', { name: /drag files/i }), [makeFile('a.png')]);

    const bar = screen.getByRole('progressbar', { name: /uploading a\.png/i });
    expect(bar).toHaveAttribute('aria-valuenow', '0');

    act(() => report(42));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('42');

    await act(async () => {
      d.resolve({ url: '/a.png' });
      await d.promise;
    });
    await waitFor(() =>
      expect(screen.getByRole('progressbar', { name: /a\.png uploaded/i })).toHaveAttribute(
        'aria-valuenow',
        '100',
      ),
    );
    expect(onComplete).toHaveBeenCalledWith(expect.any(File), { url: '/a.png' });
    expect(screen.getByRole('status')).toHaveTextContent('a.png uploaded');
  });

  it('shows an alert and a working Retry when an upload fails', async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const upload = vi
      .fn<(f: File, p: (n: number) => void) => Promise<void>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    render(<FileUpload upload={upload} />);
    dropFiles(screen.getByRole('button', { name: /drag files/i }), [makeFile('b.png')]);

    await act(async () => {
      first.reject(new Error('network down'));
      await first.promise.catch(() => {});
    });
    expect(screen.getByRole('alert')).toHaveTextContent('network down');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(upload).toHaveBeenCalledTimes(2);
    // back to a progress bar while the retry is in flight
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await act(async () => {
      second.resolve();
      await second.promise;
    });
    await waitFor(() =>
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100'),
    );
  });

  it('rejects a file over maxSize with no retry, before uploading', () => {
    const upload = vi.fn(() => Promise.resolve());
    render(<FileUpload upload={upload} maxSize={1024} />);
    dropFiles(screen.getByRole('button', { name: /drag files/i }), [makeFile('big.png', 5000)]);

    expect(upload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/larger than/i);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('removes a file from the list', async () => {
    render(<FileUpload upload={() => new Promise(() => {})} />);
    dropFiles(screen.getByRole('button', { name: /drag files/i }), [makeFile('c.png')]);
    expect(screen.getByText('c.png')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove c.png' }));
    await waitFor(() => expect(screen.queryByText('c.png')).toBeNull());
  });

  it('replaces the list when multiple is false', () => {
    render(<FileUpload upload={() => new Promise(() => {})} multiple={false} />);
    const zone = screen.getByRole('button', { name: /drag files/i });
    dropFiles(zone, [makeFile('one.png')]);
    dropFiles(zone, [makeFile('two.png')]);
    expect(screen.queryByText('one.png')).toBeNull();
    expect(screen.getByText('two.png')).toBeInTheDocument();
  });

  it('has no axe violations with a file in progress', async () => {
    const { container } = render(<FileUpload upload={() => new Promise(() => {})} />);
    dropFiles(screen.getByRole('button', { name: /drag files/i }), [makeFile('d.png')]);
    await expectNoViolations(container);
  });
});
