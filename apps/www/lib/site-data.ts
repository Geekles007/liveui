// Single source of truth for the site — mirrors the real registry. The docs
// page, roadmap and command palette all read from here, so editing once keeps
// everything in sync.

export type Status = 'done' | 'next' | 'planned';

export interface Comp {
  name: string;
  layer: number;
  status: Status;
  kind: string;
  a11y: boolean;
}

export const layerNames: Record<number, string> = {
  0: 'Foundation',
  1: 'State primitives',
  2: 'Data display',
  3: 'Fetching inputs',
  4: 'Feedback & overlays',
  5: 'Navigation',
};

export const components: Comp[] = [
  { name: 'async-state', layer: 0, status: 'done', kind: 'lib', a11y: false },
  { name: 'theme', layer: 0, status: 'done', kind: 'tokens', a11y: false },
  { name: 'use-async', layer: 0, status: 'planned', kind: 'hook', a11y: false },
  { name: 'use-optimistic-list', layer: 0, status: 'planned', kind: 'hook', a11y: false },
  { name: 'use-online', layer: 0, status: 'planned', kind: 'hook', a11y: false },
  { name: 'skeleton', layer: 0, status: 'planned', kind: 'component', a11y: true },
  { name: 'state-boundary', layer: 1, status: 'done', kind: 'component', a11y: true },
  { name: 'empty-state', layer: 1, status: 'planned', kind: 'component', a11y: true },
  { name: 'error-state', layer: 1, status: 'planned', kind: 'component', a11y: true },
  { name: 'async-button', layer: 1, status: 'planned', kind: 'component', a11y: true },
  { name: 'data-list', layer: 2, status: 'done', kind: 'component', a11y: true },
  { name: 'data-table', layer: 2, status: 'planned', kind: 'component', a11y: true },
  { name: 'card-collection', layer: 2, status: 'planned', kind: 'component', a11y: true },
  { name: 'detail-view', layer: 2, status: 'planned', kind: 'component', a11y: true },
  { name: 'avatar', layer: 2, status: 'planned', kind: 'component', a11y: false },
  { name: 'async-combobox', layer: 3, status: 'planned', kind: 'component', a11y: true },
  { name: 'command-palette', layer: 3, status: 'planned', kind: 'component', a11y: true },
  { name: 'file-upload', layer: 3, status: 'planned', kind: 'component', a11y: true },
  { name: 'toast', layer: 4, status: 'planned', kind: 'component', a11y: true },
  { name: 'confirm-dialog', layer: 4, status: 'planned', kind: 'component', a11y: true },
  { name: 'sheet', layer: 4, status: 'planned', kind: 'component', a11y: true },
  { name: 'pagination', layer: 5, status: 'planned', kind: 'component', a11y: true },
  { name: 'infinite-list', layer: 5, status: 'planned', kind: 'component', a11y: true },
  { name: 'tabs', layer: 5, status: 'planned', kind: 'component', a11y: true },
];

/** Guaranteed first component, used as a safe fallback when a selection misses. */
export const firstComponent: Comp = components[0] ?? {
  name: 'async-state',
  layer: 0,
  status: 'done',
  kind: 'lib',
  a11y: false,
};

export interface TutorialStep {
  title: string;
  body: string;
  file: string;
  code: string;
}
export interface PropRow {
  name: string;
  type: string;
  desc: string;
}
export interface Doc {
  intro: string;
  example?: 'asyncstate' | 'interactive';
  exampleTag?: string;
  demoKind?: string;
  tutorialIntro?: string;
  tutorial?: TutorialStep[];
  propsTitle?: string;
  propsIntro?: string;
  col0?: string;
  props?: PropRow[];
  a11y?: boolean;
  a11yList?: string[];
  // planned
  apiFile?: string;
  api?: string;
}

