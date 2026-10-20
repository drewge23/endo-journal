import { useState } from 'react';
import { ChevronLeft, ChevronRight, DropIcon } from '../components/Icons';
import { cycleDay, periodStarts } from '../lib/cycle';
import { addDays, formatDate } from '../lib/dates';
import { useCycles } from '../lib/hooks';
import { useStore } from '../lib/store';
import type { DayEntry } from '../lib/types';

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

const painClass = (p: number | null) => (p == null || p <= 2 ? '' : p <= 4 ? 'p1' : p <= 6 ? 'p2' : 'p3');
const bleeding = (e?: DayEntry) => !!e && (e.flow === 'light' || e.flow === 'medium' || e.flow === 'heavy');

export default function Calendar() {
  const { data } = useStore();
  const { cycles, today } = useCycles();
  const [month, setMonth] = useState(today.slice(0, 7));
  const starts = new Set(periodStarts(data));
  const cells = monthGrid(month);
  const inMonth = cells.filter((d): d is string => !!d && d <= today);
  const logged = inMonth.filter((d) => data.entries[d]).length;
  const isCurrent = month === today.slice(0, 7);

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

      <section className="card" style={{ padding: 12 }}>
        <div className="cal" role="grid" aria-label="Logged days">
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
                const label = `${formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}${cd ? `, cycle day ${cd}` : ''}${
                  e ? `, logged${e.pain != null ? `, pain ${e.pain}` : ''}${bleeding(e) ? ', bleeding' : ''}` : future ? '' : ', not logged'
                }`;
                const cls = ['cal-cell', e ? 'logged' : '', e ? painClass(e.pain) : '', d === today ? 'today' : '', starts.has(d) ? 'start' : ''].join(' ');
                return (
                  <div key={d} role="gridcell">
                    {future ? (
                      <span className={`${cls} future`} aria-label={label}>{Number(d.slice(8))}</span>
                    ) : (
                      <a className={cls} href={`#/today?d=${d}`} aria-label={label}>
                        <span className="cal-num">{Number(d.slice(8))}</span>
                        {bleeding(e) && <span className="cal-drop"><DropIcon size={11} /></span>}
                        {e && <span className="cal-dot" />}
                      </a>
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

      {isCurrent && !data.entries[today] && (
        <a href="#/today" className="btn primary big">Log today</a>
      )}
      {!isCurrent && (
        <button type="button" className="btn" onClick={() => setMonth(today.slice(0, 7))}>Back to {formatDate(today, { month: 'long' })}</button>
      )}
      <p className="tiny muted">Tap a day to view or fill it in. Missing days are fine — a few logged days per week still give useful stats.</p>
    </div>
  );
}

/** The day a calendar link asked Today to open (#/today?d=YYYY-MM-DD). */
export function dateFromHash(today: string): string {
  const m = location.hash.match(/[?&]d=(\d{4}-\d{2}-\d{2})/);
  return m && m[1] <= today ? m[1] : today;
}
