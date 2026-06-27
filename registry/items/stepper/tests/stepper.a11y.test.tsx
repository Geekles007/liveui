import { Step, Stepper } from '@/components/stepper';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('Stepper accessibility', () => {
  it('renders a progress list with the first step current', async () => {
    const { container } = render(
      <Stepper>
        <Step title="Account">
          <p>Account fields</p>
        </Step>
        <Step title="Profile">
          <p>Profile fields</p>
        </Step>
      </Stepper>,
    );
    const list = screen.getByRole('list', { name: 'Progress' });
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).not.toHaveAttribute('aria-current');
    await expectNoViolations(container);
  });

  it('advances to the next step on Next', () => {
    render(
      <Stepper>
        <Step title="Account">
          <p>Account fields</p>
        </Step>
        <Step title="Profile">
          <p>Profile fields</p>
        </Step>
      </Stepper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
  });

  it('runs async validation and shows the error on rejection', async () => {
    const onNext = vi.fn(() => Promise.reject(new Error('Email already taken')));
    render(
      <Stepper>
        <Step title="Account" onNext={onNext}>
          <p>Account fields</p>
        </Step>
        <Step title="Profile">
          <p>Profile fields</p>
        </Step>
      </Stepper>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email already taken'));
    // Still on step 1.
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
  });

  it('keeps every panel mounted so input survives navigation', () => {
    render(
      <Stepper>
        <Step title="Account">
          <input aria-label="Email" />
        </Step>
        <Step title="Profile">
          <p>Profile fields</p>
        </Step>
      </Stepper>,
    );
    const email = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'ada@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    // The first panel is hidden but still mounted with its value.
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('ada@example.com');
  });

  it('calls onComplete after the final step', () => {
    const onComplete = vi.fn();
    render(
      <Stepper onComplete={onComplete} finishLabel="Submit">
        <Step title="Only">
          <p>Just one</p>
        </Step>
      </Stepper>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
