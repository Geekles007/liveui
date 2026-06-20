import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { resolveItemTree } from '@liveui/core';
import { bold, cyan, dim, green, red, yellow } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';
import { readLockfile, recordItem, writeLockfile } from '../lockfile.js';

export interface AddOptions {
  registry?: string;
  cwd?: string;
  overwrite?: boolean;
}

export async function add(names: string[], options: AddOptions): Promise<void> {
  if (names.length === 0) {
    console.error(red('Specify at least one item to add.'));
    process.exitCode = 1;
    return;
  }

  const baseUrl = resolveRegistry(options.registry);
  const cwd = resolve(options.cwd ?? process.cwd());

  console.log(dim(`Registry: ${baseUrl}`));

  const tree = await resolveItemTree(baseUrl, names, { fetch: nodeFetch });
  const lock = await readLockfile(cwd, baseUrl);

  const npmDeps = new Set<string>();
  const npmDevDeps = new Set<string>();
  let written = 0;
  let skipped = 0;

  for (const item of tree) {
    for (const dep of item.dependencies) npmDeps.add(dep);
    for (const dep of item.devDependencies) npmDevDeps.add(dep);

    let itemWritten = false;
    for (const file of item.files) {
      const target = join(cwd, file.path);
      if (existsSync(target) && !options.overwrite) {
        console.log(`${yellow('skip')} ${file.path} ${dim('(exists)')}`);
        skipped += 1;
        continue;
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content);
      console.log(`${green('add ')} ${file.path}`);
      written += 1;
      itemWritten = true;
    }
    // Track what we installed so `liveui upgrade` can detect local edits later.
    if (itemWritten || !lock.items[item.name]) recordItem(lock, item);
  }

  await writeLockfile(cwd, lock);

  const skippedNote = skipped ? `, ${skipped} skipped (use --overwrite)` : '';
  console.log(`\n${bold('Done.')} ${written} file(s) written${skippedNote}.`);

  if (npmDeps.size || npmDevDeps.size) {
    console.log(`\n${bold('Install the required dependencies:')}`);
    if (npmDeps.size) {
      console.log(cyan(`  npm install ${[...npmDeps].join(' ')}`));
    }
    if (npmDevDeps.size) {
      console.log(cyan(`  npm install -D ${[...npmDevDeps].join(' ')}`));
    }
  }
}
