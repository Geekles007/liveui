import { DatePicker } from '@/components/date-picker';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

// June 15, 2026 is a Monday — a stable anchor for the assertions.
const ANCHOR = new Date(2026, 5, 15);

function Controlled({ onPick }: { onPick?: (d: Date) => void }) {
  const [value, setValue] = React.useState<Date | null>(ANCHOR);
  return (
    <DatePicker
      value={value}
      onChange={(d) => {
        setValue(d);
        onPick?.(d);
      }}
      label="Due date"
    />
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('DatePicker accessibility & behaviour', () => {
  it('shows the selected date and opens a calendar dialog', () => {
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('Jun 15, 2026');
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Due date' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  it('focuses the selected day on open', async () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /June 15, 2026/ })).toHaveFocus(),
    );
  });

  it('moves focus by day with the arrow keys', async () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /June 16, 2026/ })).toHaveFocus(),
    );
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowDown' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /June 23, 2026/ })).toHaveFocus(),
    );
  });

  it('selects the focused day on Enter and closes', () => {
    const onPick = vi.fn();
    render(<Controlled onPick={onPick} />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' }); // → June 16
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' });
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].getDate()).toBe(16);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('changes month with the previous / next buttons', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('May 2026')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('marks the selected gridcell with aria-selected', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    const selectedCell = screen
      .getByRole('button', { name: /June 15, 2026/ })
      .closest('[role="gridcell"]');
    expect(selectedCell).toHaveAttribute('aria-selected', 'true');
  });

  it('has no axe violations when open', async () => {
    const { container } = render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }));
    await expectNoViolations(container);
  });
});
