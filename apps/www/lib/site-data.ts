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
  { name: 'use-async', layer: 0, status: 'done', kind: 'hook', a11y: false },
  { name: 'use-optimistic-list', layer: 0, status: 'planned', kind: 'hook', a11y: false },
  { name: 'use-online', layer: 0, status: 'done', kind: 'hook', a11y: false },
  { name: 'skeleton', layer: 0, status: 'done', kind: 'component', a11y: true },
  { name: 'state-boundary', layer: 1, status: 'done', kind: 'component', a11y: true },
  { name: 'empty-state', layer: 1, status: 'done', kind: 'component', a11y: true },
  { name: 'error-state', layer: 1, status: 'done', kind: 'component', a11y: true },
  { name: 'async-button', layer: 1, status: 'done', kind: 'component', a11y: true },
  { name: 'data-list', layer: 2, status: 'done', kind: 'component', a11y: true },
  { name: 'data-table', layer: 2, status: 'done', kind: 'component', a11y: true },
  { name: 'card-collection', layer: 2, status: 'planned', kind: 'component', a11y: true },
  { name: 'detail-view', layer: 2, status: 'planned', kind: 'component', a11y: true },
  { name: 'avatar', layer: 2, status: 'planned', kind: 'component', a11y: false },
  { name: 'async-combobox', layer: 3, status: 'done', kind: 'component', a11y: true },
  { name: 'command-palette', layer: 3, status: 'planned', kind: 'component', a11y: true },
  { name: 'file-upload', layer: 3, status: 'planned', kind: 'component', a11y: true },
  { name: 'toast', layer: 4, status: 'done', kind: 'component', a11y: true },
  { name: 'confirm-dialog', layer: 4, status: 'done', kind: 'component', a11y: true },
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
      'The contract at the centre of ibirdui. One discriminated union, AsyncState<T>, models the full lifecycle of any async value — so every component speaks the same five-state language.',
    example: 'asyncstate',
    tutorialIntro:
      'async-state is a tiny type-only module. Model your data once, then hand it to any ibirdui component.',
    tutorial: [
      {
        title: 'Add the contract',
        body: 'It copies a single, dependency-free .ts file into your project. No runtime, just types and a couple of helpers.',
        file: 'terminal',
        code: '$ npx ibirdui add async-state\n✓ wrote lib/async-state.ts\n✓ updated ibirdui.lock.json',
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
        body: 'Any ibirdui display component accepts an AsyncState and renders the right slot automatically. You write zero state-handling code.',
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
  skeleton: {
    intro:
      'A decorative placeholder shaped like the content that is loading. Hidden from screen readers, it pulses while you wait and goes still under prefers-reduced-motion — so it improves perceived speed without ever lying to assistive tech.',
    apiFile: 'components/skeleton.tsx',
    api: '<Skeleton className="h-4 w-32" />\n<Skeleton className="h-10 w-10 rounded-full" />\n\n<SkeletonText lines={3} />',
    tutorialIntro:
      'Skeleton is a styled div. Size it with utility classes to mirror the real content, or reach for SkeletonText when you just need a few lines.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the component plus its axe test into your repo. You own both.',
        file: 'terminal',
        code: '$ npx ibirdui add skeleton\n✓ wrote components/skeleton.tsx\n✓ wrote components/skeleton.test.tsx',
      },
      {
        title: 'Shape it like the content',
        body: 'Give it the height and width of whatever it stands in for. It is just a div, so any Tailwind utility works.',
        file: 'card.tsx',
        code: '<div className="flex items-center gap-3">\n  <Skeleton className="h-10 w-10 rounded-full" />\n  <Skeleton className="h-4 w-32" />\n</div>',
      },
      {
        title: 'Reach for SkeletonText for prose',
        body: 'A stack of line-shaped skeletons whose last line is shorter, so it reads like a real paragraph.',
        file: 'article.tsx',
        code: '<SkeletonText lines={4} />',
      },
      {
        title: 'Pair it with a boundary',
        body: 'Hand a skeleton to any loading slot. The boundary owns the announcement; the skeleton stays decorative.',
        file: 'profile.tsx',
        code: '<StateBoundary state={profile} loading={<SkeletonText lines={3} />}>\n  {(data) => <Profile user={data} />}\n</StateBoundary>',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'Both components forward every native <div> attribute. The extras:',
    col0: 'Prop',
    props: [
      {
        name: 'className',
        type: 'string',
        desc: 'Size and shape the placeholder — height, width, radius. Merged with the base pulse styles.',
      },
      {
        name: '…divProps',
        type: 'HTMLAttributes<HTMLDivElement>',
        desc: 'Any other div attribute (style, data-*, id) is forwarded as-is.',
      },
      {
        name: 'lines',
        type: 'number',
        desc: 'SkeletonText only. Number of placeholder lines. Clamped to a minimum of 1. Default 3.',
      },
    ],
    a11y: true,
    a11yList: [
      'Marked aria-hidden, so screen readers skip it entirely — the surrounding region owns the loading announcement.',
      'Carries no role and no text content, so it never pollutes the accessibility tree.',
      'The pulse animation is disabled under prefers-reduced-motion (motion-reduce:animate-none).',
      'SkeletonText hides the whole line stack as one group rather than each line individually.',
      'Verified by a shipped axe-core test covering the block and the text variant.',
    ],
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
        code: '$ npx ibirdui add state-boundary\n✓ wrote components/state-boundary.tsx\n✓ wrote components/state-boundary.test.tsx',
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
        code: '$ npx ibirdui add data-list\n+ also adding dependency: state-boundary\n✓ wrote components/data-list.tsx',
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
      'Semantic CSS variables — background, foreground, muted, border, destructive, primary — with first-class dark and light, plus the Tailwind preset that wires them up. The token layer every ibirdui component speaks (and this very site dogfoods).',
    apiFile: 'tailwind.preset.ts',
    api: 'import ibirdui from "./tailwind.preset";\n\nexport default {\n  presets: [ibirdui],\n  content: ["./src/**/*.{ts,tsx}"],\n};',
    tutorialIntro:
      'theme ships two files — the CSS variables and a Tailwind preset. Install it before any other component; everything else assumes these tokens exist.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the token stylesheet and the Tailwind preset into your project. The CLI adds it automatically the first time you add a component that needs it.',
        file: 'terminal',
        code: '$ npx ibirdui add theme\n✓ wrote styles/theme.css\n✓ wrote tailwind.preset.ts',
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
        code: 'import ibirdui from "./tailwind.preset";\n\nexport default {\n  presets: [ibirdui],\n  content: ["./src/**/*.{ts,tsx}"],\n};',
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
      'A hook that runs an async function and hands you back a fully typed AsyncState<T> — including the retry callback — so you never assemble the union by hand. The bridge from any fetcher to every ibirdui component.',
    apiFile: 'hooks/use-async.ts',
    api: 'const users = useAsync(() => api.users.list(), []);\n// users.state: AsyncState<User[]>\n\n<DataList state={users.state} label="Users" getKey={(u) => u.id}>\n  {(u) => <UserRow user={u} />}\n</DataList>',
    tutorialIntro:
      'use-async wraps a promise in the AsyncState contract for you. It depends on async-state, which the CLI adds automatically.',
    tutorial: [
      {
        title: 'Install',
        body: 'Adds the hook and its dependency, async-state, in one go.',
        file: 'terminal',
        code: '$ npx ibirdui add use-async\n+ also adding dependency: async-state\n✓ wrote hooks/use-async.ts',
      },
      {
        title: 'Call it with a fetcher',
        body: 'Pass a function returning a promise plus a deps array (same contract as useEffect). It returns { state, refetch }.',
        file: 'users.tsx',
        code: 'const users = useAsync(() => api.users.list(), []);\n// users.state is AsyncState<User[]>, starting at "loading"',
      },
      {
        title: 'Hand the state to a component',
        body: 'No manual loading/error wiring — the state already speaks the contract every ibirdui component understands.',
        file: 'users.tsx',
        code: '<DataList state={users.state} label="Users" getKey={(u) => u.id}>\n  {(u) => <UserRow user={u} />}\n</DataList>',
      },
      {
        title: 'Retry comes built in',
        body: 'On failure, the error variant already carries retry() (wired to refetch), so DataList shows a working Retry button with nothing extra from you.',
        file: '—',
        code: '// state = { status: "error", error, retry }\n// the retry button just works',
      },
    ],
    propsTitle: 'Signature',
    propsIntro: 'useAsync(fetcher, deps?, options?) → { state, refetch }.',
    col0: 'argument',
    props: [
      {
        name: 'fetcher',
        type: '() => Promise<T>',
        desc: 'Required. The async function to run. Its resolved type becomes T.',
      },
      {
        name: 'deps',
        type: 'unknown[]',
        desc: 'Re-runs the fetcher when any entry changes (like useEffect). Default [].',
      },
      {
        name: 'options.enabled',
        type: 'boolean',
        desc: 'Skip running until true — e.g. wait for an id. Default true.',
      },
      {
        name: 'options.isEmpty',
        type: '(data: T) => boolean',
        desc: 'Decide what counts as the empty state. Default: empty array / null.',
      },
      {
        name: '→ state',
        type: 'AsyncState<T>',
        desc: 'The current state, ready for any ibirdui component.',
      },
      {
        name: '→ refetch',
        type: '() => void',
        desc: 'Manually re-run; also wired into the error variant’s retry().',
      },
    ],
  },
  'use-optimistic-list': {
    intro:
      'Mutate a list optimistically and roll the change back automatically if the request fails.',
    apiFile: 'use-optimistic-list.ts',
    api: 'const [items, mutate] = useOptimisticList(state);\nmutate.add(newItem);   // shows instantly\nmutate.remove(id);     // reverts on error',
  },
  'use-online': {
    intro:
      "A hook that tracks the browser's online/offline status reactively — so components can render offline states and pause requests the moment the network drops. SSR-safe and tearing-free, built on useSyncExternalStore.",
    apiFile: 'hooks/use-online.ts',
    api: 'const online = useOnline();\nif (!online) return <OfflineBanner />;',
    tutorialIntro:
      'use-online subscribes to the browser online/offline events and hands you a single boolean. No state wiring, no effect, no cleanup to remember.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the hook into your repo. No dependencies beyond React.',
        file: 'terminal',
        code: '$ npx ibirdui add use-online\n✓ wrote hooks/use-online.ts',
      },
      {
        title: 'Read connectivity anywhere',
        body: 'Call it in any client component. It returns true while the browser reports a connection and flips to false the instant it drops.',
        file: 'app.tsx',
        code: "const online = useOnline();\nif (!online) return <OfflineBanner />;",
      },
      {
        title: 'Pause work while offline',
        body: 'Gate a refetch or a submit on connectivity so you do not fire requests that are guaranteed to fail.',
        file: 'feed.tsx',
        code: 'const online = useOnline();\nconst feed = useAsync(() => api.feed.list(), [], { enabled: online });',
      },
      {
        title: 'SSR is handled',
        body: 'On the server there is no network to probe, so it assumes online — the first paint never flashes a false offline state before hydration corrects it.',
        file: '—',
        code: '// server snapshot = true, then hydrates to navigator.onLine',
      },
    ],
    propsTitle: 'Signature',
    propsIntro: 'useOnline() → boolean. No arguments.',
    col0: 'returns',
    props: [
      {
        name: '→ online',
        type: 'boolean',
        desc: 'true while the browser reports a connection, false when it drops. Updates on the online / offline events.',
      },
    ],
  },
  'empty-state': {
    intro:
      "A considered “there's nothing here yet” panel — an optional icon, a title, a description and a primary action. Drops straight into a state-boundary's empty slot, and imposes no role or live region of its own so the boundary still owns the announcement.",
    apiFile: 'components/empty-state.tsx',
    api: '<EmptyState\n  title="No projects yet"\n  description="Create your first project to get started."\n  action={<button>New project</button>}\n/>',
    tutorialIntro:
      'EmptyState is a presentational panel. Give it a title; layer on a description, a custom icon or an action as you need them.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the component plus its axe test into your repo. No dependencies beyond React.',
        file: 'terminal',
        code: '$ npx ibirdui add empty-state\n✓ wrote components/empty-state.tsx\n✓ wrote components/empty-state.test.tsx',
      },
      {
        title: 'Say what is missing',
        body: 'A title is all it needs. A neutral tray icon shows by default; pass icon={null} to drop it, or your own glyph to replace it.',
        file: 'projects.tsx',
        code: '<EmptyState\n  title="No projects yet"\n  description="Create your first project to get started."\n/>',
      },
      {
        title: 'Add a way out',
        body: 'Hand it any focusable control as the action — a button or a link. It keeps its native semantics; EmptyState just places it.',
        file: 'projects.tsx',
        code: '<EmptyState\n  title="No projects yet"\n  action={<button onClick={createProject}>New project</button>}\n/>',
      },
      {
        title: 'Drop it into a boundary',
        body: 'Pass it to the empty slot. The boundary announces "No results"; EmptyState is the panel the sighted user sees.',
        file: 'list.tsx',
        code: '<StateBoundary state={projects} empty={<EmptyState title="No projects yet" action={<NewProjectButton />} />}>\n  {(data) => <ProjectGrid projects={data} />}\n</StateBoundary>',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'Forwards every native <div> attribute. The extras:',
    col0: 'Prop',
    props: [
      { name: 'title', type: 'ReactNode', desc: 'Required. The headline — what is missing, in plain words.' },
      { name: 'description', type: 'ReactNode', desc: 'Optional supporting line under the title.' },
      {
        name: 'icon',
        type: 'ReactNode',
        desc: 'Decorative glyph above the title. Defaults to a tray icon; pass null to hide it.',
      },
      { name: 'action', type: 'ReactNode', desc: 'Primary action — e.g. a button that creates the first item.' },
    ],
    a11y: true,
    a11yList: [
      'The icon is decorative (aria-hidden), so screen readers get the message, not the glyph.',
      "Imposes no role or live region — the surrounding state-boundary owns the empty announcement.",
      'The action is whatever focusable control you pass in, keeping native button / link semantics.',
      'Verified by a shipped axe-core test covering the panel with an action.',
    ],
  },
  'error-state': {
    intro:
      "A clear “something went wrong” panel with an optional retry button and an expandable technical-details disclosure. It is a role=alert, so assistive tech is told the moment it appears — a drop-in for any state-boundary's error slot.",
    apiFile: 'components/error-state.tsx',
    api: '<ErrorState error={err} onRetry={retry} />',
    tutorialIntro:
      'ErrorState turns an error plus an optional retry into an announced, actionable panel. Hand it a string or an Error.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the component plus its axe test into your repo. No dependencies beyond React.',
        file: 'terminal',
        code: '$ npx ibirdui add error-state\n✓ wrote components/error-state.tsx\n✓ wrote components/error-state.test.tsx',
      },
      {
        title: 'Surface the failure',
        body: 'Pass a string to show as-is, or an Error to read its message. The container is role=alert, so it is announced on appearance.',
        file: 'page.tsx',
        code: '<ErrorState error={err} />\n// or\n<ErrorState error="Could not load users" />',
      },
      {
        title: 'Give it a retry',
        body: 'Provide onRetry to render a focusable retry button. Without it, the panel is informational only.',
        file: 'page.tsx',
        code: '<ErrorState error={err} onRetry={refetch} retryLabel="Reload" />',
      },
      {
        title: 'Wire it to a boundary',
        body: "The error slot receives the error and the AsyncState's retry. Set autoFocus so keyboard users land on the retry button when the panel appears.",
        file: 'list.tsx',
        code: '<StateBoundary state={users} error={(err, retry) => <ErrorState error={err} onRetry={retry} autoFocus />}>\n  {(data) => <UserList users={data} />}\n</StateBoundary>',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'Forwards every native <div> attribute. The extras:',
    col0: 'Prop',
    props: [
      {
        name: 'error',
        type: 'Error | string',
        desc: 'Required. A string is shown as-is; an Error shows its message and exposes its stack in the details disclosure.',
      },
      { name: 'onRetry', type: '() => void', desc: 'When provided, renders a focusable retry button wired to this callback.' },
      { name: 'title', type: 'ReactNode', desc: 'Headline above the message. Default “Something went wrong”.' },
      { name: 'retryLabel', type: 'string', desc: 'Label for the retry button. Default “Try again”.' },
      {
        name: 'autoFocus',
        type: 'boolean',
        desc: 'Move focus to the retry button on mount — set it for state transitions. Default false, so an initial-load panel never steals focus.',
      },
    ],
    a11y: true,
    a11yList: [
      'The container is role=alert, so assistive tech is told the moment the panel appears.',
      'Optional autoFocus moves focus to the retry button on a state transition, so keyboard users land on the action.',
      'The retry control is a native <button>, keeping built-in focus and keyboard semantics.',
      'Technical details live in a collapsed <details> disclosure — keyboard-operable and out of the way.',
      'Verified by a shipped axe-core test covering the panel with a retry button.',
    ],
  },
  'async-button': {
    intro:
      'A button that owns its own pending and error state — disables, shows a spinner, sets aria-busy and announces the result, from a single onClick that returns a promise. No useState, no double-submit.',
    apiFile: 'components/async-button.tsx',
    api: '<AsyncButton onClick={() => save(form)}>\n  Save changes\n</AsyncButton>',
    tutorialIntro:
      'Drop it in wherever a click kicks off an async action. If your handler returns a promise, the button takes over the pending lifecycle.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the component and its axe test. It only needs React and the theme tokens.',
        file: 'terminal',
        code: '$ npx ibirdui add async-button\n✓ wrote components/async-button.tsx',
      },
      {
        title: 'Return a promise from onClick',
        body: 'That is the whole API. While the promise is pending the button disables itself, shows a spinner and sets aria-busy.',
        file: 'save.tsx',
        code: '<AsyncButton onClick={() => api.save(form)}>\n  Save changes\n</AsyncButton>',
      },
      {
        title: 'Customise the pending + error text',
        body: 'Optional. Swap the label shown while pending, and the message announced to screen readers on failure.',
        file: 'save.tsx',
        code: '<AsyncButton\n  onClick={() => api.save(form)}\n  pendingLabel="Saving…"\n  errorLabel="Could not save"\n>\n  Save\n</AsyncButton>',
      },
      {
        title: 'Synchronous handlers still work',
        body: 'If onClick returns nothing, AsyncButton behaves exactly like a native button — no spinner, no pending.',
        file: '—',
        code: '<AsyncButton onClick={() => setOpen(true)}>Open</AsyncButton>',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'Extends the native <button> props (minus onClick).',
    col0: 'Prop',
    props: [
      {
        name: 'onClick',
        type: '(e) => unknown',
        desc: 'Your handler. Return a promise to hand the pending state to the button.',
      },
      {
        name: 'pendingLabel',
        type: 'ReactNode',
        desc: 'Shown beside the spinner while pending. Defaults to the children.',
      },
      {
        name: 'errorLabel',
        type: 'string',
        desc: 'Announced via the live region on failure. Default "Action failed".',
      },
      {
        name: 'disabled',
        type: 'boolean',
        desc: 'Disables the button; pending also disables it automatically.',
      },
      {
        name: '…rest',
        type: 'ButtonHTMLAttributes',
        desc: 'Any other native button attribute (type, form, aria-*, className).',
      },
    ],
    a11y: true,
    a11yList: [
      'Sets disabled and aria-busy="true" for the whole pending window — no double-submit.',
      'The spinner is decorative (aria-hidden) and only spins under motion-safe (respects prefers-reduced-motion).',
      'Success and failure are announced through an aria-live="polite" region.',
      'Keeps native <button> semantics, keyboard activation and focus.',
      'Shipped axe-core test covers the rest, pending and error states.',
    ],
  },
  'data-table': {
    intro:
      'A sortable table over an AsyncState<T[]> — skeleton rows while loading, empty/error via state-boundary, and sortable columns with aria-sort and announced sort changes. You describe columns; the table does the rest.',
    apiFile: 'components/data-table.tsx',
    api: '<DataTable\n  state={users}\n  columns={columns}\n  getKey={(u) => u.id}\n  label="Users"\n/>',
    tutorialIntro:
      'Pass an AsyncState and a column list. data-table composes state-boundary under the hood, so you inherit every state and accessibility guarantee.',
    tutorial: [
      {
        title: 'Install',
        body: 'Pulls in data-table and its axe test. It depends on state-boundary, which the CLI adds for you.',
        file: 'terminal',
        code: '$ npx ibirdui add data-table\n+ also adding dependency: state-boundary\n✓ wrote components/data-table.tsx',
      },
      {
        title: 'Describe your columns',
        body: 'Each column has a key and a header. Add `sortable` to make it sortable; `cell` to customise rendering.',
        file: 'columns.tsx',
        code: 'const columns: Column<User>[] = [\n  { key: "name", header: "Name", sortable: true },\n  { key: "role", header: "Role" },\n  { key: "seats", header: "Seats", align: "right", sortable: true,\n    sortValue: (u) => u.seats },\n];',
      },
      {
        title: 'Render the table',
        body: 'Give it the AsyncState, the columns, a getKey and a label. Loading, empty and error are handled for you.',
        file: 'users.tsx',
        code: '<DataTable\n  state={users}\n  columns={columns}\n  getKey={(u) => u.id}\n  label="Team members"\n/>',
      },
      {
        title: 'Sorting is accessible by default',
        body: 'Sortable headers are buttons with aria-sort; each click cycles ascending → descending → off and is announced via a polite live region.',
        file: '—',
        code: '// click "Name" → aria-sort="ascending"\n// → announces: "Sorted by Name, ascending"',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'The surface of <DataTable> and a Column<T>.',
    col0: 'Prop',
    props: [
      {
        name: 'state',
        type: 'AsyncState<T[]>',
        desc: 'Required. The rows state — an empty array resolves to the empty slot.',
      },
      {
        name: 'columns',
        type: 'Column<T>[]',
        desc: 'Required. { key, header, cell?, sortable?, sortValue?, align? }.',
      },
      { name: 'getKey', type: '(item: T) => Key', desc: 'Required. Stable React key per row.' },
      {
        name: 'label',
        type: 'string',
        desc: 'Accessible name, rendered as a visually-hidden <caption>.',
      },
      {
        name: 'loadingRows',
        type: 'number',
        desc: 'Skeleton rows shown while loading. Default 5.',
      },
      { name: 'empty', type: 'ReactNode', desc: 'Custom empty slot.' },
    ],
    a11y: true,
    a11yList: [
      'Renders a real <table> with a <caption>, scope="col" headers and aria-sort on sortable columns.',
      'Sort controls are native buttons; each sort change is announced via aria-live="polite".',
      'Loading sets aria-busy and shows skeleton rows shaped like the columns.',
      'Empty and error slots inherit state-boundary’s roles and focus behaviour.',
      'Shipped axe-core test covers success, sorting, loading and empty.',
    ],
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
      'A combobox that fetches options as you type — debounced, with loading, empty and error states inside the listbox, and the full ARIA 1.2 keyboard pattern. The first input that is interactive and async at once.',
    apiFile: 'components/async-combobox.tsx',
    api: '<AsyncCombobox\n  load={(q) => api.search(q)}\n  getLabel={(o) => o.name}\n  getKey={(o) => o.id}\n  onSelect={setUser}\n  label="Search users"\n/>',
    tutorialIntro:
      'Give it an async `load(query)` and how to label an option. It debounces, fetches, and renders the right state in the popup — you wire nothing.',
    tutorial: [
      {
        title: 'Install',
        body: 'Pulls in async-combobox and async-state (for the contract it speaks).',
        file: 'terminal',
        code: '$ npx ibirdui add async-combobox\n+ also adding dependency: async-state\n✓ wrote components/async-combobox.tsx',
      },
      {
        title: 'Wire a fetcher',
        body: 'load is called (debounced) with the current query and returns a promise of options. Loading / empty / error are handled inside the listbox.',
        file: 'user-search.tsx',
        code: '<AsyncCombobox\n  load={(q) => api.users.search(q)}\n  getLabel={(u) => u.name}\n  getKey={(u) => u.id}\n  label="Search users"\n/>',
      },
      {
        title: 'Handle the selection',
        body: 'onSelect fires with the chosen option; the label is written into the input for you.',
        file: 'user-search.tsx',
        code: 'const [user, setUser] = useState<User | null>(null);\n\n<AsyncCombobox … onSelect={setUser} />',
      },
      {
        title: 'Keyboard works out of the box',
        body: '↓/↑ move the highlight (tracked via aria-activedescendant), Enter selects, Esc closes — focus never leaves the input.',
        file: '—',
        code: '// ArrowDown → highlight next · Enter → select · Esc → close',
      },
    ],
    propsTitle: 'Props',
    propsIntro: 'The surface of <AsyncCombobox>.',
    col0: 'Prop',
    props: [
      {
        name: 'load',
        type: '(q: string) => Promise<T[]>',
        desc: 'Required. Fetch options for the query. Debounced for you.',
      },
      {
        name: 'getLabel',
        type: '(item: T) => string',
        desc: 'Required. Option label; also written into the input on select.',
      },
      { name: 'getKey', type: '(item: T) => Key', desc: 'Required. Stable key per option.' },
      { name: 'onSelect', type: '(item: T) => void', desc: 'Called when an option is chosen.' },
      { name: 'label', type: 'string', desc: 'Accessible name for the input.' },
      { name: 'debounceMs', type: 'number', desc: 'Debounce before firing load. Default 250.' },
    ],
    a11y: true,
    a11yList: [
      'role="combobox" input wired to a role="listbox" popup via aria-controls and aria-expanded.',
      'The highlighted option is tracked with aria-activedescendant — focus stays in the input.',
      'Full keyboard: ArrowDown/Up move, Enter selects, Escape closes.',
      'Loading sets aria-busy; errors expose role="alert" with a retry control.',
      'Options are role="option" with aria-selected; shipped axe test covers each state.',
    ],
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
      'Promise-aware notifications — pass a promise and the toast moves through loading → success / error on its own. A tiny module store plus a single <Toaster /> live region. The AsyncState idea, applied to transient feedback.',
    apiFile: 'components/toast.tsx',
    api: 'toast.promise(api.save(form), {\n  loading: "Saving…",\n  success: "Saved",\n  error: "Could not save",\n});',
    tutorialIntro:
      'Mount <Toaster /> once near your app root, then call toast from anywhere — no context, no hooks.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the store and the Toaster component (and its axe test). Only needs React and the theme tokens.',
        file: 'terminal',
        code: '$ npx ibirdui add toast\n✓ wrote components/toast.tsx',
      },
      {
        title: 'Mount the Toaster once',
        body: 'Render it near the root. It is the live region that announces and shows every toast.',
        file: 'app/layout.tsx',
        code: 'import { Toaster } from "@/components/toast";\n\n<body>\n  {children}\n  <Toaster />\n</body>',
      },
      {
        title: 'Fire toasts from anywhere',
        body: 'Import toast and call it. No provider, no hook — it is a plain module store.',
        file: 'save.ts',
        code: 'import { toast } from "@/components/toast";\n\ntoast.success("Saved");\ntoast.error("Could not save");',
      },
      {
        title: 'Let a promise drive it',
        body: 'toast.promise shows a loading toast, then swaps it to success or error when the promise settles — success/error can be functions of the result.',
        file: 'save.ts',
        code: 'toast.promise(api.save(form), {\n  loading: "Saving…",\n  success: (r) => `Saved ${r.name}`,\n  error: "Could not save",\n});',
      },
    ],
    propsTitle: 'API',
    propsIntro: 'The toast function, its variants, and the <Toaster /> component.',
    col0: 'member',
    props: [
      {
        name: 'toast(msg)',
        type: '(node, ms?) => id',
        desc: 'Show an info toast. Returns its id.',
      },
      {
        name: 'toast.success / .error / .info',
        type: '(node, ms?) => id',
        desc: 'Typed variants; errors persist longer and announce assertively.',
      },
      {
        name: 'toast.promise',
        type: '(p, { loading, success, error })',
        desc: 'Drive a toast from a promise; success/error may be functions of the value/error.',
      },
      {
        name: 'toast.dismiss(id)',
        type: '(id) => void',
        desc: 'Dismiss one toast; dismissAll() clears them.',
      },
      {
        name: '<Toaster />',
        type: 'position?',
        desc: 'Mount once. Anchors the stack to a corner (default bottom-right).',
      },
    ],
    a11y: true,
    a11yList: [
      'The stack is a labelled region; each toast is role="status" (polite) or role="alert" (assertive) for errors.',
      'Dismiss controls are real buttons with an accessible label and a focus ring.',
      'The loading spinner is decorative (aria-hidden) and only spins under motion-safe.',
      'Loading toasts never auto-dismiss; errors stay longer so they can be read.',
      'Shipped axe-core test covers success, error and the promise lifecycle.',
    ],
  },
  'confirm-dialog': {
    intro:
      'An imperative async confirm dialog whose action button owns its own pending and error state. await confirm({…}) anywhere; the dialog only closes once the action succeeds, and shows the error in place if it fails. Focus-trapped and Escape-dismissable.',
    apiFile: 'components/confirm-dialog.tsx',
    api: 'const ok = await confirm({\n  title: "Delete project?",\n  destructive: true,\n  action: () => api.remove(id),\n});',
    tutorialIntro:
      'Like toast, it is imperative: mount <ConfirmDialog /> once, then await confirm() from anywhere — no local open state to wire.',
    tutorial: [
      {
        title: 'Install',
        body: 'Copies the store and the dialog (and its axe test). Needs React and the theme tokens.',
        file: 'terminal',
        code: '$ npx ibirdui add confirm-dialog\n✓ wrote components/confirm-dialog.tsx',
      },
      {
        title: 'Mount it once',
        body: 'Render <ConfirmDialog /> near your app root, alongside <Toaster />.',
        file: 'app/layout.tsx',
        code: 'import { ConfirmDialog } from "@/components/confirm-dialog";\n\n<body>{children}<ConfirmDialog /></body>',
      },
      {
        title: 'Ask, and await the answer',
        body: 'confirm() returns a promise of boolean — true if confirmed, false if cancelled.',
        file: 'delete.ts',
        code: 'const ok = await confirm({\n  title: "Delete project?",\n  description: "This cannot be undone.",\n  destructive: true,\n});\nif (ok) remove();',
      },
      {
        title: 'Let the dialog own the action',
        body: 'Pass an async action: the confirm button shows pending while it runs, and on failure the dialog stays open with the error — it only closes on success.',
        file: 'delete.ts',
        code: 'await confirm({\n  title: "Delete project?",\n  action: () => api.remove(id),\n});',
      },
    ],
    propsTitle: 'API',
    propsIntro: 'confirm(options) → Promise<boolean>, plus the <ConfirmDialog /> renderer.',
    col0: 'option',
    props: [
      {
        name: 'title',
        type: 'ReactNode',
        desc: 'Required. The dialog heading (its accessible name).',
      },
      {
        name: 'description',
        type: 'ReactNode',
        desc: 'Optional supporting text (the accessible description).',
      },
      {
        name: 'action',
        type: '() => Promise<unknown>',
        desc: 'Optional. Runs on confirm; the button owns its pending/error, dialog closes on success.',
      },
      { name: 'destructive', type: 'boolean', desc: 'Style the confirm button as destructive.' },
      {
        name: 'confirmLabel / cancelLabel',
        type: 'string',
        desc: 'Override the button text. Default "Confirm" / "Cancel".',
      },
      {
        name: '<ConfirmDialog />',
        type: '—',
        desc: 'Mount once near the root to render the active dialog.',
      },
    ],
    a11y: true,
    a11yList: [
      'role="alertdialog" with aria-modal, labelled by the title and described by the message.',
      'Focus moves into the dialog on open, is trapped while open, and returns to the trigger on close.',
      'Escape and backdrop click cancel — both disabled while the action is pending.',
      'On failure the error is exposed as role="alert" and the dialog stays open; confirm sets aria-busy while pending.',
      'Shipped axe-core test covers open/focus, confirm, cancel, pending and error.',
    ],
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
