/* eslint-disable @typescript-eslint/no-unused-vars */
import { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import './index.css';
import LandingPage from './LandingPage';
import AuthPage from './pages/AuthPage';
import DocsPage from './pages/DocsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

import { DashboardProvider } from './context/DashboardContext';
import { SettingsProvider } from './context/SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import MainAppLayout from './layouts/MainAppLayout';
import PublicLayout from './layouts/PublicLayout';

// Canonical 5-pillar application pages
import ProtocolDashboardPage from './pages/ProtocolDashboardPage';
import { AgentIdentityHubPage } from './pages/AgentIdentityHubPage';
import { CortexMemoryPage } from './pages/CortexMemoryPage';
import { ShieldDefensePage } from './pages/ShieldDefensePage';
import { AisPage } from './pages/AisPage';

// Auxiliary operational views
import SettingsPage from './pages/SettingsPage';

const WikiPage = lazy(() => import('./pages/WikiPage'));

function App() {
  return (
    <ErrorBoundary fallbackTitle="Integrity Console encounter error">
      <SettingsProvider>
        <DashboardProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<PublicLayout />}>
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>
            <Route element={<MainAppLayout />}>
              {/* 5 Canonical Core Surfaces */}
              <Route path="/dashboard" element={<ProtocolDashboardPage />} />
              <Route path="/identity" element={<AgentIdentityHubPage />} />
              <Route path="/cortex" element={<CortexMemoryPage />} />
              <Route path="/shield" element={<ShieldDefensePage />} />
              <Route path="/intelligence" element={<AisPage />} />

              {/* Auxiliary & Settings */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/wiki"
                element={
                  <Suspense fallback={<div style={{ minHeight: '100vh', background: '#07111d' }} />}>
                    <WikiPage />
                  </Suspense>
                }
              />

              {/* Canonical Redirects and Legacy Route Convergence */}
              <Route path="/ais" element={<Navigate to="/intelligence" replace />} />
              <Route path="/evidence" element={<Navigate to="/intelligence" replace />} />
              <Route path="/health" element={<Navigate to="/shield" replace />} />
              <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
              <Route path="/agents" element={<Navigate to="/identity" replace />} />
              <Route path="/agent0" element={<Navigate to="/identity" replace />} />
              <Route path="/passport" element={<Navigate to="/identity" replace />} />
              <Route path="/erc8004" element={<Navigate to="/identity" replace />} />
              <Route path="/fleet" element={<Navigate to="/identity" replace />} />
              <Route path="/treasury" element={<Navigate to="/identity" replace />} />
              <Route path="/wallets" element={<Navigate to="/identity" replace />} />
              <Route path="/transactions" element={<Navigate to="/identity" replace />} />
              <Route path="/financials" element={<Navigate to="/identity" replace />} />
              <Route path="/quant" element={<Navigate to="/identity" replace />} />
              <Route path="/prediction-markets" element={<Navigate to="/identity" replace />} />

              <Route path="/memory" element={<Navigate to="/cortex" replace />} />
              <Route path="/knowledge" element={<Navigate to="/cortex" replace />} />

              <Route path="/security" element={<Navigate to="/shield" replace />} />
              <Route path="/protection" element={<Navigate to="/shield" replace />} />
              <Route path="/kernel" element={<Navigate to="/shield" replace />} />
              <Route path="/kernel-intent" element={<Navigate to="/shield" replace />} />

              <Route path="/records" element={<Navigate to="/intelligence" replace />} />
              <Route path="/proofs" element={<Navigate to="/intelligence" replace />} />
              <Route path="/contracts" element={<Navigate to="/intelligence" replace />} />
              <Route path="/activity" element={<Navigate to="/intelligence" replace />} />
              <Route path="/correlation" element={<Navigate to="/intelligence" replace />} />

              <Route path="/system" element={<Navigate to="/dashboard" replace />} />
              <Route path="/licence" element={<Navigate to="/dashboard" replace />} />
              <Route path="/developer" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </DashboardProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
