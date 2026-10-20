import type { PlanKind } from './types';

export type Evidence = 'guideline' | 'some' | 'limited' | 'anecdotal';

export const EVIDENCE: Record<Evidence, { label: string; long: string }> = {
  guideline: { label: 'Guidelines', long: 'In clinical guidelines' },
  some: { label: 'Some studies', long: 'Some studies' },
  limited: { label: 'Limited', long: 'Limited / early' },
  anecdotal: { label: 'Anecdotal', long: 'Anecdotal only' },
};

export type Category = 'Medical' | 'Diet' | 'Body & movement' | 'Pain relief';

export interface Method {
  id: string;
  name: string;
  category: Category;
  evidence: Evidence;
  blurb: string;
  track: string;
  kind: PlanKind;
  defaultDetail: string;
  asNeeded?: boolean;
  painkiller?: boolean;
  watch?: string;
}

export const LIBRARY: Method[] = [
  {
    id: 'hormonal',
    name: 'Hormonal therapy',
    category: 'Medical',
    evidence: 'guideline',
    blurb: 'Progestins (e.g. dienogest), combined pill or GnRH analogues to suppress the cycle and reduce pain. Prescribed by your doctor.',
    track: 'bleeding, mood, headaches',
    kind: 'medication',
    defaultDetail: 'Daily · as prescribed',
    watch: 'spotting, mood, headache',
  },
  {
    id: 'nsaid',
    name: 'NSAID pain relief',
    category: 'Pain relief',
    evidence: 'guideline',
    blurb: 'Ibuprofen or naproxen, often started just before the period. Log each dose to see how many you need.',
    track: 'doses per cycle, stomach',
    kind: 'medication',
    defaultDetail: 'As needed',
    asNeeded: true,
    painkiller: true,
    watch: 'stomach upset',
  },
  {
    id: 'pelvic-physio',
    name: 'Pelvic floor physiotherapy',
    category: 'Body & movement',
    evidence: 'some',
    blurb: 'Specialist physio to relax tight pelvic muscles. May help pain during sex and bowel pain.',
    track: 'pain during sex, pelvic pain',
    kind: 'habit',
    defaultDetail: 'Home exercises',
  },
  {
    id: 'heat-tens',
    name: 'Heat & TENS',
    category: 'Pain relief',
    evidence: 'some',
    blurb: 'Heat pads or a TENS unit on the lower belly or back during flares.',
    track: 'pain on flare days',
    kind: 'method',
    defaultDetail: 'During flares',
    asNeeded: true,
  },
  {
    id: 'low-fodmap',
    name: 'Low-FODMAP diet',
    category: 'Diet',
    evidence: 'some',
    blurb: 'A short elimination diet that can ease bloating and bowel symptoms when endometriosis overlaps with IBS. Best done with a dietitian.',
    track: 'bloating, bowel pain',
    kind: 'habit',
    defaultDetail: 'Elimination phase',
  },
  {
    id: 'anti-inflammatory',
    name: 'Anti-inflammatory eating',
    category: 'Diet',
    evidence: 'limited',
    blurb: 'More vegetables, oily fish, legumes and olive oil; less red meat, alcohol and processed food.',
    track: 'pain, fatigue, bloating',
    kind: 'habit',
    defaultDetail: 'Veg, oily fish, legumes, olive oil',
  },
  {
    id: 'omega3',
    name: 'Omega-3 supplement',
    category: 'Diet',
    evidence: 'limited',
    blurb: 'Fish or algae oil. Small studies suggest it may reduce period pain.',
    track: 'period pain',
    kind: 'habit',
    defaultDetail: '1 capsule with lunch',
  },
  {
    id: 'movement',
    name: 'Gentle movement',
    category: 'Body & movement',
    evidence: 'limited',
    blurb: 'Walking, yoga or stretching. Evidence for endometriosis pain is limited, but it helps general wellbeing and sleep.',
    track: 'pain, fatigue, mood',
    kind: 'habit',
    defaultDetail: '20 min walk, yoga or stretching',
  },
  {
    id: 'acupuncture',
    name: 'Acupuncture',
    category: 'Body & movement',
    evidence: 'limited',
    blurb: 'Some small trials report less pain; results vary between studies.',
    track: 'pain on session weeks',
    kind: 'method',
    defaultDetail: 'Weekly session',
    asNeeded: true,
  },
  {
    id: 'seed-cycling',
    name: 'Seed cycling',
    category: 'Diet',
    evidence: 'anecdotal',
    blurb: 'Flax + pumpkin seeds in the first half of the cycle, sesame + sunflower in the second. Popular, but not tested in clinical studies.',
    track: 'pain, cycle length, bloating',
    kind: 'method',
    defaultDetail: '1 tbsp each, ground',
    watch: 'bloating',
  },
];
