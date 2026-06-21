'use client';

import { components, pages } from '@/lib/site-data';
import { s } from '@/lib/style';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'How it works', href: '/#how' },
  { label: 'Roadmap', href: '/roadmap' },
];

/** Shared header + footer + ⌘K palette + theme toggle for the non-docs pages. */
export function SiteChrome({ current, children }: { current: string; children: ReactNode }) {
  const router = useRouter();
  const paletteRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const list = (() => {
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
    const q = query.toLowerCase();
    return q
      ? all.filter((i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q))
      : all;
  })();

  const run = (it: { comp?: string; href?: string }) => {
    setOpen(false);
    if (it.comp) router.push(`/components#${it.comp}`);
    else if (it.href) router.push(it.href);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (open) setTimeout(() => paletteRef.current?.focus(), 25);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setIndex(0);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => (i + 1 + list.length) % list.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => (i - 1 + list.length) % list.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = list[index];
        if (it) run(it);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isLight = theme === 'light';

  return (
    <div
      style={s(
        'min-height:100vh;width:100%;background:var(--background);color:var(--foreground);position:relative',
      )}
    >
      <a
        href="#main"
        style={s(
          'position:absolute;left:12px;top:-60px;z-index:200;background:var(--primary);color:var(--primary-foreground);padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px',
        )}
      >
        Skip to content
      </a>

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
            liveui
          </Link>
          <div
            style={s('display:none;align-items:center;gap:4px;margin-left:8px')}
            data-nav="desktop"
          >
            {navItems.map((n) => {
              const active = n.label.toLowerCase() === current;
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={active ? undefined : 'hov-surface'}
                  style={s(
                    `padding:7px 11px;border-radius:7px;font-size:14px;color:${active ? 'var(--foreground)' : 'var(--muted)'};${active ? 'background:var(--surface)' : ''}`,
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div style={s('margin-left:auto;display:flex;align-items:center;gap:8px')}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open command palette"
              className="hov-border"
              style={s(
                'display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer',
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
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
              href="https://github.com/Geekles007/liveui"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="liveui on GitHub"
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

      <main id="main">{children}</main>

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
            liveui
          </div>
          <div
            style={s("font-size:12.5px;color:var(--muted-2);font-family:'Geist Mono',monospace")}
          >
            MIT · © Geekles007
          </div>
          <div style={s('display:flex;gap:18px;font-size:13.5px')}>
            <a
              href="https://github.com/Geekles007/liveui"
              target="_blank"
              rel="noreferrer noopener"
              className="hov-fg"
              style={s('color:var(--muted)')}
            >
              GitHub
            </a>
            <Link href="/components" className="hov-fg" style={s('color:var(--muted)')}>
              Components
            </Link>
            <Link href="/roadmap" className="hov-fg" style={s('color:var(--muted)')}>
              Roadmap
            </Link>
          </div>
        </div>
      </footer>

      {open && (
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
            onClick={() => setOpen(false)}
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
              </span>
              <input
                ref={paletteRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
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
              {list.length === 0 && (
                <div
                  style={s('padding:28px;text-align:center;color:var(--muted-2);font-size:14px')}
                >
                  No matches.
                </div>
              )}
              {list.map((pi, i) => (
                <button
                  key={`${pi.label}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === index}
                  onClick={() => run(pi)}
                  onMouseEnter={() => setIndex(i)}
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
                    background: i === index ? 'var(--surface-2)' : 'transparent',
                    border: `1px solid ${i === index ? 'var(--border-strong)' : 'transparent'}`,
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
