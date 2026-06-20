import { describe, expect, it } from 'vitest';
import { hashContent } from './index.js';

describe('hashContent', () => {
  it('is stable for identical content', () => {
    expect(hashContent('hello')).toBe(hashContent('hello'));
  });

  it('changes when content changes', () => {
    expect(hashContent('hello')).not.toBe(hashContent('hello!'));
  });

  it('is namespaced', () => {
    expect(hashContent('x')).toMatch(/^sha256:[0-9a-f]{16}$/);
  });
});
