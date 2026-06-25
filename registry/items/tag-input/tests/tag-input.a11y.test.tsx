import { TagInput } from '@/components/tag-input';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

function Controlled({ initial = [] as string[], max }: { initial?: string[]; max?: number }) {
  const [tags, setTags] = React.useState(initial);
  return (
    <TagInput value={tags} onChange={setTags} label="Tags" max={max} placeholder="Add a tag" />
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('TagInput accessibility & behaviour', () => {
  it('adds a tag on Enter and announces it', () => {
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Tags' });
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added react');
    expect(input).toHaveValue('');
  });

  it('adds on comma and ignores blanks and duplicates', () => {
    render(<Controlled initial={['react']} />);
    const input = screen.getByRole('textbox', { name: 'Tags' });
    fireEvent.change(input, { target: { value: 'vue' } });
    fireEvent.keyDown(input, { key: ',' });
    fireEvent.change(input, { target: { value: 'react' } }); // duplicate
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getAllByRole('listitem')).toHaveLength(2); // react, vue
  });

  it('removes the last tag on Backspace when the input is empty', () => {
    render(<Controlled initial={['a', 'b']} />);
    const input = screen.getByRole('textbox', { name: 'Tags' });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(screen.queryByText('b')).toBeNull();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('removes a tag via its labelled button', () => {
    render(<Controlled initial={['react']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove react' }));
    expect(screen.queryByText('react')).toBeNull();
  });

  it('stops accepting input at max', () => {
    render(<Controlled initial={['a']} max={1} />);
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Controlled initial={['react', 'vue']} />);
    await expectNoViolations(container);
  });
});
