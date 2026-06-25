import { DetailView } from '@/components/detail-view';
import { empty, error, loading, success } from '@/lib/async-state';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

interface Order {
  id: number;
  total: string;
}

const order: Order = { id: 7, total: '$42.00' };

function renderView(state: Parameters<typeof DetailView<Order>>[0]['state']) {
  return render(
    <DetailView state={state} label="Order">
      {(o) => <p>Total {o.total}</p>}
    </DetailView>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('DetailView accessibility & behaviour', () => {
  it('renders the record inside a labelled region', async () => {
    const { container } = renderView(success(order));
    const region = screen.getByRole('region', { name: 'Order' });
    expect(region).toHaveTextContent('Total $42.00');
    await expectNoViolations(container);
  });

  it('treats the empty status as not found and announces it', async () => {
    const { container } = renderView(empty());
    expect(screen.getByText('Order not found.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Order not found');
    await expectNoViolations(container);
  });

  it('marks the loading skeleton as busy and hidden', async () => {
    const { container } = renderView(loading());
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });

  it('renders error + a working retry', () => {
    const retry = vi.fn();
    renderView(error(new Error('boom'), retry));
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('lets you override the not-found content', () => {
    render(
      <DetailView state={empty()} label="Order" notFound={<p>No such order</p>}>
        {(o: Order) => <p>{o.total}</p>}
      </DetailView>,
    );
    expect(screen.getByText('No such order')).toBeInTheDocument();
    expect(screen.queryByText('Order not found.')).toBeNull();
  });

  it('lets you override the loading content', () => {
    render(
      <DetailView state={loading()} label="Order" loading={<p>Fetching…</p>}>
        {(o: Order) => <p>{o.total}</p>}
      </DetailView>,
    );
    expect(screen.getByText('Fetching…')).toBeInTheDocument();
  });
});
