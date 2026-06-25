import { Skeleton, SkeletonText } from '@/components/skeleton';
// Resolved via the vitest aliases (see registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `ibirdui add`.
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    // jsdom has no layout engine; colour-contrast can't be evaluated here.
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('Skeleton accessibility', () => {
  it('is hidden from the accessibility tree', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const el = container.firstElementChild;
    expect(el?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes no role or text content to assistive tech', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBeNull();
    expect(el.textContent).toBe('');
  });

  it('disables its animation under prefers-reduced-motion', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('motion-reduce:animate-none');
  });

  it('forwards className and arbitrary div props', () => {
    const { container } = render(<Skeleton className="h-10 w-10 rounded-full" data-testid="avatar" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-10');
    expect(el.getAttribute('data-testid')).toBe('avatar');
  });

  it('has no axe violations on its own', async () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    await expectNoViolations(container);
  });

  describe('SkeletonText', () => {
    it('renders the requested number of lines, all hidden', () => {
      const { container } = render(<SkeletonText lines={4} />);
      const group = container.firstElementChild as HTMLElement;
      expect(group.getAttribute('aria-hidden')).toBe('true');
      expect(group.children).toHaveLength(4);
    });

    it('defaults to three lines and never renders fewer than one', () => {
      const { container: a } = render(<SkeletonText />);
      expect((a.firstElementChild as HTMLElement).children).toHaveLength(3);
      cleanup();
      const { container: b } = render(<SkeletonText lines={0} />);
      expect((b.firstElementChild as HTMLElement).children).toHaveLength(1);
    });

    it('has no axe violations', async () => {
      const { container } = render(<SkeletonText lines={3} />);
      await expectNoViolations(container);
    });
  });
});
