import { isActiveOn } from './stats';
import { emptyEntry, isEmptyEntry, type DayEntry, type PlanItem } from './types';

/**
 * Apply one day's worth of input to several days.
 * Default: anything filled in is added on top of what each day already has
 * (pain, energy and bleeding overwrite only when set; symptoms, routine items
 * and extras are merged; a note is appended). With `replace`, each day becomes
 * exactly the draft. Routine items only land on days they were active.
 */
export function applyToDays(
  entries: Record<string, DayEntry>,
  dates: string[],
  draft: DayEntry,
  plan: PlanItem[],
  replace: boolean,
): Record<string, DayEntry> {
  const out = { ...entries };
  for (const date of dates) {
    const activeDone = draft.done.filter((id) => {
      const item = plan.find((p) => p.id === id);
      return !item || isActiveOn(item, date);
    });
    let next: DayEntry;
    if (replace) {
      next = { ...draft, date, done: activeDone, symptoms: { ...draft.symptoms }, extras: [...draft.extras] };
    } else {
      const base = entries[date] ?? emptyEntry(date);
      const note = draft.note.trim();
      next = {
        ...base,
        pain: draft.pain ?? base.pain,
        energy: draft.energy ?? base.energy,
        flow: draft.flow !== 'none' ? draft.flow : base.flow,
        symptoms: { ...base.symptoms, ...draft.symptoms },
        done: [...new Set([...base.done, ...activeDone])],
        extras: [...new Set([...base.extras, ...draft.extras])],
        note: note ? (base.note.trim() ? `${base.note}\n${note}` : note) : base.note,
      };
    }
    if (isEmptyEntry(next)) delete out[date];
    else out[date] = next;
  }
  return out;
}
