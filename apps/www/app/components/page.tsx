'use client';

import { type Comp, components, docs, firstComponent, layerNames, pages } from '@/lib/site-data';
import { s } from '@/lib/style';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Theme = 'dark' | 'light';
type DemoState = 'loading' | 'empty' | 'error' | 'success';
type AsVariant = 'idle' | 'loading' | 'empty' | 'error' | 'success';

const badge = (color: string, bg: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 11px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 600,
  fontFamily: "'Geist Mono', monospace",
  color,
  background: bg,
});

const statusMeta = {
  done: { label: 'Shipped', style: badge('var(--primary-foreground)', 'var(--primary)') },
  next: { label: 'Next', style: badge('#fff', 'var(--warning)') },
  planned: { label: 'Planned', style: badge('var(--muted)', 'var(--surface-2)') },
} as const;

const pill = (a: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 13px',
  borderRadius: '999px',
  fontSize: '12.5px',
  fontWeight: a ? 600 : 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  border: `1px solid ${a ? 'var(--primary)' : 'var(--border)'}`,
  background: a ? 'var(--primary-dim)' : 'transparent',
  color: a ? 'var(--accent-fg)' : 'var(--muted)',
  transition: 'all .15s ease',
});

const SearchSvg = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);
const CheckSvg = ({ size = 16, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2.4"
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const CopySvg = ({ size = 14, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);
const ShieldSvg = ({ size = 11 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    aria-hidden="true"
  >
    <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export default function ComponentsPage() {
  const router = useRouter();
  const paletteRef = useRef<HTMLInputElement>(null);
  const reducedRef = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [theme, setTheme] = useState<Theme>('dark');
  const [selected, setSelected] = useState('data-list');
  const [sideQuery, setSideQuery] = useState('');
  const [demoState, setDemoState] = useState<DemoState>('success');
  const [asVariant, setAsVariant] = useState<AsVariant>('success');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [liveMsg, setLiveMsg] = useState('Loaded 4 users.');

  const select = useCallback((name: string) => {
    const meta = components.find((c) => c.name === name);
    setSelected(name);
    setAnnounce(`Viewing ${name} documentation`);
    if (meta && meta.status === 'done') {
      setDemoState('success');
      setLiveMsg('Loaded 4 users.');
    }
    try {
      history.replaceState(null, '', `#${name}`);
    } catch {}
    try {
      window.scrollTo({ top: 0, behavior: reducedRef.current ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  const paletteList = useMemo(() => {
    const all = [
      ...pages.map((p) => ({
        label: p.label,
        hint: p.hint,
        href: p.href,
        comp: undefined as string | undefined,
      })),
      ...components.map((c) => ({
        label: c.name,
        hint: `L${c.layer} · ${c.status}`,
        href: undefined,
        comp: c.name,
      })),
    ];
    const q = paletteQuery.toLowerCase();
    return q
      ? all.filter(
          (i) => i.label.toLowerCase().includes(q) || (i.hint || '').toLowerCase().includes(q),
        )
      : all;
  }, [paletteQuery]);

  const runPalette = useCallback(
    (it: { comp?: string; href?: string }) => {
      setPaletteOpen(false);
      if (it.comp) select(it.comp);
      else if (it.href) router.push(it.href);
    },
    [router, select],
  );

  // mount: theme + reduced-motion + hash + key/hash listeners
  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hash = (location.hash || '').replace('#', '');
    if (hash && components.some((c) => c.name === hash)) setSelected(hash);

    const onHash = () => {
      const h = (location.hash || '').replace('#', '');
      if (h && components.some((c) => c.name === h)) select(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [select]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (paletteOpen) setTimeout(() => paletteRef.current?.focus(), 25);
  }, [paletteOpen]);

  // keyboard: ⌘K + palette navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        setPaletteQuery('');
        setPaletteIndex(0);
        return;
      }
      if (!paletteOpen) return;
      if (k === 'Escape') {
        e.preventDefault();
        setPaletteOpen(false);
      } else if (k === 'ArrowDown') {
        e.preventDefault();
        setPaletteIndex((i) => (i + 1 + paletteList.length) % paletteList.length);
      } else if (k === 'ArrowUp') {
        e.preventDefault();
        setPaletteIndex((i) => (i - 1 + paletteList.length) % paletteList.length);
      } else if (k === 'Enter') {
        e.preventDefault();
        const it = paletteList[paletteIndex];
        if (it) runPalette(it);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, paletteList, paletteIndex, runPalette]);

  const copy = useCallback((text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {}
    setCopiedId(id);
    setAnnounce('Copied to clipboard');
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 1600);
  }, []);

  const setDemo = useCallback((st: DemoState) => {
    const map: Record<DemoState, string> = {
      loading: 'Loading users…',
      empty: 'No users found.',
      error: 'Could not load users. Retry is available.',
      success: 'Loaded 4 users.',
    };
    setDemoState(st);
    setLiveMsg(map[st]);
    setAnnounce(map[st]);
  }, []);

  const demoRetry = useCallback(() => {
    setDemo('loading');
    clearTimeout(demoTimer.current);
    demoTimer.current = setTimeout(() => setDemo('success'), 850);
  }, [setDemo]);

  const isLight = theme === 'light';

  // ---- derived: sidebar ----
  const q = sideQuery.toLowerCase();
  const sideGroups = [0, 1, 2, 3, 4, 5]
    .map((L) => ({
      layer: L,
      name: layerNames[L],
      items: components.filter((c) => c.layer === L && (!q || c.name.toLowerCase().includes(q))),
    }))
    .filter((g) => g.items.length > 0);

  // ---- derived: selected doc ----
  const meta = components.find((c) => c.name === selected) ?? firstComponent;
  const d = docs[meta.name] || ({} as (typeof docs)[string]);
  const planned = meta.status !== 'done';
  const install = `npx everstate add ${meta.name}`;
  const exAsyncState = !planned && d.example === 'asyncstate';
  const exInteractive = !planned && d.example === 'interactive';
  const hasTutorial = !planned && !!d.tutorial;
  const hasProps = !planned && !!d.props;
  const hasA11y = !planned && meta.a11y && !!d.a11yList;

  // async-state inspector
  const asShapes: Record<AsVariant, string> = {
    idle: '{\n  status: "idle"\n}',
    loading: '{\n  status: "loading"\n}',
    empty: '{\n  status: "empty"\n}',
    error:
      '{\n  status: "error",\n  error: Error("Network request failed"),\n  retry: () => void\n}',
    success:
      '{\n  status: "success",\n  data: [\n    { id: "u1", name: "Ada Lovelace" },\n    { id: "u2", name: "Grace Hopper" },\n    … 2 more\n  ]\n}',
  };
  const asNotes: Record<AsVariant, string> = {
    idle: 'The resting state. A component renders nothing or a prompt — no spinner, because nothing was requested.',
    loading:
      'A request is in flight. Components show a skeleton and set aria-busy so assistive tech knows to wait.',
    empty:
      'Success with zero results — deliberately distinct from loading, so users see a real "nothing here" message.',
    error:
      'Note the retry callback travels inside the variant. The error UI can wire a button without extra plumbing.',
    success:
      'The only variant carrying data. TypeScript narrows it here, so data is guaranteed to exist.',
  };
  const asKeys: AsVariant[] = ['idle', 'loading', 'empty', 'error', 'success'];

  // interactive demo
  const dlLabels: Record<DemoState, string> = {
    loading: 'Loading',
    empty: 'Empty',
    error: 'Error',
    success: 'Success',
  };
  const demoStatesArr: DemoState[] = ['loading', 'empty', 'error', 'success'];
  const demoUsers = [
    { id: 'u1', name: 'Ada Lovelace', role: 'Maintainer', initials: 'AL' },
    { id: 'u2', name: 'Grace Hopper', role: 'Admin', initials: 'GH' },
    { id: 'u3', name: 'Alan Turing', role: 'Member', initials: 'AT' },
    { id: 'u4', name: 'Radia Perlman', role: 'Member', initials: 'RP' },
  ];

  // prev/next
  const idx = components.findIndex((c) => c.name === meta.name);
  const prev: Comp | undefined = components[idx - 1];
  const next: Comp | undefined = components[idx + 1];

  const monoMuted2 = "font-family:'Geist Mono',monospace;font-size:11.5px;color:#6b727c";
  const codeCard = 'background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow:hidden';
  const preStyle =
    "padding:16px;overflow-x:auto;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:1.7;color:#e6edf3;white-space:pre";

  return (
    <div
      style={s(
        'min-height:100vh;width:100%;background:var(--background);color:var(--foreground);position:relative',
      )}
    >
      <a
        href="#doc-main"
        style={s(
          'position:absolute;left:12px;top:-60px;z-index:200;background:var(--primary);color:var(--primary-foreground);padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px',
        )}
      >
        Skip to content
      </a>
      <div
        aria-live="polite"
        role="status"
        style={s(
          'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0',
        )}
      >
        {announce}
      </div>

      {/* HEADER */}
      <header
        style={s(
          'position:sticky;top:0;z-index:100;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:var(--header-bg);border-bottom:1px solid var(--border)',
        )}
      >
        <nav
          aria-label="Primary"
          style={s(
            'max-width:1280px;margin:0 auto;padding:0 24px;height:62px;display:flex;align-items:center;gap:24px',
          )}
        >
          <Link
            href="/"
            style={s(
              'display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px;letter-spacing:-.01em',
            )}
          >
            <span
              aria-hidden="true"
              style={s(
                'position:relative;display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center',
              )}
            >
              <span
                style={s(
                  'position:absolute;inset:0;border-radius:7px;background:var(--primary);opacity:.18',
                )}
              />
              <span
                style={s(
                  'position:absolute;width:9px;height:9px;border-radius:50%;background:var(--primary);animation:pulse 1.8s ease-in-out infinite',
                )}
              />
            </span>
            everstate
          </Link>
          <div
            style={s('display:none;align-items:center;gap:4px;margin-left:8px')}
            data-nav="desktop"
          >
            <Link
              href="/"
              className="hov-surface"
              style={s('padding:7px 11px;border-radius:7px;font-size:14px;color:var(--muted)')}
            >
              Home
            </Link>
            <Link
              href="/components"
              aria-current="page"
              style={s(
                'padding:7px 11px;border-radius:7px;font-size:14px;color:var(--foreground);background:var(--surface)',
              )}
            >
              Components
            </Link>
            <Link
              href="/#how"
              className="hov-surface"
              style={s('padding:7px 11px;border-radius:7px;font-size:14px;color:var(--muted)')}
            >
              How it works
            </Link>
            <Link
              href="/roadmap"
              className="hov-surface"
              style={s('padding:7px 11px;border-radius:7px;font-size:14px;color:var(--muted)')}
            >
              Roadmap
            </Link>
          </div>
          <div style={s('margin-left:auto;display:flex;align-items:center;gap:8px')}>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
              className="hov-border"
              style={s(
                'display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer',
              )}
            >
              <SearchSvg />
              <span style={s('display:none')} data-kbd="1">
                Search
              </span>
              <kbd
                style={s(
                  "font-family:'Geist Mono',monospace;font-size:11px;padding:1px 5px;border-radius:5px;background:var(--surface-2);border:1px solid var(--border)",
                )}
              >
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle color theme"
              className="hov-border"
              style={s(
                'display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--foreground)',
              )}
            >
              {isLight ? (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                </svg>
              ) : (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M19.2 4.8l-1.8 1.8M6.6 17.4l-1.8 1.8" />
                </svg>
              )}
            </button>
            <a
              href="https://github.com/Geekles007/everstate"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="everstate on GitHub"
              className="hov-border"
              style={s(
                'display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:14px;font-weight:500',
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.85.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 015 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z" />
              </svg>
              <span data-kbd="1" style={s('display:none')}>
                Star
              </span>
            </a>
          </div>
        </nav>
      </header>

      {/* DOCS LAYOUT */}
      <div style={s('max-width:1280px;margin:0 auto;padding:0 24px')}>
        <div
          data-docgrid="1"
          style={s('display:grid;grid-template-columns:248px 1fr;gap:40px;align-items:start')}
        >
          {/* SIDEBAR */}
          <aside
            data-sidebar="1"
            aria-label="Component navigation"
            style={s(
              'position:sticky;top:62px;max-height:calc(100vh - 62px);overflow-y:auto;padding:28px 18px 28px 0;border-right:1px solid var(--border)',
            )}
          >
            <div style={s('position:relative;margin-bottom:18px')}>
              <span
                aria-hidden="true"
                style={s(
                  'position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted-2)',
                )}
              >
                <SearchSvg />
              </span>
              <input
                type="text"
                value={sideQuery}
                onChange={(e) => setSideQuery(e.target.value)}
                placeholder="Filter components…"
                aria-label="Filter components"
                className="foc-border"
                style={s(
                  'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:9px 11px 9px 33px;color:var(--foreground);font-size:13.5px;outline:none;font-family:inherit',
                )}
              />
            </div>
            <nav
              aria-label="Components by layer"
              style={s('display:flex;flex-direction:column;gap:18px')}
            >
              {sideGroups.map((g) => (
                <div key={g.layer}>
                  <div
                    style={s(
                      "font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);padding:0 8px 8px",
                    )}
                  >
                    L{g.layer} · {g.name}
                  </div>
                  <div style={s('display:flex;flex-direction:column;gap:1px')}>
                    {g.items.map((c) => {
                      const active = c.name === selected;
                      const dotColor =
                        c.status === 'done'
                          ? 'var(--primary)'
                          : c.status === 'next'
                            ? 'var(--warning)'
                            : 'var(--border-strong)';
                      return (
                        <button
                          key={c.name}
                          type="button"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => select(c.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '13px',
                            background: active ? 'var(--surface)' : 'transparent',
                            color: active ? 'var(--foreground)' : 'var(--muted)',
                            transition: 'background .12s',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              flex: 'none',
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: dotColor,
                              boxShadow: active ? '0 0 0 3px var(--primary-dim)' : 'none',
                            }}
                          />
                          <span
                            style={s(
                              'flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
                            )}
                          >
                            {c.name}
                          </span>
                          {c.status === 'done' && (
                            <span
                              aria-label="shipped"
                              style={s(
                                "font-size:9.5px;font-family:'Geist Mono',monospace;color:var(--accent-fg)",
                              )}
                            >
                              ●
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* MAIN DOC */}
          <main id="doc-main" style={s('padding:36px 0 80px;min-width:0')}>
            <div
              style={s(
                "display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted-2);font-family:'Geist Mono',monospace;margin-bottom:18px",
              )}
            >
              <Link href="/components" className="hov-fg" style={s('color:var(--muted-2)')}>
                components
              </Link>
              <span aria-hidden="true">/</span>
              <span style={s('color:var(--accent-fg)')}>L{meta.layer}</span>
              <span aria-hidden="true">/</span>
              <span style={s('color:var(--foreground)')}>{meta.name}</span>
            </div>

            <div
              style={s(
                'display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:14px',
              )}
            >
              <div>
                <h1
                  style={s(
                    "font-size:38px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0 0 12px;font-family:'Geist Mono',monospace",
                  )}
                >
                  {meta.name}
                </h1>
                <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center')}>
                  <span style={statusMeta[meta.status].style}>{statusMeta[meta.status].label}</span>
                  <span
                    style={s(
                      "font-size:11px;font-family:'Geist Mono',monospace;padding:3px 9px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--muted)",
                    )}
                  >
                    {meta.kind}
                  </span>
                  {meta.a11y && (
                    <span
                      style={s(
                        "font-size:11px;font-family:'Geist Mono',monospace;padding:3px 9px;border-radius:999px;background:var(--primary-dim);color:var(--accent-fg);display:inline-flex;align-items:center;gap:5px",
                      )}
                    >
                      <ShieldSvg />
                      a11y AA · axe verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p
              style={s(
                'font-size:18px;line-height:1.6;color:var(--muted);max-width:680px;margin:0 0 24px',
              )}
            >
              {d.intro}
            </p>

            <button
              type="button"
              onClick={() => copy(install, 'install')}
              aria-label="Copy install command"
              className="hov-accent"
              style={s(
                'display:flex;align-items:center;gap:12px;background:#0c0d10;border:1px solid #20232a;border-radius:11px;padding:13px 16px;cursor:pointer;margin-bottom:38px;max-width:420px;width:100%',
              )}
            >
              <span style={s("color:#6b727c;font-family:'Geist Mono',monospace;font-size:14px")}>
                $
              </span>
              <code
                style={s(
                  "flex:1;text-align:left;font-family:'Geist Mono',monospace;font-size:13.5px;color:#e6edf3",
                )}
              >
                {install}
              </code>
              <span style={s('flex:none;color:var(--accent-fg);display:inline-flex')}>
                {copiedId === 'install' ? <CheckSvg /> : <CopySvg stroke="#8b949e" size={15} />}
              </span>
            </button>

            {/* LIVE EXAMPLE */}
            <section aria-labelledby="ex-h" style={s('margin-bottom:44px')}>
              <h2
                id="ex-h"
                style={s(
                  "font-size:13px;font-family:'Geist Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--accent-fg);margin:0 0 16px",
                )}
              >
                Live example
              </h2>

              {!exAsyncState && !exInteractive && (
                <div
                  style={s(
                    `border:1px ${planned ? 'dashed var(--border-strong)' : 'solid var(--border)'};border-radius:14px;padding:${planned ? '40px 24px' : '20px'};text-align:${planned ? 'center' : 'left'};background:var(--surface)`,
                  )}
                >
                  {planned && (
                    <>
                      <div
                        style={s(
                          "display:inline-flex;align-items:center;gap:8px;font-family:'Geist Mono',monospace;font-size:12.5px;color:var(--warning);margin-bottom:14px;padding:5px 12px;border-radius:999px;border:1px solid var(--warning)",
                        )}
                      >
                        <span
                          style={s(
                            'width:6px;height:6px;border-radius:50%;background:var(--warning)',
                          )}
                        />
                        {statusMeta[meta.status].label} · Layer {meta.layer}
                      </div>
                      <p
                        style={s(
                          'font-size:15px;color:var(--muted);margin:0 auto 18px;max-width:440px',
                        )}
                      >
                        This component isn&apos;t shipped yet. Here&apos;s the intended API it will
                        expose once it lands.
                      </p>
                    </>
                  )}
                  <div
                    style={s(
                      `text-align:left;${planned ? 'max-width:560px;margin:0 auto;' : ''}background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow:hidden`,
                    )}
                  >
                    <div
                      style={s(`padding:10px 14px;border-bottom:1px solid #1c1f25;${monoMuted2}`)}
                    >
                      {d.apiFile || `${meta.name}.tsx`}
                    </div>
                    <pre style={s(preStyle)}>{d.api || '// coming soon'}</pre>
                  </div>
                </div>
              )}

              {exAsyncState && (
                <div
                  style={s(
                    'background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px',
                  )}
                >
                  <div
                    role="group"
                    aria-label="Inspect AsyncState variant"
                    style={s('display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px')}
                  >
                    {asKeys.map((k) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={asVariant === k}
                        onClick={() => setAsVariant(k)}
                        style={pill(asVariant === k)}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <div style={s(codeCard)}>
                    <div
                      style={s(`padding:9px 14px;border-bottom:1px solid #1c1f25;${monoMuted2}`)}
                    >
                      state: AsyncState&lt;User[]&gt;
                    </div>
                    <pre
                      style={s(
                        "padding:16px;font-family:'Geist Mono',monospace;font-size:13px;line-height:1.75;color:#e6edf3;white-space:pre;overflow-x:auto",
                      )}
                    >
                      {asShapes[asVariant]}
                    </pre>
                  </div>
                  <p
                    style={s('font-size:13.5px;color:var(--muted);margin:14px 0 0;line-height:1.6')}
                  >
                    {asNotes[asVariant]}
                  </p>
                </div>
              )}

              {exInteractive && (
                <div data-exrow="1" style={s('display:grid;grid-template-columns:1fr;gap:14px')}>
                  <div
                    style={s(
                      'background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden',
                    )}
                  >
                    <div
                      style={s(
                        'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)',
                      )}
                    >
                      <div
                        style={s(
                          "font-family:'Geist Mono',monospace;font-size:13px;color:var(--muted)",
                        )}
                      >
                        {d.exampleTag}
                      </div>
                      <div
                        role="group"
                        aria-label="Switch state"
                        style={s('display:flex;gap:6px;flex-wrap:wrap')}
                      >
                        {demoStatesArr.map((k) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={demoState === k}
                            onClick={() => setDemo(k)}
                            style={pill(demoState === k)}
                          >
                            {dlLabels[k]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={s('padding:16px;min-height:256px')}>
                      {demoState === 'loading' && (
                        <div
                          aria-busy="true"
                          aria-label="Loading"
                          style={s('display:flex;flex-direction:column;gap:10px')}
                        >
                          {[1, 2, 3, 4].map((sk) => (
                            <div
                              key={sk}
                              style={s(
                                'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;border:1px solid var(--border)',
                              )}
                            >
                              <div
                                style={s(
                                  'width:34px;height:34px;border-radius:9px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border-strong) 37%,var(--surface-2) 63%);background-size:200% 100%;animation:shimmer 1.4s linear infinite',
                                )}
                              />
                              <div style={s('flex:1;display:flex;flex-direction:column;gap:7px')}>
                                <div
                                  style={s(
                                    'height:11px;width:42%;border-radius:5px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border-strong) 37%,var(--surface-2) 63%);background-size:200% 100%;animation:shimmer 1.4s linear infinite',
                                  )}
                                />
                                <div
                                  style={s(
                                    'height:9px;width:26%;border-radius:5px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border-strong) 37%,var(--surface-2) 63%);background-size:200% 100%;animation:shimmer 1.4s linear infinite',
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {demoState === 'empty' && (
                        <div
                          style={s(
                            'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:224px;color:var(--muted)',
                          )}
                        >
                          <svg
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            style={s('margin-bottom:12px;opacity:.55')}
                            aria-hidden="true"
                          >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4-4" />
                          </svg>
                          <div
                            style={s(
                              'font-size:15px;font-weight:500;color:var(--foreground);margin-bottom:5px',
                            )}
                          >
                            No users found
                          </div>
                          <div style={s('font-size:13.5px')}>Invite a teammate to get started.</div>
                        </div>
                      )}
                      {demoState === 'error' && (
                        <div
                          style={s(
                            'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:224px',
                          )}
                        >
                          <div style={s('color:var(--destructive);margin-bottom:12px')}>
                            <svg
                              width="34"
                              height="34"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 8v4.5M12 16h.01" />
                            </svg>
                          </div>
                          <div style={s('font-size:15px;font-weight:500;margin-bottom:5px')}>
                            Couldn&apos;t load users
                          </div>
                          <div style={s('font-size:13.5px;color:var(--muted);margin-bottom:16px')}>
                            A network error occurred.
                          </div>
                          <button
                            type="button"
                            onClick={demoRetry}
                            className="hov-dim"
                            style={s(
                              'display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:9px;background:var(--foreground);color:var(--background);font-size:13.5px;font-weight:600;cursor:pointer',
                            )}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              aria-hidden="true"
                            >
                              <path d="M21 12a9 9 0 11-2.6-6.4M21 4v5h-5" />
                            </svg>
                            Retry
                          </button>
                        </div>
                      )}
                      {demoState === 'success' && (
                        <div>
                          <div
                            style={s(
                              "font-size:12px;color:var(--muted-2);font-family:'Geist Mono',monospace;padding:0 4px 9px",
                            )}
                          >
                            4 users
                          </div>
                          <div style={s('display:flex;flex-direction:column;gap:7px')}>
                            {demoUsers.map((u) => (
                              <div
                                key={u.id}
                                style={s(
                                  'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;border:1px solid var(--border);background:var(--surface-2);animation:fadeup .35s ease both',
                                )}
                              >
                                <span
                                  style={s(
                                    "width:34px;height:34px;border-radius:9px;background:var(--primary-dim);color:var(--accent-fg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:'Geist Mono',monospace",
                                  )}
                                >
                                  {u.initials}
                                </span>
                                <div style={s('flex:1;min-width:0')}>
                                  <div style={s('font-size:14px;font-weight:500')}>{u.name}</div>
                                  <div style={s('font-size:12px;color:var(--muted-2)')}>
                                    {u.role}
                                  </div>
                                </div>
                                <span
                                  aria-hidden="true"
                                  style={s(
                                    'width:7px;height:7px;border-radius:50%;background:var(--primary)',
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={s(
                      "display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted-2);font-family:'Geist Mono',monospace;padding:2px 4px",
                    )}
                  >
                    <span style={s('color:var(--accent-fg)')}>aria-live</span> announced: &quot;
                    {liveMsg}&quot;
                  </div>
                </div>
              )}
            </section>

            {/* TUTORIAL */}
            {hasTutorial && (
              <section aria-labelledby="tut-h" style={s('margin-bottom:44px')}>
                <h2
                  id="tut-h"
                  style={s('font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px')}
                >
                  Tutorial
                </h2>
                <p style={s('font-size:15px;color:var(--muted);margin:0 0 26px')}>
                  {d.tutorialIntro}
                </p>
                <ol
                  style={s(
                    'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0',
                  )}
                >
                  {(d.tutorial || []).map((st, i, arr) => {
                    const id = `st-${meta.name}-${i}`;
                    return (
                      <li
                        key={id}
                        style={s(
                          'display:grid;grid-template-columns:34px 1fr;gap:16px;padding-bottom:26px;position:relative',
                        )}
                      >
                        <div style={s('display:flex;flex-direction:column;align-items:center')}>
                          <span
                            aria-hidden="true"
                            style={s(
                              "flex:none;width:30px;height:30px;border-radius:50%;background:var(--primary-dim);color:var(--accent-fg);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;font-family:'Geist Mono',monospace",
                            )}
                          >
                            {i + 1}
                          </span>
                          {i < arr.length - 1 && (
                            <span
                              aria-hidden="true"
                              style={s('flex:1;width:1px;background:var(--border);margin-top:6px')}
                            />
                          )}
                        </div>
                        <div style={s('min-width:0;padding-top:3px')}>
                          <h3 style={s('font-size:16px;font-weight:600;margin:0 0 6px')}>
                            {st.title}
                          </h3>
                          <p
                            style={s(
                              'font-size:14px;line-height:1.6;color:var(--muted);margin:0 0 14px',
                            )}
                          >
                            {st.body}
                          </p>
                          {st.code && (
                            <div
                              style={s(
                                'position:relative;background:#0c0d10;border:1px solid #20232a;border-radius:11px;overflow:hidden',
                              )}
                            >
                              <div
                                style={s(
                                  'display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #1c1f25',
                                )}
                              >
                                <span style={s(monoMuted2)}>{st.file}</span>
                                <button
                                  type="button"
                                  onClick={() => copy(st.code, id)}
                                  aria-label="Copy code"
                                  className="hov-fg"
                                  style={s(
                                    'color:#8b949e;background:transparent;border:none;cursor:pointer;display:inline-flex',
                                  )}
                                >
                                  {copiedId === id ? (
                                    <CheckSvg size={15} stroke="#b6ff2e" />
                                  ) : (
                                    <CopySvg />
                                  )}
                                </button>
                              </div>
                              <pre
                                style={s(
                                  "padding:15px;overflow-x:auto;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:1.7;color:#e6edf3;white-space:pre",
                                )}
                              >
                                {st.code}
                              </pre>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* API / PROPS */}
            {hasProps && (
              <section aria-labelledby="props-h" style={s('margin-bottom:44px')}>
                <h2
                  id="props-h"
                  style={s('font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px')}
                >
                  {d.propsTitle}
                </h2>
                <p style={s('font-size:15px;color:var(--muted);margin:0 0 20px')}>{d.propsIntro}</p>
                <div style={s('border:1px solid var(--border);border-radius:14px;overflow:hidden')}>
                  <div
                    data-propsrow="1"
                    style={s(
                      "display:grid;grid-template-columns:200px 220px 1fr;gap:18px;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border);font-size:12px;font-family:'Geist Mono',monospace;color:var(--muted-2);text-transform:uppercase;letter-spacing:.05em",
                    )}
                  >
                    <span>{d.col0}</span>
                    <span>Type</span>
                    <span>Description</span>
                  </div>
                  {(d.props || []).map((p) => (
                    <div
                      key={p.name}
                      data-propsrow="1"
                      style={s(
                        'display:grid;grid-template-columns:200px 220px 1fr;gap:18px;padding:15px 20px;border-bottom:1px solid var(--border);align-items:start',
                      )}
                    >
                      <code
                        style={s(
                          "font-family:'Geist Mono',monospace;font-size:13px;color:var(--foreground);font-weight:500",
                        )}
                      >
                        {p.name}
                      </code>
                      <code
                        style={s(
                          "font-family:'Geist Mono',monospace;font-size:12.5px;color:var(--accent-fg);word-break:break-word",
                        )}
                      >
                        {p.type}
                      </code>
                      <span style={s('font-size:13.5px;color:var(--muted);line-height:1.5')}>
                        {p.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCESSIBILITY */}
            {hasA11y && (
              <section aria-labelledby="a11y-h" style={s('margin-bottom:44px')}>
                <h2
                  id="a11y-h"
                  style={s(
                    'display:flex;align-items:center;gap:10px;font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px',
                  )}
                >
                  <span style={s('color:var(--accent-fg)')}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  Accessibility
                </h2>
                <p style={s('font-size:15px;color:var(--muted);margin:0 0 20px')}>
                  Guaranteed and{' '}
                  <strong style={s('color:var(--foreground);font-weight:600')}>
                    verified by an axe-core test
                  </strong>{' '}
                  that fails the build on regression — not just documented.
                </p>
                <div
                  data-grid2="1"
                  style={s('display:grid;grid-template-columns:1fr 1fr;gap:12px')}
                >
                  {(d.a11yList || []).map((ag) => (
                    <div
                      key={ag}
                      style={s(
                        'display:flex;gap:11px;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px',
                      )}
                    >
                      <span style={s('color:var(--accent-fg);flex:none;margin-top:1px')}>
                        <CheckSvg size={16} />
                      </span>
                      <span style={s('font-size:13.5px;line-height:1.55;color:var(--muted)')}>
                        {ag}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* prev / next */}
            <nav
              aria-label="Component pagination"
              style={s('display:flex;gap:14px;border-top:1px solid var(--border);padding-top:24px')}
            >
              {prev && (
                <button
                  type="button"
                  onClick={() => select(prev.name)}
                  className="hov-border"
                  style={s(
                    'flex:1;display:flex;flex-direction:column;gap:4px;text-align:left;padding:15px 18px;border-radius:12px;border:1px solid var(--border);background:var(--surface);cursor:pointer',
                  )}
                >
                  <span
                    style={s(
                      "font-size:11.5px;color:var(--muted-2);font-family:'Geist Mono',monospace",
                    )}
                  >
                    ← Previous
                  </span>
                  <span
                    style={s("font-size:14.5px;font-weight:500;font-family:'Geist Mono',monospace")}
                  >
                    {prev.name}
                  </span>
                </button>
              )}
              {next && (
                <button
                  type="button"
                  onClick={() => select(next.name)}
                  className="hov-border"
                  style={s(
                    'flex:1;display:flex;flex-direction:column;gap:4px;text-align:right;align-items:flex-end;padding:15px 18px;border-radius:12px;border:1px solid var(--border);background:var(--surface);cursor:pointer',
                  )}
                >
                  <span
                    style={s(
                      "font-size:11.5px;color:var(--muted-2);font-family:'Geist Mono',monospace",
                    )}
                  >
                    Next →
                  </span>
                  <span
                    style={s("font-size:14.5px;font-weight:500;font-family:'Geist Mono',monospace")}
                  >
                    {next.name}
                  </span>
                </button>
              )}
            </nav>
          </main>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={s('border-top:1px solid var(--border);background:var(--background)')}>
        <div
          style={s(
            'max-width:1280px;margin:0 auto;padding:34px 24px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between',
          )}
        >
          <div style={s('display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px')}>
            <span
              aria-hidden="true"
              style={s(
                'position:relative;display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center',
              )}
            >
              <span
                style={s(
                  'position:absolute;inset:0;border-radius:6px;background:var(--primary);opacity:.18',
                )}
              />
              <span
                style={s(
                  'position:absolute;width:8px;height:8px;border-radius:50%;background:var(--primary);animation:pulse 1.8s ease-in-out infinite',
                )}
              />
            </span>
            everstate
          </div>
          <div
            style={s("font-size:12.5px;color:var(--muted-2);font-family:'Geist Mono',monospace")}
          >
            MIT · © Geekles007
          </div>
          <div style={s('display:flex;gap:18px;font-size:13.5px')}>
            <a
              href="https://github.com/Geekles007/everstate"
              target="_blank"
              rel="noreferrer noopener"
              className="hov-fg"
              style={s('color:var(--muted)')}
            >
              GitHub
            </a>
            <Link href="/roadmap" className="hov-fg" style={s('color:var(--muted)')}>
              Roadmap
            </Link>
            <Link href="/" className="hov-fg" style={s('color:var(--muted)')}>
              Home
            </Link>
          </div>
        </div>
      </footer>

      {/* COMMAND PALETTE */}
      {paletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          style={s(
            'position:fixed;inset:0;z-index:300;display:flex;align-items:flex-start;justify-content:center;padding:14vh 20px 20px;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);animation:fadeup .15s ease',
          )}
        >
          <button
            type="button"
            onClick={() => setPaletteOpen(false)}
            aria-label="Close"
            tabIndex={-1}
            style={s('position:absolute;inset:0;border:none;background:transparent;cursor:default')}
          />
          <div
            style={s(
              'position:relative;width:100%;max-width:560px;background:var(--surface);border:1px solid var(--border-strong);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7);overflow:hidden',
            )}
          >
            <div
              style={s(
                'display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid var(--border)',
              )}
            >
              <span style={s('color:var(--muted-2)')}>
                <SearchSvg size={18} />
              </span>
              <input
                ref={paletteRef}
                type="text"
                value={paletteQuery}
                onChange={(e) => {
                  setPaletteQuery(e.target.value);
                  setPaletteIndex(0);
                }}
                placeholder="Jump to a component or page…"
                aria-label="Search"
                style={s(
                  'flex:1;background:transparent;border:none;outline:none;color:var(--foreground);font-size:15.5px;font-family:inherit',
                )}
              />
              <kbd
                style={s(
                  "font-family:'Geist Mono',monospace;font-size:11px;padding:2px 7px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border);color:var(--muted-2)",
                )}
              >
                esc
              </kbd>
            </div>
            <div
              role="listbox"
              aria-label="Results"
              tabIndex={-1}
              style={s('max-height:340px;overflow-y:auto;padding:8px')}
            >
              {paletteList.length === 0 && (
                <div
                  style={s('padding:28px;text-align:center;color:var(--muted-2);font-size:14px')}
                >
                  No matches.
                </div>
              )}
              {paletteList.map((pi, i) => (
                <button
                  key={`${pi.label}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === paletteIndex}
                  onClick={() => runPalette(pi)}
                  onMouseEnter={() => setPaletteIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '11px 13px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    background: i === paletteIndex ? 'var(--surface-2)' : 'transparent',
                    border: `1px solid ${i === paletteIndex ? 'var(--border-strong)' : 'transparent'}`,
                  }}
                >
                  <span style={s('display:flex;align-items:center;gap:11px')}>
                    <span style={s('color:var(--muted-2)')}>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                    <span
                      style={s(
                        "font-size:14.5px;font-weight:500;font-family:'Geist Mono',monospace",
                      )}
                    >
                      {pi.label}
                    </span>
                  </span>
                  <span
                    style={s(
                      "font-size:11.5px;color:var(--muted-2);font-family:'Geist Mono',monospace",
                    )}
                  >
                    {pi.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
