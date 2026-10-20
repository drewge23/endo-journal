import { useState } from 'react';
import { SearchIcon } from '../components/Icons';
import { useCycles } from '../lib/hooks';
import { EVIDENCE, LIBRARY, type Category, type Evidence, type Method } from '../lib/library';
import { uid, useStore } from '../lib/store';

const CATEGORIES: (Category | 'All')[] = ['All', 'Medical', 'Diet', 'Body & movement', 'Pain relief'];
const EV_COLORS: Record<Evidence, string> = {
  guideline: 'var(--good)',
  some: '#4f8fb8',
  limited: '#d9a23a',
  anecdotal: 'var(--dash)',
};

export default function Library() {
  const { data, update } = useStore();
  const { today } = useCycles();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'All'>('All');

  const inPlan = (m: Method) => data.plan.some((p) => p.libraryId === m.id && (!p.endDate || p.endDate >= today));
  const query = q.trim().toLowerCase();
  const list = LIBRARY.filter(
    (m) => (cat === 'All' || m.category === cat) && (!query || `${m.name} ${m.blurb} ${m.category}`.toLowerCase().includes(query)),
  );

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
    location.hash = '#/plan';
  };

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">Things people try for endometriosis</div>
          <h1>Library</h1>
        </div>
      </header>

      <div style={{ position: 'relative' }}>
        <label htmlFor="q" className="sr-only">Search methods</label>
        <span style={{ position: 'absolute', left: 14, top: 13, color: 'var(--muted)' }}><SearchIcon size={18} /></span>
        <input id="q" type="search" className="input" style={{ paddingLeft: 40, background: 'var(--surface)' }} placeholder="Search diet, supplements, therapy…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chips" style={{ gap: 6 }}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`chip ${cat === c ? 'on' : ''}`} style={{ minHeight: 38, fontSize: 13 }} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
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

      <div className="stack" style={{ gap: 10 }}>
        {list.length === 0 && <p className="small muted">No methods match “{q}”.</p>}
        {list.map((m) => (
          <article key={m.id} className="method-card">
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div className="stack" style={{ gap: 2 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>{m.name}</h2>
                <div className="tiny muted">{m.category}</div>
              </div>
              <span className={`tag square ev-${m.evidence}`}>{EVIDENCE[m.evidence].label}</span>
            </div>
            <p>{m.blurb}</p>
            <div className="between" style={{ alignItems: 'center' }}>
              <span className="tiny muted">Track: {m.track}</span>
              {inPlan(m) ? (
                <a href="#/plan" className="tag square good-tag" style={{ fontSize: 13, padding: '8px 12px', textDecoration: 'none' }}>In my plan</a>
              ) : (
                <button type="button" className="btn outline" style={{ minHeight: 38, fontSize: 13 }} onClick={() => add(m)}>Try as experiment</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="tiny muted" style={{ lineHeight: 1.5 }}>
        This library is for information, not medical advice. Discuss any change in medication, supplements or diet with your doctor.
      </p>
    </div>
  );
}
