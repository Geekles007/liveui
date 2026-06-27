import { OfflineBanner } from '@/components/offline-banner';
import { act, cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** jsdom's navigator.onLine is a getter; redefine it per test. */
function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

afterEach(() => {
  setOnLine(true);
  cleanup();
  vi.restoreAllMocks();
});

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('OfflineBanner accessibility', () => {
  it('renders nothing while online', () => {
    setOnLine(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an assertive alert when offline', async () => {
    setOnLine(false);
    const { container } = render(<OfflineBanner />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/offline/i);
    await expectNoViolations(container);
  });

  it('reacts to the offline event and flashes a polite reconnected note', () => {
    setOnLine(true);
    render(<OfflineBanner reconnectedDuration={1000} />);

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Back online');
  });

  it('skips the reconnected note when disabled', () => {
    setOnLine(true);
    render(<OfflineBanner reconnectedMessage={null} />);

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
