'use client';

import { SiteChrome } from '@/components/site-chrome';
import { type Status, components, layerNames } from '@/lib/site-data';
import { s } from '@/lib/style';
import Link from 'next/link';

const statusDot: Record<Status, string> = {
  done: 'var(--primary)',
  next: 'var(--warning)',
  planned: 'var(--border-strong)',
};
const statusLabel: Record<Status, string> = { done: 'Shipped', next: 'Next', planned: 'Planned' };

const cardStyle = s(
  'display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px',
);

function CardInner({ c }: { c: (typeof components)[number] }) {
  const labelColor =
    c.status === 'done'
      ? 'var(--accent-fg)'
      : c.status === 'next'
        ? 'var(--warning)'
        : 'var(--muted-2)';
  return (
    <>
      <div style={s('display:flex;align-items:center;gap:9px')}>
        <span
          aria-hidden="true"
          style={{
            flex: 'none',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusDot[c.status],
          }}
        />
        <span style={s("font-family:'Geist Mono',monospace;font-size:14px;font-weight:500")}>
          {c.name}
        </span>
      </div>
      <span style={s(`font-size:11px;font-family:'Geist Mono',monospace;color:${labelColor}`)}>
        {statusLabel[c.status]}
      </span>
    </>
  );
}

export default function RoadmapPage() {
  const total = components.length;
  const done = components.filter((c) => c.status === 'done').length;
  const next = components.filter((c) => c.status === 'next').length;
  const pct = Math.round((done / total) * 100);

  const layerIds = [...new Set(components.map((c) => c.layer))].sort((a, b) => a - b);
  const layers = layerIds.map((L) => ({
    layer: L,
    name: layerNames[L],
    items: components.filter((c) => c.layer === L),
  }));

  const stats = [
    { n: done, label: 'Shipped' },
    { n: next, label: 'In progress' },
    { n: total - done - next, label: 'Planned' },
    { n: total, label: 'Total' },
  ];

  return (
    <SiteChrome current="roadmap">
      <div style={s('max-width:1080px;margin:0 auto;padding:56px 24px 96px')}>
        <h1
          style={s(
            'font-size:40px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0 0 12px',
          )}
        >
          Roadmap
        </h1>
        <p
          style={s(
            'font-size:18px;line-height:1.6;color:var(--muted);max-width:640px;margin:0 0 32px',
          )}
        >
          {total} components across {layerIds.length} layers. Each ships state-complete, with an axe
          test and an AI manifest. Shipped ones link into the docs.
        </p>

        {/* progress */}
        <div
          style={s(
            'background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:18px',
          )}
        >
          <div
            style={s(
              'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px',
            )}
          >
            <span style={s("font-family:'Geist Mono',monospace;font-size:13px;color:var(--muted)")}>
              Overall progress
            </span>
            <span
              style={s("font-family:'Geist Mono',monospace;font-size:13px;color:var(--accent-fg)")}
            >
              {pct}%
            </span>
          </div>
          <div
            style={s('height:8px;border-radius:999px;background:var(--surface-2);overflow:hidden')}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'var(--primary)',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>

        {/* stats */}
        <div
          style={s(
            'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:40px',
          )}
          data-grid2="1"
        >
          {stats.map((st) => (
            <div
              key={st.label}
              style={s(
                'background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px',
              )}
            >
              <div
                style={s(
                  "font-size:30px;font-weight:600;font-family:'Geist Mono',monospace;letter-spacing:-.02em",
                )}
              >
                {st.n}
              </div>
              <div style={s('font-size:13px;color:var(--muted);margin-top:2px')}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* layers */}
        <div style={s('display:flex;flex-direction:column;gap:34px')}>
          {layers.map((g) => (
            <section key={g.layer} aria-labelledby={`layer-${g.layer}`}>
              <h2
                id={`layer-${g.layer}`}
                style={s(
                  "font-family:'Geist Mono',monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);margin:0 0 14px",
                )}
              >
                Layer {g.layer} · {g.name}
              </h2>
              <div
                style={s(
                  'display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px',
                )}
              >
                {g.items.map((c) =>
                  c.status === 'done' ? (
                    <Link
                      key={c.name}
                      href={`/components#${c.name}`}
                      className="hov-border"
                      style={cardStyle}
                    >
                      <CardInner c={c} />
                    </Link>
                  ) : (
                    <div key={c.name} style={cardStyle}>
                      <CardInner c={c} />
                    </div>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SiteChrome>
  );
}
