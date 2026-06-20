/** Default registry base URL. Override per-project when you fork this CLI. */
export const DEFAULT_REGISTRY = 'https://Geekles007.github.io/vital';

/**
 * Resolve the registry base URL with the precedence:
 *   --registry flag  >  VITAL_REGISTRY_URL env  >  built-in default
 */
export function resolveRegistry(flag?: string): string {
  return flag ?? process.env.VITAL_REGISTRY_URL ?? DEFAULT_REGISTRY;
}
