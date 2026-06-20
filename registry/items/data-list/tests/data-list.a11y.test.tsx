import { DataList } from '@/components/data-list';
import { empty, loading, success } from '@/lib/async-state';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
];

function renderList(state: Parameters<typeof DataList<User>>[0]['state']) {
  return render(
    <DataList state={state} label="Users" getKey={(u) => u.id}>
      {(u) => <span>{u.name}</span>}
    </DataList>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('DataList accessibility', () => {
  it('renders an accessible list in the success state', async () => {
    const { container } = renderList(success(users));
    const list = screen.getByRole('list', { name: 'Users' });
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await expectNoViolations(container);
  });

  it('announces the result count', () => {
    renderList(success(users));
    expect(screen.getByRole('status')).toHaveTextContent('2 results');
  });

  it('shows an empty slot with no violations', async () => {
    const { container } = renderList(empty());
    expect(screen.getByRole('status')).toHaveTextContent('No users');
    await expectNoViolations(container);
  });

  it('marks the loading skeleton as busy and hidden', async () => {
    const { container } = renderList(loading());
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });
});
