import { useState, type ReactNode } from 'react';
import { seedPhase } from '../lib/cycle';
import { SEEDS } from '../lib/hooks';
import { uid, useStore } from '../lib/store';
import { KNOWN_SYMPTOMS, SEVERITY_NAMES, SIDE_EFFECTS } from '../lib/symptoms';
import { KINDS, type DayEntry, type Flow, type PlanItem, type Severity } from '../lib/types';
import { CheckIcon, PlusIcon, XIcon } from './Icons';
import { KindIcon } from './kinds';

const FLOWS: { id: Flow; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

interface Props {
  entry: DayEntry;
  onChange: (fn: (e: DayEntry) => DayEntry) => void;
  items: PlanItem[];
  cycleLength: number;
  seedDay?: number | null; // cycle day, to show which seeds to eat
  bleedingExtra?: ReactNode;
}

/** The fields of one day's log. Today edits one day; the calendar uses it to edit several at once. */
export default function DayForm({ entry, onChange, items, cycleLength, seedDay, bleedingExtra }: Props) {
  const { data, update } = useStore();
  const [newSymptom, setNewSymptom] = useState('');
  const [addingSymptom, setAddingSymptom] = useState(false);
  const [extra, setExtra] = useState('');
  const sideMarked = SIDE_EFFECTS.filter((s) => entry.symptoms[s.id]).length;
  const [sideOpen, setSideOpen] = useState(sideMarked > 0);

  const tapSymptom = (id: string) =>
    onChange((e) => {
      const v = e.symptoms[id] ?? 0;
      const symptoms = { ...e.symptoms };
      if (v >= 3) delete symptoms[id];
      else symptoms[id] = (v + 1) as Severity;
      return { ...e, symptoms };
    });

  const addSymptom = () => {
    const label = newSymptom.trim();
    if (!label) return;
    const existing = data.customSymptoms.find((s) => s.label.toLowerCase() === label.toLowerCase());
    const id = existing?.id ?? `c-${uid()}`;
    if (!existing) update((d) => ({ ...d, customSymptoms: [...d.customSymptoms, { id, label }] }));
    onChange((e) => ({ ...e, symptoms: { ...e.symptoms, [id]: 1 } }));
    setNewSymptom('');
    setAddingSymptom(false);
  };

  const addExtra = () => {
    const v = extra.trim();
    if (!v) return;
    onChange((e) => ({ ...e, extras: [...e.extras, v] }));
    setExtra('');
  };

  const chip = (s: { id: string; label: string }, custom = false) => {
    const v = entry.symptoms[s.id] ?? 0;
    return (
      <button
        key={s.id}
        type="button"
        className={`chip ${custom ? 'custom' : ''} ${v ? `sev${v}` : ''}`}
        aria-label={`${s.label}${v ? `, ${SEVERITY_NAMES[v]}` : ''}`}
        onClick={() => tapSymptom(s.id)}
      >
        <span>{s.label}</span>
        {v > 0 && <span className="badge">{SEVERITY_NAMES[v]}</span>}
      </button>
    );
  };

  const watching = [...new Set(items.filter((p) => p.kind === 'medication' && p.watch).map((p) => p.watch))].join('; ');
  const marked = Object.keys(entry.symptoms).length;

  return (
    <>
      <Scale
        id="pain"
        title="Overall pain"
        value={entry.pain}
        onPick={(n) => onChange((e) => ({ ...e, pain: e.pain === n ? null : n }))}
        low="No pain"
        high="Worst imaginable"
      />
      <Scale
        id="energy"
        title="Energy level"
        value={entry.energy}
        onPick={(n) => onChange((e) => ({ ...e, energy: e.energy === n ? null : n }))}
        low="Exhausted"
        high="Full of energy"
      />

      <section className="card" aria-labelledby="flow-h">
        <h2 id="flow-h">Bleeding</h2>
        <div className="chips">
          {FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip ${entry.flow === f.id ? 'on' : ''}`}
              aria-pressed={entry.flow === f.id}
              onClick={() => onChange((e) => ({ ...e, flow: f.id }))}
            >
              {f.label}
            </button>
          ))}
        </div>
        {bleedingExtra}
      </section>

      <section className="card" aria-labelledby="sym-h">
        <div className="between">
          <h2 id="sym-h">Symptoms</h2>
          <div className="small muted">{marked} marked · tap again for severity</div>
        </div>
        <div className="chips">
          {KNOWN_SYMPTOMS.map((s) => chip(s))}
          {data.customSymptoms.map((s) => chip(s, true))}
          {addingSymptom ? (
            <form className="row" onSubmit={(e) => { e.preventDefault(); addSymptom(); }}>
              <label className="sr-only" htmlFor="new-sym">New symptom</label>
              <input id="new-sym" className="input" autoFocus placeholder="e.g. Jaw tension" value={newSymptom} onChange={(e) => setNewSymptom(e.target.value)} style={{ width: 180 }} />
              <button type="submit" className="btn primary">Add</button>
              <button type="button" className="icon-btn" aria-label="Cancel" onClick={() => setAddingSymptom(false)}><XIcon size={16} /></button>
            </form>
          ) : (
            <button type="button" className="chip add" onClick={() => setAddingSymptom(true)}>
              <PlusIcon size={16} /> Add my own
            </button>
          )}
        </div>

        <details className="subblock" open={sideOpen} onToggle={(e) => setSideOpen((e.target as HTMLDetailsElement).open)}>
          <summary>
            <span>Medication side effects</span>
            {sideMarked > 0 && <span className="small muted" style={{ fontWeight: 600 }}>{sideMarked} marked</span>}
          </summary>
          <div className="stack" style={{ gap: 10, paddingTop: 10 }}>
            {watching && <p className="tiny muted">Your medications list: {watching}</p>}
            <div className="chips">{SIDE_EFFECTS.map((s) => chip(s))}</div>
          </div>
        </details>

        <div className="legend">
          <span><i className="sw" style={{ background: 'var(--sev1)' }} />Mild</span>
          <span><i className="sw" style={{ background: 'var(--sev2)' }} />Moderate</span>
          <span><i className="sw" style={{ background: 'var(--sev3)' }} />Severe</span>
          <span><i className="sw" style={{ border: '1.5px dashed var(--dash)' }} />Custom</span>
        </div>
      </section>

      <section className="card tight" aria-labelledby="plan-h">
        <div className="between">
          <h2 id="plan-h">From my routine</h2>
          <a href="#/routine" className="small" style={{ fontWeight: 600, textDecoration: 'none' }}>Edit routine</a>
        </div>
        {items.length === 0 && (
          <p className="small muted">Nothing in your routine yet. Add medications, supplements or habits in <a href="#/routine">My routine</a> or the <a href="#/library">Library</a>.</p>
        )}
        <div className="stack" style={{ gap: 10 }}>
          {KINDS.map((k) => {
            const list = items.filter((p) => p.kind === k.id);
            if (!list.length) return null;
            const doneCount = list.filter((p) => entry.done.includes(p.id)).length;
            return (
              <div key={k.id} className={`kind-block k-${k.id}`} role="group" aria-label={k.label}>
                <div className="kind-head">
                  <KindIcon kind={k.id} />
                  <span style={{ flex: 1 }}>{k.label}</span>
                  <span className="num" style={{ fontWeight: 600, letterSpacing: 0 }}>{doneCount}/{list.length}</span>
                </div>
                {list.map((p) => {
                  const done = entry.done.includes(p.id);
                  const detail = p.libraryId === 'seed-cycling' && seedDay ? `${SEEDS[seedPhase(seedDay, cycleLength)]} · ${p.detail}` : p.detail;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="plan-row"
                      aria-pressed={done}
                      onClick={() => onChange((e) => ({ ...e, done: done ? e.done.filter((x) => x !== p.id) : [...e.done, p.id] }))}
                    >
                      <span className={`box ${done ? 'done' : ''}`}>{done && <CheckIcon size={14} />}</span>
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        {(detail || p.asNeeded) && <span className="small muted">{detail}{p.asNeeded ? `${detail ? ' · ' : ''}tap if used` : ''}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {entry.extras.length > 0 && (
          <div className="chips">
            {entry.extras.map((x, i) => (
              <span key={i} className="chip" style={{ minHeight: 36 }}>
                {x}
                <button type="button" aria-label={`Remove ${x}`} onClick={() => onChange((e) => ({ ...e, extras: e.extras.filter((_, j) => j !== i) }))} style={{ border: 0, background: 'none', display: 'flex', padding: 4 }}>
                  <XIcon size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        <form className="row" onSubmit={(e) => { e.preventDefault(); addExtra(); }}>
          <label className="sr-only" htmlFor="extra">Extra medication or food</label>
          <input id="extra" className="input" placeholder="Extra medication or food…" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <button type="submit" className="btn">Add</button>
        </form>
      </section>

      <section className="card tight">
        <label htmlFor="note" style={{ fontSize: 16, fontWeight: 700 }}>Notes</label>
        <textarea id="note" className="textarea" rows={3} placeholder="Anything else? Triggers, stress, sleep…" value={entry.note} onChange={(e) => { const v = e.target.value; onChange((x) => ({ ...x, note: v })); }} />
      </section>
    </>
  );
}

function Scale({ id, title, value, onPick, low, high }: { id: string; title: string; value: number | null; onPick: (n: number) => void; low: string; high: string }) {
  return (
    <section className="card" aria-labelledby={`${id}-h`}>
      <div className="between">
        <h2 id={`${id}-h`}>{title}</h2>
        <div className="small muted">
          <strong className="num" style={{ color: 'var(--ink)', fontSize: 18 }}>{value ?? '–'}</strong> / 10
        </div>
      </div>
      <div className="pain-scale">
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} type="button" aria-pressed={value === n} aria-label={`${title} ${n}`} onClick={() => onPick(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="between tiny muted"><span>{low}</span><span>{high}</span></div>
    </section>
  );
}
