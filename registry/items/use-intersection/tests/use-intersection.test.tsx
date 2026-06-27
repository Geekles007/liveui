import { useIntersection } from '@/hooks/use-intersection';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- IntersectionObserver mock (mirrors the infinite-list test) -------------
class MockIO {
  static instances: MockIO[] = [];
  cb: IntersectionObserverCallback;
  elements = new Set<Element>();
  disconnected = false;
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
    this.disconnected = true;
  }
  trigger(isIntersecting: boolean) {
    const entries = [...this.elements].map((target) => ({ isIntersecting, target }));
    this.cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

function liveObserver() {
  return [...MockIO.instances].reverse().find((o) => o.elements.size > 0);
}

beforeEach(() => {
  MockIO.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIO);
});
afterEach(() => vi.unstubAllGlobals());

function Probe({ once = false }: { once?: boolean }) {
  const { ref, isIntersecting } = useIntersection<HTMLDivElement>({ once });
  return (
    <div ref={ref} data-testid="probe">
      {isIntersecting ? 'visible' : 'hidden'}
    </div>
  );
}

describe('useIntersection', () => {
  it('starts hidden and observes the attached node', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('probe')).toHaveTextContent('hidden');
    expect(liveObserver()).toBeDefined();
  });

  it('flips to visible when the element intersects', () => {
    const { getByTestId } = render(<Probe />);
    act(() => liveObserver()?.trigger(true));
    expect(getByTestId('probe')).toHaveTextContent('visible');

    act(() => liveObserver()?.trigger(false));
    expect(getByTestId('probe')).toHaveTextContent('hidden');
  });

  it('disconnects after the first reveal when once is set', () => {
    render(<Probe once />);
    const observer = liveObserver();
    act(() => observer?.trigger(true));
    expect(observer?.disconnected).toBe(true);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<Probe />);
    const observer = MockIO.instances[0];
    unmount();
    expect(observer.disconnected).toBe(true);
  });
});
