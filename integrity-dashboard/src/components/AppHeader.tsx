import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { NAVIGATION_ITEMS } from '../navigation';

const short = (value?: string | null, start = 10, end = 8) => {
  if (!value) return 'Unavailable';
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

export function AppHeader() {
  const location = useLocation();
  const { agents, selectedAgent, setSelectedAgent, agentsLoading } = useDashboard();

  // Derived from NAVIGATION_ITEMS so the title in the chrome and the label in
  // the sidebar cannot drift apart. The hand-written map this replaces had gone
  // stale in exactly that way: it titled /security "Overview", a name that
  // appears nowhere in the navigation and on a route that redirects away.
  const tabTitles: Record<string, string> = Object.fromEntries([
    ...NAVIGATION_ITEMS.flatMap(item =>
      [item.to, ...(item.aliases ?? [])].map(path => [path.slice(1), item.label] as const)),
    ['settings', 'Workspace settings'],
  ]);

  const routeTab = location.pathname.slice(1) || 'dashboard';

  return (
    <header className="protocol-topbar">
      <div>
        <span className="protocol-kicker">Integrity protocol backbone</span>
        <h1>{tabTitles[routeTab] || 'Dashboard'}</h1>
      </div>
      <div className="protocol-top-actions">
        <label>Selected agent namespace
          <select aria-label="Selected agent namespace" value={selectedAgent?.namespace_key || selectedAgent?.id || ''} onChange={event => { const next = agents.find(agent => (agent.namespace_key || agent.id) === event.target.value); if (next) setSelectedAgent(next); }}>
            <option value="">{agentsLoading ? 'Loading agents…' : 'No agent selected'}</option>
            {agents.map(agent => <option key={agent.namespace_key || agent.id} value={agent.namespace_key || agent.id}>{agent.alias || agent.name || short(agent.id)}{agent.profile_id ? ` · ${agent.profile_id} · ${agent.writable === false || agent.store_access === 'read_only' ? 'read only' : 'writable'}` : agent.namespace_state === 'unavailable' ? ' · Cortex namespace unavailable' : ''}</option>)}
          </select>
        </label>
        <button className="icon-button" aria-label="Refresh data"><RefreshCw size={16} /></button>
        <span className="wallet-connection"><i />Wallet offline</span>
      </div>
    </header>
  );
}
