import { type Column, DataTable } from '@/components/data-table';
import { empty, loading, success } from '@/lib/async-state';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

interface User {
  id: number;
  name: string;
  role: string;
}
const users: User[] = [
  { id: 1, name: 'Grace', role: 'Admin' },
  { id: 2, name: 'Ada', role: 'Maintainer' },
  { id: 3, name: 'Linus', role: 'Member' },
];
const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
];

function renderTable(state: Parameters<typeof DataTable<User>>[0]['state']) {
  return render(<DataTable state={state} columns={columns} getKey={(u) => u.id} label="Users" />);
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1) // drop the header row
    .map((r) => within(r).getAllByRole('cell')[0]?.textContent);

describe('DataTable accessibility & sorting', () => {
  it('renders an accessible table in the success state', async () => {
    const { container } = renderTable(success(users));
    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    await expectNoViolations(container);
  });

  it('sorts ascending then descending and reflects aria-sort', () => {
    renderTable(success(users));
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const sortButton = within(nameHeader).getByRole('button');

    expect(names()).toEqual(['Grace', 'Ada', 'Linus']); // original order

    fireEvent.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(names()).toEqual(['Ada', 'Grace', 'Linus']);

    fireEvent.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(names()).toEqual(['Linus', 'Grace', 'Ada']);
  });

  it('announces the sort change via a live region', () => {
    renderTable(success(users));
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: /name/i })).getByRole('button'),
    );
    // Two polite regions exist (sort + state-boundary); one carries the message.
    const texts = screen.getAllByRole('status').map((el) => el.textContent);
    expect(texts).toContain('Sorted by Name, ascending');
  });

  it('marks the loading skeleton as busy with no violations', async () => {
    const { container } = renderTable(loading());
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });

  it('shows an empty slot', () => {
    renderTable(empty());
    const texts = screen.getAllByRole('status').map((el) => el.textContent);
    expect(texts).toContain('No users');
  });
});
