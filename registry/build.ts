/**
 * Compiles every item under `items/<name>/` into a static JSON registry under
 * `public/r/`. The output is plain files — serve them from GitHub Pages, a CDN,
 * or anywhere static. No database, no backend.
 *
 *   items/<name>/meta.json        item metadata + file map
 *   items/<name>/files/...        the source files shipped to consumers
 *
 *   public/r/index.json           list of every item (with version, states, a11y)
 *   public/r/<name>.json          one resolved RegistryItem per item
 *   public/r/manifest.json        AI-facing manifest: intents + examples per item
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type A11y,
  type AsyncStateName,
  type Manifest,
  type RegistryIndex,
  type RegistryItem,
  hashContent,
  registryIndexSchema,
  registryItemSchema,
} from 'everstate-core';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ITEMS_DIR = join(ROOT, 'items');
const OUT_DIR = join(ROOT, 'public', 'r');

const REGISTRY_NAME = 'everstate';
const HOMEPAGE = 'https://Geekles007.github.io/everstate';

interface MetaFile {
  from: string;
  path: string;
  type?: string;
}

interface ItemMeta {
  name: string;
  type?: string;
  description?: string;
  version?: string;
  states?: AsyncStateName[];
  a11y?: A11y;
  manifest?: Manifest;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: MetaFile[];
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function listItemDirs(): Promise<string[]> {
  const entries = await readdir(ITEMS_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function buildItem(dir: string): Promise<RegistryItem> {
  const itemRoot = join(ITEMS_DIR, dir);
  const meta = await readJson<ItemMeta>(join(itemRoot, 'meta.json'));

  const files = await Promise.all(
    meta.files.map(async (file) => {
      const source = join(itemRoot, file.from);
      await stat(source); // fail loudly if a referenced file is missing
      const content = await readFile(source, 'utf8');
      return {
        path: file.path,
        content,
        type: file.type ?? 'file',
        hash: hashContent(content),
      };
    }),
  );

  // The item hash is derived from every file's path + content, so any edit to
  // any shipped file bumps it. The CLI compares this on `upgrade`.
  const itemHash = hashContent(files.map((f) => `${f.path}:${f.content}`).join('\n'));

  return registryItemSchema.parse({
    name: meta.name,
    type: meta.type ?? 'component',
    description: meta.description,
    version: meta.version ?? '0.0.0',
    hash: itemHash,
    states: meta.states ?? [],
    a11y: meta.a11y,
    manifest: meta.manifest,
    dependencies: meta.dependencies ?? [],
    devDependencies: meta.devDependencies ?? [],
    registryDependencies: meta.registryDependencies ?? [],
    files,
  });
}

async function main(): Promise<void> {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const dirs = await listItemDirs();
  const items: RegistryItem[] = [];

  for (const dir of dirs) {
    const item = await buildItem(dir);
    if (items.some((i) => i.name === item.name)) {
      throw new Error(`Duplicate registry item name: "${item.name}"`);
    }
    items.push(item);
    await writeFile(join(OUT_DIR, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }

  const index: RegistryIndex = registryIndexSchema.parse({
    $schema: 'https://everstate/schema/registry-index.json',
    name: REGISTRY_NAME,
    homepage: HOMEPAGE,
    items: items
      .map((i) => ({
        name: i.name,
        type: i.type,
        description: i.description,
        version: i.version,
        states: i.states,
        a11yLevel: i.a11y?.level,
        intents: i.manifest?.intents ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });

  await writeFile(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);

  // AI-facing manifest: a flat map an agent can read to know what each item is
  // for and how to use it, without parsing the source.
  const manifest = {
    name: REGISTRY_NAME,
    homepage: HOMEPAGE,
    items: items
      .filter((i) => i.manifest)
      .map((i) => ({
        name: i.name,
        description: i.description,
        states: i.states,
        intents: i.manifest?.intents ?? [],
        examples: i.manifest?.examples ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  await writeFile(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `Built ${items.length} item(s) to ${resolve(OUT_DIR)}:`,
    items.map((i) => i.name).join(', ') || '(none)',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
