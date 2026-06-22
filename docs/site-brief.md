# Build the marketing + docs website for **everstate**

You are building the official website for **everstate**, an open-source React component library. The site must be production-quality, fully accessible, and itself a showcase of the library's philosophy. Output a complete, runnable project.

## 1. What everstate is (context — use these facts, do not invent)

everstate is a **registry-as-code** component library: like shadcn/ui, you don't install a runtime dependency — a CLI copies the component's source **into your repo**, so you own the code. everstate's differentiator over shadcn:

> **The thesis:** shadcn gave you *ownership*. everstate adds back the two things ownership cost you — *completeness* (components handle every real-world state) and *maintainability* (a real upgrade path + AI-readiness).

Real facts to display:
- **Name:** everstate · **Author:** Geekles007 · **License:** MIT
- **GitHub:** https://github.com/Geekles007/everstate
- **Registry / live site base:** https://geekles007.github.io/everstate
- **npm packages:** `everstate-core` (the contract), `everstate` (CLI, binary `everstate`)
- **Install a component:** `npx everstate add data-list`
- **CLI commands:** `everstate list`, `everstate add <item>`, `everstate upgrade [items]`, `everstate gen "<prompt>"`
- **Stack of the library:** TypeScript, Tailwind CSS, Turborepo + pnpm, Vitest + axe-core, Biome.

## 2. The 3 differentiators (these are the heart of the site)

**1. State-complete by construction.** Every component speaks one async contract — `AsyncState<T>` with five states: `idle · loading · empty · error · success`. You write only the happy path; the loading skeleton, empty slot, error + retry, and screen-reader announcements are provided. Show this with a **live interactive demo**: a `DataList` with buttons to switch its state (Loading / Empty / Error / Success) and watch the UI react instantly.

**2. Upgradeable copy-paste.** `everstate add` writes a `everstate.lock.json` (version + a content fingerprint per file). `everstate upgrade` then updates files you haven't touched, and for files you edited locally it **does not overwrite** — it keeps yours and drops the new version as `*.new` to merge. Show this with an **animated terminal**:

```
$ everstate upgrade
state-boundary 1.0.0 → 1.1.0
  conflict components/state-boundary.tsx → wrote components/state-boundary.tsx.new
data-list 1.0.0 → 1.1.0
  upd  components/data-list.tsx
```

**3. Accessible & AI-native.** Every UI component ships an **axe accessibility test** and documents its guarantees (live-region announcements, `aria-busy`, focus management, correct roles) — accessibility is *verified*, not claimed. Every component also carries a machine-readable **manifest** (`intents`, `examples`) so `everstate gen "<prompt>"` can suggest the right components for a task. Show an **AI prompt box**: user types "a list of users with loading states", it returns suggested components (`data-list`, `state-boundary`) with the `everstate add` command. (Backed by static data is fine.)

## 3. Components to feature

Shipped today (3):
- `async-state` — *lib* — the `AsyncState<T>` contract.
- `state-boundary` — *component, a11y AA* — maps an AsyncState onto loading/empty/error/success slots, with live-region announcements + focus management.
- `data-list` — *component, a11y AA* — a list that handles loading/empty/error and announces the result count; you only write one row.

Roadmap (24 total, across 6 layers — show as a roadmap section with statuses Done / Next / Planned):
- **Layer 0 — Foundation:** async-state ✅, theme (Next), use-async, use-optimistic-list, use-online, skeleton
- **Layer 1 — State primitives:** state-boundary ✅, empty-state, error-state, async-button
- **Layer 2 — Data display:** data-list ✅, data-table, card-collection, detail-view, avatar
- **Layer 3 — Fetching inputs:** async-combobox, command-palette, file-upload
- **Layer 4 — Feedback/overlays:** toast, confirm-dialog, sheet/drawer
- **Layer 5 — Navigation:** pagination/load-more, infinite-list, tabs

## 4. Site structure (pages & sections)

