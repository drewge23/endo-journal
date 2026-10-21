import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileIcon } from '../components/Icons';
import type { Cycle } from '../lib/cycle';
import { formatDate, rangeDays } from '../lib/dates';
import { useCycles } from '../lib/hooks';
import { averagePainByDay, compareItem, cycleStats, PAIN_THRESHOLD, summarize, type Comparison, type Verdict } from '../lib/stats';
import { useStore } from '../lib/store';
import { symptomLabel } from '../lib/symptoms';
import { KINDS } from '../lib/types';

const fmt = (v: number | null, digits = 1) => (v == null ? '–' : v.toFixed(digits).replace(/\.0$/, ''));

function readFocus(): string | null {
  try {
    return sessionStorage.getItem('insights-item');
  } catch {
    return null;
  }
}

export default function Insights() {
  const { data } = useStore();
  const { cycles } = useCycles();
  const lastComplete = cycles.map((c) => c.complete).lastIndexOf(true);
  const [idx, setIdx] = useState(lastComplete >= 0 ? lastComplete : cycles.length - 1);
  const [itemId, setItemId] = useState<string | null>(() => {
    const f = readFocus();
    if (f && data.plan.some((p) => p.id === f)) return f;
    return (data.plan.find((p) => p.kind !== 'medication' && !p.asNeeded) ?? data.plan.find((p) => !p.asNeeded) ?? data.plan[0])?.id ?? null;
  });

  const cycle: Cycle | undefined = cycles[idx];
  const stats = useMemo(() => (cycle ? cycleStats(data, cycle) : null), [data, cycle]);
  const previous = useMemo(
    () => cycles.slice(0, Math.max(idx, 0)).filter((c) => c.complete).slice(-3).map((c) => cycleStats(data, c)).filter((s) => s.loggedDays >= 5),
    [data, cycles, idx],
  );
  const prevSummary = summarize(previous);
  const baseline = stats ? averagePainByDay(previous, stats.painByDay.length) : [];

  const item = data.plan.find((p) => p.id === itemId) ?? null;
  const cmp = useMemo(() => (item ? compareItem(data, cycles, item) : null), [data, cycles, item]);
  const sideEffects = useMemo(
    () =>
      data.plan
        .filter((p) => !p.painkiller)
        .map((p) => compareItem(data, cycles, p))
        .flatMap((c) => c.sideEffects.map((s) => ({ ...s, item: c.item }))),
    [data, cycles],
  );

  if (!cycle || !stats) {
    return (
      <div className="page">
        <header className="page-head"><h1>Insights</h1></header>
        <section className="card">
          <h2>No cycles yet</h2>
          <p className="small muted">Log a few days — including when your period starts — and your monthly stats will appear here.</p>
          <a className="btn primary" href="#/today">Go to today</a>
        </section>
      </div>
    );
  }

  const kpis = [
    { label: 'Avg pain', value: fmt(stats.avgPain), prev: prevSummary.avgPain, cur: stats.avgPain },
    { label: `Pain days ≥${PAIN_THRESHOLD}`, value: String(stats.painDays), prev: prevSummary.painDays, cur: stats.painDays },
    { label: 'Avg energy', value: fmt(stats.avgEnergy), prev: prevSummary.avgEnergy, cur: stats.avgEnergy, higherBetter: true },
    { label: 'Painkillers', value: String(stats.painkillerDoses), prev: prevSummary.painkillerDoses, cur: stats.painkillerDoses },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">
            Cycle {cycle.number} · {formatDate(cycle.start)} – {formatDate(cycle.end)}{cycle.complete ? '' : ' (current)'}
          </div>
          <h1>Insights</h1>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="icon-btn" aria-label="Previous cycle" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}><ChevronLeft size={18} /></button>
          <button type="button" className="icon-btn" aria-label="Next cycle" disabled={idx >= cycles.length - 1} onClick={() => setIdx(idx + 1)}><ChevronRight size={18} /></button>
        </div>
      </header>

      <div className="grid2 kpis">
        {kpis.map((k) => {
          const delta = k.prev != null && k.cur != null ? k.cur - k.prev : null;
          const better = delta == null || delta === 0 ? null : k.higherBetter ? delta > 0 : delta < 0;
          return (
            <div key={k.label} className="kpi">
              <div className="tiny muted" style={{ fontWeight: 600 }}>{k.label}</div>
              <div className="v num">{k.value}</div>
              <div className={`d ${better == null ? '' : better ? 'good' : 'bad'}`}>
                {delta == null ? <span className="muted">no earlier data</span> : delta === 0 ? 'same as before' : `${delta < 0 ? '↓' : '↑'} ${fmt(Math.abs(delta))} vs before`}
              </div>
            </div>
          );
        })}
      </div>
      <p className="tiny muted" style={{ marginTop: -8 }}>
        {stats.loggedDays} of {cycle.length} days logged{previous.length ? ` · “before” = average of the ${previous.length} previous cycle${previous.length > 1 ? 's' : ''}` : ''}
      </p>

      <section className="card">
        <div className="stack" style={{ gap: 2 }}>
          <h2>Pain by cycle day</h2>
          <div className="small muted">This cycle{previous.length ? ' vs. your average of previous cycles' : ''}</div>
        </div>
        <PainChart values={stats.painByDay} baseline={baseline} bleedDays={bleedFlags(data.entries, cycle)} />
        <div className="legend">
          <span><i className="sw" style={{ background: 'var(--accent)' }} />This cycle</span>
          {previous.length > 0 && <span><i style={{ width: 12, borderTop: '2px dashed var(--dash)' }} />Previous average</span>}
          <span><i className="sw" style={{ background: 'var(--accent-tint)' }} />Bleeding</span>
        </div>
      </section>

      {data.plan.length > 0 && (
        <section className="card">
          <label className="field">
            Is it helping?
            <select className="select" value={itemId ?? ''} onChange={(e) => setItemId(e.target.value)}>
              {KINDS.map((k) => {
                const list = data.plan.filter((p) => p.kind === k.id);
                return list.length ? <optgroup key={k.id} label={k.label}>{list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup> : null;
              })}
            </select>
          </label>
          {cmp && <ComparisonView cmp={cmp} />}
        </section>
      )}

      <section className="card tight">
        <h2>Possible side effects</h2>
        <div className="small muted">Symptoms that showed up on 2+ more days per cycle after starting something</div>
        {sideEffects.length === 0 && <p className="small muted" style={{ paddingTop: 6 }}>Nothing stands out yet.</p>}
        <div>
          {sideEffects.map((s) => (
            <div key={`${s.item.id}-${s.id}`} className="list-row" style={{ alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{symptomLabel(s.id, data.customSymptoms)}</div>
                <div className="tiny muted">after starting {s.item.name}</div>
              </div>
              <span className="tag square warn-tag num" style={{ fontSize: 13 }}>{fmt(s.before)} → {fmt(s.after)} days</span>
            </div>
          ))}
        </div>
      </section>

      <a href="#/report" className="btn primary big"><FileIcon size={18} /> Create report for my doctor</a>
    </div>
  );
}

function bleedFlags(entries: Record<string, { flow: string }>, cycle: Cycle): boolean[] {
  return rangeDays(cycle.start, cycle.end).map((d) => {
    const f = entries[d]?.flow;
    return f === 'light' || f === 'medium' || f === 'heavy';
  });
}

function PainChart({ values, baseline, bleedDays }: { values: (number | null)[]; baseline: (number | null)[]; bleedDays: boolean[] }) {
  const n = values.length;
  const ticks = [1, 7, 14, 21, 28].filter((t) => t <= n);
  return (
    <div className="chart" role="img" aria-label={`Pain by day: ${values.map((v, i) => `day ${i + 1} ${v ?? 'not logged'}`).join(', ')}`}>
      <div className="chart-y num"><span>10</span><span>5</span><span>0</span></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="chart-plot">
          {values.map((v, i) => (
            <div key={i} className={`chart-col ${bleedDays[i] ? 'period' : ''}`} title={`Day ${i + 1}: ${v ?? 'not logged'}`}>
              {baseline[i] != null && <div className="chart-base" style={{ bottom: `${baseline[i]! * 10}%` }} />}
              {v != null && <div className="chart-bar" style={{ height: `${Math.max(v * 10, 1.5)}%` }} />}
            </div>
          ))}
        </div>
        <div className="chart-x num" style={{ position: 'relative', height: 14 }}>
          {ticks.map((t) => (
            <span key={t} style={{ position: 'absolute', left: `${((t - 0.5) / n) * 100}%`, transform: 'translateX(-50%)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  better: { label: 'Looks better', cls: 'good-tag' },
  worse: { label: 'Looks worse', cls: 'warn-tag' },
  unclear: { label: 'No clear change', cls: 'ev-anecdotal' },
  'not-enough': { label: 'Not enough data', cls: 'ev-anecdotal' },
};

function ComparisonView({ cmp }: { cmp: Comparison }) {
  const { data } = useStore();
  const { before, during, beforeSummary: b, duringSummary: a } = cmp;
  const v = VERDICT[cmp.verdict];

  if (cmp.verdict === 'not-enough') {
    return (
      <div className="stack">
        <span className={`tag square ${v.cls}`} style={{ alignSelf: 'flex-start' }}>{v.label}</span>
        <p className="small muted">
          To compare, the app needs at least one full cycle logged <em>before</em> you started {cmp.item.name} ({before.length} so far) and one full cycle since ({during.length} so far).
        </p>
      </div>
    );
  }

  const rows = [
    { label: 'Avg pain', b: b.avgPain ?? 0, a: a.avgPain ?? 0 },
    ...(b.avgEnergy != null && a.avgEnergy != null ? [{ label: 'Avg energy', b: b.avgEnergy, a: a.avgEnergy, higherBetter: true }] : []),
    { label: `Days pain ≥${PAIN_THRESHOLD}`, b: b.painDays ?? 0, a: a.painDays ?? 0 },
    ...(cmp.item.painkiller ? [] : [{ label: 'Painkiller doses', b: b.painkillerDoses ?? 0, a: a.painkillerDoses ?? 0 }]),
    ...cmp.symptoms.slice(0, 4).map((s) => ({ label: symptomLabel(s.id, data.customSymptoms), b: s.before, a: s.after })),
  ];

  return (
    <div className="stack">
      <div className="between" style={{ alignItems: 'center' }}>
        <div className="small muted">{before.length} cycle{before.length > 1 ? 's' : ''} before · {during.length} during</div>
        <span className={`tag square ${v.cls}`}>{v.label}</span>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        {rows.map((r) => {
          const max = Math.max(r.a, r.b, 0.01);
          const pct = r.b ? Math.round(((r.a - r.b) / r.b) * 100) : null;
          const good = pct == null || pct === 0 ? null : 'higherBetter' in r && r.higherBetter ? pct > 0 : pct < 0;
          return (
            <div key={r.label} className="cmp-row">
              <div className="small" style={{ fontWeight: 600 }}>{r.label}</div>
              <div className="stack" style={{ gap: 3 }}>
                <div className="bar-track"><div style={{ width: `${(r.b / max) * 100}%`, background: 'var(--chart-before)' }} /></div>
                <div className="bar-track"><div style={{ width: `${(r.a / max) * 100}%`, background: 'var(--good)' }} /></div>
              </div>
              <div className="small num" style={{ fontWeight: 800, textAlign: 'right', color: good == null ? 'var(--muted)' : good ? 'var(--good-ink)' : 'var(--warn-ink)' }}>
                {pct == null ? (r.a ? 'new' : '–') : `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}%`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="sw" style={{ background: 'var(--chart-before)' }} />Before</span>
        <span><i className="sw" style={{ background: 'var(--good)' }} />During</span>
        <span>Symptoms = days per cycle</span>
      </div>
      {(during.length < 3 || cmp.confounders.length > 0) && (
        <div className="note">
          {during.length < 3 && <>Only {during.length} cycle{during.length > 1 ? 's' : ''} so far — patterns become more reliable after about 3. </>}
          {cmp.confounders.length > 0 && (
            <>In the same period you also {cmp.confounders.map((c) => `${c.endDate ? 'stopped' : 'started'} ${c.name}`).join(', ')}, which may explain part of the change.</>
          )}
        </div>
      )}
    </div>
  );
}
