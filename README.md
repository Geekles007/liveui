# vital

**State-complete, accessible, upgradeable React components — distributed as
registry-as-code.** Like shadcn, you own the code (it's copied into your repo, no
runtime dependency). Unlike shadcn, the components handle every real-world async
state out of the box, ship verified accessibility, and can be _upgraded_ without
losing your local edits.

> The thesis: shadcn gave you **ownership**. vital adds back the two things
> ownership cost you — **completeness** (all the states) and **maintainability**
> (upgrade + AI).

## The three differentiators

### 1. State-complete by construction

Every component speaks one async contract, `AsyncState<T>`
(`idle · loading · empty · error · success`). You write the happy path; the
loading skeleton, empty slot, error + retry, and screen-reader announcements come
for free.

```tsx
<DataList state={users} label="Users" getKey={(u) => u.id}>
  {(u) => <UserRow user={u} />}
</DataList>
// loading → skeleton rows · empty → empty slot · error → retry · success → list
```

### 2. Upgradeable copy-paste

`vital add` writes a `vital.lock.json` recording the version and a fingerprint of
every file. `vital upgrade` then does a safe, edit-aware update:

- file untouched since install → **updated** in place
- file you edited locally → **conflict**: your version is kept, the new one is
  written next to it as `*.new` to merge

```
$ vital upgrade
state-boundary 1.0.0 → 1.1.0
  conflict components/state-boundary.tsx → wrote components/state-boundary.tsx.new
data-list 1.0.0 → 1.1.0
  upd  components/data-list.tsx
```

### 3. Accessible & AI-native

- Every UI item ships an **axe test** (`a11y.tested: true`) and documents its
  guarantees: live-region announcements, `aria-busy`, focus management, roles.
- Every item carries a machine-readable **manifest** (`intents`, `examples`),
  aggregated into `r/manifest.json`. `vital gen "<prompt>"` matches it to suggest
  the right components — the seam where a model (e.g. `@geekles/llm_sdk`) plugs in
  to generate UI from real components instead of hallucinating markup.

Styling is **Tailwind CSS** (semantic tokens: `muted`, `destructive`, …).

## What's inside

```
packages/core      AsyncState contract · content hashing · zod schema + fetch helpers
packages/cli       add · upgrade · gen · list  (writes/maintains vital.lock.json)
registry/          Items (async-state, state-boundary, data-list) + a11y tests + build
apps/www           Next.js docs site; also serves the static registry under /r
scripts/rename.mjs One-shot rebrand for a fork
```

Stack: **pnpm** workspaces · **Turborepo** · **TypeScript** · **Tailwind** ·
**Vitest + axe-core** · **Biome** · **Changesets**.

## Items

| item             | type      | states                | a11y |
| ---------------- | --------- | --------------------- | ---- |
| `async-state`    | lib       | —                     | —    |
| `state-boundary` | component | loading/empty/error   | AA   |
| `data-list`      | component | loading/empty/error   | AA   |

`data-list` → `state-boundary` → `async-state` (resolved automatically by `add`).

## Quick start

```bash
pnpm install
pnpm registry:build   # compile registry/items -> registry/public/r
pnpm test             # core unit tests + per-component axe tests
pnpm check            # lint + format (Biome)
```

Try the full flow against the local registry, no publishing needed:

```bash
pnpm --filter @vital/cli build
REG="file://$(pwd)/registry/public"
CLI="$(pwd)/packages/cli/dist/index.js"

node "$CLI" list    --registry "$REG"
node "$CLI" gen     "a list of users with loading states" --registry "$REG"
node "$CLI" add     data-list --registry "$REG" --cwd /tmp/app   # also writes vital.lock.json
node "$CLI" upgrade --registry "$REG" --cwd /tmp/app
```

The default registry URL is GitHub Pages; `--registry` / `VITAL_REGISTRY_URL`
override it.

## How an item is defined

```
registry/items/data-list/
  meta.json                     name, version, states, a11y, manifest, file map
  files/data-list.tsx           the source copied into the consumer ("@/components/...")
  tests/data-list.a11y.test.tsx axe test that ships with the item
```

`pnpm registry:build` validates each item against `@vital/core`, injects a content
hash per file, and emits `r/index.json`, `r/<name>.json`, and `r/manifest.json`.

## Reuse for a new project

```bash
node scripts/rename.mjs --scope <name> --owner <owner> --repo <name>   # --dry to preview
pnpm install && pnpm build
```

## License

[MIT](./LICENSE) © Geekles007
