import { useMemo } from 'react';
import { averageCycleLength, getCycles } from './cycle';
import { todayIso } from './dates';
import { useStore } from './store';

export function useCycles() {
  const { data } = useStore();
  const today = todayIso();
  return useMemo(() => {
    const cycles = getCycles(data, today);
    return { cycles, today, cycleLength: averageCycleLength(cycles, data.cycleLength) };
  }, [data, today]);
}

export const SEEDS = {
  1: 'Flax + pumpkin seeds',
  2: 'Sesame + sunflower seeds',
} as const;
