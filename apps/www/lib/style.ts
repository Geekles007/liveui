import type { CSSProperties } from 'react';

/**
 * Convert a plain CSS string into a React style object, so the design's inline
 * styles can be ported almost verbatim. Custom properties (var(--x)) pass
 * through untouched.
 */
export function s(css: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const rule of css.split(';')) {
    const i = rule.indexOf(':');
    if (i < 0) continue;
    const key = rule.slice(0, i).trim();
    const value = rule.slice(i + 1).trim();
    if (!key || !value) continue;
    const camel = key.startsWith('--')
      ? key
      : key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = value;
  }
  return out as CSSProperties;
}
