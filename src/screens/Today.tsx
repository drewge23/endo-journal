import { useState } from 'react';
import DayForm from '../components/DayForm';
import { ChevronLeft, ChevronRight, DropIcon, GearIcon } from '../components/Icons';
import { cycleDay, cycleFor, periodStarts, phaseFor } from '../lib/cycle';
import { addDays, formatDate } from '../lib/dates';
import { useCycles } from '../lib/hooks';
import { sampleData } from '../lib/sample';
import { isActiveOn } from '../lib/stats';
import { useStore } from '../lib/store';
import { emptyEntry, isEmptyEntry, type DayEntry } from '../lib/types';
import { dateFromHash } from './Calendar';

export default function Today() {
  const { data, update, replace } = useStore();
  const { cycles, today, cycleLength } = useCycles();
  const [date, setDate] = useState(() => dateFromHash(today));

  const entry = data.entries[date] ?? emptyEntry(date);
  const setEntry = (fn: (e: DayEntry) => DayEntry) =>
    update((d) => {
      const next = fn(d.entries[date] ?? emptyEntry(date));
      const entries = { ...d.entries };
      if (isEmptyEntry(next)) delete entries[date];
      else entries[date] = next;
      return { ...d, entries };
    });

  const day = cycleDay(date, cycles);
  const cycle = cycleFor(date, cycles);
  const phase = day ? phaseFor(day, cycleLength) : null;
  const isToday = date === today;
  const startedHere = periodStarts(data).includes(date);
  const manualStart = data.periodStarts.includes(date);

  const togglePeriodStart = () =>
    update((d) => ({
      ...d,
      periodStarts: manualStart ? d.periodStarts.filter((x) => x !== date) : [...d.periodStarts, date].sort(),
    }));

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
        {!isToday && <button type="button" className="btn" onClick={() => setDate(today)}>Today</button>}
      </div>

      {cycles.length === 0 ? (
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

      <DayForm
        key={date}
        entry={entry}
        onChange={setEntry}
        items={data.plan.filter((p) => isActiveOn(p, date))}
        cycleLength={cycleLength}
        seedDay={day}
        bleedingExtra={
          <>
            <label className="check">
              <input type="checkbox" checked={startedHere} disabled={startedHere && !manualStart} onChange={togglePeriodStart} />
              My period started this day
            </label>
            {startedHere && !manualStart && <p className="tiny muted" style={{ marginTop: -10 }}>Detected from the bleeding you logged.</p>}
          </>
        }
      />

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
