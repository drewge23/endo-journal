import { describe, expect, it } from 'vitest';
import { getCycles, periodStarts, phaseFor, seedPhase } from './cycle';
import { addDays, diffDays } from './dates';
import { sampleData } from './sample';
import { compareItem, cycleStats } from './stats';
import { emptyData, emptyEntry } from './types';

describe('dates', () => {
  it('adds days across month and DST boundaries', () => {
    expect(addDays('2026-03-28', 3)).toBe('2026-03-31');
    expect(addDays('2026-10-24', 3)).toBe('2026-10-27');
    expect(diffDays('2026-01-30', '2026-03-01')).toBe(30);
  });
});

describe('cycles', () => {
  it('detects period starts from bleeding and merges manual ones', () => {
    const data = emptyData();
    for (const [d, flow] of [
      ['2026-08-01', 'heavy'],
      ['2026-08-02', 'medium'],
      ['2026-08-29', 'light'],
      ['2026-08-30', 'heavy'],
    ] as const) {
      data.entries[d] = { ...emptyEntry(d), flow };
    }
    data.periodStarts = ['2026-07-04', '2026-08-03'];
    expect(periodStarts(data)).toEqual(['2026-07-04', '2026-08-01', '2026-08-29']);
    const cycles = getCycles(data, '2026-09-05');
    expect(cycles.map((c) => [c.length, c.complete])).toEqual([
      [28, true],
      [28, true],
      [8, false],
    ]);
  });

  it('places phases relative to cycle length', () => {
    expect(phaseFor(2, 28)).toBe('Menstrual');
    expect(phaseFor(14, 28)).toBe('Ovulatory');
    expect(phaseFor(20, 28)).toBe('Luteal');
    expect(seedPhase(14, 28)).toBe(1);
    expect(seedPhase(15, 28)).toBe(2);
  });
});

describe('stats', () => {
  const today = '2026-10-20';
  const data = sampleData(today);
  const cycles = getCycles(data, today);

  it('builds sample cycles ending today on day 3', () => {
    expect(cycles).toHaveLength(6);
    expect(cycles[5].start).toBe('2026-10-18');
    expect(cycles[5].complete).toBe(false);
  });

  it('counts painkiller doses and pain days', () => {
    const s = cycleStats(data, cycles[0]);
    expect(s.loggedDays).toBeGreaterThan(20);
    expect(s.painkillerDoses).toBe(s.painByDay.filter((p) => p != null && p >= 6).length);
  });

  it('compares cycles before and during a method', () => {
    const seeds = data.plan.find((p) => p.id === 'seeds')!;
    const cmp = compareItem(data, cycles, seeds);
    expect(cmp.before).toHaveLength(3);
    expect(cmp.during).toHaveLength(2);
    expect(cmp.verdict).toBe('better');
    expect(cmp.confounders.map((p) => p.id)).toContain('antiinf');
  });
});

describe('normalize', () => {
  it('maps old routine types and adds energy', async () => {
    const { normalize } = await import('./store');
    const d = normalize({
      version: 1,
      entries: { '2026-10-01': { date: '2026-10-01', pain: 3, flow: 'none', symptoms: {}, done: [], extras: [], note: '' } as never },
      plan: [
        { id: 'a', name: 'Seeds', kind: 'method' as never, detail: '', startDate: '2026-09-01', endDate: null, asNeeded: false, painkiller: false, watch: '', libraryId: 'seed-cycling' },
        { id: 'b', name: 'Walk', kind: 'habit' as never, detail: '', startDate: '2026-09-01', endDate: null, asNeeded: false, painkiller: false, watch: '' },
        { id: 'c', name: 'Reiki', kind: 'method' as never, detail: '', startDate: '2026-09-01', endDate: null, asNeeded: false, painkiller: false, watch: '' },
      ],
    });
    expect(d.plan.map((p) => p.kind)).toEqual(['diet', 'lifestyle', 'holistic']);
    expect(d.entries['2026-10-01'].energy).toBeNull();
  });
});

describe('applyToDays', () => {
  it('merges into existing days and respects routine dates', async () => {
    const { applyToDays } = await import('./batch');
    const plan = [{ id: 'm', name: 'Mag', kind: 'supplement' as const, detail: '', startDate: '2026-10-14', endDate: null, asNeeded: false, painkiller: false, watch: '' }];
    const entries = { '2026-10-12': { ...emptyEntry('2026-10-12'), pain: 7, symptoms: { cramps: 3 as const }, note: 'bad day' } };
    const draft = { ...emptyEntry(''), energy: 4, symptoms: { bloating: 1 as const }, done: ['m'], note: 'flare week' };
    const out = applyToDays(entries, ['2026-10-12', '2026-10-13', '2026-10-14'], draft, plan, false);
    expect(out['2026-10-12']).toMatchObject({ pain: 7, energy: 4, symptoms: { cramps: 3, bloating: 1 }, done: [], note: 'bad day\nflare week' });
    expect(out['2026-10-14'].done).toEqual(['m']);
    const replaced = applyToDays(entries, ['2026-10-12'], draft, plan, true);
    expect(replaced['2026-10-12']).toMatchObject({ pain: null, symptoms: { bloating: 1 }, note: 'flare week' });
  });
});
