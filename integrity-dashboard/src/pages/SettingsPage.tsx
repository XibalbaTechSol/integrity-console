/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useDashboard } from '../context/DashboardContext';
import { Settings, Key, Palette, Type, Layout, Trash2, Plus, Copy, CheckCircle, Shield } from 'lucide-react';
import { PrivacyPanel } from '../components/tabs/PrivacyPanel';
import { SubTabs } from '../components/ui/SubTabs';

export default function SettingsPage() {
  const { font, fontSize, appName, headerStyle, apiKeys, apiKeysAuthed, updateSettings, createApiKey, deleteApiKey } = useSettings();
  const { layoutMode, setLayoutMode } = useDashboard();
  const [activeTab, setActiveTab] = useState<'appearance' | 'api' | 'branding' | 'privacy'>('appearance');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await createApiKey();
    } catch (err) {
      setCreateError('Failed to create key — sign in first.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Settings</h1>
      <SubTabs 
        tabs={[
          { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
          { id: 'branding', label: 'Branding & Layout', icon: <Layout size={16} /> },
          { id: 'api', label: 'Developer API', icon: <Key size={16} /> },
          { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={16} /> }
        ]} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab as any} 
      />
{/* Settings Content */}
      <div style={{ flex: 1 }} className="card" role="tabpanel" id={`settings-panel-${activeTab}`} aria-labelledby={`settings-tab-${activeTab}`}>
        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Appearance Settings</h3>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <Palette size={16} /> Appearance
              </label>
              {/* The theme picker offered light, cyber and xibalba. `light` had no
                  stylesheet at all, so choosing it changed nothing, and each of the
                  others redefined --accent-color, which is what left the console
                  showing two different accents at once. The console is dark-only
                  (operator decision, 2026-11-03). */}
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)', maxWidth: '58ch', lineHeight: 1.55 }}>
                The console uses a single dark palette so that colour carries meaning:
                blue marks what you can act on, and green, amber and red report agent
                state. There is nothing to choose here.
              </p>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                <Type size={16} /> Typography
              </label>
              <label htmlFor="settings-font" style={{ display: 'contents' }}>
              <select id="settings-font" aria-label="Font family"
                value={font} 
                onChange={e => updateSettings({ font: e.target.value as any })}
                className="secondary-button"
                style={{ width: '100%', padding: '1rem', textAlign: 'left', marginBottom: '1rem' }}
              >
                {/* Only the families the console actually loads. Roboto, Fira Code
                    and Playfair Display were options here but were never used by the
                    app shell, which hardcoded its own family. */}
                <option value="Inter">Inter</option>
                <option value="System Default">System default</option>
              </select>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Font Size: {fontSize}px</span>
                <input aria-label="Font size"
                  type="range" 
                  min="12" 
                  max="24" 
                  value={fontSize} 
                  onChange={e => updateSettings({ fontSize: parseInt(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                <Layout size={16} /> Effects
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={useSettings().animationsEnabled} 
                  onChange={e => updateSettings({ animationsEnabled: e.target.checked })} 
                  style={{ accentColor: 'var(--text-primary)' }} 
                /> 
                Enable Landing Page Scroll Animations
              </label>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Branding & Layout</h3>
            
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Global App Name / Title</label>
              <input 
                type="text" 
                value={appName} 
                onChange={e => updateSettings({ appName: e.target.value })}
                style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>This title appears in headers and notifications.</p>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>Navigation Layout</label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {(['sidebar', 'header'] as const).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setLayoutMode(mode)}
                    className="secondary-button"
                    style={{ 
                      flex: 1, 
                      padding: '1rem',
                      background: layoutMode === mode ? 'var(--text-primary)' : 'transparent',
                      color: layoutMode === mode ? 'var(--bg-color)' : 'var(--text-primary)',
                      border: layoutMode === mode ? 'none' : '1px solid var(--border-color)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {mode} Navigation
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>Header Style</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {(['solid', 'transparent', 'blur'] as const).map(s => (
                  <button 
                    key={s}
                    onClick={() => updateSettings({ headerStyle: s })}
                    className="secondary-button"
                    style={{ 
                      flex: 1, 
                      padding: '1rem',
                      background: headerStyle === s ? 'var(--text-primary)' : 'transparent',
                      color: headerStyle === s ? 'var(--bg-color)' : 'var(--text-primary)',
                      border: headerStyle === s ? 'none' : '1px solid var(--border-color)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Developer API Keys</h3>

            {!apiKeysAuthed ? (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
                Sign in to manage real userapi-issued API keys.
              </div>
            ) : (
              <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0 }}>Create New Key</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Keys are issued by userapi with a fixed AIS trust ceiling — there's no per-key name or scoped permissions on the backend yet.
                </p>
                {createError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{createError}</div>}
                <button onClick={handleCreateKey} disabled={creating} className="primary-button" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> {creating ? 'Generating…' : 'Generate Key'}</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0 }}>Active Keys</h4>
              {apiKeys.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
                  No API keys generated yet.
                </div>
              ) : (
                apiKeys.map(key => (
                  <div key={key.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--bg-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>{key.id}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                          {key.revokedAt && ` • Revoked: ${new Date(key.revokedAt).toLocaleDateString()}`}
                          {` • Trust ceiling: ${key.aisTrustCeiling}`}
                        </div>
                      </div>
                      {!key.revokedAt && (
                        <button onClick={() => deleteApiKey(key.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }} title="Revoke Key">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    {key.rawKey && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                        <code style={{ flex: 1, fontFamily: 'monospace' }}>{key.rawKey}</code>
                        <button onClick={() => handleCopy(key.rawKey!)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Copy">
                          {copiedKey === key.rawKey ? <CheckCircle size={16} color="var(--success)" /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}
                    {!key.rawKey && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Secret shown only at creation time.</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <PrivacyPanel />
          </div>
        )}
      </div>
    </div>
  );
}
