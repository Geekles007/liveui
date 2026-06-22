import { fetchRegistryIndex } from 'everstate-core';
import { bold, dim } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';

export interface ListOptions {
  registry?: string;
}

export async function list(options: ListOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const index = await fetchRegistryIndex(baseUrl, { fetch: nodeFetch });

  console.log(bold(`${index.name} — ${index.items.length} item(s)\n`));
  for (const item of index.items) {
    const tags = [
      `v${item.version}`,
      item.a11yLevel ? `a11y ${item.a11yLevel}` : null,
      item.states.length ? `states: ${item.states.join('/')}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    console.log(`  ${bold(item.name)} ${dim(tags)}`);
    if (item.description) console.log(`    ${dim(item.description)}`);
  }
}
