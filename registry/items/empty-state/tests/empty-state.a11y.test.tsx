import { EmptyState } from '@/components/empty-state';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    // jsdom has no layout engine; colour-contrast can't be evaluated here.
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('EmptyState accessibility & behaviour', () => {
  it('renders the title and description', () => {
    render(<EmptyState title="No projects yet" description="Create your first project." />);
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project.')).toBeInTheDocument();
  });

  it('shows a decorative default icon hidden from assistive tech', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // The icon sits inside an aria-hidden wrapper, never in the a11y tree.
    expect(svg?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders no icon when icon is null', () => {
    const { container } = render(<EmptyState title="Empty" icon={null} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the action and keeps it focusable', () => {
    render(<EmptyState title="Empty" action={<button type="button">New project</button>} />);
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument();
  });

  it('forwards className and arbitrary div props', () => {
    const { container } = render(
      <EmptyState title="Empty" className="my-panel" data-testid="empty" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('my-panel');
    expect(el.getAttribute('data-testid')).toBe('empty');
  });

  it('has no axe violations with an action', async () => {
    const { container } = render(
      <EmptyState
        title="No projects yet"
        description="Create your first project."
        action={<button type="button">New project</button>}
      />,
    );
    await expectNoViolations(container);
  });
});
