import { useRef, useState } from 'react';
import { XIcon } from '../components/Icons';
import { periodStarts } from '../lib/cycle';
import { formatDate, todayIso } from '../lib/dates';
import { sampleData } from '../lib/sample';
import { parseBackup, useStore } from '../lib/store';
import { emptyData } from '../lib/types';

export default function Settings() {
  const { data, update, replace } = useStore();
  const [start, setStart] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const detected = periodStarts(data).filter((d) => !data.periodStarts.includes(d));
  const hasData = Object.keys(data.entries).length > 0 || data.plan.length > 0;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `endo-journal-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const next = parseBackup(await file.text());
      if (hasData && !confirm('Replace everything on this device with the backup?')) return;
      replace(next);
      setMsg(`Restored ${Object.keys(next.entries).length} days from the backup.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">Your data stays on this device</div>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="card">
        <h2>Cycle</h2>
        <label className="field" style={{ maxWidth: 220 }}>
          Usual cycle length (days)
          <input className="input" type="number" min={18} max={60} value={data.cycleLength} onChange={(e) => update((d) => ({ ...d, cycleLength: Number(e.target.value) || 28 }))} />
        </label>
        <p className="small muted">Once you have logged full cycles, the app uses their average length instead.</p>
        <div className="stack" style={{ gap: 8 }}>
          <div className="small" style={{ fontWeight: 700 }}>Period start dates</div>
          <p className="small muted" style={{ marginTop: -4 }}>Starts are detected from logged bleeding. Add any the app missed (for example, before you started using it).</p>
          <div className="chips">
            {data.periodStarts.map((d) => (
              <span key={d} className="chip" style={{ minHeight: 36 }}>
                {formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' })}
                <button type="button" aria-label={`Remove ${d}`} onClick={() => update((x) => ({ ...x, periodStarts: x.periodStarts.filter((p) => p !== d) }))} style={{ border: 0, background: 'none', display: 'flex', padding: 4 }}>
                  <XIcon size={14} />
                </button>
              </span>
            ))}
            {detected.map((d) => (
              <span key={d} className="chip" style={{ minHeight: 36, borderStyle: 'dashed' }} title="Detected from logged bleeding">
                {formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' })} · auto
              </span>
            ))}
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (start && !data.periodStarts.includes(start)) update((d) => ({ ...d, periodStarts: [...d.periodStarts, start].sort() })); setStart(''); }}>
            <label className="sr-only" htmlFor="ps">Add period start</label>
            <input id="ps" className="input" type="date" max={todayIso()} value={start} onChange={(e) => setStart(e.target.value)} />
            <button type="submit" className="btn">Add</button>
          </form>
        </div>
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="small muted">Everything is stored in this browser only. Export a backup file now and then, and import it to move to another device.</p>
        <div className="row wrap">
          <button type="button" className="btn primary" onClick={exportJson}>Export backup</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
        </div>
        {msg && <p role="status" className="small">{msg}</p>}
      </section>

      <section className="card">
        <h2>Sample data</h2>
        <p className="small muted">Fill the app with five months of made-up entries to see how Insights and the report work.</p>
        <div className="row wrap">
          <button type="button" className="btn" onClick={() => { if (!hasData || confirm('This replaces your current data. Continue?')) replace(sampleData()); }}>Load sample data</button>
          <button type="button" className="btn danger" onClick={() => { if (confirm('Delete all entries, your routine and settings from this device? This cannot be undone.')) replace(emptyData()); }}>Delete all data</button>
        </div>
      </section>
    </div>
  );
}
