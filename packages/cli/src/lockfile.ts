import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RegistryItem } from '@liveui/core';
import { hashContent } from '@liveui/core';

export const LOCKFILE_NAME = 'liveui.lock.json';

/** One installed item: the version pinned and the hash of each file we wrote. */
export interface LockedItem {
  version: string;
  files: Record<string, string>;
}

export interface Lockfile {
  $schema?: string;
  registry: string;
  items: Record<string, LockedItem>;
}

function emptyLock(registry: string): Lockfile {
  return {
    $schema: 'https://liveui/schema/lockfile.json',
    registry,
    items: {},
  };
}

export async function readLockfile(cwd: string, registry: string): Promise<Lockfile> {
  const path = join(cwd, LOCKFILE_NAME);
  if (!existsSync(path)) return emptyLock(registry);
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Lockfile;
    return { ...emptyLock(registry), ...parsed, items: parsed.items ?? {} };
  } catch {
    return emptyLock(registry);
  }
}

export async function writeLockfile(cwd: string, lock: Lockfile): Promise<void> {
  await writeFile(join(cwd, LOCKFILE_NAME), `${JSON.stringify(lock, null, 2)}\n`);
}

/** Record an installed item's version and per-file fingerprints. */
export function recordItem(lock: Lockfile, item: RegistryItem): void {
  const files: Record<string, string> = {};
  for (const file of item.files) {
    files[file.path] = file.hash ?? hashContent(file.content);
  }
  lock.items[item.name] = { version: item.version, files };
}
