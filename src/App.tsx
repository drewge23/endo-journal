import { useEffect, useState } from 'react';
import { BookIcon, CalendarIcon, ChartIcon, DropIcon, GearIcon, ListIcon } from './components/Icons';
import Insights from './screens/Insights';
import Library from './screens/Library';
import Plan from './screens/Plan';
import Report from './screens/Report';
import Settings from './screens/Settings';
import Today from './screens/Today';

const ROUTES = ['today', 'plan', 'insights', 'library', 'report', 'settings'] as const;
export type Route = (typeof ROUTES)[number];

function readRoute(): Route {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'today';
}

const TABS: { route: Route; label: string; icon: JSX.Element }[] = [
  { route: 'today', label: 'Today', icon: <CalendarIcon /> },
  { route: 'plan', label: 'My plan', icon: <ListIcon /> },
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
        {route === 'plan' && <Plan />}
        {route === 'insights' && <Insights />}
        {route === 'library' && <Library />}
        {route === 'report' && <Report />}
        {route === 'settings' && <Settings />}
      </main>
    </div>
  );
}
