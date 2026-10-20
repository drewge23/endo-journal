import { addDays, diffDays } from './dates';
import type { AppData, Flow } from './types';

const BLEEDING: Flow[] = ['light', 'medium', 'heavy'];
const MIN_GAP = 12; // days: two starts closer than this belong to one period

/**
 * Period start dates: the ones set by hand plus any logged bleeding day
 * (light or heavier) that follows MIN_GAP days with no bleeding.
 */
export function periodStarts(data: AppData): string[] {
  const bleedDays = Object.values(data.entries)
    .filter((e) => BLEEDING.includes(e.flow))
    .map((e) => e.date)
    .sort();
  const auto: string[] = [];
  let last: string | null = null;
  for (const d of bleedDays) {
    if (last === null || diffDays(last, d) > MIN_GAP) auto.push(d);
    last = d;
  }
  const all = [...new Set([...data.periodStarts, ...auto])].sort();
  const merged: string[] = [];
  for (const d of all) {
    const prev = merged[merged.length - 1];
    if (prev && diffDays(prev, d) < MIN_GAP) continue;
    merged.push(d);
  }
  return merged;
}

export interface Cycle {
  number: number; // 1-based, oldest first
  start: string;
  end: string; // inclusive
  length: number;
  complete: boolean;
}

export function getCycles(data: AppData, today: string): Cycle[] {
  const starts = periodStarts(data).filter((d) => d <= today);
  return starts.map((start, i) => {
    const next = starts[i + 1];
    const end = next ? addDays(next, -1) : today;
    return { number: i + 1, start, end, length: diffDays(start, end) + 1, complete: !!next };
  });
}

export function cycleFor(date: string, cycles: Cycle[]): Cycle | null {
  for (let i = cycles.length - 1; i >= 0; i--) {
    if (cycles[i].start <= date) return cycles[i];
  }
  return null;
}

export function cycleDay(date: string, cycles: Cycle[]): number | null {
  const c = cycleFor(date, cycles);
  return c ? diffDays(c.start, date) + 1 : null;
}

export type Phase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

/** Estimated phase, assuming ovulation ~14 days before the next period. */
export function phaseFor(day: number, cycleLength: number): Phase {
  const ovulation = Math.max(cycleLength - 14, 6);
  if (day <= 5) return 'Menstrual';
  if (day < ovulation - 1) return 'Follicular';
  if (day <= ovulation + 1) return 'Ovulatory';
  return 'Luteal';
}

/** Seed cycling switches at the estimated ovulation day. */
export function seedPhase(day: number, cycleLength: number): 1 | 2 {
  return day <= Math.max(cycleLength - 14, 6) ? 1 : 2;
}

export function averageCycleLength(cycles: Cycle[], fallback: number): number {
  const done = cycles.filter((c) => c.complete).slice(-6);
  if (!done.length) return fallback;
  return Math.round(done.reduce((s, c) => s + c.length, 0) / done.length);
}
