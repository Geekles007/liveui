import { MultiSelect, type MultiSelectOption } from '@/components/multi-select';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

const options: MultiSelectOption[] = [
  { value: 'r', label: 'React' },
  { value: 'v', label: 'Vue' },
  { value: 's', label: 'Svelte' },
];

function Controlled({ initial = [] as string[] }) {
  const [value, setValue] = React.useState(initial);
  return <MultiSelect options={options} value={value} onChange={setValue} label="Frameworks" />;
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('MultiSelect accessibility & behaviour', () => {
  it('opens the popover from the trigger', () => {
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Frameworks' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Frameworks' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('selects and deselects options', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Frameworks' }));
    const react = screen.getByRole('checkbox', { name: 'React' });
    fireEvent.click(react);
    expect(react).toBeChecked();
    fireEvent.click(react);
    expect(react).not.toBeChecked();
  });

  it('summarises the selection on the trigger', () => {
    render(<Controlled initial={['r', 'v']} />);
    expect(screen.getByRole('button', { name: 'Frameworks' })).toHaveTextContent('React, Vue');
  });

  it('collapses the summary past two selections', () => {
    render(<Controlled initial={['r', 'v', 's']} />);
    expect(screen.getByRole('button', { name: 'Frameworks' })).toHaveTextContent('3 selected');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Frameworks' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const { container } = render(<Controlled initial={['r']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Frameworks' }));
    await expectNoViolations(container);
  });
});
