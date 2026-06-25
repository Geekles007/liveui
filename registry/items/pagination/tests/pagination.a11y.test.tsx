import { LoadMore, Pagination } from '@/components/pagination';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('Pagination accessibility & behaviour', () => {
  it('renders a labelled nav and marks the current page', () => {
    render(<Pagination page={2} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    const current = screen.getByRole('button', { name: 'Page 2' });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('announces the current page', () => {
    render(<Pagination page={3} pageCount={9} onPageChange={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Page 3 of 9');
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination page={1} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();

    rerender(<Pagination page={5} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('moves to the next, previous and a specific page', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={9} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(onPageChange.mock.calls).toEqual([[4], [2], [1]]);
  });

  it('collapses long ranges with ellipses', () => {
    render(<Pagination page={6} pageCount={20} onPageChange={() => {}} />);
    // First, last and the current ± 1 are present; the middle is collapsed.
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 10' })).toBeNull();
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables every control when disabled', () => {
    render(<Pagination page={2} pageCount={5} onPageChange={() => {}} disabled />);
    for (const btn of screen.getAllByRole('button')) expect(btn).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Pagination page={6} pageCount={20} onPageChange={() => {}} />);
    await expectNoViolations(container);
  });
});

describe('LoadMore accessibility & behaviour', () => {
  it('loads more on click', () => {
    const onLoadMore = vi.fn();
    render(<LoadMore onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('disables, sets aria-busy and announces while loading', () => {
    render(<LoadMore onLoadMore={() => {}} loading />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading more…');
  });

  it('renders nothing when there is no more to load', () => {
    const { container } = render(<LoadMore onLoadMore={() => {}} hasMore={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = render(<LoadMore onLoadMore={() => {}} />);
    await expectNoViolations(container);
  });
});
