import { CardCollection } from '@/components/card-collection';
import { empty, error, loading, success } from '@/lib/async-state';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

interface Photo {
  id: number;
  title: string;
}

const photos: Photo[] = [
  { id: 1, title: 'Sunrise' },
  { id: 2, title: 'Harbour' },
  { id: 3, title: 'Forest' },
];

function renderGrid(state: Parameters<typeof CardCollection<Photo>>[0]['state']) {
  return render(
    <CardCollection state={state} label="Photos" getKey={(p) => p.id}>
      {(p) => <span>{p.title}</span>}
    </CardCollection>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('CardCollection accessibility & behaviour', () => {
  it('renders an accessible labelled grid in the success state', async () => {
    const { container } = renderGrid(success(photos));
    expect(screen.getByRole('list', { name: 'Photos' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    await expectNoViolations(container);
  });

  it('announces the result count', () => {
    renderGrid(success(photos));
    expect(screen.getByRole('status')).toHaveTextContent('3 results');
  });

  it('singularises the count for one item', () => {
    renderGrid(success([photos[0]]));
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
  });

  it('shows an empty slot with no violations', async () => {
    const { container } = renderGrid(empty());
    expect(screen.getByRole('status')).toHaveTextContent('No photos');
    await expectNoViolations(container);
  });

  it('marks the loading skeleton cards as busy and hidden', async () => {
    const { container } = renderGrid(loading());
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });

  it('renders error + a working retry', () => {
    const retry = vi.fn();
    renderGrid(error(new Error('boom'), retry));
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('applies the requested column count', () => {
    const { container } = render(
      <CardCollection state={success(photos)} label="Photos" getKey={(p) => p.id} columns={4}>
        {(p) => <span>{p.title}</span>}
      </CardCollection>,
    );
    const grid = screen.getByRole('list', { name: 'Photos' }) as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(container).toBeTruthy();
  });
});
