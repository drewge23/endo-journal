import { useMemo, useState } from 'react';
import { formatDate, todayIso } from '../lib/dates';
import { useCycles } from '../lib/hooks';
import { adherence, compareItem, cycleStats, PAIN_THRESHOLD } from '../lib/stats';
import { useStore } from '../lib/store';
import { symptomLabel } from '../lib/symptoms';

const fmt = (v: number | null) => (v == null ? '–' : v.toFixed(1).replace(/\.0$/, ''));

function shade(v: number | null): [string, string] {
  if (v == null) return ['#ffffff', '#9a8fa3'];
  if (v <= 1) return ['#f5f3f7', '#5e5766'];
  if (v <= 3) return ['#e9cfe0', '#4a1e3d'];
  if (v <= 5) return ['#c98ab4', '#2a0f22'];
  if (v <= 7) return ['#9a4580', '#ffffff'];
  return ['#5a1a47', '#ffffff'];
}

export default function Report() {
  const { data, update } = useStore();
  const { cycles } = useCycles();
  const complete = cycles.filter((c) => c.complete);
  const [count, setCount] = useState(Math.min(3, complete.length || 1));

  const chosen = complete.length ? complete.slice(-count) : cycles.slice(-1);
  const stats = useMemo(() => chosen.map((c) => cycleStats(data, c)), [data, chosen]);

  if (!chosen.length) {
    return (
      <div className="page">
        <header className="page-head"><h1>Doctor report</h1></header>
        <section className="card"><p className="small muted">Log at least one cycle to create a report.</p></section>
      </div>
    );
  }

  const from = chosen[0].start;
  const to = chosen[chosen.length - 1].end;
  const width = Math.max(...chosen.map((c) => c.length));

  const first = stats[0];
  const last = stats[stats.length - 1];
  const ids = [...new Set(stats.flatMap((s) => Object.keys(s.symptomDays)))];
  const total = (id: string) => stats.reduce((sum, s) => sum + (s.symptomDays[id] ?? 0), 0);
  const symptoms = ids.sort((a, b) => total(b) - total(a)).slice(0, 8);

  const treatments = data.plan.filter((p) => p.startDate <= to && (!p.endDate || p.endDate >= from));
  const sideEffects = data.plan
    .filter((p) => !p.painkiller)
    .map((p) => compareItem(data, cycles, p))
    .flatMap((c) => c.sideEffects.map((s) => `${symptomLabel(s.id, data.customSymptoms)} — ${fmt(s.before)} → ${fmt(s.after)} days per cycle after starting ${c.item.name}`));

  const setProfile = (k: 'name' | 'dob' | 'diagnosis', v: string) => update((d) => ({ ...d, profile: { ...d.profile, [k]: v } }));

  return (
    <div className="page wide">
      <div className="no-print stack">
        <header className="page-head">
          <div className="stack" style={{ gap: 4 }}>
            <a href="#/insights" className="eyebrow" style={{ textDecoration: 'none', color: 'var(--accent)' }}>← Insights</a>
            <h1>Doctor report</h1>
          </div>
          <button type="button" className="btn primary" onClick={() => window.print()}>Print / save as PDF</button>
        </header>
        <div className="card tight">
          <div className="grid3" style={{ gap: 10 }}>
            <label className="field">Name<input className="input" value={data.profile.name} onChange={(e) => setProfile('name', e.target.value)} /></label>
            <label className="field">Date of birth<input className="input" type="date" value={data.profile.dob} onChange={(e) => setProfile('dob', e.target.value)} /></label>
            <label className="field">Cycles to include
              <select className="select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {Array.from({ length: Math.max(1, Math.min(complete.length, 12)) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <label className="field">Diagnosis<input className="input" placeholder="e.g. Laparoscopy, 2023" value={data.profile.diagnosis} onChange={(e) => setProfile('diagnosis', e.target.value)} /></label>
        </div>
      </div>

      <article className="report">
        <header className="between" style={{ alignItems: 'flex-start', paddingBottom: 16, borderBottom: '2px solid #1e1a22', flexWrap: 'wrap' }}>
          <div className="stack" style={{ gap: 4 }}>
            <div className="tiny" style={{ fontWeight: 700, color: '#7a2e63', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Endometriosis symptom report</div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>{data.profile.name || 'Patient'}</h1>
            <div className="muted">
              {data.profile.dob && <>Born {formatDate(data.profile.dob, { day: 'numeric', month: 'short', year: 'numeric' })} · </>}
              {data.profile.diagnosis ? `Diagnosis: ${data.profile.diagnosis}` : 'Diagnosis not entered'}
            </div>
          </div>
          <div className="stack muted" style={{ gap: 4, textAlign: 'right' }}>
            <strong style={{ color: '#1e1a22' }}>Period covered</strong>
            <span>{chosen.length} cycle{chosen.length > 1 ? 's' : ''} · {formatDate(from, { day: 'numeric', month: 'short', year: 'numeric' })} – {formatDate(to, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Generated {formatDate(todayIso(), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </header>

        <section className="stack" style={{ gap: 8 }}>
          <h2>Cycle summary</h2>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Cycle</th><th>Length</th><th>Bleeding</th><th>Avg pain</th><th>Max pain</th><th>Avg energy</th><th>Days pain ≥{PAIN_THRESHOLD}</th><th>Painkiller doses</th><th>Days logged</th></tr></thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.cycle.start}>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatDate(s.cycle.start)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.cycle.length} days</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.bleedDays} days</td>
                    <td>{fmt(s.avgPain)}</td>
                    <td>{s.maxPain ?? '–'}</td>
                    <td>{fmt(s.avgEnergy)}</td>
                    <td>{s.painDays}</td>
                    <td>{s.painkillerDoses}</td>
                    <td>{s.loggedDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stack" style={{ gap: 8 }}>
          <div className="between" style={{ flexWrap: 'wrap' }}>
            <h2>Pain by cycle day (0–10)</h2>
            <div className="row tiny muted" style={{ gap: 6 }}>
              0 {[0, 2, 4, 6, 8].map((v) => <span key={v} style={{ width: 14, height: 10, background: shade(v)[0], border: '1px solid #e4dfe9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />)} 10
            </div>
          </div>
          <div className="table-scroll">
            <div style={{ minWidth: 560 }} className="stack">
              {stats.map((s) => (
                <div key={s.cycle.start} className="row" style={{ gap: 8 }}>
                  <div className="tiny" style={{ width: 60, fontWeight: 700, flexShrink: 0 }}>{formatDate(s.cycle.start)}</div>
                  <div className="heat" style={{ flex: 1, gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}>
                    {Array.from({ length: width }, (_, i) => {
                      const v = i < s.painByDay.length ? s.painByDay[i] : undefined;
                      if (v === undefined) return <div key={i} />;
                      const [bg, fg] = shade(v);
                      return <div key={i} style={{ background: bg, color: fg, border: v == null ? '1px dashed #e4dfe9' : 0 }}>{v ?? ''}</div>;
                    })}
                  </div>
                </div>
              ))}
              <div className="row tiny muted" style={{ gap: 8 }}>
                <div style={{ width: 60, flexShrink: 0 }} />
                <div className="between" style={{ flex: 1 }}><span>Day 1</span><span>7</span><span>14</span><span>21</span><span>{width}</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="report-cols">
          <section className="stack" style={{ gap: 8 }}>
            <h2>Most frequent symptoms</h2>
            <table>
              <thead><tr><th>Symptom</th><th>Days / cycle</th><th>Trend</th></tr></thead>
              <tbody>
                {symptoms.map((id) => {
                  const a = first.symptomDays[id] ?? 0;
                  const b = last.symptomDays[id] ?? 0;
                  return (
                    <tr key={id}>
                      <td>{symptomLabel(id, data.customSymptoms)}</td>
                      <td>{stats.length > 1 ? `${a} → ${b}` : b}</td>
                      <td style={{ fontWeight: 700 }}>{stats.length < 2 ? '' : b < a ? '↓ less' : b > a ? '↑ more' : '→ same'}</td>
                    </tr>
                  );
                })}
                {!symptoms.length && <tr><td colSpan={3} className="muted">No symptoms logged.</td></tr>}
              </tbody>
            </table>
          </section>
          <section className="stack" style={{ gap: 8 }}>
            <h2>Routine: treatment &amp; self-care</h2>
            <table>
              <thead><tr><th>What</th><th>Since</th><th>Taken</th></tr></thead>
              <tbody>
                {treatments.map((p) => {
                  const ad = adherence(data, p, from, to);
                  return (
                    <tr key={p.id}>
                      <td>{p.name}{p.detail ? <span className="muted"> · {p.detail}</span> : null}{p.endDate ? <span className="muted"> (stopped {formatDate(p.endDate)})</span> : null}</td>
                      <td>{formatDate(p.startDate, { month: 'short', year: 'numeric' })}</td>
                      <td>{p.asNeeded ? `${ad.done} times` : ad.days ? `${Math.round((ad.done / ad.days) * 100)}% of days` : '–'}</td>
                    </tr>
                  );
                })}
                {!treatments.length && <tr><td colSpan={3} className="muted">Nothing recorded.</td></tr>}
              </tbody>
            </table>
          </section>
        </div>

        <div className="report-cols">
          <section className="stack" style={{ gap: 8 }}>
            <h2>Possible side effects noted</h2>
            {sideEffects.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>{sideEffects.map((s) => <li key={s}>{s}</li>)}</ul>
            ) : (
              <p className="muted">None stood out in the logged data.</p>
            )}
          </section>
          <section className="stack" style={{ gap: 8 }}>
            <h2><label htmlFor="questions">Questions for my doctor</label></h2>
            <textarea
              id="questions"
              className="textarea no-print"
              rows={4}
              placeholder="e.g. Is the spotting on my medication expected to settle?"
              value={data.questions}
              onChange={(e) => update((d) => ({ ...d, questions: e.target.value }))}
              style={{ background: '#fbfafc', color: '#1e1a22', borderColor: '#e4dfe9' }}
            />
            <div className="print-only" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{data.questions || '—'}</div>
          </section>
        </div>

        <footer className="between tiny muted" style={{ paddingTop: 12, borderTop: '1px solid #e4dfe9', flexWrap: 'wrap' }}>
          <span>Self-reported data from Endo Journal. Pain scale 0 = none, 10 = worst imaginable. Blank cells = day not logged.</span>
        </footer>
      </article>
    </div>
  );
}
