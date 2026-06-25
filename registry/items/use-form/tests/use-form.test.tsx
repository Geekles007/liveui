// Resolved via the vitest aliases (registry/vitest.config.ts).
import { useForm } from '@/hooks/use-form';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

interface Values {
  email: string;
  name: string;
}

const base = {
  initialValues: { email: '', name: '' } as Values,
  validate: (v: Values) => {
    const e: Partial<Record<keyof Values, string>> = {};
    if (!v.email) e.email = 'Email is required';
    return e;
  },
};

describe('useForm', () => {
  it('seeds values and updates them via setValue', () => {
    const { result } = renderHook(() => useForm({ ...base, onSubmit: vi.fn() }));
    expect(result.current.values).toEqual({ email: '', name: '' });
    act(() => result.current.setValue('email', 'a@b.co'));
    expect(result.current.values.email).toBe('a@b.co');
  });

  it('blocks submit and surfaces validation errors', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useForm({ ...base, onSubmit }));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.errors.email).toBe('Email is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears a field error as soon as it is edited', async () => {
    const { result } = renderHook(() => useForm({ ...base, onSubmit: vi.fn() }));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.errors.email).toBeTruthy();
    act(() => result.current.setValue('email', 'x@y.z'));
    expect(result.current.errors.email).toBeUndefined();
  });

  it('tracks submitting and resolves a valid submit', async () => {
    let resolve!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const { result } = renderHook(() =>
      useForm({ initialValues: { email: 'a@b.co', name: '' } as Values, onSubmit }),
    );

    let p!: Promise<void>;
    act(() => {
      p = result.current.handleSubmit();
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));

    await act(async () => {
      resolve();
      await p;
    });
    expect(result.current.submitting).toBe(false);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.co', name: '' });
  });

  it('maps a rejected submit with fields back onto the fields', async () => {
    const onSubmit = vi.fn(() => Promise.reject({ fields: { email: 'Already taken' } }));
    const { result } = renderHook(() =>
      useForm({ initialValues: { email: 'a@b.co', name: '' } as Values, onSubmit }),
    );
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.errors.email).toBe('Already taken');
  });

  it('surfaces a plain rejection as a form-level submitError', async () => {
    const onSubmit = vi.fn(() => Promise.reject(new Error('Server is down')));
    const { result } = renderHook(() =>
      useForm({ initialValues: { email: 'a@b.co', name: '' } as Values, onSubmit }),
    );
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.submitError).toBe('Server is down');
  });

  it('register provides value/onChange and reset restores initial values', () => {
    const { result } = renderHook(() => useForm({ ...base, onSubmit: vi.fn() }));
    const binding = result.current.register('name');
    expect(binding).toMatchObject({ name: 'name', value: '' });

    act(() =>
      binding.onChange({ target: { value: 'Ada' } } as React.ChangeEvent<HTMLInputElement>),
    );
    expect(result.current.values.name).toBe('Ada');

    act(() => result.current.reset());
    expect(result.current.values).toEqual({ email: '', name: '' });
  });
});
