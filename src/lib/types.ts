export type Flow = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type Severity = 1 | 2 | 3;

export interface DayEntry {
  date: string; // YYYY-MM-DD
  pain: number | null; // 0–10
  energy: number | null; // 0–10
  flow: Flow;
  symptoms: Record<string, Severity>; // symptom id → severity
  done: string[]; // plan item ids taken / done that day
  extras: string[]; // free-text extra meds or food
  note: string;
}

export type PlanKind = 'medication' | 'lifestyle' | 'supplement' | 'diet' | 'holistic';

export const KINDS: { id: PlanKind; label: string; one: string }[] = [
  { id: 'medication', label: 'Medications', one: 'Medication' },
  { id: 'lifestyle', label: 'Lifestyle', one: 'Lifestyle' },
  { id: 'supplement', label: 'Supplements', one: 'Supplement' },
  { id: 'diet', label: 'Dietary', one: 'Dietary' },
  { id: 'holistic', label: 'Holistic', one: 'Holistic' },
];

/** Routine items in category order: medications first, then lifestyle, supplements, dietary, holistic. */
export const byKind = <T extends { kind: PlanKind }>(items: T[]): T[] => {
  const rank = (k: PlanKind) => KINDS.findIndex((x) => x.id === k);
  return [...items].sort((a, b) => rank(a.kind) - rank(b.kind));
};

export interface PlanItem {
  id: string;
  name: string;
  kind: PlanKind;
  detail: string;
  startDate: string;
  endDate: string | null;
  asNeeded: boolean; // not expected daily (e.g. painkillers)
  painkiller: boolean; // counted as a painkiller dose
  watch: string; // side effects to watch for
  libraryId?: string;
}

export interface CustomSymptom {
  id: string;
  label: string;
}

export interface Profile {
  name: string;
  dob: string;
  diagnosis: string;
}

export interface AppData {
  version: 1;
  entries: Record<string, DayEntry>;
  plan: PlanItem[];
  customSymptoms: CustomSymptom[];
  avoiding: string[];
  cycleLength: number;
  periodStarts: string[]; // manually set period start dates
  profile: Profile;
  questions: string;
}

export const emptyData = (): AppData => ({
  version: 1,
  entries: {},
  plan: [],
  customSymptoms: [],
  avoiding: [],
  cycleLength: 28,
  periodStarts: [],
  profile: { name: '', dob: '', diagnosis: '' },
  questions: '',
});

export const emptyEntry = (date: string): DayEntry => ({
  date,
  pain: null,
  energy: null,
  flow: 'none',
  symptoms: {},
  done: [],
  extras: [],
  note: '',
});

export const isEmptyEntry = (e: DayEntry) =>
  e.pain === null &&
  e.energy === null &&
  e.flow === 'none' &&
  !Object.keys(e.symptoms).length &&
  !e.done.length &&
  !e.extras.length &&
  !e.note.trim();
