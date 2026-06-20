import { normalizeBaseUrl } from '@liveui/core';
import { bold, cyan, dim, green } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';

export interface GenOptions {
  registry?: string;
}

interface ManifestItem {
  name: string;
  description?: string;
  states: string[];
  intents: string[];
  examples: string[];
}

interface Manifest {
  name: string;
  items: ManifestItem[];
}

/**
 * AI-facing entry point. Today it does a transparent keyword match of the prompt
 * against each item's declared `intents` and returns the components an agent
 * should compose from — with the exact `add` command and a usage example.
 *
 * Because every item ships a machine-readable manifest, this is also the seam to
 * plug a real model (e.g. @geekles/llm_sdk) for ranking and code generation,
 * without the model ever having to guess which components exist.
 */
export async function gen(prompt: string, options: GenOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const res = await nodeFetch(`${normalizeBaseUrl(baseUrl)}/r/manifest.json`);
  if (!res.ok) {
    throw new Error(`Could not load the AI manifest (${res.status}).`);
  }
  const manifest = (await res.json()) as Manifest;

  const terms = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);

  const ranked = manifest.items
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log(bold(`\nPrompt: ${dim(prompt)}\n`));

  if (ranked.length === 0) {
    console.log("No matching components. Try `liveui list` to see what's available.");
    return;
  }

  console.log(bold('Suggested components:\n'));
  for (const { item } of ranked) {
    console.log(`${green(item.name)} ${dim(`— ${item.description ?? ''}`)}`);
    if (item.states.length) console.log(`  states: ${dim(item.states.join(', '))}`);
    const example = item.examples[0];
    if (example) console.log(`  ${dim(example)}`);
    console.log('');
  }

  const addList = ranked.map((r) => r.item.name).join(' ');
  console.log(cyan(`Add them all:\n  liveui add ${addList}`));
}

function scoreItem(item: ManifestItem, terms: string[]): number {
  const haystack = [item.name, item.description ?? '', ...item.intents, ...item.states]
    .join(' ')
    .toLowerCase();
  return terms.reduce((score, term) => (haystack.includes(term) ? score + 1 : score), 0);
}