export const docs: Record<string, Doc> = {
  'async-state': {
    intro:
      'The contract at the centre of liveui. One discriminated union, AsyncState<T>, models the full lifecycle of any async value — so every component speaks the same five-state language.',
    example: 'asyncstate',
    tutorialIntro:
      'async-state is a tiny type-only module. Model your data once, then hand it to any liveui component.',
    tutorial: [
      {
        title: 'Add the contract',
        body: 'It copies a single, dependency-free .ts file into your project. No runtime, just types and a couple of helpers.',
        file: 'terminal',
        code: '$ npx liveui add async-state\n✓ wrote lib/async-state.ts\n✓ updated liveui.lock.json',
      },
      {
        title: 'Model your data',
        body: 'AsyncState<T> is a union of five variants. The compiler forces you to handle each one — you can never forget the error branch again.',
        file: 'lib/async-state.ts',
        code: 'export type AsyncState<T> =\n  | { status: "idle" }\n  | { status: "loading" }\n  | { status: "empty" }\n  | { status: "error"; error: Error; retry: () => void }\n  | { status: "success"; data: T };',
      },
      {
        title: 'Produce a state',
        body: 'Wrap any fetch. Return loading first, then narrow to empty / error / success. The retry callback is part of the error variant by design.',
        file: 'load-users.ts',
        code: 'async function loadUsers(): Promise<AsyncState<User[]>> {\n  try {\n    const data = await api.users.list();\n    return data.length\n      ? { status: "success", data }\n      : { status: "empty" };\n  } catch (error) {\n    return { status: "error", error, retry: loadUsers };\n  }\n}',
      },
      {
        title: 'Hand it to a component',
        body: 'Any liveui display component accepts an AsyncState and renders the right slot automatically. You write zero state-handling code.',
        file: 'users.tsx',
        code: '<DataList state={users} label="Users" getKey={(u) => u.id}>\n  {(u) => <UserRow user={u} />}\n</DataList>',
      },
    ],
    propsTitle: 'Variants',
    propsIntro: 'The five members of the union and the data each one carries.',
    col0: 'status',
    props: [
      { name: '"idle"', type: '{ }', desc: 'Nothing requested yet — the initial resting state.' },
      {
        name: '"loading"',
        type: '{ }',
        desc: 'A request is in flight. Components render their skeleton and set aria-busy.',
      },
      {
        name: '"empty"',
        type: '{ }',
        desc: 'The request succeeded but returned no items — a distinct, designed state.',
      },
      {
        name: '"error"',
        type: '{ error, retry }',
        desc: 'The request failed. Carries the Error plus a retry() so the UI can offer a button.',
      },
      {
        name: '"success"',
        type: '{ data: T }',
        desc: 'The request resolved with data. The only variant where data is present.',
      },
    ],
    a11y: false,
  },
  'state-boundary': {
    intro:
      'Maps an AsyncState onto loading / empty / error / success slots — with polite live-region announcements and automatic focus management. The single primitive every other display component is built on.',
    example: 'interactive',
    exampleTag: '<StateBoundary state={…} />',
    demoKind: 'boundary',
    tutorialIntro:
      'Wrap any async-driven region. Provide the slots you care about; the boundary picks the right one and announces the transition.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the component plus its axe test into your repo. You own both.',
        file: 'terminal',
        code: '$ npx liveui add state-boundary\n✓ wrote components/state-boundary.tsx\n✓ wrote components/state-boundary.test.tsx',
      },
      {
        title: 'Wrap your async region',
        body: 'Pass the AsyncState as state. The boundary renders loading / empty / error for you — you only describe success.',
        file: 'profile.tsx',
        code: '<StateBoundary state={profile}>\n  {(data) => <Profile user={data} />}\n</StateBoundary>',
      },
      {
        title: 'Customise the slots (optional)',
        body: 'Every slot has a sensible default; override any of them when the context calls for it.',
        file: 'profile.tsx',
        code: '<StateBoundary\n  state={profile}\n  loading={<ProfileSkeleton />}\n  empty={<NoProfile />}\n  error={(e, retry) => <ErrorCard error={e} onRetry={retry} />}\n>\n  {(data) => <Profile user={data} />}\n</StateBoundary>',
      },
      {
        title: 'Announcements happen for free',
        body: 'On every transition the boundary writes to a polite live region and moves focus to the error action when one appears. Nothing to wire up.',
        file: '—',
        code: '// "Loading profile…"  →  "Profile loaded."\n// announced automatically via aria-live="polite"',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'The full surface of <StateBoundary>.',
    col0: 'Prop',
    props: [
      {
        name: 'state',
        type: 'AsyncState<T>',
        desc: 'Required. The state to render. Drives which slot is shown.',
      },
      {
        name: 'children',
        type: '(data: T) => ReactNode',
        desc: 'Required. The success renderer — called only when status is "success".',
      },
      {
        name: 'loading',
        type: 'ReactNode',
        desc: 'Slot shown while loading. Defaults to a skeleton with aria-busy.',
      },
      {
        name: 'empty',
        type: 'ReactNode',
        desc: 'Slot shown when empty. Defaults to a neutral empty message.',
      },
      {
        name: 'error',
        type: '(error, retry) => ReactNode',
        desc: 'Error renderer. Default shows the message plus a retry button.',
      },
      {
        name: 'announce',
        type: '(s) => string',
        desc: 'Override the live-region text for each transition.',
      },
    ],
    a11y: true,
    a11yList: [
      'Transitions are announced through an aria-live="polite" region so screen readers hear the new state.',
      'The loading slot sets aria-busy="true" on its container.',
      'When an error appears, focus moves to the retry control so keyboard users land on the action.',
      'Slots use correct roles (status / alert) and never trap focus.',
      'All motion respects prefers-reduced-motion — skeletons stop shimmering.',
      'Verified by a shipped axe-core test that runs across every state.',
    ],
  },
  'data-list': {
    intro:
      'A list that handles loading, empty and error for you and announces the result count to assistive tech. You write a single row component — everything else is provided.',
    example: 'interactive',
    exampleTag: '<DataList state={…} />',
    demoKind: 'datalist',
    tutorialIntro:
      'Give it a state and a way to render one item. data-list composes state-boundary under the hood, so you inherit every accessibility guarantee.',
    tutorial: [
      {
        title: 'Install',
        body: 'Pulls in data-list and its axe test. It depends on state-boundary, which the CLI adds for you if it is missing.',
        file: 'terminal',
        code: '$ npx liveui add data-list\n+ also adding dependency: state-boundary\n✓ wrote components/data-list.tsx',
      },
      {
        title: 'Write one row',
        body: 'A plain component for a single item. No loading or error logic lives here — that is the list’s job.',
        file: 'user-row.tsx',
        code: 'function UserRow({ user }: { user: User }) {\n  return (\n    <li className="row">\n      <Avatar src={user.avatar} />\n      <span>{user.name}</span>\n    </li>\n  );\n}',
      },
      {
        title: 'Render the list',
        body: 'Pass the AsyncState, a label for screen readers, and a getKey. The render function turns each item into a row.',
        file: 'users.tsx',
        code: '<DataList\n  state={users}\n  label="Team members"\n  getKey={(u) => u.id}\n>\n  {(u) => <UserRow user={u} />}\n</DataList>',
      },
      {
        title: 'Result count is announced',
        body: 'On success the list announces e.g. "4 team members loaded" via a polite live region — try the toggles in the example above.',
        file: '—',
        code: '// status="success", data.length === 4\n// → announces: "4 team members loaded"',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'The full surface of <DataList>.',
    col0: 'Prop',
    props: [
      {
        name: 'state',
        type: 'AsyncState<T[]>',
        desc: 'Required. The list state. An empty array resolves to the "empty" slot automatically.',
      },
      {
        name: 'children',
        type: '(item: T) => ReactNode',
        desc: 'Required. Renders one row. Called per item on success.',
      },
      {
        name: 'getKey',
        type: '(item: T) => string',
        desc: 'Required. Stable React key for each row.',
      },
      {
        name: 'label',
        type: 'string',
        desc: 'Accessible name for the list, also used in the count announcement.',
      },
      {
        name: 'empty',
        type: 'ReactNode',
        desc: 'Custom empty slot. Defaults to a searching/empty message.',
      },
      {
        name: 'loadingRows',
        type: 'number',
        desc: 'How many skeleton rows to show while loading. Default 4.',
      },
    ],
    a11y: true,
    a11yList: [
      'Renders a real list — role="list" with role="listitem" rows — so structure is conveyed.',
      'The result count is announced via aria-live after a successful load.',
      'Loading state sets aria-busy and shows the configured number of skeleton rows.',
      'The empty and error slots inherit state-boundary’s roles and focus behaviour.',
      'Fully keyboard operable; interactive rows expose visible focus.',
      'Shipped axe-core test exercises loading, empty, error and success.',
    ],
  },
  // ---- planned (intended API) ----
  theme: {
    intro:
      'Semantic CSS variables — background, foreground, muted, border, destructive, primary — with first-class dark and light, plus the Tailwind preset that wires them up. The token layer every liveui component speaks (and this very site dogfoods).',
    apiFile: 'tailwind.preset.ts',
    api: 'import liveui from "./tailwind.preset";\n\nexport default {\n  presets: [liveui],\n  content: ["./src/**/*.{ts,tsx}"],\n};',
    tutorialIntro:
      'theme ships two files — the CSS variables and a Tailwind preset. Install it before any other component; everything else assumes these tokens exist.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the token stylesheet and the Tailwind preset into your project. The CLI adds it automatically the first time you add a component that needs it.',
        file: 'terminal',
        code: '$ npx liveui add theme\n✓ wrote styles/theme.css\n✓ wrote tailwind.preset.ts',
      },
      {
        title: 'Import the tokens',
        body: 'Pull the stylesheet into your global CSS once. It defines the variables for light and dark and sets the base background / foreground.',
        file: 'app/globals.css',
        code: '@import "../styles/theme.css";',
      },
      {
        title: 'Wire up Tailwind',
        body: 'Add the preset so utilities like bg-background, text-muted-foreground and border-border resolve to the tokens — with opacity modifiers (bg-destructive/10) working.',
        file: 'tailwind.config.ts',
        code: 'import liveui from "./tailwind.preset";\n\nexport default {\n  presets: [liveui],\n  content: ["./src/**/*.{ts,tsx}"],\n};',
      },
      {
        title: 'Toggle dark mode',
        body: 'Set data-theme on <html>. Every token flips; no component needs to know about the theme.',
        file: '—',
        code: '<html data-theme="dark"> … </html>',
      },
    ],
    propsTitle: 'Tokens',
    propsIntro:
      'The semantic variables, exposed as HSL channels so Tailwind can compose them with opacity.',
    col0: 'token',
    props: [
      {
        name: '--background / --foreground',
        type: 'page',
        desc: 'Base surface and text colour for the whole app.',
      },
      {
        name: '--muted / --muted-foreground',
        type: 'subtle',
        desc: 'Subdued surfaces (skeletons, chips) and secondary text.',
      },
      {
        name: '--border / --input / --ring',
        type: 'lines',
        desc: 'Borders, form field outlines, and the focus ring.',
      },
      {
        name: '--primary / --primary-foreground',
        type: 'brand',
        desc: 'Primary action colour and the text that sits on it.',
      },
      {
        name: '--destructive / --destructive-foreground',
        type: 'danger',
        desc: 'Error and destructive states.',
      },
      { name: '--radius', type: 'shape', desc: 'Base corner radius; md and sm derive from it.' },
    ],
  },
  'use-async': {
    intro:
      'A hook that runs an async function and hands you back a fully typed AsyncState<T> — including the retry callback — so you never assemble the union by hand.',
    apiFile: 'use-async.ts',
    api: 'const users = useAsync(() => api.users.list(), []);\n// users: AsyncState<User[]>\n\n<DataList state={users}>{…}</DataList>',
  },
  'use-optimistic-list': {
    intro:
      'Mutate a list optimistically and roll the change back automatically if the request fails.',
    apiFile: 'use-optimistic-list.ts',
    api: 'const [items, mutate] = useOptimisticList(state);\nmutate.add(newItem);   // shows instantly\nmutate.remove(id);     // reverts on error',
  },
  'use-online': {
    intro:
      'Track connectivity so components can render offline states and pause requests when the network drops.',
    apiFile: 'use-online.ts',
    api: 'const online = useOnline();\nif (!online) return <OfflineBanner />;',
  },
  skeleton: {
    intro:
      'A composable loading-placeholder primitive — the shimmer block every loading slot is built from.',
    apiFile: 'skeleton.tsx',
    api: '<Skeleton className="h-4 w-32" />\n<Skeleton.Circle size={32} />',
  },
  'empty-state': {
    intro:
      'A considered empty slot with an icon, a message and a primary action — drop-in for any boundary’s empty prop.',
    apiFile: 'empty-state.tsx',
    api: '<EmptyState\n  title="No projects yet"\n  action={<Button>New project</Button>}\n/>',
  },
  'error-state': {
    intro:
      'An error slot with retry and expandable technical details, wired to the AsyncState error variant.',
    apiFile: 'error-state.tsx',
    api: '<ErrorState error={err} onRetry={retry} />',
  },
  'async-button': {
    intro:
      'A button that owns its own pending and error state — disables, shows a spinner, and recovers, from a single onClick that returns a promise.',
    apiFile: 'async-button.tsx',
    api: '<AsyncButton onClick={() => save(form)}>\n  Save changes\n</AsyncButton>',
  },
  'data-table': {
    intro:
      'A sortable table over an AsyncState — with loading rows, empty and error states, and announced sort changes.',
    apiFile: 'data-table.tsx',
    api: '<DataTable state={rows} columns={columns} getKey={(r) => r.id} />',
  },
  'card-collection': {
    intro:
      'A responsive card grid over an AsyncState — loading, empty and success, with one card component.',
    apiFile: 'card-collection.tsx',
    api: '<CardCollection state={products}>\n  {(p) => <ProductCard product={p} />}\n</CardCollection>',
  },
  'detail-view': {
    intro: 'A single-record view with loading and not-found handling for the empty state.',
    apiFile: 'detail-view.tsx',
    api: '<DetailView state={order}>\n  {(o) => <OrderSummary order={o} />}\n</DetailView>',
  },
  avatar: {
    intro: 'An avatar with image fallback and a loading state for the image itself.',
    apiFile: 'avatar.tsx',
    api: '<Avatar src={user.avatar} name={user.name} />',
  },
  'async-combobox': {
    intro:
      'A combobox that fetches options as you type — debounced, with loading, empty and error states inside the listbox.',
    apiFile: 'async-combobox.tsx',
    api: '<AsyncCombobox\n  load={(q) => api.search(q)}\n  getLabel={(o) => o.name}\n/>',
  },
  'command-palette': {
    intro:
      'A ⌘K palette over async sources — exactly the pattern this site previews in its own header.',
    apiFile: 'command-palette.tsx',
    api: '<CommandPalette sources={[pages, asyncSearch]} />',
  },
  'file-upload': {
    intro: 'Upload with progress, retry and error states, modelled on AsyncState.',
    apiFile: 'file-upload.tsx',
    api: '<FileUpload\n  upload={(file) => api.upload(file)}\n  accept="image/*"\n/>',
  },
  toast: {
    intro:
      'Promise-aware notifications — pass a promise and the toast moves through loading → success / error on its own.',
    apiFile: 'toast.ts',
    api: 'toast.promise(save(form), {\n  loading: "Saving…",\n  success: "Saved",\n  error: "Could not save",\n});',
  },
  'confirm-dialog': {
    intro: 'An async confirm dialog whose action button owns its own pending and error state.',
    apiFile: 'confirm-dialog.tsx',
    api: 'const ok = await confirm({\n  title: "Delete project?",\n  action: () => api.remove(id),\n});',
  },
  sheet: {
    intro: 'A slide-over panel for detail views and forms, with a loading state for its contents.',
    apiFile: 'sheet.tsx',
    api: '<Sheet open={open} onOpenChange={setOpen}>\n  <DetailView state={record}>{…}</DetailView>\n</Sheet>',
  },
  pagination: {
    intro: 'Paged or load-more navigation over an AsyncState, with an announced page change.',
    apiFile: 'pagination.tsx',
    api: '<Pagination state={page} onPage={setPage} />',
  },
  'infinite-list': {
    intro:
      'Windowed infinite scroll with a loading sentinel and an announced "loading more" state.',
    apiFile: 'infinite-list.tsx',
    api: '<InfiniteList\n  state={pages}\n  onLoadMore={fetchNext}\n>{(item) => <Row item={item} />}</InfiniteList>',
  },
  tabs: {
    intro: 'Tabs where each panel can hold its own async content, lazily loaded on first view.',
    apiFile: 'tabs.tsx',
    api: '<Tabs>\n  <Tab title="Activity">{(/* AsyncState */) => …}</Tab>\n</Tabs>',
  },
};

export interface PageLink {
  label: string;
  hint: string;
  href: string;
}
export const pages: PageLink[] = [
  { label: 'Home', hint: 'Page', href: '/' },
  { label: 'Components', hint: 'Page', href: '/components' },
  { label: 'How it works', hint: 'Section', href: '/#how' },
  { label: 'Comparison', hint: 'Section', href: '/#compare' },
  { label: 'Quick start', hint: 'Section', href: '/#quickstart' },
  { label: 'Roadmap', hint: 'Page', href: '/roadmap' },
];
