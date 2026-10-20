import { useState } from 'react';
import { InfoIcon, LeafIcon, PillIcon, PlusIcon, XIcon } from '../components/Icons';
import { cycleDay, cycleFor, seedPhase } from '../lib/cycle';
import { addDays, formatDate, rangeDays } from '../lib/dates';
import { SEEDS, useCycles } from '../lib/hooks';
import { LIBRARY, EVIDENCE } from '../lib/library';
import { uid, useStore } from '../lib/store';
import type { PlanItem, PlanKind } from '../lib/types';

type Tab = 'All' | 'Methods' | 'Meds' | 'Habits';

export function focusInsights(id: string) {
  try {
    sessionStorage.setItem('insights-item', id);
  } catch {
    // only a convenience
  }
}

export default function Plan() {
  const { data, update } = useStore();
  const { cycles, today, cycleLength } = useCycles();
  const [tab, setTab] = useState<Tab>('All');
  const [editing, setEditing] = useState<PlanItem | 'new' | null>(null);
  const [avoid, setAvoid] = useState('');

  const active = data.plan.filter((p) => !p.endDate || p.endDate >= today);
  const past = data.plan.filter((p) => p.endDate && p.endDate < today);
  const show = (k: PlanKind) => tab === 'All' || (tab === 'Methods' && k === 'method') || (tab === 'Meds' && k === 'medication') || (tab === 'Habits' && k === 'habit');

  const save = (item: PlanItem) => {
    update((d) => ({ ...d, plan: d.plan.some((p) => p.id === item.id) ? d.plan.map((p) => (p.id === item.id ? item : p)) : [...d.plan, item] }));
    setEditing(null);
  };
  const stop = (item: PlanItem) => update((d) => ({ ...d, plan: d.plan.map((p) => (p.id === item.id ? { ...p, endDate: addDays(today, -1) < p.startDate ? today : addDays(today, -1) } : p)) }));
  const resume = (item: PlanItem) => update((d) => ({ ...d, plan: d.plan.map((p) => (p.id === item.id ? { ...p, endDate: null } : p)) }));
  const remove = (item: PlanItem) => {
    if (!confirm(`Delete “${item.name}”? Days you already marked it will lose the link.`)) return;
    update((d) => ({ ...d, plan: d.plan.filter((p) => p.id !== item.id) }));
    setEditing(null);
  };

  const last7 = rangeDays(addDays(today, -6), today);
  const methods = active.filter((p) => p.kind === 'method');
  const meds = active.filter((p) => p.kind === 'medication');
  const habits = active.filter((p) => p.kind === 'habit');
  const day = cycleDay(today, cycles);

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">What I’m trying</div>
          <h1>My plan</h1>
        </div>
        <button type="button" className="btn primary pill" onClick={() => setEditing('new')}>
          <PlusIcon size={16} /> Add
        </button>
      </header>

      {editing && (
        <PlanForm
          initial={editing === 'new' ? null : editing}
          today={today}
          onSave={save}
          onCancel={() => setEditing(null)}
          onDelete={editing !== 'new' ? () => remove(editing) : undefined}
        />
      )}

      <div className="segmented" role="tablist" aria-label="Filter plan">
        {(['All', 'Methods', 'Meds', 'Habits'] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {active.length === 0 && !editing && (
        <section className="card">
          <h2>Nothing here yet</h2>
          <p className="small muted">Add the medications you take, and any method or habit you want to test. Or pick one from the <a href="#/library">Library</a>.</p>
        </section>
      )}

      {show('method') && methods.map((m) => {
        const lib = LIBRARY.find((l) => l.id === m.libraryId);
        const isSeeds = m.libraryId === 'seed-cycling';
        const sincePeriods = cycles.filter((c) => c.start >= m.startDate).length;
        const cur = cycleFor(today, cycles);
        const curDays = cur && cur.start >= m.startDate ? rangeDays(cur.start, today) : rangeDays(m.startDate > today ? today : m.startDate, today);
        const taken = curDays.filter((d) => data.entries[d]?.done.includes(m.id)).length;
        const phase = day ? seedPhase(day, cycleLength) : 1;
        return (
          <section key={m.id} className="card">
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div className="stack" style={{ gap: 4 }}>
                <span className="tag method" style={{ alignSelf: 'flex-start' }}>Method · experiment</span>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>{m.name}</h2>
                <div className="small muted">
                  Started {formatDate(m.startDate)}{sincePeriods > 0 ? ` · cycle ${sincePeriods} on it` : ''}
                </div>
              </div>
              {lib && <span className={`tag square ev-${lib.evidence}`}>{EVIDENCE[lib.evidence].label}</span>}
            </div>
            {isSeeds && (
              <div className="grid2">
                <div className={`seed-box ${phase === 1 ? 'now' : ''}`}>
                  <div className="tiny" style={{ fontWeight: 700, color: phase === 1 ? 'var(--accent)' : 'var(--muted)' }}>{phase === 1 ? 'NOW · ' : ''}Day 1 – ovulation</div>
                  <div className="small" style={{ fontWeight: 700 }}>{SEEDS[1]}</div>
                  <div className="tiny muted">{m.detail}</div>
                </div>
                <div className={`seed-box ${phase === 2 ? 'now' : ''}`}>
                  <div className="tiny" style={{ fontWeight: 700, color: phase === 2 ? 'var(--accent)' : 'var(--muted)' }}>{phase === 2 ? 'NOW · ' : ''}Ovulation – period</div>
                  <div className="small" style={{ fontWeight: 700 }}>{SEEDS[2]}</div>
                  <div className="tiny muted">{m.detail}</div>
                </div>
              </div>
            )}
            {!isSeeds && <p className="small muted">{m.detail}</p>}
            {!m.asNeeded && (
              <div className="stack" style={{ gap: 6 }}>
                <div className="between small"><span className="muted">Done this cycle</span><strong className="num">{taken} / {curDays.length} days</strong></div>
                <div className="progress"><div style={{ width: `${curDays.length ? (taken / curDays.length) * 100 : 0}%` }} /></div>
              </div>
            )}
            <div className="row wrap">
              <a href="#/insights" className="btn" style={{ flex: 1 }} onClick={() => focusInsights(m.id)}>See if it’s helping →</a>
              <button type="button" className="btn ghost" onClick={() => setEditing(m)}>Edit</button>
              <button type="button" className="btn ghost" onClick={() => stop(m)}>Stop</button>
            </div>
          </section>
        );
      })}

      {show('medication') && meds.length > 0 && (
        <section className="card tight">
          <h2>Medications</h2>
          <div>
            {meds.map((m) => (
              <div key={m.id} className="list-row">
                <div className="pill-icon" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}><PillIcon size={20} /></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <div className="between"><strong>{m.name}</strong><span className="small muted">{m.asNeeded ? 'as needed' : `since ${formatDate(m.startDate)}`}</span></div>
                  <div className="small muted">{m.detail}</div>
                  {m.watch && <div className="tiny" style={{ color: 'var(--accent-tint-ink)' }}>Watching for: {m.watch}</div>}
                  <div className="row" style={{ gap: 4, marginTop: 4 }}>
                    <a href="#/insights" className="btn" style={{ minHeight: 36, fontSize: 13 }} onClick={() => focusInsights(m.id)}>Effect</a>
                    <button type="button" className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => setEditing(m)}>Edit</button>
                    <button type="button" className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => stop(m)}>Stop</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {show('habit') && (habits.length > 0 || tab !== 'All' || data.avoiding.length > 0) && (
        <section className="card">
          <h2>Habits &amp; eating</h2>
          <div className="stack">
            {habits.map((h) => {
              const done = last7.filter((d) => data.entries[d]?.done.includes(h.id)).length;
              return (
                <div key={h.id} className="row" style={{ gap: 12 }}>
                  <button type="button" onClick={() => setEditing(h)} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, background: 'none', border: 0, textAlign: 'left', padding: 0, minHeight: 44, justifyContent: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{h.name}</span>
                    <span className="tiny muted">{h.detail}</span>
                  </button>
                  <div className="week" aria-label={`${done} of last 7 days`}>
                    {last7.map((d) => <span key={d} className={data.entries[d]?.done.includes(h.id) ? 'on' : ''} />)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="stack" style={{ gap: 8, paddingTop: 6, borderTop: '1px solid var(--line-soft)' }}>
            <div className="small" style={{ fontWeight: 700, color: 'var(--muted)' }}>I’m avoiding</div>
            <div className="chips">
              {data.avoiding.map((a) => (
                <span key={a} className="tag habit" style={{ fontSize: 13, padding: '4px 4px 4px 10px', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  {a}
                  <button type="button" aria-label={`Remove ${a}`} onClick={() => update((d) => ({ ...d, avoiding: d.avoiding.filter((x) => x !== a) }))} style={{ border: 0, background: 'none', display: 'flex', padding: 4, color: 'inherit' }}>
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
            <form className="row" onSubmit={(e) => { e.preventDefault(); const v = avoid.trim(); if (v && !data.avoiding.includes(v)) update((d) => ({ ...d, avoiding: [...d.avoiding, v] })); setAvoid(''); }}>
              <label className="sr-only" htmlFor="avoid">Food or drink to avoid</label>
              <input id="avoid" className="input" placeholder="e.g. Gluten, dairy, alcohol" value={avoid} onChange={(e) => setAvoid(e.target.value)} />
              <button type="submit" className="btn">Add</button>
            </form>
          </div>
        </section>
      )}

      {past.length > 0 && (
        <details className="card tight">
          <summary style={{ fontWeight: 700, cursor: 'pointer', minHeight: 32 }}>Stopped ({past.length})</summary>
          {past.map((p) => (
            <div key={p.id} className="list-row" style={{ alignItems: 'center' }}>
              <div className="pill-icon" style={{ background: 'var(--sunken)', color: 'var(--muted)' }}><LeafIcon size={18} /></div>
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

function PlanForm({ initial, today, onSave, onCancel, onDelete }: {
  initial: PlanItem | null;
  today: string;
  onSave: (p: PlanItem) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [p, setP] = useState<PlanItem>(
    initial ?? { id: uid(), name: '', kind: 'medication', detail: '', startDate: today, endDate: null, asNeeded: false, painkiller: false, watch: '' },
  );
  const set = <K extends keyof PlanItem>(k: K, v: PlanItem[K]) => setP((x) => ({ ...x, [k]: v }));
  return (
    <form className="card sheet" onSubmit={(e) => { e.preventDefault(); if (p.name.trim()) onSave({ ...p, name: p.name.trim() }); }}>
      <div className="between">
        <h2>{initial ? 'Edit' : 'Add to my plan'}</h2>
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
            <option value="medication">Medication</option>
            <option value="method">Method</option>
            <option value="habit">Habit / eating</option>
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
        <button type="submit" className="btn primary">{initial ? 'Save' : 'Add to plan'}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        {onDelete && <button type="button" className="btn danger" style={{ marginLeft: 'auto' }} onClick={onDelete}>Delete</button>}
      </div>
    </form>
  );
}
