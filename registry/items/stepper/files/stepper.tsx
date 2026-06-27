'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface StepProps {
  /** The step's label in the progress header. */
  title: React.ReactNode;
  children: React.ReactNode;
  /**
   * Validate before advancing. Return a promise; while it's pending the Next
   * button shows busy, and if it rejects the wizard stays on this step and shows
   * the error.
   */
  onNext?: () => Promise<unknown> | unknown;
}

/**
 * Declares one wizard step. It renders nothing on its own — {@link Stepper} reads
 * its props and orchestrates the header, panels and navigation.
 */
export function Step(_props: StepProps): React.ReactNode {
  return null;
}

export interface StepperProps {
  children: React.ReactNode;
  /** Called after the final step's `onNext` resolves. */
  onComplete?: () => void;
  /** Accessible name for the progress list. Default "Progress". */
  label?: string;
  /** Label for the final step's advance button. Default "Finish". */
  finishLabel?: string;
  className?: string;
}

function isStep(node: React.ReactNode): node is React.ReactElement<StepProps> {
  return React.isValidElement(node) && node.type === Step;
}

/**
 * A multi-step wizard with async validation between steps. Each step can supply
 * an `onNext` that runs before advancing: the Next button shows busy
 * (`aria-busy`) while it resolves, and a rejection keeps you on the step and
 * surfaces the error in a `role="alert"`. All panels stay mounted (hidden when
 * inactive) so form input is never lost moving back and forth.
 *
 *   <Stepper onComplete={submit}>
 *     <Step title="Account" onNext={() => api.checkEmail(email)}>
 *       <AccountFields />
 *     </Step>
 *     <Step title="Profile"><ProfileFields /></Step>
 *     <Step title="Review"><Review /></Step>
 *   </Stepper>
 *
 * The header is an ordered list with `aria-current="step"` on the active step;
 * completed steps are marked, and a polite live region announces each move.
 */
export function Stepper({
  children,
  onComplete,
  label = 'Progress',
  finishLabel = 'Finish',
  className,
}: StepperProps) {
  const steps = React.useMemo(() => React.Children.toArray(children).filter(isStep), [children]);
  const baseId = React.useId();
  const panelId = (i: number) => `${baseId}-panel-${i}`;
  const stepId = (i: number) => `${baseId}-step-${i}`;

  const [current, setCurrent] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (steps.length === 0) return null;

  const isLast = current === steps.length - 1;

  const advance = () => {
    if (isLast) onComplete?.();
    else setCurrent((c) => c + 1);
  };

  const handleNext = () => {
    setError(null);
    const result = steps[current].props.onNext?.();
    if (!result || typeof (result as Promise<unknown>).then !== 'function') {
      advance();
      return;
    }
    setPending(true);
    Promise.resolve(result).then(
      () => {
        if (!mounted.current) return;
        setPending(false);
        advance();
      },
      (err: unknown) => {
        if (!mounted.current) return;
        setPending(false);
        setError(err instanceof Error ? err.message : String(err));
      },
    );
  };

  const back = () => {
    setError(null);
    setCurrent((c) => Math.max(0, c - 1));
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ol aria-label={label} className="flex items-center gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={stepId(i)}
              aria-current={active ? 'step' : undefined}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : done
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground',
                )}
              >
                {done ? (
                  <svg
                    aria-hidden="true"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(active ? 'font-medium text-foreground' : 'text-muted-foreground')}
              >
                {step.props.title}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="mx-1 h-px w-6 bg-border" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Polite live region: announces each move without stealing focus. */}
      <span role="status" aria-live="polite" className="sr-only">
        {`Step ${current + 1} of ${steps.length}`}
      </span>

      {steps.map((step, i) => (
        <div
          key={panelId(i)}
          id={panelId(i)}
          role="group"
          aria-labelledby={stepId(i)}
          hidden={i !== current}
        >
          <span id={stepId(i)} className="sr-only">
            {step.props.title}
          </span>
          {step.props.children}
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={back}
          disabled={current === 0 || pending}
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={pending}
          aria-busy={pending || undefined}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && (
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="motion-safe:animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          )}
          <span>{isLast ? finishLabel : 'Next'}</span>
        </button>
      </div>
    </div>
  );
}
