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

      {/* Deployment & Baseline Registration Form (Item 4) */}
      <RegisterDeploymentCard onRegistered={() => setSaved(true)} />
    </div>
  );
};

interface RegisterDeploymentCardProps {
  onRegistered?: () => void;
}

const RegisterDeploymentCard: React.FC<RegisterDeploymentCardProps> = () => {
  const [siteName, setSiteName] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [deploymentIdentifier, setDeploymentIdentifier] = useState('');
  const [commissioningPageId, setCommissioningPageId] = useState('');
  const [attributeName, setAttributeName] = useState('surface_finish');
  const [attributeValue, setAttributeValue] = useState('matte_epoxy');
  const [quotedText, setQuotedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRegError(null);
    setSuccessMsg(null);

    try {
      const res: any = await invoke('registerDeployment', {
        siteName: siteName.trim(),
        zoneName: zoneName.trim(),
        deploymentIdentifier: deploymentIdentifier.trim(),
        confluenceCommissioningPageId: commissioningPageId.trim() || undefined,
        conditions: [
          {
            attribute_name: attributeName.trim(),
            attribute_value: attributeValue.trim(),
            quoted_text: quotedText.trim() || undefined,
          },
        ],
        commissioningSummary: quotedText.trim(),
      });

      setSuccessMsg(res?.message || `Deployment "${deploymentIdentifier}" registered successfully.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setRegError(err?.message || 'Failed to register deployment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="andon-card" style={{ maxWidth: '680px', marginTop: '24px' }}>
      <div className="card-top-row">
        <div className="card-title-group">
          <span className="header-icon">🤖</span>
          <h3 className="card-heading">Register Robotics Deployment &amp; Baseline Evidence</h3>
        </div>
        <span className="badge-planned">ONBOARDING</span>
      </div>

      <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 16px 0' }}>
        Registers an autonomous robotics deployment, facility zone, and commissioning baseline into Forge SQL.
        If a Confluence page ID is provided, quotes must be verbatim substrings.
      </p>

      {successMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          ✓ {successMsg}
        </div>
      )}

      {regError && (
        <div className="redline-alert-box alert-error" style={{ marginBottom: '16px' }}>
          <strong>Registration Error:</strong> {regError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Facility Site Name</label>
            <input
              type="text"
              className="form-input"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Zone Name</label>
            <input
              type="text"
              className="form-input"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Deployment Identifier</label>
            <input
              type="text"
              className="form-input"
              value={deploymentIdentifier}
              onChange={(e) => setDeploymentIdentifier(e.target.value)}
              placeholder="e.g. AGV-01"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confluence Baseline Page ID (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={commissioningPageId}
              onChange={(e) => setCommissioningPageId(e.target.value)}
              placeholder="e.g. 10482"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Operating Attribute</label>
            <input
              type="text"
              className="form-input"
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              placeholder="e.g. surface_finish"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Declared Baseline Value</label>
            <input
              type="text"
              className="form-input"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              placeholder="e.g. matte_epoxy"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Verbatim Commissioning Quote / Excerpt</label>
          <textarea
            className="form-input"
            rows={3}
            value={quotedText}
            onChange={(e) => setQuotedText(e.target.value)}
            placeholder="Verbatim quote from the Confluence commissioning page establishing this baseline..."
          />
        </div>

        <div style={{ marginTop: '8px' }}>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying & Registering...' : 'Register Deployment into Forge SQL'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsView;
