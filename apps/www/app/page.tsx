'use client';

import { SiteChrome } from '@/components/site-chrome';
import { s } from '@/lib/style';
import Link from 'next/link';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

type HeroState = 'idle' | 'loading' | 'empty' | 'error' | 'success';
type DlState = 'loading' | 'empty' | 'error' | 'success';
type Pkg = 'npm' | 'pnpm' | 'bun';

interface HC {
  name: string;
  layer: number;
  status: 'done' | 'next' | 'planned';
  kind: string;
  a11y: boolean;
  desc: string;
  states: string[];
}

const layerNames: Record<number, string> = {
  0: 'Foundation',
  1: 'State primitives',
  2: 'Data display',
  3: 'Fetching inputs',
  4: 'Feedback & overlays',
  5: 'Navigation',
};

const homeComponents: HC[] = [
  {
    name: 'async-state',
    layer: 0,
    status: 'done',
    kind: 'lib',
    a11y: false,
    desc: 'The AsyncState<T> contract — the five states every component speaks.',
    states: ['idle', 'loading', 'empty', 'error', 'success'],
  },
  {
    name: 'theme',
    layer: 0,
    status: 'done',
    kind: 'tokens',
    a11y: false,
    desc: 'Semantic CSS variables (background, foreground, primary…) with dark and light, plus the Tailwind preset.',
    states: [],
  },
  {
    name: 'use-async',
    layer: 0,
    status: 'done',
    kind: 'hook',
    a11y: false,
    desc: 'Run an async function and get a typed AsyncState back, with retry built in.',
    states: ['idle', 'loading', 'error', 'success'],
  },
  {
    name: 'use-optimistic-list',
    layer: 0,
    status: 'planned',
    kind: 'hook',
    a11y: false,
    desc: 'Mutate a list optimistically and roll back on error.',
    states: [],
  },
  {
    name: 'use-online',
    layer: 0,
    status: 'done',
    kind: 'hook',
    a11y: false,
    desc: 'Reactive online/offline status — SSR-safe via useSyncExternalStore.',
    states: [],
  },
  {
    name: 'skeleton',
    layer: 0,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Decorative loading placeholder — pulses, aria-hidden, respects reduced motion.',
    states: ['loading'],
  },
  {
    name: 'state-boundary',
    layer: 1,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Maps an AsyncState onto loading/empty/error/success slots, with live-region announcements and focus management.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'empty-state',
    layer: 1,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'A considered empty slot with a primary action.',
    states: ['empty'],
  },
  {
    name: 'error-state',
    layer: 1,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'role=alert error slot with retry and expandable details.',
    states: ['error'],
  },
  {
    name: 'async-button',
    layer: 1,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'A button that owns its own pending and error state.',
    states: ['idle', 'loading', 'error'],
  },
  {
    name: 'data-list',
    layer: 2,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'A list that handles loading/empty/error and announces the result count — you only write one row.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'data-table',
    layer: 2,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Sortable table with loading rows and empty/error states.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'card-collection',
    layer: 2,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'State-complete card grid over an AsyncState.',
    states: ['loading', 'empty', 'success'],
  },
  {
    name: 'detail-view',
    layer: 2,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Single-record view with loading and not-found.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'avatar',
    layer: 2,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Avatar with image fallback and loading state.',
    states: ['loading', 'error', 'success'],
  },
  {
    name: 'async-combobox',
    layer: 3,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Combobox that fetches options as you type.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'command-palette',
    layer: 3,
    status: 'planned',
    kind: 'component',
    a11y: true,
    desc: 'A ⌘K palette over async sources — previewed on this very page.',
    states: ['loading', 'empty', 'success'],
  },
  {
    name: 'file-upload',
    layer: 3,
    status: 'planned',
    kind: 'component',
    a11y: true,
    desc: 'Upload with progress, retry and error states.',
    states: ['idle', 'loading', 'error', 'success'],
  },
  {
    name: 'toast',
    layer: 4,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Promise-aware notifications.',
    states: ['loading', 'error', 'success'],
  },
  {
    name: 'confirm-dialog',
    layer: 4,
    status: 'done',
    kind: 'component',
    a11y: true,
    desc: 'Async confirm with a pending action.',
    states: ['idle', 'loading', 'error'],
  },
  {
    name: 'sheet',
    layer: 4,
    status: 'planned',
    kind: 'component',
    a11y: true,
    desc: 'Slide-over panel for detail and forms.',
    states: ['loading', 'success'],
  },
  {
    name: 'pagination',
    layer: 5,
    status: 'planned',
    kind: 'component',
    a11y: true,
    desc: 'Paged or load-more over an AsyncState.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'infinite-list',
    layer: 5,
    status: 'planned',
    kind: 'component',
    a11y: true,
    desc: 'Windowed infinite scroll with a loading sentinel.',
    states: ['loading', 'empty', 'error', 'success'],
  },
  {
    name: 'tabs',
    layer: 5,
    status: 'planned',
    kind: 'component',
    a11y: true,
    desc: 'Tabs with per-panel async content.',
    states: ['loading', 'success'],
  },
];

const termLines = [
  { text: '$ ibirdui upgrade', color: '#e6edf3' },
  { text: 'state-boundary 1.0.0 → 1.1.0', color: '#79c0ff' },
  {
    text: '  conflict components/state-boundary.tsx → wrote components/state-boundary.tsx.new',
    color: '#febc2e',
  },
  { text: 'data-list 1.0.0 → 1.1.0', color: '#79c0ff' },
  { text: '  upd  components/data-list.tsx', color: '#7ee787' },
  { text: '✓ 1 updated, 1 conflict kept for review', color: '#b6ff2e' },
];

const compRows: [string, boolean | 'partial', boolean | 'partial', boolean | 'partial'][] = [
  ['You own the code', true, true, true],
  ['Loading / empty / error built-in', true, false, false],
  ['Optimistic & offline states', true, false, false],
  ['Verified accessibility (axe)', true, 'partial', false],
  ['Upgrade path for copied code', true, false, false],
  ['AI manifest for codegen', true, false, false],
];

const runner: Record<Pkg, string> = { npm: 'npx', pnpm: 'pnpm dlx', bun: 'bunx' };

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
const seg = (a: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: a ? 600 : 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  border: `1px solid ${a ? 'transparent' : 'var(--border)'}`,
  background: a ? 'var(--primary)' : 'transparent',
  color: a ? 'var(--primary-foreground)' : 'var(--muted)',
  transition: 'all .15s ease',
  whiteSpace: 'nowrap',
});
const statusMeta = {
  done: { label: 'Shipped', color: 'var(--primary-foreground)', bg: 'var(--primary)' },
  next: { label: 'Next', color: '#fff', bg: 'var(--warning)' },
  planned: { label: 'Planned', color: 'var(--muted)', bg: 'var(--surface-2)' },
} as const;
const badgeStyle = (st: keyof typeof statusMeta): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 9px',
  borderRadius: '999px',
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '.02em',
  fontFamily: "'Geist Mono', monospace",
  color: statusMeta[st].color,
  background: statusMeta[st].bg,
});

