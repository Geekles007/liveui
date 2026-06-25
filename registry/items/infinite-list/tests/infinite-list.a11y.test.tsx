import { InfiniteList } from '@/components/infinite-list';
import { empty, error, loading, success } from '@/lib/async-state';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface Post {
  id: number;
  title: string;
}

const posts: Post[] = [
  { id: 1, title: 'First' },
  { id: 2, title: 'Second' },
];

// --- IntersectionObserver mock ----------------------------------------------
class MockIO {
  static instances: MockIO[] = [];
  cb: IntersectionObserverCallback;
  elements = new Set<Element>();
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    MockIO.instances.push(this);
  }
  observe(el: Element) {
    this.elements.add(el);
  }
  unobserve(el: Element) {
    this.elements.delete(el);
  }
  disconnect() {
    this.elements.clear();
  }
  trigger(isIntersecting: boolean) {
    const entries = [...this.elements].map((target) => ({ isIntersecting, target }));
    this.cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

/** The most recently constructed observer that still has a target. */
function liveObserver() {
  return [...MockIO.instances].reverse().find((o) => o.elements.size > 0);
}

beforeEach(() => {
  MockIO.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIO);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderList(
  state: Parameters<typeof InfiniteList<Post>>[0]['state'],
  props: Partial<Parameters<typeof InfiniteList<Post>>[0]> = {},
) {
  return render(
    <InfiniteList state={state} label="Posts" getKey={(p) => p.id} onLoadMore={() => {}} {...props}>
      {(p) => <span>{p.title}</span>}
    </InfiniteList>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('InfiniteList accessibility & behaviour', () => {
  it('shows a busy, hidden skeleton during the first load', async () => {
    const { container } = renderList(loading());
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });

  it('renders a labelled list and announces the count on success', async () => {
    const { container } = renderList(success(posts));
    expect(screen.getByRole('list', { name: 'Posts' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 results');
    await expectNoViolations(container);
  });

  it('loads more when the sentinel scrolls into view', () => {
    const onLoadMore = vi.fn();
    renderList(success(posts), { onLoadMore, hasMore: true });
    act(() => liveObserver()?.trigger(true));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('does not fire when the sentinel is merely observed, not intersecting', () => {
    const onLoadMore = vi.fn();
    renderList(success(posts), { onLoadMore, hasMore: true });
    act(() => liveObserver()?.trigger(false));
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('removes the sentinel and shows the loading footer while loading more', () => {
    renderList(success(posts), { loadingMore: true });
    // No sentinel is observing while a page is in flight.
    expect(liveObserver()).toBeUndefined();
    expect(screen.getByText('Loading more…')).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
  });

  it('stops observing and shows the end message when there is no more', () => {
    renderList(success(posts), { hasMore: false, endMessage: 'That’s everything' });
    expect(liveObserver()).toBeUndefined();
    expect(screen.getByText('That’s everything')).toBeInTheDocument();
  });

  it('renders error + a working retry', () => {
    const retry = vi.fn();
    renderList(error(new Error('boom'), retry));
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows the empty slot', () => {
    renderList(empty());
    expect(screen.getByRole('status')).toHaveTextContent('No posts');
  });
});
