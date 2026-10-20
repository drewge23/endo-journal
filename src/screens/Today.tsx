import { useState } from 'react';
import { CheckIcon, ChevronLeft, ChevronRight, DropIcon, GearIcon, PlusIcon, XIcon } from '../components/Icons';
import { cycleDay, cycleFor, periodStarts, phaseFor, seedPhase } from '../lib/cycle';
import { addDays, formatDate } from '../lib/dates';
import { SEEDS, useCycles } from '../lib/hooks';
import { sampleData } from '../lib/sample';
import { isActiveOn } from '../lib/stats';
import { dateFromHash } from './Calendar';
import { uid, useStore } from '../lib/store';
import { KNOWN_SYMPTOMS, SEVERITY_NAMES } from '../lib/symptoms';
import { emptyEntry, type DayEntry, type Flow, type Severity } from '../lib/types';

const FLOWS: { id: Flow; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

const isEmpty = (e: DayEntry) =>
  e.pain === null && e.flow === 'none' && !Object.keys(e.symptoms).length && !e.done.length && !e.extras.length && !e.note.trim();

export default function Today() {
  const { data, update, replace } = useStore();
  const { cycles, today, cycleLength } = useCycles();
  const [date, setDate] = useState(() => dateFromHash(today));
  const [newSymptom, setNewSymptom] = useState('');
  const [addingSymptom, setAddingSymptom] = useState(false);
  const [extra, setExtra] = useState('');

  const entry = data.entries[date] ?? emptyEntry(date);
  const setEntry = (fn: (e: DayEntry) => DayEntry) =>
    update((d) => {
      const next = fn(d.entries[date] ?? emptyEntry(date));
      const entries = { ...d.entries };
      if (isEmpty(next)) delete entries[date];
      else entries[date] = next;
      return { ...d, entries };
    });

  const day = cycleDay(date, cycles);
  const cycle = cycleFor(date, cycles);
  const phase = day ? phaseFor(day, cycleLength) : null;
  const isToday = date === today;
  const starts = periodStarts(data);
  const startedHere = starts.includes(date);
  const manualStart = data.periodStarts.includes(date);

  const togglePeriodStart = () =>
    update((d) => ({
      ...d,
      periodStarts: manualStart ? d.periodStarts.filter((x) => x !== date) : [...d.periodStarts, date].sort(),
    }));

  const tapSymptom = (id: string) =>
    setEntry((e) => {
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
    update((d) => ({
      ...d,
      customSymptoms: existing ? d.customSymptoms : [...d.customSymptoms, { id, label }],
      entries: { ...d.entries, [date]: { ...(d.entries[date] ?? emptyEntry(date)), symptoms: { ...(d.entries[date]?.symptoms ?? {}), [id]: 1 } } },
    }));
    setNewSymptom('');
    setAddingSymptom(false);
  };

  const addExtra = () => {
    const v = extra.trim();
    if (!v) return;
    setEntry((e) => ({ ...e, extras: [...e.extras, v] }));
    setExtra('');
  };

  const planItems = data.plan.filter((p) => isActiveOn(p, date));
  const allSymptoms = [
    ...KNOWN_SYMPTOMS.map((s) => ({ ...s, custom: false })),
    ...data.customSymptoms.map((s) => ({ ...s, custom: true })),
  ];
  const marked = Object.keys(entry.symptoms).length;
  const noSetup = cycles.length === 0;

  return (
    <div className="page">
      <header className="page-head" style={{ alignItems: 'center' }}>
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>{isToday ? 'How are you today?' : 'How were you?'}</h1>
        </div>
        <div className="row">
          {day && (
            <div
              className="ring"
              style={{ background: `conic-gradient(var(--accent) 0 ${Math.min(100, (day / cycleLength) * 100)}%, var(--line) 0 100%)` }}
              aria-label={`Cycle day ${day}`}
            >
              <div className="ring-inner">
                <span className="lbl">Day</span>
                <span className="val num">{day}</span>
              </div>
            </div>
          )}
          <a href="#/settings" className="icon-btn mobile-only" aria-label="Settings" style={{ color: 'var(--ink)' }}>
            <GearIcon size={20} />
          </a>
        </div>
      </header>

      <div className="datebar">
        <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
          <ChevronLeft size={18} />
        </button>
        <label className="sr-only" htmlFor="log-date">Date</label>
        <input id="log-date" className="input" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button type="button" className="icon-btn" aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))}>
          <ChevronRight size={18} />
        </button>
        {!isToday && (
          <button type="button" className="btn" onClick={() => setDate(today)}>Today</button>
        )}
      </div>

      {noSetup ? (
        <Setup onSample={() => replace(sampleData())} />
      ) : (
        cycle && phase && (
          <div className="banner">
            <DropIcon size={18} />
            <div>
              <strong>{phase} phase</strong> · cycle {cycle.number} · period started {formatDate(cycle.start)}
            </div>
          </div>
        )
      )}

      <section className="card" aria-labelledby="pain-h">
        <div className="between">
          <h2 id="pain-h">Overall pain</h2>
          <div className="small muted">
            <strong className="num" style={{ color: 'var(--ink)', fontSize: 18 }}>{entry.pain ?? '–'}</strong> / 10
          </div>
        </div>
        <div className="pain-scale">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              aria-pressed={entry.pain === n}
              aria-label={`Pain ${n}`}
              onClick={() => setEntry((e) => ({ ...e, pain: e.pain === n ? null : n }))}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="between tiny muted"><span>No pain</span><span>Worst imaginable</span></div>
      </section>

      <section className="card" aria-labelledby="flow-h">
        <h2 id="flow-h">Bleeding</h2>
        <div className="chips">
          {FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip ${entry.flow === f.id ? 'on' : ''}`}
              aria-pressed={entry.flow === f.id}
              onClick={() => setEntry((e) => ({ ...e, flow: f.id }))}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={startedHere} disabled={startedHere && !manualStart} onChange={togglePeriodStart} />
          My period started this day
        </label>
        {startedHere && !manualStart && (
          <p className="tiny muted" style={{ marginTop: -10 }}>Detected from the bleeding you logged.</p>
        )}
      </section>

      <section className="card" aria-labelledby="sym-h">
        <div className="between">
          <h2 id="sym-h">Symptoms</h2>
          <div className="small muted">{marked} marked · tap again for severity</div>
        </div>
        <div className="chips">
          {allSymptoms.map((s) => {
            const v = entry.symptoms[s.id] ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                className={`chip ${s.custom ? 'custom' : ''} ${v ? `sev${v}` : ''}`}
                aria-label={`${s.label}${v ? `, ${SEVERITY_NAMES[v]}` : ''}`}
                onClick={() => tapSymptom(s.id)}
              >
                <span>{s.label}</span>
                {v > 0 && <span className="badge">{SEVERITY_NAMES[v]}</span>}
              </button>
            );
          })}
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
        <div className="legend">
          <span><i className="sw" style={{ background: 'var(--sev1)' }} />Mild</span>
          <span><i className="sw" style={{ background: 'var(--sev2)' }} />Moderate</span>
          <span><i className="sw" style={{ background: 'var(--sev3)' }} />Severe</span>
          <span><i className="sw" style={{ border: '1.5px dashed var(--dash)' }} />Custom</span>
        </div>
      </section>

      <section className="card tight" aria-labelledby="plan-h">
        <div className="between">
          <h2 id="plan-h">From my plan</h2>
          <a href="#/plan" className="small" style={{ fontWeight: 600, textDecoration: 'none' }}>Edit plan</a>
        </div>
        {planItems.length === 0 && (
          <p className="small muted">Nothing in your plan yet. Add medications, methods or habits in <a href="#/plan">My plan</a> or the <a href="#/library">Library</a>.</p>
        )}
        <div>
          {planItems.map((p) => {
            const done = entry.done.includes(p.id);
            const detail = p.libraryId === 'seed-cycling' && day ? `${SEEDS[seedPhase(day, cycleLength)]} · ${p.detail}` : p.detail;
            return (
              <button
                key={p.id}
                type="button"
                className="plan-row"
                aria-pressed={done}
                onClick={() => setEntry((e) => ({ ...e, done: done ? e.done.filter((x) => x !== p.id) : [...e.done, p.id] }))}
              >
                <span className={`box ${done ? 'done' : ''}`}>{done && <CheckIcon size={14} />}</span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className="small muted">{detail}{p.asNeeded ? ' · tap if taken' : ''}</span>
                </span>
                <span className={`tag ${p.kind}`}>{p.kind === 'medication' ? 'Medication' : p.kind === 'method' ? 'Method' : 'Habit'}</span>
              </button>
            );
          })}
        </div>
        {entry.extras.length > 0 && (
          <div className="chips">
            {entry.extras.map((x, i) => (
              <span key={i} className="chip" style={{ minHeight: 36 }}>
                {x}
                <button type="button" aria-label={`Remove ${x}`} onClick={() => setEntry((e) => ({ ...e, extras: e.extras.filter((_, j) => j !== i) }))} style={{ border: 0, background: 'none', display: 'flex', padding: 4 }}>
                  <XIcon size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        <form className="row" onSubmit={(e) => { e.preventDefault(); addExtra(); }}>
          <label className="sr-only" htmlFor="extra">Extra medication or food</label>
          <input id="extra" className="input" placeholder="Extra medication or food today…" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <button type="submit" className="btn">Add</button>
        </form>
      </section>

      <section className="card tight">
        <label htmlFor="note" style={{ fontSize: 16, fontWeight: 700 }}>Notes</label>
        <textarea id="note" className="textarea" rows={3} placeholder="Anything else? Triggers, stress, sleep…" value={entry.note} onChange={(e) => setEntry((x) => ({ ...x, note: e.target.value }))} />
      </section>

      <p className="saved" role="status">{data.entries[date] ? '✓ Saved on this device' : 'Changes save automatically'}</p>
    </div>
  );
}

function Setup({ onSample }: { onSample: () => void }) {
  const { update } = useStore();
  const [start, setStart] = useState('');
  const [len, setLen] = useState(28);
  return (
    <section className="card sheet">
      <h2>Welcome! Two quick questions</h2>
      <p className="small muted">They let the app count cycle days. You can change them later in Settings.</p>
      <div className="grid2">
        <label className="field">
          Last period started
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          Usual cycle length (days)
          <input className="input" type="number" min={18} max={60} value={len} onChange={(e) => setLen(Number(e.target.value))} />
        </label>
      </div>
      <div className="row wrap">
        <button
          type="button"
          className="btn primary"
          disabled={!start}
          onClick={() => update((d) => ({ ...d, periodStarts: [...d.periodStarts, start].sort(), cycleLength: len || 28 }))}
        >
          Start journaling
        </button>
        <button type="button" className="btn ghost" onClick={onSample}>Explore with sample data</button>
      </div>
    </section>
  );
}
