import { z } from 'zod';

/** The five real-world async states a ibirdui component is expected to handle. */
export const asyncStateNameSchema = z.enum(['loading', 'empty', 'error', 'optimistic', 'offline']);

export type AsyncStateName = z.infer<typeof asyncStateNameSchema>;

/**
 * A single file that ships with a registry item. The `path` is relative to the
 * consumer project root; `content` is the literal source written to disk. `hash`
 * is filled in by the build and lets the CLI detect local edits on `upgrade`.
 */
export const registryFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  /** Hint used by the CLI to decide a default target directory. */
  type: z.enum(['component', 'lib', 'hook', 'style', 'file']).default('file'),
  /** Content fingerprint, injected by the registry build. */
  hash: z.string().optional(),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;

/**
 * Accessibility guarantees an item makes. Surfaced in the docs and in the `add`
 * output, and backed by an axe test that ships with the item when `tested` is
 * true — accessibility is verified, not just claimed.
 */
export const a11ySchema = z.object({
  level: z.enum(['A', 'AA', 'AAA']).default('AA'),
  notes: z.array(z.string()).default([]),
  tested: z.boolean().default(false),
});

export type A11y = z.infer<typeof a11ySchema>;

/**
 * Machine-readable description for AI / agent consumers. Lets `ibirdui gen` (and
 * any external agent) compose UIs from real components with valid props instead
 * of hallucinating markup.
 */
export const manifestSchema = z.object({
  intents: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
});

export type Manifest = z.infer<typeof manifestSchema>;

/**
 * The unit a consumer installs with `add <name>`. Kept generic enough for UI
 * components, headless libs, hooks and snippets, but enriched with the metadata
 * that powers ibirdui's three differentiators: state-completeness (`states`),
 * upgradeability (`version` + per-file `hash`) and AI-readiness (`manifest`).
 */
export const registryItemSchema = z.object({
  name: z.string().min(1),
  type: z.string().default('component'),
  description: z.string().optional(),
  /** Semver of the item itself — drives `upgrade`. */
  version: z.string().default('0.0.0'),
  /** Fingerprint of the item's combined file contents. */
  hash: z.string().optional(),
  /** Async states this item handles out of the box. */
  states: z.array(asyncStateNameSchema).default([]),
  a11y: a11ySchema.optional(),
  manifest: manifestSchema.optional(),
  /** npm packages the item needs at runtime. */
  dependencies: z.array(z.string()).default([]),
  /** npm packages the item needs at build/dev time. */
  devDependencies: z.array(z.string()).default([]),
  /** Other registry items this one pulls in. */
  registryDependencies: z.array(z.string()).default([]),
  files: z.array(registryFileSchema).min(1),
});

export type RegistryItem = z.infer<typeof registryItemSchema>;

/** Lightweight entry used by the index that lists every published item. */
export const registryIndexEntrySchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  description: z.string().optional(),
  version: z.string().default('0.0.0'),
  states: z.array(asyncStateNameSchema).default([]),
  a11yLevel: z.enum(['A', 'AA', 'AAA']).optional(),
  intents: z.array(z.string()).default([]),
});

export type RegistryIndexEntry = z.infer<typeof registryIndexEntrySchema>;

export const registryIndexSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  homepage: z.string().url().optional(),
  items: z.array(registryIndexEntrySchema),
});

export type RegistryIndex = z.infer<typeof registryIndexSchema>;
