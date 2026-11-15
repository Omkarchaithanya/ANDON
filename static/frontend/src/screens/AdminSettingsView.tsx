import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

interface AdminSettingsViewProps {
  onBack: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onBack }) => {
  const [siteRegistryId, setSiteRegistryId] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [reviewerPolicyMode, setReviewerPolicyMode] = useState<'configured_list' | 'owner_only'>('configured_list');
  const [allowedReviewersText, setAllowedReviewersText] = useState('');
  const [saved, setSaved] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentConfig() {
      try {
        const res: any = await invoke('getAppConfig');
        if (res) {
          if (res.siteRegistryPageId) setSiteRegistryId(res.siteRegistryPageId);
          if (res.defaultFollowupProjectKey) setProjectKey(res.defaultFollowupProjectKey);
          if (res.reviewerPolicy?.mode) {
            setReviewerPolicyMode(res.reviewerPolicy.mode === 'owner_only' ? 'owner_only' : 'configured_list');
          }
          if (Array.isArray(res.reviewerPolicy?.allowed_account_ids)) {
            setAllowedReviewersText(res.reviewerPolicy.allowed_account_ids.join(', '));
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load initial app configuration.');
      } finally {
        setLoadingConfig(false);
      }
    }
    loadCurrentConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const allowedIds = allowedReviewersText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await invoke('updateAppConfig', {
        siteRegistryPageId: siteRegistryId.trim(),
        defaultFollowupProjectKey: projectKey.trim().toUpperCase(),
        reviewerPolicy: {
          mode: reviewerPolicyMode,
          allowed_account_ids: allowedIds,
        },
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to save configuration.');
    }
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
            Configure Teamwork Graph registry anchors, reviewer authorization policy, and follow-up routing
          </p>
        </div>
      </div>

      <div className="andon-card" style={{ maxWidth: '680px' }}>
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

        {error && (
          <div className="redline-alert-box alert-error" style={{ marginBottom: '16px' }}>
            <strong>Configuration Error:</strong> {error}
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

          <div className="form-group">
            <label className="form-label">Reviewer Authorization Policy</label>
            <select
              className="form-input"
              value={reviewerPolicyMode}
              onChange={(e) => setReviewerPolicyMode(e.target.value as 'configured_list' | 'owner_only')}
              disabled={loadingConfig}
            >
              <option value="configured_list">Configured List (Fail-closed to designated account IDs)</option>
              <option value="owner_only">Owner Only (Only deployment creator/owner can review)</option>
            </select>
            <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
              Strict fail-closed policy controlling who is permitted to confirm relationships or approve follow-ups.
            </span>
          </div>

          {reviewerPolicyMode === 'configured_list' && (
            <div className="form-group">
              <label className="form-label">Allowed Reviewer Account IDs (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={allowedReviewersText}
                onChange={(e) => setAllowedReviewersText(e.target.value)}
                placeholder="e.g. 557058:..., 712020:..."
                disabled={loadingConfig}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Leave empty to fail-closed (no reviewer allowed until populated).
              </span>
            </div>
          )}

          <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loadingConfig}>
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsView;
