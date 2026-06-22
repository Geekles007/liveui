import { AsyncCombobox } from '@/components/async-combobox';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

interface User {
  id: number;
  name: string;
}
const ALL: User[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Alan' },
  { id: 3, name: 'Bob' },
];

function setup(opts: { load?: (q: string) => Promise<User[]>; onSelect?: (u: User) => void } = {}) {
  const load =
    opts.load ??
    ((q: string) =>
      Promise.resolve(ALL.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))));
  return render(
    <AsyncCombobox
      load={load}
      getLabel={(u) => u.name}
      getKey={(u) => u.id}
      onSelect={opts.onSelect}
      label="Search users"
      debounceMs={0}
    />,
  );
}

const type = (value: string) =>
  fireEvent.change(screen.getByRole('combobox', { name: 'Search users' }), { target: { value } });

describe('AsyncCombobox accessibility & behaviour', () => {
  it('opens a listbox of results and has no axe violations', async () => {
    const { container } = setup();
    const input = screen.getByRole('combobox', { name: 'Search users' });
    type('a');

    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(2); // Ada, Alan
    await expectNoViolations(container);
  });

  it('tracks the active option with aria-activedescendant and selects on Enter', async () => {
    const onSelect = vi.fn();
    setup({ onSelect });
    const input = screen.getByRole('combobox', { name: 'Search users' });
    type('a');

    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2));
    // first option active by default
    const first = screen.getByText('Ada');
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);

    fireEvent.keyDown(input, { key: 'ArrowDown' }); // → Alan
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getByText('Alan').id);

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith({ id: 2, name: 'Alan' });
    expect((input as HTMLInputElement).value).toBe('Alan');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    setup();
    type('zzz');
    await waitFor(() => expect(screen.getByText('No results')).toBeInTheDocument());
  });

  it('exposes errors as an alert with a retry', async () => {
    setup({ load: () => Promise.reject(new Error('Network down')) });
    type('a');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network down'));
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    setup();
    const input = screen.getByRole('combobox', { name: 'Search users' });
    type('a');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}
