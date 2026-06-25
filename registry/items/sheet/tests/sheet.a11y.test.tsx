import { Sheet } from '@/components/sheet';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('Sheet accessibility & behaviour', () => {
  it('renders nothing while closed', () => {
    render(
      <Sheet open={false} onOpenChange={() => {}} title="Edit profile">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders a modal dialog labelled by its title', () => {
    render(
      <Sheet open onOpenChange={() => {}} title="Edit profile" description="Update your details">
        <p>Body</p>
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Edit profile' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Update your details');
  });

  it('falls back to an aria-label when there is no title', () => {
    render(
      <Sheet open onOpenChange={() => {}} label="Filters">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('moves focus to the close button on open', async () => {
    render(
      <Sheet open onOpenChange={() => {}} title="Edit profile">
        <p>Body</p>
      </Sheet>,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  it('requests close on Escape, the close button and a backdrop click', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Sheet open onOpenChange={onOpenChange} title="Edit profile">
        <p>Body</p>
      </Sheet>,
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    // The backdrop is the outermost fixed wrapper.
    fireEvent.mouseDown(container.firstElementChild as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledTimes(3);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when interacting inside the panel', () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange} title="Edit profile">
        <p>Body</p>
      </Sheet>,
    );
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('traps Tab focus inside the panel', () => {
    render(
      <Sheet open onOpenChange={() => {}} title="Edit profile">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Sheet>,
    );
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('button', { name: 'Last' });

    last.focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(close).toHaveFocus(); // wraps from last back to the first focusable

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus(); // and back again
  });

  it('anchors to the requested side', () => {
    const { rerender } = render(
      <Sheet open onOpenChange={() => {}} title="X" side="left">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').className).toContain('left-0');
    rerender(
      <Sheet open onOpenChange={() => {}} title="X" side="bottom">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').className).toContain('bottom-0');
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(
      <Sheet open onOpenChange={() => {}} title="X">
        <p>Body</p>
      </Sheet>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <Sheet open={false} onOpenChange={() => {}} title="X">
        <p>Body</p>
      </Sheet>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('has no axe violations while open', async () => {
    const { container } = render(
      <Sheet open onOpenChange={() => {}} title="Edit profile" description="Update your details">
        <p>Body</p>
      </Sheet>,
    );
    // Flush the enter transition's state update under act before auditing.
    await waitFor(() => expect(screen.getByRole('dialog').className).toContain('translate-x-0'));
    await expectNoViolations(container);
  });
});
