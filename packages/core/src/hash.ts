import { createHash } from 'node:crypto';

/**
 * Stable content fingerprint for a registry file. Stored in the consumer's
 * `ibirdui.lock.json` so `ibirdui upgrade` can tell an untouched file (safe to
 * overwrite) from one the consumer has edited locally (needs a merge).
 *
 * Node-only: used by the registry build and the CLI, never in the browser.
 */
export function hashContent(content: string): string {
  return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16)}`;
}
