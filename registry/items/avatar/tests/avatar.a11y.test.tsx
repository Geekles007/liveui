import { Avatar } from '@/components/avatar';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

describe('Avatar accessibility & behaviour', () => {
  it('shows initials labelled with the name when there is no image', () => {
    render(<Avatar name="Ada Lovelace" />);
    const img = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(img).toHaveTextContent('AL');
    // No actual <img> element rendered without a src.
    expect(document.querySelector('img')).toBeNull();
  });

  it('renders the image with alt defaulting to the name, plus a loading skeleton', () => {
    const { container } = render(<Avatar src="/a.png" name="Grace Hopper" />);
    const el = container.querySelector('img');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('alt')).toBe('Grace Hopper');
    // While loading, a decorative skeleton is shown underneath.
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('falls back to initials when the image fails to load', () => {
    const { container } = render(<Avatar src="/missing.png" name="Alan Turing" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Alan Turing' })).toHaveTextContent('AT');
  });

  it('reveals the image and drops the skeleton once it loads', () => {
    const { container } = render(<Avatar src="/a.png" name="Grace Hopper" />);
    const el = container.querySelector('img') as HTMLImageElement;
    fireEvent.load(el);
    expect(el.className).toContain('opacity-100');
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('is decorative (no accessible name) when given neither name nor src', () => {
    render(<Avatar />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('prefers an explicit alt over the name for the image', () => {
    const { container } = render(
      <Avatar src="/a.png" name="Grace Hopper" alt="Rear Admiral Hopper" />,
    );
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Rear Admiral Hopper');
  });

  it('forwards className and arbitrary props onto the root', () => {
    const { container } = render(<Avatar name="Ada" className="ring-2" data-testid="av" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('ring-2');
    expect(root.getAttribute('data-testid')).toBe('av');
  });

  it('has no axe violations for the image and the initials fallback', async () => {
    const loaded = render(<Avatar src="/a.png" name="Grace Hopper" />);
    fireEvent.load(loaded.container.querySelector('img') as HTMLImageElement);
    await expectNoViolations(loaded.container);
    cleanup();
    const fallback = render(<Avatar name="Ada Lovelace" />);
    await expectNoViolations(fallback.container);
  });
});