const CopyIcon = ({ copied }: { copied: boolean }) =>
  copied ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#b6ff2e"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ) : (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15V5a2 2 0 012-2h10" />
    </svg>
  );
const Arrow = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const dlUsers = [
  { id: 'u1', name: 'Ada Lovelace', role: 'Maintainer', initials: 'AL' },
  { id: 'u2', name: 'Grace Hopper', role: 'Admin', initials: 'GH' },
  { id: 'u3', name: 'Alan Turing', role: 'Member', initials: 'AT' },
  { id: 'u4', name: 'Radia Perlman', role: 'Member', initials: 'RP' },
];

export default function Home() {
  const reduced = useRef(false);
  const heroTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const dlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const termTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [heroState, setHeroState] = useState<HeroState>('loading');
  const [heroAuto, setHeroAuto] = useState(true);
  const [dlState, setDlState] = useState<DlState>('success');
  const [pkg, setPkg] = useState<Pkg>('npm');
  const [aiQuery, setAiQuery] = useState('a list of users with loading states');
  const [aiResults, setAiResults] = useState<
    { name: string; desc: string; status: string; add: string }[] | null
  >(null);
  const [termCount, setTermCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback((text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {}
    setCopiedId(id);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 1600);
  }, []);

  const runTerminal = useCallback(() => {
    if (reduced.current) {
      setTermCount(termLines.length);
      return;
    }
    clearInterval(termTimer.current);
    setTermCount(1);
    termTimer.current = setInterval(() => {
      setTermCount((c) => {
        if (c >= termLines.length) {
          clearInterval(termTimer.current);
          return c;
        }
        return c + 1;
      });
    }, 560);
  }, []);

  // mount
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    runTerminal();
    return () => {
      clearInterval(heroTimer.current);
      clearInterval(termTimer.current);
      clearTimeout(dlTimer.current);
      clearTimeout(copyTimer.current);
    };
  }, [runTerminal]);

  // hero auto-cycle
  useEffect(() => {
    clearInterval(heroTimer.current);
    if (!heroAuto || reduced.current) return;
    const order: HeroState[] = ['idle', 'loading', 'empty', 'error', 'success'];
    heroTimer.current = setInterval(() => {
      setHeroState((cur) => order[(order.indexOf(cur) + 1) % order.length] as HeroState);
    }, 2100);
    return () => clearInterval(heroTimer.current);
  }, [heroAuto]);

  const setHero = (st: HeroState) => {
    setHeroAuto(false);
    setHeroState(st);
  };
  const setDl = (st: DlState) => setDlState(st);
  const dlRetry = () => {
    setDl('loading');
    clearTimeout(dlTimer.current);
    dlTimer.current = setTimeout(() => setDl('success'), 850);
  };

  const runAi = useCallback(() => {
    const q = aiQuery.toLowerCase();
    const pick: string[] = [];
    const add = (n: string) => {
      if (!pick.includes(n)) pick.push(n);
    };
    if (/table/.test(q)) add('data-table');
    if (/list|users?|feed|collection|grid|people|items?/.test(q)) {
      add('data-list');
      add('state-boundary');
    }
    if (/load|fetch|async|spinner|skeleton|pending/.test(q)) {
      add('state-boundary');
      add('skeleton');
    }
    if (/search|combobox|autocomplete|typeahead|filter/.test(q)) {
      add('async-combobox');
      add('command-palette');
    }
    if (/upload|file|drop|attach/.test(q)) add('file-upload');
    if (/toast|notif|alert|message/.test(q)) add('toast');
    if (/dialog|confirm|modal|prompt/.test(q)) add('confirm-dialog');
    if (/button|submit|save|form|action/.test(q)) add('async-button');
    if (/paginat|infinite|load more|scroll/.test(q)) {
      add('pagination');
      add('infinite-list');
    }
    if (/empty/.test(q)) add('empty-state');
    if (/error|retry|fail/.test(q)) add('error-state');
    if (!pick.length) {
      add('data-list');
      add('state-boundary');
    }
    const map = Object.fromEntries(homeComponents.map((c) => [c.name, c]));
    setAiResults(
      pick.slice(0, 3).map((n) => {
        const c = map[n];
        return {
          name: n,
          desc: c?.desc ?? '',
          status: c?.status ?? 'planned',
          add: `npx ibirdui add ${n}`,
        };
      }),
    );
  }, [aiQuery]);

  const shipped = homeComponents.filter((c) => c.status === 'done');
  const doneCount = shipped.length;
  // Home teaser shows at most 6; the "Browse all" link covers the rest.
  const featured = shipped.slice(0, 6);
  const dotColor: Record<string, string> = {
    done: 'var(--primary)',
    next: 'var(--warning)',
    planned: 'var(--border-strong)',
  };
  const layerCards = [0, 1, 2, 3, 4, 5].map((L) => {
    const its = homeComponents.filter((c) => c.layer === L);
    const d = its.filter((c) => c.status === 'done').length;
    return {
      layer: L,
      name: layerNames[L],
      summary: d > 0 ? `${d}/${its.length}` : `${its.length} planned`,
      dots: its.map((c) => ({ name: c.name, color: dotColor[c.status] })),
    };
  });

  const qsList = `${runner[pkg]} ibirdui list`;
  const qsAdd = `${runner[pkg]} ibirdui add data-list`;
  const qsUpgrade = `${runner[pkg]} ibirdui upgrade`;

  const eyebrow =
    "font-family:'Geist Mono',monospace;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-fg);margin-bottom:16px";
  const mono = "'Geist Mono',monospace";
  const qsSteps: [string, string, string][] = [
    ['1', qsList, 'qsl'],
    ['2', qsAdd, 'qsa'],
    ['3', qsUpgrade, 'qsu'],
  ];

  return (
    <SiteChrome current="home">
      {/* HERO */}
      <section
        aria-labelledby="hero-h"
        data-hero="1"
        style={s(
          'max-width:1180px;margin:0 auto;padding:84px 24px 64px;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center',
        )}
      >
        <div>
          <div
            style={s(
              `display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface);font-size:12.5px;color:var(--muted);margin-bottom:24px;font-family:${mono}`,
            )}
          >
            <span
              aria-hidden="true"
              style={s(
                'width:7px;height:7px;border-radius:50%;background:var(--primary);animation:pulse 1.8s ease-in-out infinite',
              )}
            />
            registry-as-code · MIT
          </div>
          <h1
            id="hero-h"
            style={s(
              'font-size:56px;line-height:1.04;letter-spacing:-.03em;font-weight:600;margin:0 0 22px',
            )}
          >
            Components that handle the parts you{' '}
            <span style={s('color:var(--accent-fg)')}>always forget</span>.
          </h1>
          <p
            style={s(
              'font-size:19px;line-height:1.6;color:var(--muted);max-width:540px;margin:0 0 34px',
            )}
          >
            Own the code like shadcn — but with every state, verified accessibility, and an upgrade
            path that survives your edits.
          </p>
          <div style={s('display:flex;flex-wrap:wrap;gap:12px;align-items:center')}>
            <button
              type="button"
              onClick={() => copy('npx ibirdui add data-list', 'hero')}
              aria-label="Copy install command: npx ibirdui add data-list"
              className="hov-accent"
              style={s(
                `display:inline-flex;align-items:center;gap:12px;padding:13px 18px;border-radius:11px;background:var(--surface);border:1px solid var(--border-strong);cursor:pointer;font-family:${mono};font-size:14.5px`,
              )}
            >
              <span style={s('color:var(--muted-2)')}>$</span>
              <span>npx ibirdui add data-list</span>
              <span aria-hidden="true" style={s('display:inline-flex;color:var(--accent-fg)')}>
                <CopyIcon copied={copiedId === 'hero'} />
              </span>
            </button>
            <a
              href="https://github.com/Geekles007/ibirdui"
              target="_blank"
              rel="noreferrer noopener"
              className="hov-dim"
              style={s(
                'display:inline-flex;align-items:center;gap:9px;padding:13px 18px;border-radius:11px;background:var(--primary);color:var(--primary-foreground);font-weight:600;font-size:14.5px;cursor:pointer',
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01z" />
              </svg>
              Star on GitHub
            </a>
          </div>
          <div style={s('display:flex;gap:28px;margin-top:38px;flex-wrap:wrap')}>
            {[
              ['5', 'async states, handled'],
              ['AA', 'accessibility, verified'],
              ['0', 'runtime dependencies'],
            ].map(([n, label], i) => (
              <div key={label} style={s('display:flex;gap:28px;align-items:center')}>
                {i > 0 && <span style={s('width:1px;height:34px;background:var(--border)')} />}
                <div>
                  <div
                    style={s(
                      `font-family:${mono};font-size:22px;font-weight:600;color:var(--foreground)`,
                    )}
                  >
                    {n}
                  </div>
                  <div style={s('font-size:13px;color:var(--muted-2)')}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* live vital-signs monitor */}
        <div style={s('position:relative')}>
          <div
            role="group"
            aria-label="Live component state demo"
            style={s(
              'background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;box-shadow:0 24px 60px -30px rgba(0,0,0,.6)',
            )}
          >
            <div
              style={s(
                'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px',
              )}
            >
              <div
                style={s(
                  `display:flex;align-items:center;gap:9px;font-family:${mono};font-size:12.5px;color:var(--muted)`,
                )}
              >
                <span aria-hidden="true" style={s('display:flex;gap:5px')}>
                  <span
                    style={s(
                      'width:9px;height:9px;border-radius:50%;background:var(--border-strong)',
                    )}
                  />
                  <span
                    style={s(
                      'width:9px;height:9px;border-radius:50%;background:var(--border-strong)',
                    )}
                  />
                  <span
                    style={s(
                      'width:9px;height:9px;border-radius:50%;background:var(--border-strong)',
                    )}
                  />
                </span>
                &lt;StateBoundary/&gt;
              </div>
              <span
                style={s(
                  `font-family:${mono};font-size:11.5px;padding:3px 9px;border-radius:999px;background:var(--primary-dim);color:var(--accent-fg);text-transform:uppercase;letter-spacing:.06em`,
                )}
              >
                {heroState}
              </span>
            </div>

            <div
              style={s(
                'min-height:172px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);padding:18px;display:flex;flex-direction:column;justify-content:center',
              )}
            >
              {heroState === 'idle' && (
                <div style={s('text-align:center;color:var(--muted-2)')}>
                  <div style={s(`font-size:13px;font-family:${mono}`)}>awaiting trigger…</div>
                </div>
              )}
              {heroState === 'loading' && (
                <div aria-busy="true" style={s('display:flex;flex-direction:column;gap:11px')}>
                  {['62%', '88%', '74%'].map((w) => (
                    <div
                      key={w}
                      style={{
                        height: '13px',
                        width: w,
                        borderRadius: '6px',
                        background:
                          'linear-gradient(90deg,var(--border) 25%,var(--border-strong) 37%,var(--border) 63%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.4s linear infinite',
                      }}
                    />
                  ))}
                </div>
              )}
              {heroState === 'empty' && (
                <div style={s('text-align:center;color:var(--muted)')}>
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    style={s('margin:0 auto 8px;display:block;opacity:.6')}
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18" />
                  </svg>
                  <div style={s('font-size:13.5px')}>No records yet</div>
                </div>
              )}
              {heroState === 'error' && (
                <div style={s('text-align:center;color:var(--destructive)')}>
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    style={s('margin:0 auto 8px;display:block')}
                    aria-hidden="true"
                  >
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.9L1.8 18.4A2 2 0 003.5 21.4h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  </svg>
                  <div style={s('font-size:13.5px;margin-bottom:10px')}>Request failed</div>
                  <span
                    style={s(
                      'display:inline-flex;padding:6px 13px;border-radius:8px;border:1px solid var(--destructive);color:var(--destructive);font-size:12.5px;font-weight:600',
                    )}
                  >
                    Retry
                  </span>
                </div>
              )}
              {heroState === 'success' && (
                <div style={s('display:flex;flex-direction:column;gap:11px')}>
                  <div style={s('display:flex;align-items:center;gap:11px')}>
                    <span
                      style={s(
                        `width:30px;height:30px;border-radius:8px;background:var(--primary-dim);color:var(--accent-fg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;font-family:${mono}`,
                      )}
                    >
                      AL
                    </span>
                    <div>
                      <div style={s('font-size:13.5px;font-weight:500')}>Ada Lovelace</div>
                      <div style={s('font-size:11.5px;color:var(--muted-2)')}>online</div>
                    </div>
                    <svg
                      width="56"
                      height="22"
                      viewBox="0 0 120 30"
                      style={s('margin-left:auto')}
                      aria-hidden="true"
                    >
                      <polyline
                        points="0,15 20,15 28,15 34,4 42,26 50,15 70,15 78,15 84,8 92,22 100,15 120,15"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeDasharray="340"
                        style={{ animation: 'ecg 2.4s linear infinite' }}
                      />
                    </svg>
                  </div>
                  <div style={s('display:flex;align-items:center;gap:11px')}>
                    <span
                      style={s(
                        `width:30px;height:30px;border-radius:8px;background:var(--surface);border:1px solid var(--border);color:var(--muted);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;font-family:${mono}`,
                      )}
                    >
                      GH
                    </span>
                    <div>
                      <div style={s('font-size:13.5px;font-weight:500')}>Grace Hopper</div>
                      <div style={s('font-size:11.5px;color:var(--muted-2)')}>online</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              role="radiogroup"
              aria-label="Override component state"
              style={s('display:flex;flex-wrap:wrap;gap:7px;margin-top:16px')}
            >
              {(['idle', 'loading', 'empty', 'error', 'success'] as HeroState[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={heroState === k}
                  onClick={() => setHero(k)}
                  style={pill(heroState === k)}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div
            aria-hidden="true"
            style={s(
              'position:absolute;inset:-40px -20px;z-index:-1;background:radial-gradient(circle at 60% 40%,var(--primary-dim),transparent 70%);filter:blur(20px)',
            )}
          />
        </div>
      </section>

      {/* PROBLEM */}
      <section
        id="problem"
        aria-labelledby="problem-h"
        style={s(
          'scroll-margin-top:80px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface)',
        )}
      >
        <div style={s('max-width:1180px;margin:0 auto;padding:72px 24px')}>
          <div style={s(eyebrow)}>The problem</div>
          <h2
            id="problem-h"
            style={s(
              'font-size:34px;line-height:1.18;letter-spacing:-.02em;font-weight:600;margin:0 0 18px;max-width:760px',
            )}
          >
            shadcn gave you ownership. It also handed you a pile of unfinished UI.
          </h2>
          <p
            style={s(
              'font-size:17px;line-height:1.65;color:var(--muted);max-width:720px;margin:0 0 40px',
            )}
          >
            You copy a component, then re-implement loading, empty and error states in every
            project. Accessibility is asserted, never checked. And once you edit the code, you can
            never upgrade what you copied. ibirdui adds back the two things ownership cost you —{' '}
            <strong style={s('color:var(--foreground);font-weight:600')}>completeness</strong> and{' '}
            <strong style={s('color:var(--foreground);font-weight:600')}>maintainability</strong>.
          </p>
          <div
            data-grid3="1"
            style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:18px')}
          >
            {[
              [
                'You re-write every state',
                'Loading skeletons, empty slots, error + retry — hand-rolled again and again, inconsistently.',
              ],
              [
                'Accessibility is unchecked',
                'Roles and labels are claimed in a README, not enforced by a test that fails the build.',
              ],
              [
                'No upgrade path',
                "The moment you touch the copied file, you're cut off from every future fix and improvement.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                style={s(
                  'background:var(--background);border:1px solid var(--border);border-radius:14px;padding:22px',
                )}
              >
                <div style={s('color:var(--destructive);margin-bottom:12px')}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </div>
                <h3 style={s('font-size:16px;font-weight:600;margin:0 0 7px')}>{title}</h3>
                <p style={s('font-size:14px;line-height:1.6;color:var(--muted);margin:0')}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFF 1: STATE-COMPLETE */}
      <section
        id="state-complete"
        aria-labelledby="d1-h"
        data-diff="1"
        style={s(
          'scroll-margin-top:80px;max-width:1180px;margin:0 auto;padding:88px 24px;display:grid;grid-template-columns:.95fr 1.05fr;gap:56px;align-items:center',
        )}
      >
        <div>
          <div style={s(eyebrow)}>01 — State-complete by construction</div>
          <h2
            id="d1-h"
            style={s(
              'font-size:32px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 18px',
            )}
          >
            Write the happy path. Get the other four states free.
          </h2>
          <p style={s('font-size:16.5px;line-height:1.65;color:var(--muted);margin:0 0 22px')}>
            Every component speaks one async contract —{' '}
            <code
              style={s(
                `font-family:${mono};font-size:14px;background:var(--surface);padding:2px 7px;border-radius:6px;border:1px solid var(--border);color:var(--accent-fg)`,
              )}
            >
              AsyncState&lt;T&gt;
            </code>{' '}
            with five states. The loading skeleton, empty slot, error + retry, and screen-reader
            announcements are provided. You write one row.
          </p>
          <div style={s('display:flex;flex-wrap:wrap;gap:8px')}>
            {['idle', 'loading', 'empty', 'error', 'success'].map((x) => {
              const on = x === 'success';
              return (
                <span
                  key={x}
                  style={s(
                    `font-family:${mono};font-size:12.5px;padding:5px 11px;border-radius:7px;background:${on ? 'var(--primary-dim)' : 'var(--surface)'};border:1px solid ${on ? 'var(--primary)' : 'var(--border)'};color:${on ? 'var(--accent-fg)' : 'var(--muted)'}`,
                  )}
                >
                  {x}
                </span>
              );
            })}
          </div>
        </div>

        {/* DataList live demo */}
        <div
          style={s(
            'background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden',
          )}
        >
          <div
            style={s(
              'display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)',
            )}
          >
            <div style={s(`font-family:${mono};font-size:13px;color:var(--muted)`)}>
              &lt;DataList label=&quot;Users&quot; /&gt;
            </div>
            <div
              role="group"
              aria-label="Switch DataList state"
              style={s('display:flex;gap:6px;flex-wrap:wrap')}
            >
              {(['loading', 'empty', 'error', 'success'] as DlState[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={dlState === k}
                  onClick={() => setDl(k)}
                  style={pill(dlState === k)}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={s('padding:14px;min-height:248px')}>
            {dlState === 'loading' && (
              <div
                aria-busy="true"
                aria-label="Loading users"
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
            {dlState === 'empty' && (
              <div
                style={s(
                  'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:220px;color:var(--muted)',
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
            {dlState === 'error' && (
              <div
                style={s(
                  'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:220px',
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
                  onClick={dlRetry}
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
            {dlState === 'success' && (
              <div>
                <div
                  style={s(
                    `font-size:12px;color:var(--muted-2);font-family:${mono};padding:0 4px 9px`,
                  )}
                >
                  4 users
                </div>
                <div style={s('display:flex;flex-direction:column;gap:7px')}>
                  {dlUsers.map((u) => (
                    <div
                      key={u.id}
                      style={s(
                        'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;border:1px solid var(--border);background:var(--surface-2);animation:fadeup .35s ease both',
                      )}
                    >
                      <span
                        style={s(
                          `width:34px;height:34px;border-radius:9px;background:var(--primary-dim);color:var(--accent-fg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:${mono}`,
                        )}
                      >
                        {u.initials}
                      </span>
                      <div style={s('flex:1;min-width:0')}>
                        <div style={s('font-size:14px;font-weight:500')}>{u.name}</div>
                        <div style={s('font-size:12px;color:var(--muted-2)')}>{u.role}</div>
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
      </section>

      {/* DIFF 2: UPGRADEABLE */}
      <section
        id="upgradeable"
        aria-labelledby="d2-h"
        style={s(
          'scroll-margin-top:80px;border-top:1px solid var(--border);background:var(--surface)',
        )}
      >
        <div
          data-diff="1"
          style={s(
            'max-width:1180px;margin:0 auto;padding:88px 24px;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center',
          )}
        >
          <div
            style={s(
              'background:#0c0d10;border:1px solid #20232a;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px -30px rgba(0,0,0,.6)',
            )}
          >
            <div
              style={s(
                'display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #1c1f25',
              )}
            >
              <span
                aria-hidden="true"
                style={s('width:11px;height:11px;border-radius:50%;background:#ff5f57')}
              />
              <span
                aria-hidden="true"
                style={s('width:11px;height:11px;border-radius:50%;background:#febc2e')}
              />
              <span
                aria-hidden="true"
                style={s('width:11px;height:11px;border-radius:50%;background:#28c840')}
              />
              <span style={s(`margin-left:8px;font-family:${mono};font-size:12px;color:#6b727c`)}>
                upgrade — zsh
              </span>
              <button
                type="button"
                onClick={runTerminal}
                aria-label="Replay terminal animation"
                className="hov-fg"
                style={s(
                  `margin-left:auto;display:flex;align-items:center;gap:6px;font-family:${mono};font-size:11.5px;color:#6b727c;background:transparent;border:1px solid #20232a;padding:4px 9px;border-radius:7px;cursor:pointer`,
                )}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 11-2.6-6.4M21 4v5h-5" />
                </svg>
                Replay
              </button>
            </div>
            <div
              style={s(
                `padding:18px;font-family:${mono};font-size:13.5px;line-height:1.85;min-height:210px`,
              )}
            >
              {termLines.map((l, i) =>
                i < termCount ? (
                  <div
                    key={l.text}
                    style={{ color: l.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {l.text}
                    {i === termCount - 1 && (
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '15px',
                          background: '#b6ff2e',
                          marginLeft: '3px',
                          verticalAlign: '-2px',
                          animation: 'blink 1s step-end infinite',
                        }}
                      />
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </div>
          <div>
            <div style={s(eyebrow)}>02 — Upgradeable copy-paste</div>
            <h2
              id="d2-h"
              style={s(
                'font-size:32px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 18px',
              )}
            >
              Upgrades that respect the edits you made.
            </h2>
            <p style={s('font-size:16.5px;line-height:1.65;color:var(--muted);margin:0 0 22px')}>
              <code
                style={s(
                  `font-family:${mono};font-size:14px;background:var(--background);padding:2px 7px;border-radius:6px;border:1px solid var(--border);color:var(--accent-fg)`,
                )}
              >
                ibirdui add
              </code>{' '}
              writes a{' '}
              <code
                style={s(
                  `font-family:${mono};font-size:14px;background:var(--background);padding:2px 7px;border-radius:6px;border:1px solid var(--border);color:var(--accent-fg)`,
                )}
              >
                ibirdui.lock.json
              </code>{' '}
              — a version and a content fingerprint per file.{' '}
              <code
                style={s(
                  `font-family:${mono};font-size:14px;background:var(--background);padding:2px 7px;border-radius:6px;border:1px solid var(--border);color:var(--accent-fg)`,
                )}
              >
                ibirdui upgrade
              </code>{' '}
              updates files you haven&apos;t touched, and for files you edited it never overwrites —
              it drops the new version as{' '}
              <code
                style={s(
                  `font-family:${mono};font-size:14px;background:var(--background);padding:2px 7px;border-radius:6px;border:1px solid var(--border);color:var(--accent-fg)`,
                )}
              >
                *.new
              </code>{' '}
              for you to merge.
            </p>
            <ul
              style={s(
                'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px',
              )}
            >
              {[
                'Untouched files update cleanly in place.',
                'Your edits are detected by fingerprint and never clobbered.',
                'Conflicts land as .new so you merge on your terms.',
              ].map((t) => (
                <li
                  key={t}
                  style={s(
                    'display:flex;gap:11px;align-items:flex-start;font-size:14.5px;color:var(--muted)',
                  )}
                >
                  <span style={s('color:var(--accent-fg);flex:none;margin-top:2px')}>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* DIFF 3: A11Y + AI */}
      <section
        id="a11y"
        aria-labelledby="d3-h"
        data-diff="1"
        style={s(
          'scroll-margin-top:80px;max-width:1180px;margin:0 auto;padding:88px 24px;display:grid;grid-template-columns:.95fr 1.05fr;gap:56px;align-items:center',
        )}
      >
        <div>
          <div style={s(eyebrow)}>03 — Accessible &amp; AI-native</div>
          <h2
            id="d3-h"
            style={s(
              'font-size:32px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 18px',
            )}
          >
            Accessibility you can verify. Components an AI can read.
          </h2>
          <p style={s('font-size:16.5px;line-height:1.65;color:var(--muted);margin:0 0 24px')}>
            Every UI component ships an{' '}
            <strong style={s('color:var(--foreground);font-weight:600')}>
              axe accessibility test
            </strong>{' '}
            and documents its guarantees — live-region announcements,{' '}
            <code style={s(`font-family:${mono};font-size:14px;color:var(--accent-fg)`)}>
              aria-busy
            </code>
            , focus management, correct roles. And every component carries a machine-readable
            manifest, so{' '}
            <code style={s(`font-family:${mono};font-size:14px;color:var(--accent-fg)`)}>
              ibirdui gen
            </code>{' '}
            can suggest the right pieces for a task.
          </p>
          <div style={s('display:flex;gap:14px;flex-wrap:wrap')}>
            <div
              style={s(
                'display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:11px;background:var(--surface);border:1px solid var(--border)',
              )}
            >
              <span style={s('color:var(--accent-fg)')}>
                <svg
                  width="18"
                  height="18"
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
              <span style={s('font-size:13.5px;font-weight:500')}>axe-core verified</span>
            </div>
            <div
              style={s(
                'display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:11px;background:var(--surface);border:1px solid var(--border)',
              )}
            >
              <span style={s('color:var(--accent-fg)')}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7z" />
                </svg>
              </span>
              <span style={s('font-size:13.5px;font-weight:500')}>AI manifest</span>
            </div>
          </div>
        </div>

        {/* AI prompt box */}
        <div
          style={s(
            'background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:20px',
          )}
        >
          <label
            htmlFor="ai-input"
            style={s('display:block;font-size:13px;color:var(--muted);margin-bottom:9px')}
          >
            Describe what you&apos;re building
          </label>
          <div style={s('display:flex;gap:9px;margin-bottom:6px')}>
            <div
              style={s(
                'flex:1;display:flex;align-items:center;gap:10px;background:var(--background);border:1px solid var(--border-strong);border-radius:11px;padding:0 13px',
              )}
            >
              <span style={s('color:var(--accent-fg);flex:none')}>
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7z" />
                </svg>
              </span>
              <input
                id="ai-input"
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runAi();
                  }
                }}
                placeholder="a list of users with loading states"
                style={s(
                  'flex:1;background:transparent;border:none;outline:none;color:var(--foreground);font-size:14.5px;padding:13px 0;font-family:inherit',
                )}
              />
            </div>
            <button
              type="button"
              onClick={runAi}
              className="hov-dim"
              style={s(
                'display:inline-flex;align-items:center;gap:8px;padding:0 17px;border-radius:11px;background:var(--primary);color:var(--primary-foreground);font-weight:600;font-size:14px;cursor:pointer;flex:none',
              )}
            >
              <span style={s(`font-family:${mono}`)}>gen</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div
            style={s(`font-size:12px;color:var(--muted-2);margin-bottom:16px;font-family:${mono}`)}
          >
            $ ibirdui gen &quot;{aiQuery}&quot;
          </div>

          {aiResults && aiResults.length > 0 && (
            <div style={s('border-top:1px solid var(--border);padding-top:16px')}>
              <div
                style={s(
                  `font-size:12px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:11px;font-family:${mono}`,
                )}
              >
                Suggested components
              </div>
              <div style={s('display:flex;flex-direction:column;gap:10px')}>
                {aiResults.map((ar) => (
                  <div
                    key={ar.name}
                    style={s(
                      'display:flex;align-items:center;gap:13px;padding:13px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);animation:fadeup .3s ease both',
                    )}
                  >
                    <div style={s('flex:1;min-width:0')}>
                      <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:3px')}>
                        <span style={s(`font-family:${mono};font-size:14px;font-weight:600`)}>
                          {ar.name}
                        </span>
                        <span
                          style={s(
                            `font-size:10.5px;font-family:${mono};padding:2px 7px;border-radius:999px;background:var(--primary-dim);color:var(--accent-fg)`,
                          )}
                        >
                          {statusMeta[ar.status as keyof typeof statusMeta]?.label ?? 'Planned'}
                        </span>
                      </div>
                      <div style={s('font-size:12.5px;color:var(--muted);line-height:1.45')}>
                        {ar.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(ar.add, `ai-${ar.name}`)}
                      aria-label={`Copy add command for ${ar.name}`}
                      className="hov-accent"
                      style={s(
                        `flex:none;display:inline-flex;align-items:center;gap:7px;font-family:${mono};font-size:12px;padding:7px 11px;border-radius:8px;border:1px solid var(--border-strong);background:var(--background);cursor:pointer;color:var(--muted)`,
                      )}
                    >
                      {copiedId === `ai-${ar.name}` ? (
                        <span style={s('color:var(--accent-fg)')}>copied</span>
                      ) : (
                        <>
                          <span>add</span>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <rect x="9" y="9" width="12" height="12" rx="2.5" />
                            <path d="M5 15V5a2 2 0 012-2h10" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* COMPONENTS TEASER */}
      <section
        id="components"
        aria-labelledby="gal-h"
        style={s(
          'scroll-margin-top:80px;border-top:1px solid var(--border);background:var(--surface)',
        )}
      >
        <div style={s('max-width:1180px;margin:0 auto;padding:84px 24px')}>
          <div
            style={s(
              'display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:32px',
            )}
          >
            <div>
              <div style={s(eyebrow)}>Components</div>
              <h2
                id="gal-h"
                style={s(
                  'font-size:34px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 12px',
                )}
              >
                Shipped today. Production-ready.
              </h2>
              <p
                style={s(
                  'font-size:16px;line-height:1.6;color:var(--muted);max-width:560px;margin:0',
                )}
              >
                {doneCount} components are live now — each state-complete, AA-verified and
                upgradeable. Each comes with a full tutorial, live example and API reference.
              </p>
            </div>
            <Link
              href="/components"
              className="hov-accent"
              style={s(
                'display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border-radius:11px;border:1px solid var(--border-strong);background:var(--background);font-size:14.5px;font-weight:500;white-space:nowrap',
              )}
            >
              Browse all 24 components
              <Arrow />
            </Link>
          </div>
          <div
            role="list"
            aria-label="Shipped ibirdui components"
            data-grid3="1"
            style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}
          >
            {featured.map((c) => (
              <Link
                key={c.name}
                role="listitem"
                href={`/components#${c.name}`}
                className="hov-border"
                style={s(
                  'display:flex;flex-direction:column;background:var(--background);border:1px solid var(--border);border-radius:15px;padding:20px',
                )}
              >
                <div
                  style={s(
                    'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px',
                  )}
                >
                  <span
                    style={s(
                      `font-family:${mono};font-size:16px;font-weight:600;letter-spacing:-.01em`,
                    )}
                  >
                    {c.name}
                  </span>
                  <span style={badgeStyle(c.status)}>{statusMeta[c.status].label}</span>
                </div>
                <p
                  style={s(
                    'font-size:13.5px;line-height:1.55;color:var(--muted);margin:0 0 16px;flex:1',
                  )}
                >
                  {c.desc}
                </p>
                <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px')}>
                  <span
                    style={s(
                      `font-size:10.5px;font-family:${mono};padding:3px 8px;border-radius:6px;background:var(--surface);border:1px solid var(--border);color:var(--muted-2)`,
                    )}
                  >
                    {c.kind}
                  </span>
                  {c.a11y && (
                    <span
                      style={s(
                        `font-size:10.5px;font-family:${mono};padding:3px 8px;border-radius:6px;background:var(--primary-dim);color:var(--accent-fg);display:inline-flex;align-items:center;gap:4px`,
                      )}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        aria-hidden="true"
                      >
                        <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
                      </svg>
                      a11y AA
                    </span>
                  )}
                </div>
                <span
                  style={s(
                    'display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:var(--accent-fg)',
                  )}
                >
                  Read docs
                  <Arrow size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        aria-labelledby="how-h"
        style={s('scroll-margin-top:80px;max-width:1180px;margin:0 auto;padding:88px 24px')}
      >
        <div style={s(eyebrow)}>How it works</div>
        <h2
          id="how-h"
          style={s(
            'font-size:34px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 12px',
          )}
        >
          No backend. Just static files.
        </h2>
        <p
          style={s(
            'font-size:16px;line-height:1.6;color:var(--muted);max-width:640px;margin:0 0 40px',
          )}
        >
          The registry is source. It builds to static JSON. The CLI copies files into your project
          and records a lock.
        </p>
        <div
          data-flow="1"
          style={s(
            'display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:18px;align-items:stretch',
          )}
        >
          {[
            [
              'registry/items/*',
              'Source of truth',
              'Each component is authored once with its code, manifest, and axe test.',
            ],
            [
              '/r/*.json',
              'Static registry',
              'Builds to plain JSON on GitHub Pages — no server, no database.',
            ],
            [
              'your-project/',
              'You own it',
              'The CLI copies files in and writes ibirdui.lock.json.',
            ],
          ].map(([tag, title, body], i) => (
            <div key={tag} style={s('display:contents')}>
              <div
                style={s(
                  'background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:22px',
                )}
              >
                <div
                  style={s(
                    `font-family:${mono};font-size:12px;color:var(--accent-fg);margin-bottom:12px`,
                  )}
                >
                  {tag}
                </div>
                <h3 style={s('font-size:16px;font-weight:600;margin:0 0 7px')}>{title}</h3>
                <p style={s('font-size:13.5px;line-height:1.55;color:var(--muted);margin:0')}>
                  {body}
                </p>
              </div>
              {i < 2 && (
                <div
                  aria-hidden="true"
                  data-arrow="1"
                  style={s(
                    'display:flex;align-items:center;justify-content:center;color:var(--muted-2)',
                  )}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section
        id="compare"
        aria-labelledby="cmp-h"
        style={s(
          'scroll-margin-top:80px;border-top:1px solid var(--border);background:var(--surface)',
        )}
      >
        <div style={s('max-width:1180px;margin:0 auto;padding:84px 24px')}>
          <div style={s(eyebrow)}>Comparison</div>
          <h2
            id="cmp-h"
            style={s(
              'font-size:34px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 32px',
            )}
          >
            Where ibirdui sits.
          </h2>
          <div
            style={s(
              'overflow-x:auto;border:1px solid var(--border);border-radius:16px;background:var(--background)',
            )}
          >
            <table style={s('width:100%;border-collapse:collapse;min-width:640px')}>
              <caption
                style={s(
                  'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)',
                )}
              >
                Feature comparison of ibirdui, shadcn/ui, and hand-rolled components
              </caption>
              <thead>
                <tr style={s('border-bottom:1px solid var(--border)')}>
                  <th
                    scope="col"
                    style={s(
                      'text-align:left;padding:16px 20px;font-size:13px;font-weight:500;color:var(--muted)',
                    )}
                  >
                    Capability
                  </th>
                  <th
                    scope="col"
                    style={s(
                      'text-align:center;padding:16px 20px;font-size:14px;font-weight:600;color:var(--accent-fg)',
                    )}
                  >
                    ibirdui
                  </th>
                  <th
                    scope="col"
                    style={s(
                      'text-align:center;padding:16px 20px;font-size:14px;font-weight:500;color:var(--muted)',
                    )}
                  >
                    shadcn/ui
                  </th>
                  <th
                    scope="col"
                    style={s(
                      'text-align:center;padding:16px 20px;font-size:14px;font-weight:500;color:var(--muted)',
                    )}
                  >
                    Hand-rolled
                  </th>
                </tr>
              </thead>
              <tbody>
                {compRows.map((row) => {
                  const cell = (v: boolean | 'partial') => {
                    const g =
                      v === true
                        ? { glyph: '✓', color: 'var(--accent-fg)', bg: 'var(--primary-dim)' }
                        : v === 'partial'
                          ? { glyph: '~', color: 'var(--warning)', bg: 'rgba(255,176,32,.13)' }
                          : { glyph: '–', color: 'var(--muted-2)', bg: 'transparent' };
                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '14px',
                          color: g.color,
                          background: g.bg,
                        }}
                      >
                        {g.glyph}
                      </span>
                    );
                  };
                  return (
                    <tr key={row[0]} style={s('border-bottom:1px solid var(--border)')}>
                      <th
                        scope="row"
                        style={s(
                          'text-align:left;padding:15px 20px;font-size:14.5px;font-weight:500;color:var(--foreground)',
                        )}
                      >
                        {row[0]}
                      </th>
                      <td style={s('text-align:center;padding:15px 20px')}>{cell(row[1])}</td>
                      <td style={s('text-align:center;padding:15px 20px')}>{cell(row[2])}</td>
                      <td style={s('text-align:center;padding:15px 20px')}>{cell(row[3])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* QUICK START + CODE */}
      <section
        id="quickstart"
        aria-labelledby="qs-h"
        data-diff="1"
        style={s(
          'scroll-margin-top:80px;max-width:1180px;margin:0 auto;padding:88px 24px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start',
        )}
      >
        <div>
          <div style={s(eyebrow)}>Quick start</div>
          <h2
            id="qs-h"
            style={s(
              'font-size:32px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 22px',
            )}
          >
            Add your first component in seconds.
          </h2>
          <div
            role="tablist"
            aria-label="Package manager"
            style={s(
              'display:inline-flex;gap:4px;padding:4px;border-radius:11px;background:var(--surface);border:1px solid var(--border);margin-bottom:18px',
            )}
          >
            {(['npm', 'pnpm', 'bun'] as Pkg[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={pkg === p}
                onClick={() => setPkg(p)}
                style={seg(pkg === p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={s('display:flex;flex-direction:column;gap:12px')}>
            {qsSteps.map(([n, cmd, id]) => (
              <div
                key={id}
                style={s(
                  'display:flex;align-items:center;gap:12px;background:#0c0d10;border:1px solid #20232a;border-radius:12px;padding:14px 16px',
                )}
              >
                <span
                  aria-hidden="true"
                  style={s(`color:#6b727c;font-family:${mono};font-size:14px`)}
                >
                  {n}
                </span>
                <code
                  style={s(
                    `flex:1;font-family:${mono};font-size:13.5px;color:#e6edf3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                  )}
                >
                  {cmd}
                </code>
                <button
                  type="button"
                  onClick={() => copy(cmd, id)}
                  aria-label="Copy command"
                  className="hov-fg"
                  style={s(
                    'flex:none;color:#8b949e;background:transparent;border:none;cursor:pointer;display:inline-flex',
                  )}
                >
                  <CopyIcon copied={copiedId === id} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* code examples */}
        <div
          id="code"
          style={s('scroll-margin-top:80px;display:flex;flex-direction:column;gap:18px')}
        >
          <div
            style={s(
              'background:#0c0d10;border:1px solid #20232a;border-radius:14px;overflow:hidden',
            )}
          >
            <div
              style={s(
                'display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid #1c1f25',
              )}
            >
              <span style={s(`font-family:${mono};font-size:12px;color:#6b727c`)}>
                async-state.ts
              </span>
            </div>
            <pre
              style={s(
                `margin:0;padding:16px;overflow-x:auto;font-family:${mono};font-size:12.5px;line-height:1.7`,
              )}
            >
              <code>
                <span style={{ color: '#ff7b72' }}>export type </span>
                <span style={{ color: '#d2a8ff' }}>AsyncState</span>
                <span style={{ color: '#e6edf3' }}>{'<T> ='}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'  | { '}</span>
                <span style={{ color: '#79c0ff' }}>status</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#a5d6ff' }}>&quot;idle&quot;</span>
                <span style={{ color: '#e6edf3' }}>{' }'}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'  | { '}</span>
                <span style={{ color: '#79c0ff' }}>status</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#a5d6ff' }}>&quot;loading&quot;</span>
                <span style={{ color: '#e6edf3' }}>{' }'}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'  | { '}</span>
                <span style={{ color: '#79c0ff' }}>status</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#a5d6ff' }}>&quot;empty&quot;</span>
                <span style={{ color: '#e6edf3' }}>{' }'}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'  | { '}</span>
                <span style={{ color: '#79c0ff' }}>status</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#a5d6ff' }}>&quot;error&quot;</span>
                <span style={{ color: '#e6edf3' }}>; </span>
                <span style={{ color: '#79c0ff' }}>error</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#d2a8ff' }}>Error</span>
                <span style={{ color: '#e6edf3' }}>; </span>
                <span style={{ color: '#79c0ff' }}>retry</span>
                <span style={{ color: '#e6edf3' }}>: () =&gt; </span>
                <span style={{ color: '#ff7b72' }}>void</span>
                <span style={{ color: '#e6edf3' }}>{' }'}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'  | { '}</span>
                <span style={{ color: '#79c0ff' }}>status</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#a5d6ff' }}>&quot;success&quot;</span>
                <span style={{ color: '#e6edf3' }}>; </span>
                <span style={{ color: '#79c0ff' }}>data</span>
                <span style={{ color: '#e6edf3' }}>: </span>
                <span style={{ color: '#d2a8ff' }}>T</span>
                <span style={{ color: '#e6edf3' }}>{' };'}</span>
              </code>
            </pre>
          </div>
          <div
            style={s(
              'background:#0c0d10;border:1px solid #20232a;border-radius:14px;overflow:hidden',
            )}
          >
            <div
              style={s(
                'display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid #1c1f25',
              )}
            >
              <span style={s(`font-family:${mono};font-size:12px;color:#6b727c`)}>users.tsx</span>
            </div>
            <pre
              style={s(
                `margin:0;padding:16px;overflow-x:auto;font-family:${mono};font-size:12.5px;line-height:1.7`,
              )}
            >
              <code>
                <span style={{ color: '#e6edf3' }}>{'<'}</span>
                <span style={{ color: '#7ee787' }}>DataList</span>
                <span style={{ color: '#e6edf3' }}> </span>
                <span style={{ color: '#79c0ff' }}>state</span>
                <span style={{ color: '#e6edf3' }}>{'={users} '}</span>
                <span style={{ color: '#79c0ff' }}>label</span>
                <span style={{ color: '#e6edf3' }}>=</span>
                <span style={{ color: '#a5d6ff' }}>&quot;Users&quot;</span>
                <span style={{ color: '#e6edf3' }}> </span>
                <span style={{ color: '#79c0ff' }}>getKey</span>
                <span style={{ color: '#e6edf3' }}>{'={(u) => u.id}>'}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'  {(u) => <'}</span>
                <span style={{ color: '#7ee787' }}>UserRow</span>
                <span style={{ color: '#e6edf3' }}> </span>
                <span style={{ color: '#79c0ff' }}>user</span>
                <span style={{ color: '#e6edf3' }}>{'={u} />}'}</span>
                {'\n'}
                <span style={{ color: '#e6edf3' }}>{'</'}</span>
                <span style={{ color: '#7ee787' }}>DataList</span>
                <span style={{ color: '#e6edf3' }}>{'>'}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ROADMAP TEASER */}
      <section
        id="roadmap"
        aria-labelledby="rm-h"
        style={s(
          'scroll-margin-top:80px;border-top:1px solid var(--border);background:var(--surface)',
        )}
      >
        <div style={s('max-width:1180px;margin:0 auto;padding:84px 24px')}>
          <div style={s(eyebrow)}>Roadmap</div>
          <h2
            id="rm-h"
            style={s(
              'font-size:34px;line-height:1.16;letter-spacing:-.02em;font-weight:600;margin:0 0 12px',
            )}
          >
            Six layers, building up.
          </h2>
          <p
            style={s(
              'font-size:16px;line-height:1.6;color:var(--muted);max-width:600px;margin:0 0 32px',
            )}
          >
            24 components, each layer composing the one beneath it.{' '}
            <strong style={s('color:var(--foreground);font-weight:600')}>
              {doneCount} shipped
            </strong>
            , the rest mapped out.
          </p>
          <div
            data-grid3="1"
            style={s(
              'display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px',
            )}
          >
            {layerCards.map((lc) => (
              <Link
                key={lc.layer}
                href="/roadmap"
                className="hov-border"
                style={s(
                  'display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:14px;border:1px solid var(--border);background:var(--background)',
                )}
              >
                <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                  <span style={s(`font-family:${mono};font-size:12px;color:var(--accent-fg)`)}>
                    L{lc.layer}
                  </span>
                  <span style={s(`font-family:${mono};font-size:11.5px;color:var(--muted-2)`)}>
                    {lc.summary}
                  </span>
                </div>
                <div style={s('font-size:15px;font-weight:600')}>{lc.name}</div>
                <div aria-hidden="true" style={s('display:flex;gap:4px;margin-top:2px')}>
                  {lc.dots.map((dt) => (
                    <span
                      key={dt.name}
                      style={{
                        width: '100%',
                        height: '5px',
                        borderRadius: '999px',
                        background: dt.color,
                      }}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/roadmap"
            className="hov-dim"
            style={s(
              'display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border-radius:11px;background:var(--primary);color:var(--primary-foreground);font-weight:600;font-size:14.5px',
            )}
          >
            See the full roadmap
            <Arrow />
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
