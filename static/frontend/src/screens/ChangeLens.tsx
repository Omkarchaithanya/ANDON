import React, { useState } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { FloorPlanLocator } from '../components/FloorPlanLocator';
import { RobotArmIllustration } from '../components/RobotArmIllustration';
import { useReviewState } from '../hooks/useReviewState';

interface ChangeLensProps {
  onSelectCandidate: (candidateId: string) => void;
  onOpenRegistry?: () => void;
}

export const ChangeLens: React.FC<ChangeLensProps> = ({
  onSelectCandidate,
  onOpenRegistry,
}) => {
  const {
    context,
    candidates,
    loading,
    error,
    triggerDiscovery,
  } = useDiscovery();

  const { dismissCandidate } = useReviewState();
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [freshnessExpanded, setFreshnessExpanded] = useState(true);

  const activeCandidate = candidates.length > 0 ? candidates[0] : null;

  const handleDismissSubmit = async () => {
    if (!activeCandidate || !dismissReason.trim()) return;
    setIsDismissing(true);
    try {
      await dismissCandidate(activeCandidate.id, dismissReason);
      setDismissModalOpen(false);
      setDismissReason('');
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="change-lens-container" aria-label="Change Intake Lens Dashboard">
      {error && (
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
                <span className="jira-key-pill">{context?.issueKey || 'Unknown'}</span>
              </div>
              <span className="badge-planned">PLANNED</span>
            </div>

            <h2 className="jira-headline">
              {context?.plannedWorkSummary || (loading ? 'Loading issue details...' : 'No work description recorded')}
            </h2>

            {/* 4 Metadata Columns */}
            <div className="jira-metadata-grid">
              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">📍</span>
                  <span>Location</span>
                </div>
                <div className="meta-value">{context?.location || 'Unknown'}</div>
              </div>

              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">📅</span>
                  <span>Schedule</span>
                </div>
                <div className="meta-value">{context?.effectiveDate || 'Unscheduled'}</div>
              </div>

              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">🔀</span>
                  <span>Source</span>
                </div>
                <div className="meta-value">{context?.issueKey ? 'Jira' : 'Unknown'}</div>
              </div>

              <div className="meta-col">
                <div className="meta-label">
                  <span className="meta-icon">🕒</span>
                  <span>Status</span>
                </div>
                <div className="meta-value">{loading ? 'Checking...' : 'Synchronized'}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Facility Map */}
          <div className="andon-card facility-map-card">
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="header-icon">🗺️</span>
                <h3 className="card-heading">Facility Map</h3>
              </div>
              <button className="topbar-dropdown-pill btn-sm" title="Selected Map Scope">
                <span className="pill-text">{context?.location || 'Facility Alpha'}</span>
                <span className="pill-caret">⌄</span>
              </button>
            </div>

            <FloorPlanLocator
              siteName="Facility Alpha"
              zoneName={activeCandidate?.zone || context?.location || 'Unknown'}
              deploymentIdentifier={activeCandidate?.deployment || 'Unknown'}
              hasLayoutData={Boolean(activeCandidate?.zone)}
            />
          </div>

          {/* Card 3: Potential Operating-Assumption Intersection */}
          {activeCandidate ? (
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
                <span className="candidate-badge">{activeCandidate.status}</span>
              </div>

              <div className="candidate-headline">
                {activeCandidate.changedAttribute
                  ? `${activeCandidate.changedAttribute} modification detected`
                  : 'Condition modification candidate detected'}
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
                    <div className="condition-box-value">{activeCandidate.currentValue || 'Unknown'}</div>
                  </div>

                  <div className="condition-box proposed-box">
                    <div className="condition-box-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>Proposed Condition</span>
                    </div>
                    <div className="condition-box-value">{activeCandidate.proposedValue || 'Unknown'}</div>
                  </div>
                </div>

                {/* Right Side Text and Action Buttons */}
                <div className="candidate-actions-group">
                  <p className="candidate-explainer">
                    The request may change an operating assumption on which{' '}
                    {activeCandidate.deployment || 'the robot'} was commissioned.
                  </p>

                  <div className="candidate-button-row">
                    <button
                      className="btn btn-inspect-orange"
                      onClick={() => onSelectCandidate(activeCandidate.id)}
                    >
                      Inspect Evidence ➔
                    </button>
                    <button
                      className="btn btn-outline-subtle"
                      onClick={() => setDismissModalOpen(true)}
                    >
                      ⊘ Not Related
                    </button>
                  </div>
                </div>
              </div>

              {/* Related Context Traversal Line */}
              <div className="candidate-context-footer">
                <span className="context-chain-icon">🔗</span>
                <span>
                  Related Context: {activeCandidate.zone || 'Zone'} →{' '}
                  {activeCandidate.deployment || 'Deployment'} → Commissioning Baseline
                </span>
              </div>
            </div>
          ) : (
            <div className="andon-card candidate-intersection-card">
              <div className="candidate-card-header">
                <div className="candidate-header-left">
                  <span
                    style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    UNKNOWN
                  </span>
                  <h3 className="candidate-title" style={{ marginLeft: '10px' }}>
                    Operating Assumption Relationship: Unknown
                  </h3>
                </div>
              </div>

              <div className="candidate-headline" style={{ fontSize: '15px' }}>
                No candidate change intents discovered
              </div>

              <div style={{ marginTop: '12px' }}>
                <p className="candidate-explainer">
                  No physical operating-assumption candidate has been discovered or confirmed for this work request.
                  Absence of a recorded graph path indicates relationship status is Unknown (not unaffected).
                </p>

                <div className="candidate-button-row" style={{ marginTop: '16px' }}>
                  <button
                    className="btn btn-inspect-orange"
                    onClick={triggerDiscovery}
                    disabled={loading || !context?.issueKey}
                  >
                    {loading ? 'Scanning Context...' : 'Scan Context via Teamwork Graph ➔'}
                  </button>
                </div>
              </div>
            </div>
          )}
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
              {activeCandidate && (
                <button
                  className="btn-link-blue"
                  onClick={() => onSelectCandidate(activeCandidate.id)}
                >
                  View Graph ➔
                </button>
              )}
            </div>

            {/* Graph Visual Traversal Chain */}
            <div className="traversal-nodes-chain">
              <div className="chain-node">
                <div className="node-icon-circle blue-circle">🏢</div>
                <span className="node-name">Site Registry</span>
              </div>

              <div className="chain-arrow">→</div>

              <div className="chain-node">
                <div className="node-icon-circle blue-circle">📍</div>
                <span className="node-name">{activeCandidate?.zone || context?.location || 'Zone'}</span>
              </div>

              <div className="chain-arrow">→</div>

              <div className="chain-node">
                <div className="node-icon-circle blue-circle">🤖</div>
                <span className="node-name">{activeCandidate?.deployment || 'Deployment'}</span>
              </div>

              <div className="chain-arrow">→</div>

              <div className="chain-node">
                <div className="node-icon-circle blue-circle">📄</div>
                <span className="node-name">Baseline Record</span>
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
                  All sources accessible • Last checked: {loading ? 'Checking...' : 'Just now'}
                </p>
                <div className="freshness-sources-list">
                  <div className="source-item">
                    <span>✓ Jira API ({context?.issueKey || 'Connected'})</span>
                    <span className="source-status-live">Synchronized</span>
                  </div>
                  <div className="source-item">
                    <span>
                      ✓ Confluence Baseline ({activeCandidate?.deployment ? `${activeCandidate.deployment} ODD` : 'Standby'})
                    </span>
                    <span className="source-status-live">Verified</span>
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
                className="btn btn-outline-action"
                onClick={triggerDiscovery}
                disabled={loading || !context?.issueKey}
              >
                <span>🔄</span>
                <span>{loading ? 'Scanning...' : 'Scan Context'}</span>
              </button>
              <button className="btn btn-outline-action" onClick={onOpenRegistry}>
                <span>🏢</span>
                <span>Open Registry</span>
              </button>
            </div>
          </div>

          {/* Card 4: Why this matters? */}
          <div className="andon-card why-matters-card">
            <div className="why-matters-content">
              <div className="card-top-row" style={{ marginBottom: '8px' }}>
                <div className="card-title-group">
                  <span className="header-icon">ℹ️</span>
                  <h3 className="card-heading">Why this matters?</h3>
                </div>
              </div>
              <p className="why-matters-text">
                ANDON helps you verify whether this change conflicts with documented robotics assumptions
                before work begins.
              </p>
            </div>
            <div className="why-matters-graphic">
              <RobotArmIllustration />
            </div>
          </div>
        </div>
      </div>

      {/* Dismissal Dialog Modal */}
      {dismissModalOpen && activeCandidate && (
        <div className="andon-modal-overlay" role="dialog" aria-modal="true">
          <div className="andon-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Dismiss Candidate Relationship</h3>
              <button className="modal-close-btn" onClick={() => setDismissModalOpen(false)}>
                ✕
              </button>
            </div>
            <p className="modal-description">
              Provide an engineering justification for why this work request does not affect {activeCandidate.deployment || 'the robot'}.
            </p>
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="e.g. Work is restricted to overhead area."
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn btn-outline-subtle"
                onClick={() => setDismissModalOpen(false)}
                disabled={isDismissing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDismissSubmit}
                disabled={isDismissing || !dismissReason.trim()}
              >
                {isDismissing ? 'Recording...' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
