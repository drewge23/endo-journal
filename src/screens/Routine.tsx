import { useState } from 'react';
import { InfoIcon, PlusIcon, XIcon } from '../components/Icons';
import { KindIcon } from '../components/kinds';
import { cycleDay, seedPhase } from '../lib/cycle';
import { addDays, formatDate, rangeDays } from '../lib/dates';
import { SEEDS, useCycles } from '../lib/hooks';
import { EVIDENCE, LIBRARY } from '../lib/library';
import { uid, useStore } from '../lib/store';
import { KINDS, type PlanItem, type PlanKind } from '../lib/types';

export function focusInsights(id: string) {
  try {
    sessionStorage.setItem('insights-item', id);
  } catch {
    // only a convenience
  }
}

export default function Routine() {
  const { data, update } = useStore();
  const { cycles, today, cycleLength } = useCycles();
  const [filter, setFilter] = useState<PlanKind | 'all'>('all');
  const [editing, setEditing] = useState<PlanItem | 'new' | null>(null);
  const [avoid, setAvoid] = useState('');

  const active = data.plan.filter((p) => !p.endDate || p.endDate >= today);
  const past = data.plan.filter((p) => p.endDate && p.endDate < today);
  const last7 = rangeDays(addDays(today, -6), today);
  const day = cycleDay(today, cycles);

  const save = (item: PlanItem) => {
    update((d) => ({ ...d, plan: d.plan.some((p) => p.id === item.id) ? d.plan.map((p) => (p.id === item.id ? item : p)) : [...d.plan, item] }));
    setEditing(null);
  };
  const stop = (item: PlanItem) =>
    update((d) => ({ ...d, plan: d.plan.map((p) => (p.id === item.id ? { ...p, endDate: addDays(today, -1) < p.startDate ? p.startDate : addDays(today, -1) } : p)) }));
  const resume = (item: PlanItem) => update((d) => ({ ...d, plan: d.plan.map((p) => (p.id === item.id ? { ...p, endDate: null } : p)) }));
  const remove = (item: PlanItem) => {
    if (!confirm(`Delete “${item.name}”? Days you already marked it will lose the link.`)) return;
    update((d) => ({ ...d, plan: d.plan.filter((p) => p.id !== item.id) }));
    setEditing(null);
  };

  const kinds = KINDS.filter((k) => filter === 'all' || filter === k.id);

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">What I take and do</div>
          <h1>My routine</h1>
        </div>
        <button type="button" className="btn primary pill" onClick={() => setEditing('new')}>
          <PlusIcon size={16} /> Add
        </button>
      </header>

      {editing && (
        <RoutineForm
          initial={editing === 'new' ? null : editing}
          defaultKind={filter === 'all' ? 'medication' : filter}
          today={today}
          onSave={save}
          onCancel={() => setEditing(null)}
          onDelete={editing !== 'new' ? () => remove(editing) : undefined}
        />
      )}

      <div className="chips" style={{ gap: 6 }} role="group" aria-label="Show">
        {[{ id: 'all' as const, label: 'All' }, ...KINDS].map((k) => (
          <button key={k.id} type="button" className={`chip ${filter === k.id ? 'on' : ''}`} style={{ minHeight: 38, fontSize: 13 }} aria-pressed={filter === k.id} onClick={() => setFilter(k.id)}>
            {k.label}
          </button>
        ))}
      </div>

      {active.length === 0 && !editing && filter === 'all' && (
        <section className="card">
          <h2>Nothing here yet</h2>
          <p className="small muted">Add the medications you take, and any supplement, habit or therapy you want to test. Or pick one from the <a href="#/library">Library</a>.</p>
        </section>
      )}

      {kinds.map((k) => {
        const list = active.filter((p) => p.kind === k.id);
        const showAvoid = k.id === 'diet';
        if (!list.length && filter === 'all' && !(showAvoid && data.avoiding.length)) return null;
        return (
          <section key={k.id} className={`kind-card k-${k.id}`} aria-labelledby={`kh-${k.id}`}>
            <div className="kind-head" style={{ padding: '2px 4px 4px' }}>
              <span className="kind-icon"><KindIcon kind={k.id} size={18} /></span>
              <h2 id={`kh-${k.id}`} style={{ flex: 1, fontSize: 15 }}>{k.label}</h2>
              <span className="num" style={{ letterSpacing: 0 }}>{list.length}</span>
            </div>
            {!list.length && (
              <p className="small" style={{ color: 'var(--k-ink)', padding: '0 4px 6px' }}>
                Nothing yet. <button type="button" className="linklike" onClick={() => setEditing('new')}>Add one</button> or <a href="#/library">browse the library</a>.
              </p>
            )}
            {list.map((m) => (
              <Item key={m.id} item={m} today={today} last7={last7} seedDay={day} cycleLength={cycleLength} cycles={cycles.filter((c) => c.start >= m.startDate).length} onEdit={() => setEditing(m)} onStop={() => stop(m)} />
            ))}
            {showAvoid && (
              <div className="item stack" style={{ gap: 8 }}>
                <div className="small" style={{ fontWeight: 700 }}>I’m avoiding</div>
                {data.avoiding.length > 0 && (
                  <div className="chips" style={{ gap: 6 }}>
                    {data.avoiding.map((a) => (
                      <span key={a} className="tag kind" style={{ fontSize: 13, padding: '4px 4px 4px 10px', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        {a}
                        <button type="button" aria-label={`Remove ${a}`} onClick={() => update((d) => ({ ...d, avoiding: d.avoiding.filter((x) => x !== a) }))} style={{ border: 0, background: 'none', display: 'flex', padding: 4, color: 'inherit' }}>
                          <XIcon size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <form className="row" onSubmit={(e) => { e.preventDefault(); const v = avoid.trim(); if (v && !data.avoiding.includes(v)) update((d) => ({ ...d, avoiding: [...d.avoiding, v] })); setAvoid(''); }}>
                  <label className="sr-only" htmlFor="avoid">Food or drink to avoid</label>
                  <input id="avoid" className="input" placeholder="e.g. Gluten, dairy, alcohol" value={avoid} onChange={(e) => setAvoid(e.target.value)} />
                  <button type="submit" className="btn">Add</button>
                </form>
              </div>
            )}
          </section>
        );
      })}

      {past.length > 0 && (
        <details className="card tight">
          <summary style={{ fontWeight: 700, cursor: 'pointer', minHeight: 32 }}>Stopped ({past.length})</summary>
          {past.map((p) => (
            <div key={p.id} className="list-row" style={{ alignItems: 'center' }}>
              <span className={`kind-icon k-${p.kind}`}><KindIcon kind={p.kind} size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="tiny muted">{formatDate(p.startDate)} – {formatDate(p.endDate!)}</div>
              </div>
              <a href="#/insights" className="btn" style={{ minHeight: 36, fontSize: 13 }} onClick={() => focusInsights(p.id)}>Effect</a>
              <button type="button" className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => resume(p)}>Resume</button>
            </div>
          ))}
        </details>
      )}

      <div className="row tiny muted" style={{ alignItems: 'flex-start', gap: 10, lineHeight: 1.5 }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}><InfoIcon size={16} /></span>
        <span>Change one thing at a time when you can — it makes the comparison in Insights much clearer. Talk to your doctor before starting or stopping medication.</span>
      </div>
    </div>
  );
}

function Item({ item: m, today, last7, seedDay, cycleLength, cycles, onEdit, onStop }: {
  item: PlanItem;
  today: string;
  last7: string[];
  seedDay: number | null;
  cycleLength: number;
  cycles: number;
  onEdit: () => void;
  onStop: () => void;
}) {
  const { data } = useStore();
  const lib = LIBRARY.find((l) => l.id === m.libraryId);
  const isSeeds = m.libraryId === 'seed-cycling';
  const phase = seedDay ? seedPhase(seedDay, cycleLength) : 1;
  const week = last7.filter((d) => d >= m.startDate);
  const doneWeek = week.filter((d) => data.entries[d]?.done.includes(m.id)).length;
  return (
    <div className="item stack" style={{ gap: 10 }}>
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <strong style={{ fontSize: 15 }}>{m.name}</strong>
          {m.detail && !isSeeds && <span className="small muted">{m.detail}</span>}
          <span className="tiny muted">
            {m.startDate > today ? `Starts ${formatDate(m.startDate)}` : `Since ${formatDate(m.startDate)}`}
            {cycles > 0 && ` · cycle ${cycles} on it`}
            {m.asNeeded && ' · when needed'}
          </span>
        </div>
        {lib && <span className={`tag square ev-${lib.evidence}`}>{EVIDENCE[lib.evidence].label}</span>}
      </div>
      {isSeeds && (
        <div className="grid2">
          {([1, 2] as const).map((n) => (
            <div key={n} className={`seed-box ${phase === n ? 'now' : ''}`}>
              <div className="tiny" style={{ fontWeight: 700, color: phase === n ? 'var(--k-ink)' : 'var(--muted)' }}>{phase === n ? 'NOW · ' : ''}{n === 1 ? 'Day 1 – ovulation' : 'Ovulation – period'}</div>
              <div className="small" style={{ fontWeight: 700 }}>{SEEDS[n]}</div>
              <div className="tiny muted">{m.detail}</div>
            </div>
          ))}
        </div>
      )}
      {m.watch && <div className="tiny" style={{ color: 'var(--k-ink)' }}>Watching for: {m.watch}</div>}
      {!m.asNeeded && week.length > 0 && (
        <div className="row" style={{ gap: 10 }}>
          <div className="week" aria-hidden="true">
            {week.map((d) => <span key={d} className={data.entries[d]?.done.includes(m.id) ? 'on' : ''} />)}
          </div>
          <span className="tiny muted">{doneWeek} of last {week.length} days</span>
        </div>
      )}
      <div className="row wrap" style={{ gap: 4 }}>
        <a href="#/insights" className="btn" style={{ minHeight: 36, fontSize: 13 }} onClick={() => focusInsights(m.id)}>Is it helping?</a>
        <button type="button" className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={onEdit}>Edit</button>
        <button type="button" className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={onStop}>Stop</button>
      </div>
    </div>
  );
}

function RoutineForm({ initial, defaultKind, today, onSave, onCancel, onDelete }: {
  initial: PlanItem | null;
  defaultKind: PlanKind;
  today: string;
  onSave: (p: PlanItem) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [p, setP] = useState<PlanItem>(
    initial ?? { id: uid(), name: '', kind: defaultKind, detail: '', startDate: today, endDate: null, asNeeded: false, painkiller: false, watch: '' },
  );
  const set = <K extends keyof PlanItem>(k: K, v: PlanItem[K]) => setP((x) => ({ ...x, [k]: v }));
  return (
    <form className="card sheet" onSubmit={(e) => { e.preventDefault(); if (p.name.trim()) onSave({ ...p, name: p.name.trim() }); }}>
      <div className="between">
        <h2>{initial ? 'Edit' : 'Add to my routine'}</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onCancel}><XIcon size={16} /></button>
      </div>
      <label className="field">
        Name
        <input className="input" required autoFocus placeholder="e.g. Dienogest 2 mg" value={p.name} onChange={(e) => set('name', e.target.value)} />
      </label>
      <div className="grid2">
        <label className="field">
          Type
          <select className="select" value={p.kind} onChange={(e) => set('kind', e.target.value as PlanKind)}>
            {KINDS.map((k) => <option key={k.id} value={k.id}>{k.one}</option>)}
          </select>
        </label>
        <label className="field">
          Started
          <input className="input" type="date" required value={p.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </label>
      </div>
      <label className="field">
        Dose / details
        <input className="input" placeholder="e.g. Daily, 08:00" value={p.detail} onChange={(e) => set('detail', e.target.value)} />
      </label>
      <label className="field">
        Side effects to watch for
        <input className="input" placeholder="e.g. spotting, mood, headache" value={p.watch} onChange={(e) => set('watch', e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={p.asNeeded} onChange={(e) => set('asNeeded', e.target.checked)} />
        Only when needed (not every day)
      </label>
      <label className="check">
        <input type="checkbox" checked={p.painkiller} onChange={(e) => set('painkiller', e.target.checked)} />
        Count as a painkiller dose in stats
      </label>
      <div className="row wrap">
        <button type="submit" className="btn primary">{initial ? 'Save' : 'Add to routine'}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        {onDelete && <button type="button" className="btn danger" style={{ marginLeft: 'auto' }} onClick={onDelete}>Delete</button>}
      </div>
    </form>
  );
}
