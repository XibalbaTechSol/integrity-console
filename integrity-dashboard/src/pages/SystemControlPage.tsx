import { useState } from 'react';
import { Activity, BookOpen, ScrollText } from 'lucide-react';
import { SubTabs } from '../components/ui/SubTabs';
import HealthPage from './HealthPage';
import WikiPage from './WikiPage';
import PolicyPacksPage from './PolicyPacksPage';

const TABS = [
  { id: 'health', label: 'Service health', icon: <Activity size={14} /> },
  { id: 'policies', label: 'Policy packs', icon: <ScrollText size={14} /> },
  { id: 'wiki', label: 'Knowledge base', icon: <BookOpen size={14} /> },
];

export default function SystemControlPage() {
  const [tab, setTab] = useState('health');

  return (
    <div className="control-page control-page-full operations-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="control-page-header">
        <div>
          <p className="eyebrow">Shared operational tools</p>
          <h2>Operations</h2>
          <p className="control-page-description">
            Runtime health, policy packs, and documentation in one place.
          </p>
        </div>
        <Activity size={28} aria-hidden="true" />
      </div>
      <SubTabs tabs={TABS} activeTab={tab} setActiveTab={setTab} />
      <div style={{ marginTop: 'var(--space-2)' }}>
        {tab === 'health' && <HealthPage />}
        {tab === 'policies' && <PolicyPacksPage />}
        {tab === 'wiki' && <WikiPage />}
      </div>
    </div>
  );
}
