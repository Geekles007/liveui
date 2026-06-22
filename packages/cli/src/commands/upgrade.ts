import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { type RegistryItem, fetchRegistryItem, hashContent } from 'ibirdui-core';
import { bold, cyan, dim, green, red, yellow } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';
import { readLockfile, recordItem, writeLockfile } from '../lockfile.js';

export interface UpgradeOptions {
  registry?: string;
  cwd?: string;
}

/**
 * The feature copy-paste libraries don't have: bring installed items up to date
 * while preserving local edits.
 *
 * For each file we compare three fingerprints — the version we originally wrote
 * (from the lockfile), what's on disk now, and the new upstream version:
 *
 *  - on-disk matches the lock  → untouched by the user, safe to overwrite
 *  - on-disk already equals new → nothing to do
 *  - on-disk differs from both  → locally edited: keep theirs, drop a `.new`
 *    file next to it and flag a conflict to resolve
 */
export async function upgrade(names: string[], options: UpgradeOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const cwd = resolve(options.cwd ?? process.cwd());
  const lock = await readLockfile(cwd, baseUrl);

  const targets = names.length > 0 ? names : Object.keys(lock.items);
  if (targets.length === 0) {
    console.log(yellow('Nothing installed yet. Run `ibirdui add <item>` first.'));
    return;
  }

  console.log(dim(`Registry: ${baseUrl}\n`));

  let updated = 0;
  let conflicts = 0;
  let upToDate = 0;

  for (const name of targets) {
    const locked = lock.items[name];
    if (!locked) {
      console.log(`${yellow('skip')} ${name} ${dim('(not in lockfile — use `add`)')}`);
      continue;
    }

    const item: RegistryItem = await fetchRegistryItem(baseUrl, name, { fetch: nodeFetch });
    if (item.version === locked.version) {
      console.log(`${dim('ok  ')} ${name}@${item.version} ${dim('(up to date)')}`);
      upToDate += 1;
      continue;
    }

    console.log(`${bold(name)} ${dim(`${locked.version} → ${item.version}`)}`);

    for (const file of item.files) {
      const target = join(cwd, file.path);
      const newContent = file.content;
      const newHash = file.hash ?? hashContent(newContent);
      const lockedHash = locked.files[file.path];

      if (!existsSync(target)) {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, newContent);
        console.log(`  ${green('add ')} ${file.path} ${dim('(new file)')}`);
        continue;
      }

      const current = await readFile(target, 'utf8');
      const currentHash = hashContent(current);

      if (currentHash === newHash) {
        console.log(`  ${dim('ok  ')} ${file.path} ${dim('(already current)')}`);
      } else if (currentHash === lockedHash) {
        await writeFile(target, newContent);
        console.log(`  ${green('upd ')} ${file.path}`);
        updated += 1;
      } else {
        // Locally edited and upstream changed → don't clobber the user's work.
        const sidecar = `${target}.new`;
        await writeFile(sidecar, newContent);
        console.log(`  ${red('conflict')} ${file.path} ${dim(`→ wrote ${file.path}.new`)}`);
        conflicts += 1;
      }
    }

    // Pin the new version. Conflicted files keep the user's content on disk but
    // we record the new hashes so the next upgrade compares against this release.
    recordItem(lock, item);
  }

  await writeLockfile(cwd, lock);

  console.log(
    `\n${bold('Done.')} ${updated} updated, ${conflicts} conflict(s), ${upToDate} up to date.`,
  );
  if (conflicts > 0) {
    console.log(
      cyan(
        '\nResolve conflicts by merging each *.new into your edited file, then delete the *.new.',
      ),
    );
  }
}
