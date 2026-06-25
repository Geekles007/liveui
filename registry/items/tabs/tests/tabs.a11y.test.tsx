import { Tab, Tabs } from '@/components/tabs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

function basicTabs(extra?: React.ReactNode) {
  return (
    <Tabs label="Sections">
      <Tab title="Overview">
        <p>Overview content</p>
      </Tab>
      <Tab title="Activity">
        <p>Activity content</p>
      </Tab>
      {extra}
    </Tabs>
  );
}

describe('Tabs accessibility & behaviour', () => {
  it('renders a labelled tablist with the first tab selected', () => {
    render(basicTabs());
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
    const [first, second] = screen.getAllByRole('tab');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('aria-selected', 'false');
    expect(second).toHaveAttribute('tabindex', '-1');
  });

  it('wires each tab to its panel', () => {
    render(basicTabs());
    const tab = screen.getByRole('tab', { name: 'Overview' });
    const panel = screen.getByRole('tabpanel');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('shows only the selected panel', () => {
    render(basicTabs());
    // Only the selected panel is exposed; the other is hidden.
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview content');
  });

  it('selects a tab on click', () => {
    render(basicTabs());
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Activity content');
  });

  it('moves with arrow keys, wrapping, and Home/End', () => {
    render(basicTabs());
    const [overview, activity] = screen.getAllByRole('tab');

    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(activity).toHaveAttribute('aria-selected', 'true');
    expect(activity).toHaveFocus();

    fireEvent.keyDown(activity, { key: 'ArrowRight' }); // wraps to first
    expect(overview).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(overview, { key: 'End' });
    expect(activity).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(activity, { key: 'Home' });
    expect(overview).toHaveAttribute('aria-selected', 'true');
  });

  it('lazily mounts a panel on first open and keeps it mounted', () => {
    const mountSpy = vi.fn();
    function Lazy() {
      React.useEffect(() => mountSpy(), []);
      return <p>Lazy content</p>;
    }
    render(
      <Tabs label="Sections">
        <Tab title="Overview">
          <p>Overview content</p>
        </Tab>
        <Tab title="Activity">{() => <Lazy />}</Tab>
      </Tabs>,
    );
    expect(mountSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(mountSpy).toHaveBeenCalledOnce();

    // Switch away and back — it stays mounted (no refetch).
    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(mountSpy).toHaveBeenCalledOnce();
  });

  it('skips a disabled tab with the keyboard and ignores its click', () => {
    const disabled = (
      <Tab title="Disabled" disabled>
        <p>Nope</p>
      </Tab>
    );
    render(basicTabs(disabled));
    const [overview, activity, disabledTab] = screen.getAllByRole('tab');

    fireEvent.click(disabledTab);
    expect(disabledTab).toHaveAttribute('aria-selected', 'false');

    // From Activity, ArrowRight skips the disabled tab and wraps to Overview.
    fireEvent.click(activity);
    fireEvent.keyDown(activity, { key: 'ArrowRight' });
    expect(overview).toHaveAttribute('aria-selected', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(basicTabs());
    await expectNoViolations(container);
  });
});
