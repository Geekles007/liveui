import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/dropdown-menu';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

function renderMenu(onEdit = vi.fn(), onDelete = vi.fn()) {
  return {
    onEdit,
    onDelete,
    ...render(
      <DropdownMenu label="Actions">
        <MenuItem onSelect={onEdit}>Edit</MenuItem>
        <MenuItem onSelect={onEdit}>Share</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={onDelete} disabled>
          Delete
        </MenuItem>
      </DropdownMenu>,
    ),
  };
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('DropdownMenu accessibility', () => {
  it('exposes an accessible trigger that is collapsed by default', async () => {
    const { container } = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expectNoViolations(container);
  });

  it('opens a labelled menu with menuitems and no violations', async () => {
    const { container } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    await expectNoViolations(container);
  });

  it('marks the disabled item with aria-disabled', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('selects an item, fires onSelect and closes', () => {
    const { onEdit } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not select a disabled item', () => {
    const { onDelete } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
