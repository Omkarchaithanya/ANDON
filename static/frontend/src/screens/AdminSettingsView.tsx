import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { useDiscovery } from '../hooks/useDiscovery';

interface AdminSettingsViewProps {
  onBack: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onBack }) => {
  const { updateConfig } = useDiscovery();
  const [siteRegistryId, setSiteRegistryId] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    async function loadCurrentConfig() {
      try {
        const res: any = await invoke('getAppConfig');
        if (res) {
          if (res.siteRegistryPageId) setSiteRegistryId(res.siteRegistryPageId);
          if (res.defaultFollowupProjectKey) setProjectKey(res.defaultFollowupProjectKey);
        }
      } catch (err: any) {
        console.warn('Failed to load initial app config:', err?.message);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadCurrentConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(siteRegistryId, projectKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="admin-settings-view" aria-label="System Administration View">
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Change Intake Lens
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">System Administration &amp; App Configuration</h2>
          <p className="redline-main-subtitle">
            Configure Teamwork Graph registry anchors, storage mechanisms, and default routing
          </p>
        </div>
      </div>

      <div className="andon-card" style={{ maxWidth: '640px' }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="header-icon">⚙️</span>
            <h3 className="card-heading">Registry &amp; Routing Parameters</h3>
          </div>
          <span className="jira-key-pill">Forge Settings</span>
        </div>

        {saved && (
          <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            ✓ Configuration saved successfully to Forge secure storage.
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div className="form-group">
            <label className="form-label">Confluence Site Registry Page ID</label>
            <input
              type="text"
              className="form-input"
              value={siteRegistryId}
              onChange={(e) => setSiteRegistryId(e.target.value)}
              placeholder="e.g. Confluence Page ID"
              disabled={loadingConfig}
              required
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
              The root Confluence page containing the facility zones and robot deployment table.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Default Follow-up Jira Project Key</label>
            <input
              type="text"
              className="form-input"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              placeholder="e.g. ROBOT"
              disabled={loadingConfig}
              required
            />
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
              The engineering project where follow-up revalidation tasks will be created upon prospective gap confirmation.
            </span>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <button type="submit" className="btn btn-inspect-orange" disabled={loadingConfig}>
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
