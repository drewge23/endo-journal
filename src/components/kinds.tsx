import type { ReactNode } from 'react';
import type { PlanKind } from '../lib/types';

const Svg = ({ children, size = 16 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export function KindIcon({ kind, size }: { kind: PlanKind; size?: number }) {
  switch (kind) {
    case 'medication':
      return <Svg size={size}><rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-45 12 12.5)" /><path d="M9.5 10l5 5" /></Svg>;
    case 'lifestyle':
      return <Svg size={size}><path d="M3 12h4l3-7 4 14 3-7h4" /></Svg>;
    case 'supplement':
      return <Svg size={size}><rect x="7" y="8" width="10" height="13" rx="2" /><path d="M8 4h8v4H8zM7 13h10" /></Svg>;
    case 'diet':
      return <Svg size={size}><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M9 8c0-2 2-2 2-4M14 8c0-2 2-2 2-4" /></Svg>;
    case 'holistic':
      return <Svg size={size}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19l7-7" /></Svg>;
  }
}
