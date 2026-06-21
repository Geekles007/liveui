'use client';

import { SiteChrome } from '@/components/site-chrome';
import { s } from '@/lib/style';
import Link from 'next/link';
import { useState } from 'react';

const diffs = [
  {
    tag: '01',
    title: 'State-complete by construction',
    body: 'Every component speaks one contract — AsyncState<T> with five states: idle, loading, empty, error, success. You write only the happy path; skeletons, empty slots, retries and screen-reader announcements come for free.',
  },
  {
    tag: '02',
    title: 'Upgradeable copy-paste',
    body: 'liveui add writes a lockfile with a fingerprint per file. liveui upgrade updates files you have not touched and never clobbers your edits — conflicts land as *.new for you to merge.',
  },
  {
    tag: '03',
    title: 'Accessible & AI-native',
    body: 'Every component ships an axe test that fails the build on regression, and a machine-readable manifest so liveui gen can suggest the right components for a task.',
  },
];

export default function Home() {
  const [copied, setCopied] = useState(false);
  const cmd = 'npx liveui add data-list';
  const copy = () => {
    try {
      navigator.clipboard.writeText(cmd);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <SiteChrome current="home">
      {/* HERO */}
      <section
        style={s(
          'max-width:1280px;margin:0 auto;padding:96px 24px 72px;display:flex;flex-direction:column;align-items:center;text-align:center',
        )}
      >
        <div
          style={s(
            "display:inline-flex;align-items:center;gap:8px;padding:5px 13px;border-radius:999px;border:1px solid var(--border);background:var(--surface);font-size:12.5px;color:var(--muted);font-family:'Geist Mono',monospace;margin-bottom:26px",
          )}
        >
          <span
            aria-hidden="true"
            style={s(
              'width:7px;height:7px;border-radius:50%;background:var(--primary);animation:pulse 1.8s ease-in-out infinite',
            )}
          />
          registry-as-code · React + Tailwind
        </div>
        <h1
          style={s(
            'font-size:56px;line-height:1.04;letter-spacing:-.035em;font-weight:600;margin:0 0 22px;max-width:840px',
          )}
        >
          Components that handle the parts you always forget.
        </h1>
        <p
          style={s(
            'font-size:19px;line-height:1.6;color:var(--muted);max-width:620px;margin:0 0 36px',
          )}
        >
          Own the code like shadcn — but with every async state, verified accessibility, and an
          upgrade path that survives your edits.
        </p>
        <div
          style={s(
            'display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center',
          )}
        >
          <button
            type="button"
            onClick={copy}
            aria-label="Copy install command"
            className="hov-accent"
            style={s(
              'display:flex;align-items:center;gap:12px;background:#0c0d10;border:1px solid #20232a;border-radius:11px;padding:13px 16px;cursor:pointer',
            )}
          >
            <span style={s("color:#6b727c;font-family:'Geist Mono',monospace;font-size:14px")}>
              $
            </span>
            <code style={s("font-family:'Geist Mono',monospace;font-size:13.5px;color:#e6edf3")}>
              {cmd}
            </code>
            <span style={s('color:var(--accent-fg);display:inline-flex')}>
              {copied ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
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
                  stroke="#8b949e"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="12" height="12" rx="2.5" />
                  <path d="M5 15V5a2 2 0 012-2h10" />
                </svg>
              )}
            </span>
          </button>
          <Link
            href="/components"
            style={s(
              'display:inline-flex;align-items:center;gap:8px;padding:13px 20px;border-radius:11px;background:var(--primary);color:var(--primary-foreground);font-size:14.5px;font-weight:600',
            )}
          >
            Browse components →
          </Link>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={s('max-width:760px;margin:0 auto;padding:0 24px 72px;text-align:center')}>
        <p style={s('font-size:17px;line-height:1.7;color:var(--muted)')}>
          shadcn gave you the code. But you still re-implement loading, empty and error states in
          every project, accessibility goes unchecked, and you can never upgrade what you copied.{' '}
          <strong style={s('color:var(--foreground);font-weight:600')}>
            liveui fixes all three.
          </strong>
        </p>
      </section>

      {/* DIFFERENTIATORS */}
      <section id="how" style={s('max-width:1280px;margin:0 auto;padding:0 24px 40px')}>
        <div
          style={s(
            'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px',
          )}
        >
          {diffs.map((dd) => (
            <div
              key={dd.tag}
              style={s(
                'background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px',
              )}
            >
              <div
                style={s(
                  "font-family:'Geist Mono',monospace;font-size:12px;color:var(--accent-fg);margin-bottom:14px",
                )}
              >
                {dd.tag}
              </div>
              <h2 style={s('font-size:19px;font-weight:600;letter-spacing:-.02em;margin:0 0 10px')}>
                {dd.title}
              </h2>
              <p style={s('font-size:14.5px;line-height:1.65;color:var(--muted);margin:0')}>
                {dd.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK START */}
      <section id="quickstart" style={s('max-width:760px;margin:0 auto;padding:56px 24px 96px')}>
        <h2
          style={s(
            "font-size:13px;font-family:'Geist Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--accent-fg);margin:0 0 16px;text-align:center",
          )}
        >
          Quick start
        </h2>
        <div
          style={s(
            'background:#0c0d10;border:1px solid #20232a;border-radius:14px;overflow:hidden',
          )}
        >
          <div
            style={s(
              "padding:11px 16px;border-bottom:1px solid #1c1f25;font-family:'Geist Mono',monospace;font-size:11.5px;color:#6b727c",
            )}
          >
            terminal
          </div>
          <pre
            style={s(
              "padding:18px;overflow-x:auto;font-family:'Geist Mono',monospace;font-size:13px;line-height:1.8;color:#e6edf3;white-space:pre",
            )}
          >{`$ npx liveui list
$ npx liveui add data-list
$ npx liveui upgrade        # keeps your local edits`}</pre>
        </div>
        <p style={s('text-align:center;margin:22px 0 0;font-size:14px;color:var(--muted)')}>
          Then read the{' '}
          <Link href="/components" style={s('color:var(--accent-fg)')}>
            component docs
          </Link>{' '}
          or the{' '}
          <Link href="/roadmap" style={s('color:var(--accent-fg)')}>
            roadmap
          </Link>
          .
        </p>
      </section>
    </SiteChrome>
  );
}
