import type { ReactNode } from 'react';

const Svg = ({ size = 22, children, sw = 2 }: { size?: number; children: ReactNode; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

type P = { size?: number };

export const CalendarIcon = (p: P) => (
  <Svg {...p}><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></Svg>
);
export const ListIcon = (p: P) => (
  <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></Svg>
);
export const ChartIcon = (p: P) => (
  <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>
);
export const BookIcon = (p: P) => (
  <Svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5" /></Svg>
);
export const GearIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Svg>
);
export const DropIcon = (p: P) => (
  <Svg {...p}><path d="M12 2.7c-3.3 4.2-6 7.6-6 11.1a6 6 0 0 0 12 0c0-3.5-2.7-6.9-6-11.1z" /></Svg>
);
export const PlusIcon = (p: P) => (
  <Svg {...p} sw={2.4}><path d="M12 5v14M5 12h14" /></Svg>
);
export const CheckIcon = (p: P) => (
  <Svg {...p} sw={3}><path d="M5 12l5 5 9-10" /></Svg>
);
export const ChevronLeft = (p: P) => (
  <Svg {...p} sw={2.2}><path d="M15 6l-6 6 6 6" /></Svg>
);
export const ChevronRight = (p: P) => (
  <Svg {...p} sw={2.2}><path d="M9 6l6 6-6 6" /></Svg>
);
export const InfoIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16v.5" /></Svg>
);
export const PillIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-45 12 12.5)" /><path d="M9.5 10l5 5" /></Svg>
);
export const LeafIcon = (p: P) => (
  <Svg {...p}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19l7-7" /></Svg>
);
export const FileIcon = (p: P) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></Svg>
);
export const XIcon = (p: P) => (
  <Svg {...p} sw={2.2}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const SearchIcon = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>
);
export const GridIcon = (p: P) => (
  <Svg {...p}><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 10h16M9 14h.01M12 14h.01M15 14h.01M9 17.5h.01M12 17.5h.01" /></Svg>
);
