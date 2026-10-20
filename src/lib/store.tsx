import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { emptyData, type AppData } from './types';

const KEY = 'endo-journal:v1';

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyData(), ...JSON.parse(raw) };
  } catch {
    // unreadable storage: start fresh
  }
  return emptyData();
}

/** Accepts a parsed backup file; throws if it doesn't look like one. */
export function parseBackup(text: string): AppData {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object' || !Array.isArray(parsed.plan)) {
    throw new Error('This file is not an Endo Journal backup.');
  }
  return { ...emptyData(), ...parsed };
}

type Updater = (fn: (d: AppData) => AppData) => void;

const Ctx = createContext<{ data: AppData; update: Updater; replace: (d: AppData) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data]);

  const update = useCallback<Updater>((fn) => setData((d) => fn(d)), []);

  return (
    <Ctx.Provider value={{ data, update, replace: setData }}>
      {saveError && (
        <div role="alert" className="save-error">
          Your browser didn’t let us save. Export a backup from Settings so nothing is lost.
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
