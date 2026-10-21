import { useEffect, useState } from 'react';
import { BookIcon, CalendarIcon, GridIcon, ChartIcon, DropIcon, GearIcon, ListIcon } from './components/Icons';
import Calendar from './screens/Calendar';
import Insights from './screens/Insights';
import Library from './screens/Library';
import Report from './screens/Report';
import Routine from './screens/Routine';
import Settings from './screens/Settings';
import Today from './screens/Today';

const ROUTES = ['today', 'calendar', 'routine', 'insights', 'library', 'report', 'settings'] as const;
export type Route = (typeof ROUTES)[number];

function readRoute(): Route {
  let r = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (r === 'plan') r = 'routine'; // old links
  return (ROUTES as readonly string[]).includes(r) ? (r as Route) : 'today';
}

const TABS: { route: Route; label: string; icon: JSX.Element }[] = [
  { route: 'today', label: 'Today', icon: <CalendarIcon /> },
  { route: 'calendar', label: 'Calendar', icon: <GridIcon /> },
  { route: 'routine', label: 'My routine', icon: <ListIcon /> },
  { route: 'insights', label: 'Insights', icon: <ChartIcon /> },
  { route: 'library', label: 'Library', icon: <BookIcon /> },
];

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const on = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const active = route === 'report' ? 'insights' : route;

  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        <div className="brand">
          <span style={{ color: 'var(--accent)', display: 'flex' }}><DropIcon /></span>
          Endo Journal
        </div>
        {TABS.map((t) => (
          <a key={t.route} href={`#/${t.route}`} aria-current={active === t.route ? 'page' : undefined}>
            {t.icon}
            {t.label}
          </a>
        ))}
        <a className="nav-settings" href="#/settings" aria-current={active === 'settings' ? 'page' : undefined}>
          <GearIcon />
          Settings
        </a>
      </nav>
      <main className="main">
        {route === 'today' && <Today />}
        {route === 'calendar' && <Calendar />}
        {route === 'routine' && <Routine />}
        {route === 'insights' && <Insights />}
        {route === 'library' && <Library />}
        {route === 'report' && <Report />}
        {route === 'settings' && <Settings />}
      </main>
    </div>
  );
}
