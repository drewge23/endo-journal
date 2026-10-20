import { addDays, todayIso } from './dates';
import { emptyData, type AppData, type DayEntry, type Flow, type PlanItem, type Severity } from './types';

/** Five months of made-up entries so every screen has something to show. */
export function sampleData(today = todayIso()): AppData {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const lengths = [29, 28, 29, 28, 27];
  const starts: string[] = [];
  let s = addDays(today, -2); // today is cycle day 3
  starts.unshift(s);
  for (let i = lengths.length - 1; i >= 0; i--) {
    s = addDays(s, -lengths[i]);
    starts.unshift(s);
  }
  const seedStart = starts[3];

  const plan: PlanItem[] = [
    { id: 'dienogest', name: 'Dienogest 2 mg', kind: 'medication', detail: 'Daily · morning', startDate: addDays(starts[0], -60), endDate: null, asNeeded: false, painkiller: false, watch: 'spotting, mood, headache', libraryId: 'hormonal' },
    { id: 'ibuprofen', name: 'Ibuprofen 400 mg', kind: 'medication', detail: 'As needed, max 3× a day', startDate: addDays(starts[0], -60), endDate: null, asNeeded: true, painkiller: true, watch: 'stomach upset', libraryId: 'nsaid' },
    { id: 'seeds', name: 'Seed cycling', kind: 'method', detail: '1 tbsp each, ground', startDate: seedStart, endDate: null, asNeeded: false, painkiller: false, watch: 'bloating', libraryId: 'seed-cycling' },
    { id: 'antiinf', name: 'Anti-inflammatory eating', kind: 'habit', detail: 'Veg, oily fish, legumes, olive oil', startDate: addDays(starts[4], 3), endDate: null, asNeeded: false, painkiller: false, watch: '', libraryId: 'anti-inflammatory' },
    { id: 'walk', name: 'Gentle movement', kind: 'habit', detail: '20 min walk or yoga', startDate: addDays(starts[0], -30), endDate: null, asNeeded: false, painkiller: false, watch: '', libraryId: 'movement' },
  ];

  const basePain = (day: number, len: number) => {
    if (day <= 3) return 7 - (day - 1);
    if (day <= 6) return 4 - (day - 4);
    if (Math.abs(day - (len - 14)) <= 1) return 3;
    if (day > len - 5) return 3 + (day - (len - 5));
    return 1;
  };
  const flows: Flow[] = ['heavy', 'heavy', 'medium', 'light', 'spotting'];
  const entries: Record<string, DayEntry> = {};

  for (let c = 0; c < starts.length; c++) {
    const len = lengths[c] ?? 28;
    const onSeeds = starts[c] >= seedStart;
    for (let day = 1; day <= len; day++) {
      const date = addDays(starts[c], day - 1);
      if (date > today) break;
      if (rand() < 0.1 && day > 3) continue; // missed a day
      const factor = onSeeds ? 0.75 : 1;
      const pain = Math.max(0, Math.min(10, Math.round(basePain(day, len) * factor + (rand() - 0.5) * 2)));
      const symptoms: Record<string, Severity> = {};
      const sev = (p: number): Severity => (p >= 7 ? 3 : p >= 4 ? 2 : 1);
      if (pain >= 3) symptoms['pelvic-pain'] = sev(pain);
      if (day <= 3) symptoms['cramps'] = sev(pain + 1);
      if (pain >= 5 && rand() < 0.5) symptoms['back-pain'] = sev(pain - 1);
      if (rand() < (onSeeds ? 0.22 : 0.35)) symptoms['bloating'] = rand() < 0.3 ? 2 : 1;
      if (rand() < 0.4) symptoms['fatigue'] = rand() < 0.3 ? 2 : 1;
      if (day <= 2 && rand() < (onSeeds ? 0.4 : 0.6)) symptoms['dyschezia'] = 2;
      if (day > 8 && rand() < (c >= 4 ? 0.2 : 0.05)) symptoms['spotting'] = 1;
      if (day > len - 8 && rand() < 0.25) symptoms['low-mood'] = 1;
      const done = ['dienogest'];
      if (pain >= 6) done.push('ibuprofen');
      if (onSeeds && rand() < 0.92) done.push('seeds');
      if (date >= plan[3].startDate && rand() < 0.7) done.push('antiinf');
      if (rand() < 0.6) done.push('walk');
      entries[date] = {
        date,
        pain,
        flow: day <= 5 ? flows[day - 1] : symptoms['spotting'] ? 'spotting' : 'none',
        symptoms,
        done,
        extras: [],
        note: '',
      };
    }
  }

  return {
    ...emptyData(),
    entries,
    plan,
    customSymptoms: [{ id: 'c-jaw', label: 'Jaw tension' }],
    avoiding: ['Gluten', 'Dairy', 'Alcohol'],
    profile: { name: 'Sample patient', dob: '', diagnosis: 'Laparoscopy, 2023' },
  };
}
