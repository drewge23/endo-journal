import { rangeDays } from './dates';
import type { Cycle } from './cycle';
import type { AppData, PlanItem } from './types';

export interface CycleStats {
  cycle: Cycle;
  loggedDays: number;
  avgPain: number | null;
  maxPain: number | null;
  avgEnergy: number | null;
  painDays: number; // days with pain ≥ 5
  bleedDays: number;
  painkillerDoses: number;
  symptomDays: Record<string, number>;
  painByDay: (number | null)[];
}

export const PAIN_THRESHOLD = 5;
const MIN_LOGGED = 5; // a cycle with fewer logged days is too sparse to compare

export function cycleStats(data: AppData, cycle: Cycle): CycleStats {
  const painkillers = new Set(data.plan.filter((p) => p.painkiller).map((p) => p.id));
  const days = rangeDays(cycle.start, cycle.end);
  let logged = 0;
  let painSum = 0;
  let painN = 0;
  let maxPain: number | null = null;
  let energySum = 0;
  let energyN = 0;
  let painDays = 0;
  let bleedDays = 0;
  let doses = 0;
  const symptomDays: Record<string, number> = {};
  const painByDay = days.map((d) => {
    const e = data.entries[d];
    if (!e) return null;
    logged++;
    if (e.flow === 'light' || e.flow === 'medium' || e.flow === 'heavy') bleedDays++;
    doses += e.done.filter((id) => painkillers.has(id)).length;
    for (const id of Object.keys(e.symptoms)) symptomDays[id] = (symptomDays[id] ?? 0) + 1;
    if (e.energy != null) {
      energySum += e.energy;
      energyN++;
    }
    if (e.pain === null) return null;
    painSum += e.pain;
    painN++;
    maxPain = maxPain === null ? e.pain : Math.max(maxPain, e.pain);
    if (e.pain >= PAIN_THRESHOLD) painDays++;
    return e.pain;
  });
  return {
    cycle,
    loggedDays: logged,
    avgPain: painN ? painSum / painN : null,
    maxPain,
    avgEnergy: energyN ? energySum / energyN : null,
    painDays,
    bleedDays,
    painkillerDoses: doses,
    symptomDays,
    painByDay,
  };
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Average pain per cycle day across several cycles. */
export function averagePainByDay(stats: CycleStats[], length: number): (number | null)[] {
  return Array.from({ length }, (_, i) => mean(stats.map((s) => s.painByDay[i]).filter((v): v is number => v != null)));
}

export interface Summary {
  avgPain: number | null;
  avgEnergy: number | null;
  painDays: number | null;
  painkillerDoses: number | null;
  symptomDays: Record<string, number>;
}

export function summarize(stats: CycleStats[]): Summary {
  const ids = new Set(stats.flatMap((s) => Object.keys(s.symptomDays)));
  const symptomDays: Record<string, number> = {};
  for (const id of ids) symptomDays[id] = mean(stats.map((s) => s.symptomDays[id] ?? 0)) ?? 0;
  return {
    avgPain: mean(stats.map((s) => s.avgPain).filter((v): v is number => v != null)),
    avgEnergy: mean(stats.map((s) => s.avgEnergy).filter((v): v is number => v != null)),
    painDays: mean(stats.map((s) => s.painDays)),
    painkillerDoses: mean(stats.map((s) => s.painkillerDoses)),
    symptomDays,
  };
}

export type Verdict = 'better' | 'worse' | 'unclear' | 'not-enough';

export interface Comparison {
  item: PlanItem;
  before: CycleStats[];
  during: CycleStats[];
  beforeSummary: Summary;
  duringSummary: Summary;
  verdict: Verdict;
  painChange: number | null; // relative change in average pain
  symptoms: { id: string; before: number; after: number }[];
  sideEffects: { id: string; before: number; after: number }[];
  confounders: PlanItem[];
}

/**
 * Compare up to 3 complete cycles before a plan item started with the
 * complete cycles since. Partial and sparsely logged cycles are left out.
 */
export function compareItem(data: AppData, cycles: Cycle[], item: PlanItem): Comparison {
  const usable = (c: Cycle) => c.complete;
  const before = cycles
    .filter((c) => usable(c) && c.end < item.startDate)
    .map((c) => cycleStats(data, c))
    .filter((s) => s.loggedDays >= MIN_LOGGED)
    .slice(-3);
  const during = cycles
    .filter((c) => usable(c) && c.start >= item.startDate && (!item.endDate || c.start <= item.endDate))
    .map((c) => cycleStats(data, c))
    .filter((s) => s.loggedDays >= MIN_LOGGED);
  const b = summarize(before);
  const a = summarize(during);

  let verdict: Verdict = 'not-enough';
  let painChange: number | null = null;
  if (before.length && during.length && b.avgPain != null && a.avgPain != null) {
    painChange = (a.avgPain - b.avgPain) / Math.max(b.avgPain, 0.5);
    verdict = painChange <= -0.15 ? 'better' : painChange >= 0.15 ? 'worse' : 'unclear';
  }

  const ids = [...new Set([...Object.keys(b.symptomDays), ...Object.keys(a.symptomDays)])];
  const symptoms = ids
    .map((id) => ({ id, before: b.symptomDays[id] ?? 0, after: a.symptomDays[id] ?? 0 }))
    .sort((x, y) => Math.max(y.before, y.after) - Math.max(x.before, x.after));
  const sideEffects = before.length && during.length ? symptoms.filter((s) => s.after - s.before >= 2) : [];

  let confounders: PlanItem[] = [];
  if (before.length && during.length) {
    const from = before[0].cycle.start;
    const to = during[during.length - 1].cycle.end;
    const inWindow = (d: string | null) => !!d && d > from && d <= to;
    confounders = data.plan.filter((p) => p.id !== item.id && (inWindow(p.startDate) || inWindow(p.endDate)));
  }

  return { item, before, during, beforeSummary: b, duringSummary: a, verdict, painChange, symptoms, sideEffects, confounders };
}

export function isActiveOn(item: PlanItem, date: string): boolean {
  return item.startDate <= date && (!item.endDate || item.endDate >= date);
}

/** Share of logged days an item was marked done, from its start (or `start`) to `end`. */
export function adherence(data: AppData, item: PlanItem, start: string, end: string): { done: number; days: number } {
  const from = item.startDate > start ? item.startDate : start;
  const to = item.endDate && item.endDate < end ? item.endDate : end;
  let done = 0;
  let days = 0;
  if (from > to) return { done, days };
  for (const d of rangeDays(from, to)) {
    const e = data.entries[d];
    if (!e) continue;
    days++;
    if (e.done.includes(item.id)) done++;
  }
  return { done, days };
}