1. **Hero** — name, the one-line thesis, two CTAs: a primary copy-to-clipboard pill showing `npx everstate add data-list`, and a "Star on GitHub" button. Visual centerpiece: a small live component cycling through the 5 states (with a manual override). A subtle "pulse / vital-signs" motif fits the "live" brand.
2. **The problem** — one tight section: "shadcn gives you dumb UI — you re-implement loading/empty/error in every project, accessibility is unchecked, and you can never upgrade what you copied." Lead into the three differentiators.
3. **Three differentiator sections** — each with the interactive demo described in §2.
4. **Component gallery** — a filterable grid (filter by layer and by status). Each card: name, plain-English description, states it handles (chips), a11y badge (AA), and the `everstate add <name>` command with copy button. Done components are interactive previews; planned ones show a "Planned" badge.
5. **How it works** — a clear diagram: `registry/items/*` → static JSON (`/r/*.json`) → `everstate` CLI copies files into your project + writes `everstate.lock.json`. Explain "no backend, just static files."
6. **Comparison table** — everstate vs shadcn/ui vs hand-rolled, rows: *You own the code*, *Loading/empty/error built-in*, *Optimistic & offline states*, *Verified accessibility (axe)*, *Upgrade path*, *AI manifest*. (everstate = all yes.)
7. **Quick start** — copyable, with package-manager tabs (npm / pnpm / bun). Show `npx everstate list`, `npx everstate add data-list`, `npx everstate upgrade`.
8. **Code examples** — syntax-highlighted (Shiki), with copy buttons. Include the real `AsyncState<T>` type and a `DataList` usage:

```tsx
<DataList state={users} label="Users" getKey={(u) => u.id}>
  {(u) => <UserRow user={u} />}
</DataList>
```

9. **Roadmap** — the 24 components grouped by the 6 layers with status badges.
10. **Footer** — GitHub, npm, docs, MIT license, © Geekles007.

## 5. Design direction

- **Aesthetic:** modern, technical, restrained — in the family of Linear / Radix / shadcn docs. Generous whitespace, crisp type, strong hierarchy.
- **Dark mode first**, with a light theme and an accessible toggle. **Dogfood everstate's own theme tokens** (semantic CSS variables: `background`, `foreground`, `muted`, `border`, `destructive`, `primary`).
- **Accent:** a single vivid "signal" color (e.g. an electric green/lime or a vital-signs cyan) on neutral grays. Tie subtle motion to a heartbeat/pulse motif.
- **Type:** Inter or Geist for UI; Geist Mono or JetBrains Mono for code.
- **Motion:** purposeful micro-interactions (state transitions animate, copy gives feedback, cards lift slightly). All motion must respect `prefers-reduced-motion`.
- **Bonus (dogfooding):** a **Cmd+K command palette** to jump between components/sections — it previews the future `command-palette` component.

## 6. Accessibility requirements (non-negotiable — this library is *about* a11y)

The site must meet **WCAG 2.1 AA** and pass automated axe checks:
- Semantic HTML landmarks (`header`, `nav`, `main`, `footer`), one `h1`, logical heading order.
- Full keyboard operability, visible `:focus-visible` styles, no keyboard traps.
- Color contrast ≥ AA in both themes. Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- All interactive demos announce state changes via a polite live region (mirroring everstate's own `state-boundary`).
- Images/icons have proper alt/aria; copy buttons have accessible labels and success feedback.

## 7. Technical constraints

- **Next.js (App Router) + TypeScript + Tailwind CSS.** Must support **static export** (deployed to GitHub Pages under base path `/everstate`) — no server runtime, no database.
- Syntax highlighting via **Shiki** (build-time). Clipboard copy on all command/code blocks.
- Fully responsive (mobile → desktop). Lighthouse ≥ 95 for Performance, Accessibility, Best Practices, SEO.
- **SEO:** title, meta description, Open Graph + Twitter cards, an OG image, favicon, sitemap.
- Keep all content data-driven (a single `components.ts` / `roadmap.ts` source feeding the gallery and roadmap), so it's trivial to keep in sync with the registry.

## 8. Deliverables

- A complete, runnable Next.js project (or a drop-in `app/` + `components/` set for an existing Next 15 / React 19 + Tailwind workspace).
- All sections in §4 implemented with the working interactive demos in §2.
- Light/dark theming with the semantic tokens, the command palette, copy buttons, and Shiki highlighting.
- Passing accessibility (no axe violations) and a clean responsive layout.
- A short README explaining how to run, edit content, and deploy to GitHub Pages.

**Brand voice:** confident, precise, developer-to-developer. No fluff, no buzzword soup. Lead with what breaks today and how everstate fixes it. Sample hero copy: *"Components that handle the parts you always forget. Own the code like shadcn — but with every state, verified accessibility, and an upgrade path that survives your edits."*
