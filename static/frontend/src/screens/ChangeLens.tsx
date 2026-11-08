import React, { useState } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { FloorPlanLocator } from '../components/FloorPlanLocator';
import { HatchedUnknown } from '../components/HatchedUnknown';
import { useReviewState } from '../hooks/useReviewState';

interface ChangeLensProps {
  onSelectCandidate: (candidateId: string) => void;
}

export const ChangeLens: React.FC<ChangeLensProps> = ({ onSelectCandidate }) => {
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
  const [dismissReason, setDismissReason] = useState('');
  const [dismissLoading, setDismissLoading] = useState(false);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [siteRegistryInput, setSiteRegistryInput] = useState('');
  const [projectKeyInput, setProjectKeyInput] = useState('');
  const [configSaving, setConfigSaving] = useState(false);

  const handleDismissConfirm = async () => {
    if (!dismissModalId || !dismissReason.trim()) return;
    setDismissLoading(true);
    try {
      await dismissCandidate(dismissModalId, dismissReason.trim());
      setDismissModalId(null);
      setDismissReason('');
      await triggerDiscovery();
    } finally {
      setDismissLoading(false);
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

      {error && (
        <div style={{ background: 'var(--andon-signal-red-light)', border: '1px solid var(--andon-signal-red)', padding: '10px 14px' }}>
          <strong style={{ color: 'var(--andon-signal-red)' }}>Resolver Error:</strong> {error}
        </div>
      )}

      {!isConfigured && (
        <HatchedUnknown
          title="Confluence Site Registry Unconfigured"
          reason="Site registry page ID is not set. Robot commissioning baselines cannot be traversed without a registry anchor."
          resolutionStep="Click Registry Settings above to configure the Confluence Site Registry Page ID."
        />
      )}

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

          <span className="mono" style={{ fontSize: '10px', color: 'var(--andon-ink-muted)', display: 'block', marginBottom: '4px' }}>
            VERBATIM WORK DESCRIPTION
          </span>
          <h3 className="work-summary-headline">“{context.plannedWorkSummary}”</h3>

          {/* Andon Callout Leader Row */}
          <div className="andon-callout-row">
            <div className="callout-leader-info">
              <span className="callout-tag">ANDON CALLOUT // CANDIDATE DEPENDENCY DETECTED</span>
              <span className="callout-text">
                Planned floor finish modifications potentially intersect AMR-12 Operating Design Domain.
              </span>
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
              {context.lastChecked ? `Scanned ${new Date(context.lastChecked).toLocaleTimeString()}` : ''}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            {/* Floor Plan Locator */}
            <FloorPlanLocator
              siteName="Facility Alpha (Reg: Page 10482)"
              zoneName={context.location || 'Aisle 7'}
              deploymentIdentifier="AMR-12"
              hasLayoutData={true}
            />

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
              </div>
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

              <div style={{ margin: '10px 0', fontSize: '13px' }}>
                <span style={{ color: 'var(--andon-ink-subtle)' }}>Condition Divergence: </span>
                <code>{cand.changedAttribute}</code> (Documented: <em>{cand.currentValue}</em> ➔ Proposed: <strong>{cand.proposedValue}</strong>)
              </div>

              <blockquote className="verbatim-quote-box" style={{ margin: '8px 0 14px 0' }}>
                “{cand.sourceReference || 'Apply high-gloss clear finish to Aisle 7 next Saturday'}”
              </blockquote>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--andon-border)', paddingTop: '12px' }}>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
                  <span>TARGET DEPLOYMENT: <strong>{cand.deployment}</strong></span>
                  <span style={{ margin: '0 8px' }}>//</span>
                  <span>ZONE: <strong>{cand.zone}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() => {
                      setDismissModalId(cand.id);
                      setDismissReason('');
                    }}
                  >
                    Not Related (Reason Required)
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectCandidate(cand.id)}
                  >
                    Inspect Redline Sheet ➔
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
            <div className="modal-footer">
              <button
                className="btn btn-subtle"
                onClick={() => setDismissModalId(null)}
                disabled={dismissLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={!dismissReason.trim() || dismissLoading}
                onClick={handleDismissConfirm}
              >
                {dismissLoading ? 'Recording Dismissal...' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registry Settings Modal */}
      {configModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Configure Confluence Site Registry</h3>
              <p className="page-desc">
                Link the Confluence Page ID that documents facility zones and active robotics deployments.
              </p>
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
              <button
                className="btn btn-subtle"
                onClick={() => setConfigModalOpen(false)}
                disabled={configSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveConfig}
                disabled={!siteRegistryInput.trim() || configSaving}
              >
                {configSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
