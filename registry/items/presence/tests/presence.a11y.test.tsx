import { Presence, type PresenceUser } from '@/components/presence';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

const users: PresenceUser[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Linus Torvalds' },
  { id: 3, name: 'Grace Hopper' },
];

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('Presence accessibility', () => {
  it('renders a labelled list of online people', async () => {
    const { container } = render(<Presence users={users} />);
    expect(screen.getByRole('list', { name: 'People online' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    await expectNoViolations(container);
  });

  it('announces the summary politely', () => {
    render(<Presence users={users} />);
    expect(screen.getByRole('status')).toHaveTextContent('3 people online');
  });

  it('collapses overflow into a labelled +N chip', async () => {
    const { container } = render(<Presence users={users} max={2} />);
    // 2 avatars + 1 overflow chip = 3 list items.
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByLabelText('1 more')).toBeInTheDocument();
    await expectNoViolations(container);
  });

  it('handles the empty case without violations', async () => {
    const { container } = render(<Presence users={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('No one online');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await expectNoViolations(container);
  });

  it('uses the singular for one person', () => {
    render(<Presence users={[users[0]]} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 person online');
  });
});
