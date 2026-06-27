import { Popover } from '@/components/popover';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

function renderPopover() {
  return render(
    <Popover label="Filters" title="Filter results">
      <button type="button">Apply</button>
    </Popover>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('Popover accessibility', () => {
  it('renders a collapsed trigger by default', async () => {
    const { container } = renderPopover();
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await expectNoViolations(container);
  });

  it('opens a labelled dialog and moves focus inside', async () => {
    const { container } = renderPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = screen.getByRole('dialog', { name: 'Filter results' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await expectNoViolations(container);
  });

  it('falls back to ariaLabel when there is no title', () => {
    render(
      <Popover label="Info" ariaLabel="More info">
        <p>Hello</p>
      </Popover>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Info' }));
    expect(screen.getByRole('dialog', { name: 'More info' })).toBeInTheDocument();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Filters' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
