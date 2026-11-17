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
  const [isLocalPreview, setIsLocalPreview] = useState(false);

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
        const msg = err?.message || '';
        if (msg.includes('Forge bridge unavailable') || msg.includes('failed to fetch') || typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          setIsLocalPreview(true);
        } else {
          setError(msg || 'Failed to load initial app configuration.');
        }
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
    <div className="admin-settings-view" aria-label="System Administration View" style={{ padding: '4px 0' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <button
          className="btn btn-outline-subtle btn-sm"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#374151' }}
        >
          ← Back to Change Intake Lens
        </button>
        <span style={{ fontSize: '11.5px', color: '#6B7280', background: '#FFFFFF', padding: '4px 10px', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
          Atlassian Forge SQL Secure Storage
        </span>
      </div>

      {isLocalPreview && (
        <div
          style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>ℹ️</span>
          <span>
            <strong>Localhost Preview Mode:</strong> Running outside Jira. Configuration will synchronize with Forge SQL once opened inside your Jira Cloud workspace.
          </span>
        </div>
      )}

      {error && (
        <div
          className="redline-alert-box alert-error"
          style={{
            background: '#FEE2E2',
            border: '1px solid #F87171',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <strong>Configuration Error:</strong> {error}
        </div>
      )}

      {saved && (
        <div
          style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          ✓ Configuration saved successfully to Forge secure storage.
        </div>
      )}

      {/* Two-Column Responsive Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Card 1: Enterprise Registry & Routing Parameters */}
        <div className="andon-card" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px' }}>
          <div className="card-top-row" style={{ marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
            <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚙️</span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Registry &amp; Routing Parameters
              </h3>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#2563EB',
                background: '#EFF6FF',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #BFDBFE',
              }}
            >
              Enterprise Config
            </span>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Confluence Site Registry Page ID
              </label>
              <input
                type="text"
                className="form-input"
                value={siteRegistryId}
                onChange={(e) => setSiteRegistryId(e.target.value)}
                placeholder="e.g. Confluence Page ID"
                disabled={loadingConfig}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                required
              />
              <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                The root Confluence page containing facility zones and robot deployment table.
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Default Follow-up Jira Project Key
              </label>
              <input
                type="text"
                className="form-input"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                placeholder="e.g. ROBOT"
                disabled={loadingConfig}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                required
              />
              <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                The engineering project where follow-up revalidation tasks are dispatched.
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Reviewer Authorization Policy
              </label>
              <select
                className="form-input"
                value={reviewerPolicyMode}
                onChange={(e) => setReviewerPolicyMode(e.target.value as 'configured_list' | 'owner_only')}
                disabled={loadingConfig}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#FFFFFF' }}
              >
                <option value="configured_list">Configured List (Designated reviewer account IDs)</option>
                <option value="owner_only">Owner Only (Only deployment creator can review)</option>
              </select>
              <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                Strict fail-closed policy controlling who is authorized to confirm candidates or approve follow-ups.
              </span>
            </div>

            {reviewerPolicyMode === 'configured_list' && (
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Allowed Reviewer Account IDs (Comma-separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={allowedReviewersText}
                  onChange={(e) => setAllowedReviewersText(e.target.value)}
                  placeholder="e.g. 557058:..., 712020:..."
                  disabled={loadingConfig}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                  Leave empty to fail-closed (no reviewer authorized until account IDs populated).
                </span>
              </div>
            )}

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loadingConfig}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loadingConfig ? 'not-allowed' : 'pointer',
                }}
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Deployment & Baseline Registration Form */}
        <RegisterDeploymentCard onRegistered={() => setSaved(true)} />
      </div>
    </div>
  );
};

interface RegisterDeploymentCardProps {
  onRegistered?: () => void;
}

const RegisterDeploymentCard: React.FC<RegisterDeploymentCardProps> = ({ onRegistered }) => {
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
      onRegistered?.();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setRegError(err?.message || 'Failed to register deployment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="andon-card" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px' }}>
      <div className="card-top-row" style={{ marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
        <div className="card-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🤖</span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Register Robotics Deployment
          </h3>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#16A34A',
            background: '#DCFCE7',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #BBF7D0',
          }}
        >
          Forge SQL
        </span>
      </div>

      <p style={{ fontSize: '12.5px', color: '#4B5563', margin: '0 0 16px 0', lineHeight: 1.5 }}>
        Registers an autonomous robotics deployment, facility zone, and commissioning baseline into Forge SQL.
        If a Confluence page ID is provided, quotes must be exact substrings.
      </p>

      {successMsg && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          ✓ {successMsg}
        </div>
      )}

      {regError && (
        <div
          className="redline-alert-box alert-error"
          style={{
            background: '#FEE2E2',
            border: '1px solid #F87171',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <strong>Registration Error:</strong> {regError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Facility Site Name
            </label>
            <input
              type="text"
              className="form-input"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Factory Site"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Zone Name
            </label>
            <input
              type="text"
              className="form-input"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="e.g. Assembly Bay 1"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Deployment Identifier
            </label>
            <input
              type="text"
              className="form-input"
              value={deploymentIdentifier}
              onChange={(e) => setDeploymentIdentifier(e.target.value)}
              placeholder="e.g. Robot Fleet Unit"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Baseline Confluence Page ID (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              value={commissioningPageId}
              onChange={(e) => setCommissioningPageId(e.target.value)}
              placeholder="e.g. Commissioning Page ID"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Operating Attribute
            </label>
            <input
              type="text"
              className="form-input"
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              placeholder="e.g. surface_finish"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Declared Baseline Value
            </label>
            <input
              type="text"
              className="form-input"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              placeholder="e.g. matte_epoxy"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Verbatim Commissioning Quote / Excerpt
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={quotedText}
            onChange={(e) => setQuotedText(e.target.value)}
            placeholder="Verbatim quote from the Confluence commissioning page establishing this baseline..."
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '6px', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginTop: '4px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Verifying & Registering...' : 'Register Deployment into Forge SQL'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsView;
