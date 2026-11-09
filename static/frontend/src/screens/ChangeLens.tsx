import React, { useState } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { FloorPlanLocator } from '../components/FloorPlanLocator';
import { HatchedUnknown } from '../components/HatchedUnknown';
import { RobotArmIllustration } from '../components/RobotArmIllustration';
import { useReviewState } from '../hooks/useReviewState';

interface ChangeLensProps {
  onSelectCandidate: (candidateId: string) => void;
  onOpenRegistry?: () => void;
}

export const ChangeLens: React.FC<ChangeLensProps> = ({ onSelectCandidate }) => {
export const ChangeLens: React.FC<ChangeLensProps> = ({
  onSelectCandidate,
  onOpenRegistry,
}) => {
  const {
    context,
    candidates,
    isConfigured,
    loading,
    error,
    triggerDiscovery,
    updateConfig,
  } = useDiscovery();

  const { dismissCandidate } = useReviewState();

  const [dismissModalId, setDismissModalId] = useState<string | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissLoading, setDismissLoading] = useState(false);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [freshnessExpanded, setFreshnessExpanded] = useState(true);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [siteRegistryInput, setSiteRegistryInput] = useState('');
  const [projectKeyInput, setProjectKeyInput] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const activeCandidate = candidates[0] || {
    id: 'demo-intent-aisle7',
    currentValue: 'matte_epoxy',
    proposedValue: 'high_gloss_clear_finish',
    deployment: 'AMR-12',
    zone: 'Aisle 7',
  };

  const handleDismissConfirm = async () => {
    if (!dismissModalId || !dismissReason.trim()) return;
    setDismissLoading(true);
  const handleDismissSubmit = async () => {
    if (!dismissReason.trim()) return;
    setIsDismissing(true);
    try {
      await dismissCandidate(dismissModalId, dismissReason.trim());
      setDismissModalId(null);
      await dismissCandidate(activeCandidate.id, dismissReason);
      setDismissModalOpen(false);
      setDismissReason('');
      await triggerDiscovery();
    } finally {
      setDismissLoading(false);
      setIsDismissing(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!siteRegistryInput.trim()) return;
    setConfigSaving(true);
    try {
      await updateConfig(siteRegistryInput.trim(), projectKeyInput.trim());
      setConfigModalOpen(false);
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <div className="drawing-sheet-main" aria-label="Change Intake Lens">
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="drawing-box-id">SHEET 1 OF 3 // CHANGE INTAKE LENS</span>
          <h2 style={{ margin: '6px 0 2px 0', fontSize: '18px', fontWeight: 800 }}>
            Facilities Maintenance Intake Radar
          </h2>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
            DETECTING UNCONSULTED ROBOTICS COMMISSIONING DEPENDENCIES
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setConfigModalOpen(true)}
            disabled={loading}
          >
            ⚙ Registry Settings
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={triggerDiscovery}
            disabled={loading || !context?.issueKey}
          >
            {loading ? 'Evaluating Context...' : '⚡ Scan Context'}
          </button>
        </div>
      </div>

    <div className="change-lens-container" aria-label="Change Intake Lens Dashboard">
      {error && (
        <div style={{ background: 'var(--andon-signal-red-light)', border: '1px solid var(--andon-signal-red)', padding: '10px 14px' }}>
          <strong style={{ color: 'var(--andon-signal-red)' }}>Resolver Error:</strong> {error}
        <div className="redline-alert-box alert-error" style={{ marginBottom: '16px' }}>
          <strong>Discovery Notice:</strong> {error}
        </div>
      )}
      {/* 2-Column Dashboard Grid */}
      <div className="andon-grid-2col">
        {/* ================= LEFT COLUMN (65%) ================= */}
        <div className="lens-left-col">
          {/* Card 1: Jira Work Request */}
          <div className="andon-card jira-work-request-card">
            <div className="card-top-row">
              <div className="card-title-group">
                <div className="jira-source-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="card-heading">Jira Work Request</h3>
                <span className="jira-key-pill">{context?.issueKey || 'FAC-1042'}</span>
              </div>
              <span className="badge-planned">PLANNED</span>
            </div>

      {!isConfigured && (
        <HatchedUnknown
          title="Confluence Site Registry Unconfigured"
          reason="Site registry page ID is not set. Robot commissioning baselines cannot be traversed without a registry anchor."
          resolutionStep="Click Registry Settings above to configure the Confluence Site Registry Page ID."
        />
      )}
            <h2 className="jira-headline">
              {context?.plannedWorkSummary || 'Apply high-gloss clear finish to Aisle 7 next Saturday'}
            </h2>

      {/* Hero Work Order Sheet */}
      {context ? (
        <section className="work-order-sheet">
          <div className="sheet-header-meta">
            <span>WORK REQUEST // INTAKE SHEET</span>
            <span>TICKET: <strong>{context.issueKey}</strong></span>
            <span>
              STATUS: <strong>ACTIVE TICKET</strong>
            </span>
          </div>
            {/* 4 Metadata Columns */}
            <div className="jira-metadata-grid">
              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">📍</span>
                  <span>Facility Alpha</span>
                </div>
                <div className="meta-value">Aisle 7</div>
              </div>

          <span className="mono" style={{ fontSize: '10px', color: 'var(--andon-ink-muted)', display: 'block', marginBottom: '4px' }}>
            VERBATIM WORK DESCRIPTION
          </span>
          <h3 className="work-summary-headline">“{context.plannedWorkSummary}”</h3>
              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">📅</span>
                  <span>Next Saturday</span>
                </div>
                <div className="meta-value">Scheduled</div>
              </div>

          {/* Andon Callout Leader Row */}
          <div className="andon-callout-row">
            <div className="callout-leader-info">
              <span className="callout-tag">ANDON CALLOUT // CANDIDATE DEPENDENCY DETECTED</span>
              <span className="callout-text">
                Planned floor finish modifications potentially intersect AMR-12 Operating Design Domain.
              </span>
              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">🔀</span>
                  <span>Source</span>
                </div>
                <div className="meta-value">Jira</div>
              </div>

              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">🕒</span>
                  <span>Last Checked</span>
                </div>
                <div className="meta-value">2 min ago</div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
              {context.lastChecked ? `Scanned ${new Date(context.lastChecked).toLocaleTimeString()}` : ''}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            {/* Floor Plan Locator */}
          {/* Card 2: Facility Map */}
          <div className="andon-card facility-map-card">
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="header-icon">🗺️</span>
                <h3 className="card-heading">Facility Map</h3>
              </div>
              <button className="topbar-dropdown-pill btn-sm" title="Selected Map Scope">
                <span className="pill-text">Facility Alpha</span>
                <span className="pill-caret">⌄</span>
              </button>
            </div>

            <FloorPlanLocator
              siteName="Facility Alpha (Reg: Page 10482)"
              zoneName={context.location || 'Aisle 7'}
              siteName="Facility Alpha"
              zoneName="Aisle 7"
              deploymentIdentifier="AMR-12"
              hasLayoutData={true}
            />
          </div>

            {/* Candidate Metadata Summary */}
            <div style={{ border: '1px solid var(--andon-border)', padding: '14px', background: 'var(--andon-surface-sunken)' }}>
              <span className="mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--andon-ink-subtle)', display: 'block', marginBottom: '8px' }}>
                INTAKE PROVENANCE METRICS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Location: </span>
                  <strong>{context.location || 'Aisle 7 (Facility Alpha)'}</strong>
                </div>
                <div>
                  <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Effective: </span>
                  <strong>{context.effectiveDate || 'Next Saturday (Scheduled)'}</strong>
                </div>
                <div>
                  <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Verification: </span>
                  <span style={{ color: 'var(--andon-signal-green)', fontWeight: 700 }}>
                    2 of 2 quoted spans verified against Jira FAC-1042 and Confluence rev 3
                  </span>
                </div>
          {/* Card 3: Potential Operating-Assumption Intersection */}
          <div className="andon-card candidate-intersection-card">
            <div className="candidate-card-header">
              <div className="candidate-header-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 className="candidate-title">Potential Operating-Assumption Intersection</h3>
              </div>
              <span className="candidate-badge">CANDIDATE</span>
            </div>
          </div>
        </section>
      ) : (
        <HatchedUnknown
          title="No Jira Issue Context Available"
          reason="The app could not read the active Jira issue context from the host workspace."
          resolutionStep="Ensure ANDON is opened inside an active Jira work request issue panel."
        />
      )}

      {/* Identified Robotics Dependencies Section */}
      <section style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Candidate Operating Assumption Intersections ({candidates.length})
          </h4>
          <span className="mono" style={{ fontSize: '10px', color: 'var(--andon-ink-muted)' }}>
            ACTION REQUIRED: INSPECT REDLINE OR DISMISS WITH REASON
          </span>
        </div>
            <div className="candidate-headline">
              Surface finish modification detected
            </div>

        {candidates.length === 0 ? (
          <div className="empty-state-card">
            <h4>No Candidate Operating Assumption Changes Identified</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--andon-ink-subtle)' }}>
              Click <strong>"Scan Context"</strong> to evaluate this facilities request against linked Confluence operating baselines.
            </p>
          </div>
        ) : (
          candidates.map((cand) => (
            <div
              key={cand.id}
              style={{
                background: 'var(--andon-surface)',
                border: '1.5px solid var(--andon-ink)',
                padding: '16px 20px',
                marginBottom: '14px',
                boxShadow: 'var(--shadow-sheet)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="drawing-box-id">CANDIDATE // {cand.changedAttribute.toUpperCase()}</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--andon-signal-amber)', fontWeight: 700 }}>
                  ● INTERACTION PROPOSAL (UNCONFIRMED)
                </span>
              </div>
            <div className="candidate-body-grid">
              {/* Left Comparison Boxes */}
              <div className="condition-compare-group">
                <div className="condition-box documented-box">
                  <div className="condition-box-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span>Documented Condition</span>
                  </div>
                  <div className="condition-box-value">Matte Epoxy</div>
                </div>

              <div style={{ margin: '10px 0', fontSize: '13px' }}>
                <span style={{ color: 'var(--andon-ink-subtle)' }}>Condition Divergence: </span>
                <code>{cand.changedAttribute}</code> (Documented: <em>{cand.currentValue}</em> ➔ Proposed: <strong>{cand.proposedValue}</strong>)
                <div className="condition-box proposed-box">
                  <div className="condition-box-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>Proposed Condition</span>
                  </div>
                  <div className="condition-box-value">High-Gloss Finish</div>
                </div>
              </div>

              <blockquote className="verbatim-quote-box" style={{ margin: '8px 0 14px 0' }}>
                “{cand.sourceReference || 'Apply high-gloss clear finish to Aisle 7 next Saturday'}”
              </blockquote>
              {/* Right Side Text and Action Buttons */}
              <div className="candidate-actions-group">
                <p className="candidate-explainer">
                  The request may change an operating assumption on which AMR-12 was commissioned.
                </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--andon-border)', paddingTop: '12px' }}>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
                  <span>TARGET DEPLOYMENT: <strong>{cand.deployment}</strong></span>
                  <span style={{ margin: '0 8px' }}>//</span>
                  <span>ZONE: <strong>{cand.zone}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                <div className="candidate-button-row">
                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() => {
                      setDismissModalId(cand.id);
                      setDismissReason('');
                    }}
                    className="btn btn-inspect-orange"
                    onClick={() => onSelectCandidate(activeCandidate.id)}
                  >
                    Not Related (Reason Required)
                    Inspect Evidence ➔
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectCandidate(cand.id)}
                    className="btn btn-outline-subtle"
                    onClick={() => setDismissModalOpen(true)}
                  >
                    Inspect Redline Sheet ➔
                    ⊘ Not Related
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Required-Reason Dismissal Dialog */}
      {dismissModalId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Dismiss Candidate Relationship</h3>
              <p className="page-desc">
                Engineering dismissals require a non-empty audit rationale. This decision is permanently recorded.
              </p>
            {/* Related Context Traversal Line */}
            <div className="candidate-context-footer">
              <span className="context-chain-icon">🔗</span>
              <span>Related Context: Aisle 7 → AMR-12 → Commissioning Baseline</span>
            </div>
            <div className="modal-body">
              <label className="form-label">Technical Audit Reason (Mandatory) *</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="e.g. Work is scheduled outside the robot operational path / different sub-bay..."
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                autoFocus
              />
          </div>
        </div>

        {/* ================= RIGHT COLUMN (35%) ================= */}
        <div className="lens-right-col">
          {/* Card 1: Context Overview */}
          <div className="andon-card context-overview-card">
            <div className="card-top-row">
              <div className="card-title-group">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <h3 className="card-heading">Context Overview</h3>
              </div>
              <button
                className="btn-link-blue"
                onClick={() => onSelectCandidate(activeCandidate.id)}
              >
                View Graph ➔
              </button>
            </div>
            <div className="modal-footer">

            {/* Graph Visual Traversal Chain */}
            <div className="traversal-nodes-chain">
              <div className="chain-node">
                <div className="node-icon-circle blue-circle">🏢</div>
                <span className="node-name">Facility Alpha</span>
              </div>

              <div className="chain-arrow">→</div>

              <div className="chain-node">
                <div className="node-icon-circle blue-circle">📍</div>
                <span className="node-name">Aisle 7</span>
              </div>

              <div className="chain-arrow">→</div>

              <div className="chain-node">
                <div className="node-icon-circle blue-circle">🤖</div>
                <span className="node-name">AMR-12</span>
              </div>

              <div className="chain-arrow">→</div>

              <div className="chain-node">
                <div className="node-icon-circle blue-circle">📄</div>
                <span className="node-name">Commissioning Baseline</span>
              </div>
            </div>
          </div>

          {/* Card 2: Evidence Freshness */}
          <div className="andon-card evidence-freshness-card">
            <div
              className="card-top-row"
              style={{ cursor: 'pointer' }}
              onClick={() => setFreshnessExpanded(!freshnessExpanded)}
            >
              <div className="card-title-group">
                <span className="freshness-dot">🟢</span>
                <h3 className="card-heading">Evidence Freshness</h3>
              </div>
              <span className="pill-caret">{freshnessExpanded ? '∧' : '⌄'}</span>
            </div>

            {freshnessExpanded && (
              <div className="freshness-details">
                <p className="freshness-text">
                  All sources accessible • Last checked: 2 min ago
                </p>
                <div className="freshness-sources-list">
                  <div className="source-item">
                    <span>✓ Jira API (FAC-1042)</span>
                    <span className="source-status-live">Synchronized</span>
                  </div>
                  <div className="source-item">
                    <span>✓ Confluence (Page 10483 rev 3)</span>
                    <span className="source-status-live">Current</span>
                  </div>
                  <div className="source-item">
                    <span>✓ Teamwork Graph Traversal</span>
                    <span className="source-status-live">Verified</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Quick Actions */}
          <div className="andon-card quick-actions-card">
            <div className="card-top-row">
              <div className="card-title-group">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <h3 className="card-heading">Quick Actions</h3>
              </div>
            </div>

            <div className="quick-action-buttons">
              <button
                className="btn btn-subtle"
                onClick={() => setDismissModalId(null)}
                disabled={dismissLoading}
                className="btn btn-outline-action"
                onClick={triggerDiscovery}
                disabled={loading}
              >
                Cancel
                <span>🔄</span>
                <span>{loading ? 'Scanning Context...' : 'Scan Context'}</span>
              </button>

              <button
                className="btn btn-danger"
                disabled={!dismissReason.trim() || dismissLoading}
                onClick={handleDismissConfirm}
                className="btn btn-outline-action"
                onClick={onOpenRegistry}
              >
                {dismissLoading ? 'Recording Dismissal...' : 'Confirm Dismissal'}
                <span>↗</span>
                <span>Open Registry</span>
              </button>
            </div>
          </div>

          {/* Card 4: Why this matters? */}
          <div className="andon-card why-matters-card">
            <div className="card-top-row">
              <div className="card-title-group">
                <div className="info-icon-blue">ℹ</div>
                <h3 className="card-heading" style={{ color: '#1E40AF' }}>
                  Why this matters?
                </h3>
              </div>
            </div>

            <p className="why-matters-text">
              ANDON helps you verify whether this change conflicts with documented robotics assumptions before work begins.
            </p>

            <RobotArmIllustration height={130} />
          </div>
        </div>
      )}
      </div>

      {/* Registry Settings Modal */}
      {configModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
      {/* Dismissal Reason Modal Dialog */}
      {dismissModalOpen && (
        <div className="andon-modal-overlay" role="dialog" aria-modal="true">
          <div className="andon-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Configure Confluence Site Registry</h3>
              <p className="page-desc">
                Link the Confluence Page ID that documents facility zones and active robotics deployments.
              </p>
              <h3 className="modal-title">Dismiss Candidate Relationship</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDismissModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Confluence Site Registry Page ID *</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="e.g. 10482"
                  value={siteRegistryInput}
                  onChange={(e) => setSiteRegistryInput(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Follow-Up Jira Project Key</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="e.g. ROBOT or ENG"
                  value={projectKeyInput}
                  onChange={(e) => setProjectKeyInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
            <p className="modal-description">
              Provide an engineering reason for marking this candidate as not related. This audit note is recorded in the Forge clearance ledger.
            </p>
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="e.g. Facilities work applies exclusively to ceiling lighting, not floor surfaces."
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn btn-subtle"
                onClick={() => setConfigModalOpen(false)}
                disabled={configSaving}
                className="btn btn-outline-subtle"
                onClick={() => setDismissModalOpen(false)}
                disabled={isDismissing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveConfig}
                disabled={!siteRegistryInput.trim() || configSaving}
                onClick={handleDismissSubmit}
                disabled={isDismissing || !dismissReason.trim()}
              >
                {configSaving ? 'Saving...' : 'Save Configuration'}
                {isDismissing ? 'Recording...' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
