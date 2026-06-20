import { StateBoundary } from '@/components/state-boundary';
// Resolved via the vitest aliases (see registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `liveui add`.
import { error, loading, success } from '@/lib/async-state';
import { cleanup, render, screen } from '@testing-library/react';
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

describe('StateBoundary accessibility', () => {
  it('has no axe violations in the loading state', async () => {
    const { container } = render(<StateBoundary state={loading()}>{() => null}</StateBoundary>);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });

  it('announces state via a polite live region', () => {
    render(<StateBoundary state={loading()}>{() => null}</StateBoundary>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading…');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('exposes errors as an alert with no violations', async () => {
    const { container } = render(
      <StateBoundary state={error(new Error('Network down'))}>{() => null}</StateBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await expectNoViolations(container);
  });

  it('moves focus to the retry control when an error appears', () => {
    const retry = vi.fn();
    render(<StateBoundary state={error(new Error('Boom'), retry)}>{() => null}</StateBoundary>);
    const button = screen.getByRole('button', { name: /try again/i });
    expect(document.activeElement).toBe(button);
  });

  it('renders resolved content in the success state', async () => {
    const { container } = render(
      <StateBoundary state={success(['a', 'b'])}>
        {(data) => <p>{data.join(',')}</p>}
      </StateBoundary>,
    );
    expect(screen.getByText('a,b')).toBeInTheDocument();
    await expectNoViolations(container);
  });
});
