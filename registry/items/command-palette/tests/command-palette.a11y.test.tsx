import { type Command, CommandPalette } from '@/components/command-palette';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

function makeCommands(onSelect = vi.fn()): Command[] {
  return [
    { id: 'home', label: 'Go to Home', group: 'Navigation', onSelect },
    { id: 'settings', label: 'Open Settings', keywords: 'preferences', group: 'Navigation', onSelect },
    { id: 'new', label: 'New file', shortcut: '⌘N', group: 'Actions', onSelect },
  ];
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

/** Dispatch a real keydown on window (the global shortcut listener). */
function pressGlobal(key: string, init: KeyboardEventInit = {}) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  });
}

describe('CommandPalette accessibility & behaviour', () => {
  it('is closed by default and opens on Cmd+K', () => {
    render(<CommandPalette commands={makeCommands()} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    pressGlobal('k', { metaKey: true });
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('also opens on Ctrl+K', () => {
    render(<CommandPalette commands={makeCommands()} />);
    pressGlobal('k', { ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('filters commands as you type and announces the count', () => {
    render(<CommandPalette commands={makeCommands()} open />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'settings' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Open Settings');
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
  });

  it('matches on keywords beyond the label', () => {
    render(<CommandPalette commands={makeCommands()} open />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'preferences' } });
    expect(screen.getByRole('option')).toHaveTextContent('Open Settings');
  });

  it('tracks the highlighted option through aria-activedescendant', () => {
    render(<CommandPalette commands={makeCommands()} open />);
    const input = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[2].id); // wraps
  });

  it('runs the highlighted command on Enter and closes (uncontrolled)', () => {
    const onSelect = vi.fn();
    render(<CommandPalette commands={makeCommands(onSelect)} />);
    pressGlobal('k', { metaKey: true });
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // highlight the 2nd
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('runs a command on click', () => {
    const onSelect = vi.fn();
    render(<CommandPalette commands={makeCommands(onSelect)} open />);
    fireEvent.click(screen.getByText('New file'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('closes on Escape', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette commands={makeCommands()} open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the empty message when nothing matches', () => {
    render(<CommandPalette commands={makeCommands()} open emptyMessage="Nothing found" />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const { container } = render(<CommandPalette commands={makeCommands()} open />);
    await expectNoViolations(container);
  });
});
