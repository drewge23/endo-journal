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

export function symptomLabel(id: string, custom: CustomSymptom[]): string {
  return KNOWN_SYMPTOMS.find((s) => s.id === id)?.label ?? custom.find((s) => s.id === id)?.label ?? id;
}

export const SEVERITY_NAMES = ['', 'Mild', 'Moderate', 'Severe'] as const;
