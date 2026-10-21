import { useState } from 'react';
import { SearchIcon } from '../components/Icons';
import { KindIcon } from '../components/kinds';
import { useCycles } from '../lib/hooks';
import { EVIDENCE, LIBRARY, type Evidence, type Method } from '../lib/library';
import { uid, useStore } from '../lib/store';
import { KINDS, type PlanKind } from '../lib/types';

const EV_COLORS: Record<Evidence, string> = {
  guideline: 'var(--good)',
  some: 'var(--blue)',
  limited: 'var(--amber)',
  anecdotal: 'var(--dash)',
};

export default function Library() {
  const { data, update } = useStore();
  const { today } = useCycles();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<PlanKind | 'all'>('all');

  const inRoutine = (m: Method) => data.plan.some((p) => p.libraryId === m.id && (!p.endDate || p.endDate >= today));
  const query = q.trim().toLowerCase();
  const matches = (m: Method) => !query || `${m.name} ${m.blurb} ${m.track} ${m.watch ?? ''}`.toLowerCase().includes(query);

  const add = (m: Method) => {
    update((d) => ({
      ...d,
      plan: [
        ...d.plan,
        {
          id: uid(),
          name: m.name,
          kind: m.kind,
          detail: m.defaultDetail,
          startDate: today,
          endDate: null,
          asNeeded: !!m.asNeeded,
          painkiller: !!m.painkiller,
          watch: m.watch ?? '',
          libraryId: m.id,
        },
      ],
    }));
    location.hash = '#/routine';
  };

  const groups = KINDS.filter((k) => cat === 'all' || cat === k.id)
    .map((k) => ({ ...k, list: LIBRARY.filter((m) => m.kind === k.id && matches(m)) }))
    .filter((g) => g.list.length);

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">{LIBRARY.length} things people try for endometriosis</div>
          <h1>Library</h1>
        </div>
      </header>

      <div style={{ position: 'relative' }}>
        <label htmlFor="q" className="sr-only">Search methods</label>
        <span style={{ position: 'absolute', left: 14, top: 13, color: 'var(--muted)' }}><SearchIcon size={18} /></span>
        <input id="q" type="search" className="input" style={{ paddingLeft: 40, background: 'var(--surface)' }} placeholder="Search e.g. LED, magnesium, yoga…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chips" style={{ gap: 6 }} role="group" aria-label="Category">
        {[{ id: 'all' as const, label: 'All' }, ...KINDS].map((c) => (
          <button key={c.id} type="button" className={`chip ${cat === c.id ? 'on' : ''}`} style={{ minHeight: 38, fontSize: 13 }} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="card tight" style={{ padding: '12px 14px' }}>
        <div className="tiny" style={{ fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>How strong is the evidence?</div>
        <div className="grid2 tiny" style={{ gap: '6px 12px' }}>
          {(Object.keys(EVIDENCE) as Evidence[]).map((e) => (
            <span key={e} className="row" style={{ gap: 6 }}><i className="sw" style={{ background: EV_COLORS[e] }} />{EVIDENCE[e].long}</span>
          ))}
        </div>
      </div>

      {groups.length === 0 && <p className="small muted">Nothing matches “{q}”.</p>}
      {groups.map((g) => (
        <section key={g.id} className="stack" style={{ gap: 10 }} aria-labelledby={`lh-${g.id}`}>
          <div className={`kind-head k-${g.id}`} style={{ padding: '6px 2px 0' }}>
            <span className="kind-icon"><KindIcon kind={g.id} size={18} /></span>
            <h2 id={`lh-${g.id}`} style={{ flex: 1, fontSize: 14 }}>{g.label}</h2>
          </div>
          {g.list.map((m) => (
            <article key={m.id} className={`method-card k-${m.kind}`}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{m.name}</h3>
                <span className={`tag square ev-${m.evidence}`}>{EVIDENCE[m.evidence].label}</span>
              </div>
              <p>{m.blurb}</p>
              {m.watch && m.kind === 'medication' && <p className="tiny" style={{ color: 'var(--k-ink)' }}>Common side effects: {m.watch}</p>}
              <div className="between" style={{ alignItems: 'center' }}>
                <span className="tiny muted">Track: {m.track}</span>
                {inRoutine(m) ? (
                  <a href="#/routine" className="tag square good-tag" style={{ fontSize: 13, padding: '8px 12px', textDecoration: 'none' }}>In my routine</a>
                ) : (
                  <button type="button" className="btn outline" style={{ minHeight: 38, fontSize: 13 }} onClick={() => add(m)}>Add to routine</button>
                )}
              </div>
            </article>
          ))}
        </section>
      ))}

      <p className="tiny muted" style={{ lineHeight: 1.5 }}>
        This library is for information, not medical advice. Discuss any change in medication, supplements or diet with your doctor.
      </p>
    </div>
  );
}
