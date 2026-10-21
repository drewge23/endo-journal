import { useState } from 'react';
import DayForm from '../components/DayForm';
import { CheckIcon, ChevronLeft, ChevronRight, DropIcon } from '../components/Icons';
import { applyToDays } from '../lib/batch';
import { cycleDay, periodStarts } from '../lib/cycle';
import { addDays, formatDate, rangeDays } from '../lib/dates';
import { useCycles } from '../lib/hooks';
import { isActiveOn } from '../lib/stats';
import { useStore } from '../lib/store';
import { emptyEntry, type DayEntry } from '../lib/types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthGrid(month: string): (string | null)[] {
  // month = YYYY-MM; Monday-first weeks, padded with nulls.
  const first = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let i = 0; i < days; i++) cells.push(addDays(first, i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "12–18 Oct" for a run of days, otherwise "5 days". */
function describe(dates: string[]): string {
  if (dates.length === 1) return formatDate(dates[0], { day: 'numeric', month: 'short' });
  const first = dates[0];
  const last = dates[dates.length - 1];
  const contiguous = rangeDays(first, last).length === dates.length;
  return contiguous ? `${formatDate(first)} – ${formatDate(last)}` : `${dates.length} separate days`;
}

const painClass = (p: number | null) => (p == null || p <= 2 ? '' : p <= 4 ? 'p1' : p <= 6 ? 'p2' : 'p3');
const bleeding = (e?: DayEntry) => !!e && (e.flow === 'light' || e.flow === 'medium' || e.flow === 'heavy');

type Mode = 'range' | 'days';

export default function Calendar() {
  const { data, update } = useStore();
  const { cycles, today, cycleLength } = useCycles();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selecting, setSelecting] = useState(false);
  const [mode, setMode] = useState<Mode>('range');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DayEntry>(emptyEntry(''));
  const [replaceAll, setReplaceAll] = useState(false);
  const [msg, setMsg] = useState('');

  const starts = new Set(periodStarts(data));
  const cells = monthGrid(month);
  const inMonth = cells.filter((d): d is string => !!d && d <= today);
  const logged = inMonth.filter((d) => data.entries[d]).length;
  const isCurrent = month === today.slice(0, 7);
  const dates = [...selected].sort();

  const pick = (d: string) => {
    setMsg('');
    const next = new Set(selected);
    if (mode === 'days') {
      if (next.has(d)) next.delete(d);
      else next.add(d);
    } else if (!anchor) {
      next.add(d);
      setAnchor(d);
    } else {
      const [a, b] = anchor < d ? [anchor, d] : [d, anchor];
      rangeDays(a, b).forEach((x) => next.add(x));
      setAnchor(null);
    }
    setSelected(next);
  };

  const clear = () => {
    setSelected(new Set());
    setAnchor(null);
  };
  const stopSelecting = () => {
    clear();
    setSelecting(false);
    setEditing(false);
  };
  const startEditing = () => {
    setDraft(emptyEntry(''));
    setReplaceAll(false);
    setEditing(true);
    window.scrollTo(0, 0);
  };
  const apply = () => {
    const alreadyLogged = dates.filter((d) => data.entries[d]).length;
    if (replaceAll && alreadyLogged && !confirm(`Replace everything already logged on ${alreadyLogged} of these days?`)) return;
    update((d) => ({ ...d, entries: applyToDays(d.entries, dates, draft, d.plan, replaceAll) }));
    setMsg(`Saved ${dates.length} days (${describe(dates)}).`);
    stopSelecting();
  };

  if (editing) {
    const items = data.plan.filter((p) => dates.some((d) => isActiveOn(p, d)));
    const alreadyLogged = dates.filter((d) => data.entries[d]).length;
    return (
      <div className="page">
        <header className="page-head">
          <div className="stack" style={{ gap: 4 }}>
            <button type="button" className="eyebrow" onClick={() => setEditing(false)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--accent)', textAlign: 'left' }}>← Back to calendar</button>
            <h1>Edit {dates.length} days</h1>
            <div className="small muted">{describe(dates)}{alreadyLogged ? ` · ${alreadyLogged} already logged` : ''}</div>
          </div>
        </header>
        <div className="note" style={{ background: 'var(--surface)' }}>
          Fill in what was the same on all these days. It’s added to each day — anything you leave empty stays as it was.
        </div>

        <DayForm entry={draft} onChange={(fn) => setDraft((e) => fn(e))} items={items} cycleLength={cycleLength} />

        <section className="card tight">
          <label className="check">
            <input type="checkbox" checked={replaceAll} onChange={(e) => setReplaceAll(e.target.checked)} />
            Replace what’s already logged on these days
          </label>
          <div className="row wrap">
            <button type="button" className="btn primary big" style={{ flex: 1 }} onClick={apply}>Apply to {dates.length} days</button>
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">
            {inMonth.length ? `${logged} of ${inMonth.length} days logged` : 'Nothing to log yet'}
          </div>
          <h1>{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</h1>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
          <button type="button" className="icon-btn" aria-label="Next month" disabled={isCurrent} onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
        </div>
      </header>

      {selecting ? (
        <div className="stack" style={{ gap: 8 }}>
          <div className="segmented" role="tablist" aria-label="How to select">
            <button type="button" role="tab" aria-selected={mode === 'range'} onClick={() => { setMode('range'); setAnchor(null); }}>Range</button>
            <button type="button" role="tab" aria-selected={mode === 'days'} onClick={() => { setMode('days'); setAnchor(null); }}>Single days</button>
          </div>
          <p className="small muted">
            {mode === 'range' ? (anchor ? `From ${formatDate(anchor)} — now tap the last day.` : 'Tap the first day, then the last day.') : 'Tap each day you want to edit.'}
          </p>
        </div>
      ) : (
        <button type="button" className="btn outline" onClick={() => { setSelecting(true); setMsg(''); }}>
          <CheckIcon size={14} /> Select several days to edit together
        </button>
      )}
      {msg && <p role="status" className="saved">✓ {msg}</p>}

      <section className="card" style={{ padding: 12 }}>
        <div className="cal" role="grid" aria-label={selecting ? 'Select days' : 'Logged days'} aria-multiselectable={selecting || undefined}>
          <div role="row" className="cal-row">
            {WEEKDAYS.map((w) => <div key={w} role="columnheader" className="cal-head">{w}</div>)}
          </div>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <div key={r} role="row" className="cal-row">
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                if (!d) return <div key={i} role="gridcell" className="cal-cell empty" />;
                const e = data.entries[d];
                const future = d > today;
                const cd = cycleDay(d, cycles);
                const isSel = selected.has(d);
                const label = `${formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}${cd ? `, cycle day ${cd}` : ''}${
                  e ? `, logged${e.pain != null ? `, pain ${e.pain}` : ''}${bleeding(e) ? ', bleeding' : ''}` : future ? '' : ', not logged'
                }`;
                const cls = ['cal-cell', e ? 'logged' : '', e ? painClass(e.pain) : '', d === today ? 'today' : '', starts.has(d) ? 'start' : '', isSel ? 'selected' : '', anchor === d ? 'anchor' : ''].join(' ');
                const inner = (
                  <>
                    <span className="cal-num">{Number(d.slice(8))}</span>
                    {bleeding(e) && <span className="cal-drop"><DropIcon size={11} /></span>}
                    {e && <span className="cal-dot" />}
                    {isSel && <span className="cal-check"><CheckIcon size={10} /></span>}
                  </>
                );
                return (
                  <div key={d} role="gridcell" aria-selected={selecting ? isSel : undefined}>
                    {future ? (
                      <span className={`${cls} future`} aria-label={label}>{Number(d.slice(8))}</span>
                    ) : selecting ? (
                      <button type="button" className={cls} aria-label={label} aria-pressed={isSel} onClick={() => pick(d)}>{inner}</button>
                    ) : (
                      <a className={cls} href={`#/today?d=${d}`} aria-label={label}>{inner}</a>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="legend" style={{ paddingTop: 4 }}>
          <span><i className="cal-dot" style={{ position: 'static' }} />Logged</span>
          <span style={{ color: 'var(--accent)' }}><DropIcon size={12} /><span className="muted">Bleeding</span></span>
          <span><i className="sw" style={{ background: 'var(--sev1)' }} />Pain 3–4</span>
          <span><i className="sw" style={{ background: 'var(--sev2)' }} />5–6</span>
          <span><i className="sw" style={{ background: 'var(--sev3)' }} />7+</span>
          <span><i className="sw" style={{ border: '2px solid var(--accent)' }} />Period start</span>
        </div>
      </section>

      {selecting && (
        <div className="selbar" role="region" aria-label="Selection">
          <div style={{ flex: '1 1 150px', minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>{dates.length ? `${dates.length} day${dates.length > 1 ? 's' : ''} selected` : 'No days selected'}</div>
            {dates.length > 0 && <div className="tiny muted">{describe(dates)}</div>}
          </div>
          {dates.length > 0 && <button type="button" className="btn ghost" onClick={clear}>Clear</button>}
          <button type="button" className="btn ghost" onClick={stopSelecting}>Done</button>
          <button type="button" className="btn primary" disabled={!dates.length} onClick={startEditing}>Edit together</button>
        </div>
      )}

      {!selecting && isCurrent && !data.entries[today] && <a href="#/today" className="btn primary big">Log today</a>}
      {!selecting && !isCurrent && (
        <button type="button" className="btn" onClick={() => setMonth(today.slice(0, 7))}>Back to {formatDate(today, { month: 'long' })}</button>
      )}
      {!selecting && <p className="tiny muted">Tap a day to view or fill it in. Missing days are fine — a few logged days per week still give useful stats.</p>}
    </div>
  );
}

/** The day a calendar link asked Today to open (#/today?d=YYYY-MM-DD). */
export function dateFromHash(today: string): string {
  const m = location.hash.match(/[?&]d=(\d{4}-\d{2}-\d{2})/);
  return m && m[1] <= today ? m[1] : today;
}
