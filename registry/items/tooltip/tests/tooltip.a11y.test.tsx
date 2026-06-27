import { Tooltip } from '@/components/tooltip';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

describe('Tooltip accessibility', () => {
  it('is hidden until the trigger is focused', () => {
    render(
      <Tooltip content="Saved automatically">
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('aria-describedby');
  });

  it('shows on focus and wires aria-describedby with no violations', async () => {
    const { container } = render(
      <Tooltip content="Saved automatically">
        <button type="button">Save</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.focus(button);

    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Saved automatically');
    expect(button).toHaveAttribute('aria-describedby', tip.id);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it('hides on blur', () => {
    render(
      <Tooltip content="Saved automatically">
        <button type="button">Save</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides on Escape', () => {
    render(
      <Tooltip content="Saved automatically">
        <button type="button">Save</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('preserves the child’s own handlers', () => {
    let focused = false;
    render(
      <Tooltip content="Tip">
        <button
          type="button"
          onFocus={() => {
            focused = true;
          }}
        >
          Save
        </button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Save' }));
    expect(focused).toBe(true);
  });
});
