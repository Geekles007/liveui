import { Accordion, AccordionItem } from '@/components/accordion';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

function renderAccordion(props: { multiple?: boolean } = {}) {
  return render(
    <Accordion {...props}>
      <AccordionItem title="Shipping">
        <p>Ships in 2 days.</p>
      </AccordionItem>
      <AccordionItem title="Returns">{() => <p>30-day returns.</p>}</AccordionItem>
      <AccordionItem title="Warranty" disabled>
        <p>One year.</p>
      </AccordionItem>
    </Accordion>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('Accordion accessibility', () => {
  it('renders collapsed headers wired to their panels', async () => {
    const { container } = renderAccordion();
    const shipping = screen.getByRole('button', { name: 'Shipping' });
    expect(shipping).toHaveAttribute('aria-expanded', 'false');
    expect(shipping).toHaveAttribute('aria-controls');
    await expectNoViolations(container);
  });

  it('expands a panel on click and exposes it as a labelled region', async () => {
    const { container } = renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('region', { name: 'Shipping' })).toBeInTheDocument();
    await expectNoViolations(container);
  });

  it('lazily mounts function children only once opened', () => {
    renderAccordion();
    expect(screen.queryByText('30-day returns.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByText('30-day returns.')).toBeInTheDocument();
  });

  it('keeps only one panel open by default', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    fireEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('allows multiple open when asked', () => {
    renderAccordion({ multiple: true });
    fireEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    fireEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('disables the disabled section', () => {
    renderAccordion();
    const warranty = screen.getByRole('button', { name: 'Warranty' });
    expect(warranty).toBeDisabled();
    fireEvent.click(warranty);
    expect(warranty).toHaveAttribute('aria-expanded', 'false');
  });
});
