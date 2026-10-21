import type { CustomSymptom } from './types';

export const KNOWN_SYMPTOMS: { id: string; label: string }[] = [
  { id: 'pelvic-pain', label: 'Pelvic pain' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'back-pain', label: 'Lower back pain' },
  { id: 'leg-pain', label: 'Leg / sciatic pain' },
  { id: 'dyspareunia', label: 'Pain during sex' },
  { id: 'dyschezia', label: 'Painful bowel movements' },
  { id: 'dysuria', label: 'Painful urination' },
  { id: 'bloating', label: 'Bloating (endo belly)' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'headache', label: 'Headache' },
  { id: 'heavy-bleeding', label: 'Heavy bleeding' },
  { id: 'spotting', label: 'Spotting between periods' },
  { id: 'brain-fog', label: 'Brain fog' },
  { id: 'low-mood', label: 'Low mood' },
  { id: 'insomnia', label: 'Insomnia' },
];

/** Common side effects of endometriosis medications (hormonal treatment, GnRH drugs, NSAIDs). */
export const SIDE_EFFECTS: { id: string; label: string }[] = [
  { id: 'hot-flashes', label: 'Hot flashes' },
  { id: 'night-sweats', label: 'Night sweats' },
  { id: 'vaginal-dryness', label: 'Vaginal dryness' },
  { id: 'breast-tenderness', label: 'Breast tenderness' },
  { id: 'mood-swings', label: 'Mood swings / irritability' },
  { id: 'low-libido', label: 'Low libido' },
  { id: 'weight-gain', label: 'Weight gain' },
  { id: 'acne', label: 'Acne / oily skin' },
  { id: 'hair-thinning', label: 'Hair thinning' },
  { id: 'joint-pain', label: 'Joint or muscle aches' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'heartburn', label: 'Stomach upset / heartburn' },
];

export function symptomLabel(id: string, custom: CustomSymptom[]): string {
  return (
    KNOWN_SYMPTOMS.find((s) => s.id === id)?.label ??
    SIDE_EFFECTS.find((s) => s.id === id)?.label ??
    custom.find((s) => s.id === id)?.label ??
    id
  );
}

export const SEVERITY_NAMES = ['', 'Mild', 'Moderate', 'Severe'] as const;
