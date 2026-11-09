import React, { useEffect, useState } from 'react';
import { useReviewState } from '../hooks/useReviewState';

interface EvidenceRedlineProps {
  changeIntentId: string;
  onBack: () => void;
  onProceedToReview: (reviewDecisionId: string) => void;
}

export const EvidenceRedline: React.FC<EvidenceRedlineProps> = ({
  changeIntentId,
  onBack,
  onProceedToReview,
}) => {
  const {
    redlineData,
    loading,
    error,
    loadRedline,
    confirmCandidate,
    dismissCandidate,
  } = useReviewState();

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (changeIntentId) {
      loadRedline(changeIntentId);
    }
  }, [changeIntentId, loadRedline]);

  const handleConfirm = async () => {
    if (!redlineData || !redlineData.changeIntent) return;
    setConfirmError(null);
    setIsProcessing(true);
    try {
      const reviewDecisionId = await confirmCandidate(
        changeIntentId,
        redlineData.changeIntent.deployment,
        redlineData.changeIntent.changedAttribute,
        redlineData.changeIntent.proposedValue
      );
      onProceedToReview(reviewDecisionId);
    } catch (err: any) {
      setConfirmError(err?.message || 'Failed to record relationship confirmation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    if (!dismissReason.trim()) return;
    setIsProcessing(true);
    try {
      await dismissCandidate(changeIntentId, dismissReason.trim());
      setDismissModalOpen(false);
      onBack();
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="evidence-redline-view">
        <div className="redline-top-action-bar">
          <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
            ← Back to Change Intake Lens
          </button>
        </div>
        <div className="andon-card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748B' }}>Loading evidence redline from platform...</p>
        </div>
      </div>
    );
  }

  if (!changeIntentId || !redlineData || !redlineData.changeIntent) {
    return (
      <div className="evidence-redline-view">
        <div className="redline-top-action-bar">
          <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
            ← Back to Change Intake Lens
          </button>
        </div>
        <div className="redline-alert-box alert-error" style={{ marginTop: '20px' }}>
          <strong>Unknown:</strong> {error || 'No candidate selected or accessible evidence redline found. Relationship cannot be evaluated without accessible source records.'}
        </div>
      </div>
    );
  }

  const candidate = redlineData.changeIntent;
  const proposed = redlineData.proposedSource;
  const baseline = redlineData.commissionedSource;

  return (
    <div className="evidence-redline-view" aria-label="Evidence Redline Screen">
      {/* Top Navigation & Header */}
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Change Intake Lens
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">Evidence Redline &amp; Provenance Inspection</h2>
          <p className="redline-main-subtitle">
            Side-by-side examination: Jira Work Order ({proposed.sourceRef}) vs Confluence Commissioning Baseline ({baseline.sourceRef} rev {baseline.version})
          </p>
        </div>
      </div>

      {(error || confirmError) && (
        <div className="redline-alert-box alert-error">
          <strong>Verification Notice:</strong> {error || confirmError}
        </div>
      )}

      {/* Dual Side-by-Side Comparison Cards with Center Divergence */}
      <div className="redline-comparison-grid">
        {/* Left Card: Live Jira Work Order */}
        <div className="andon-card redline-source-card source-jira">
          <div className="source-card-header">
            <div className="source-badge-wrap">
              <span className="source-type-pill pill-jira">SOURCE 1: LIVE JIRA WORK REQUEST</span>
              <span className="source-ref-badge">{proposed.sourceRef}</span>
            </div>
            <span className="source-status-live">✓ Live Read</span>
          </div>

          <div className="source-card-meta">
            <span>Target Zone: <strong>{candidate.zone || 'Unknown'}</strong></span>
            <span>Execution: <strong>Scheduled</strong></span>
          </div>

          <div className="source-quote-container">
            <span className="quote-label">VERBATIM QUOTE FROM TICKET DESCRIPTION:</span>
            <blockquote className="source-quote-text">
              “{proposed.text}”
            </blockquote>
          </div>

          <div className="source-extracted-condition">
            <div className="extracted-pill proposed-pill">
              <span className="dot-orange">●</span>
              <span>Proposed Value: <code>{candidate.proposedValue}</code></span>
            </div>
            <span className="extracted-hint">Extracted condition candidate from facilities text</span>
          </div>

          <div className="source-card-footer">
            <span>PERMISSIONS: ✓ READ:JIRA-WORK VERIFIED</span>
            <span>PROVENANCE: JIRA API REST v3</span>
          </div>
        </div>

        {/* Center Divergence Badge Column */}
        <div className="redline-center-divergence-col">
          <div className="divergence-indicator-card">
            <span className="divergence-glyph">≠</span>
            <span className="divergence-label">DIVERGENCE</span>
            <div className="divergence-diff">
              <span className="diff-val diff-old">{candidate.currentValue}</span>
              <span className="diff-arrow">➔</span>
              <span className="diff-val diff-new">{candidate.proposedValue}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Confluence Commissioning Baseline */}
        <div className="andon-card redline-source-card source-confluence">
          <div className="source-card-header">
            <div className="source-badge-wrap">
              <span className="source-type-pill pill-confluence">SOURCE 2: CONFLUENCE BASELINE</span>
              <span className="source-ref-badge">{baseline.sourceRef} rev {baseline.version}</span>
            </div>
            <span className="source-status-live">✓ Verified Record</span>
          </div>

          <div className="source-card-meta">
            <span>Deployment: <strong>{candidate.deployment || 'Unknown'}</strong></span>
            <span>Attribute: <strong>{candidate.changedAttribute || 'Unknown'}</strong></span>
          </div>

          <div className="source-quote-container">
            <span className="quote-label">AUTHORITATIVE BASELINE CLAUSE:</span>
            <blockquote className="source-quote-text">
              “{baseline.text}”
            </blockquote>
          </div>

          <div className="source-extracted-condition">
            <div className="extracted-pill documented-pill">
              <span className="dot-blue">●</span>
              <span>Documented Baseline: <code>{candidate.currentValue}</code></span>
            </div>
            <span className="extracted-hint">Declared in {candidate.deployment || 'Robot'} Commissioning Baseline</span>
          </div>

          <div className="source-card-footer">
            <span>PERMISSIONS: ✓ READ:CONFLUENCE-CONTENT VERIFIED</span>
            <span>PROVENANCE: CONFLUENCE REST v2</span>
          </div>
        </div>
      </div>

      {/* Teamwork Graph Traversal Card */}
      <div className="andon-card graph-traversal-fullcard">
        <div className="graph-traversal-header">
          <div className="traversal-title-group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <h3 className="card-heading">Teamwork Graph Traversal Thread</h3>
          </div>
          <span className="semantics-badge">SEMANTICS: RECORDED CONTEXT ONLY (NOT CAUSAL SUPPORT)</span>
        </div>

        <div className="traversal-chain-row">
          <div className="chain-step-pill">
            <span className="step-icon">🏢</span>
            <div className="step-info">
              <span className="step-type">SITE REGISTRY</span>
              <strong className="step-title">Site Registry Anchor</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill">
            <span className="step-icon">📍</span>
            <div className="step-info">
              <span className="step-type">FACILITY ZONE</span>
              <strong className="step-title">Zone: {candidate.zone || 'Unknown'}</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill">
            <span className="step-icon">🤖</span>
            <div className="step-info">
              <span className="step-type">ROBOT DEPLOYMENT</span>
              <strong className="step-title">Deployment: {candidate.deployment || 'Unknown'}</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill">
            <span className="step-icon">📋</span>
            <div className="step-info">
              <span className="step-type">COMMISSIONING ODD</span>
              <strong className="step-title">{baseline.sourceRef}</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill owner-pill">
            <span className="step-icon">👤</span>
            <div className="step-info">
              <span className="step-type">DOCUMENT OWNER</span>
              <strong className="step-title">{redlineData.graphContext?.ownerName || 'Qualified Reviewer'}</strong>
            </div>
            <span className="step-perm-tag">✓ GRAPH IDENTITY</span>
          </div>
        </div>
      </div>

      {/* The Stamp: Human Confirmation Ceremony */}
      <div className="andon-card the-stamp-card">
        <div className="stamp-header">
          <div className="stamp-badge">
            <span>FORM QM-ENG-03</span>
            <span>CLEARANCE VERIFICATION CEREMONY</span>
          </div>
          <div className="stamp-authority-info">
            AUTHORITY: QUALIFIED REVIEWER ONLY
          </div>
        </div>

        <div className="stamp-body">
          <h3 className="stamp-title">
            Confirm Operating Assumption Relationship
          </h3>
          <p className="stamp-description">
            Confirming this candidate asserts that the planned {candidate.changedAttribute || 'condition'} modification in {candidate.zone || 'the zone'}
            intersects the declared Operating Design Domain of {candidate.deployment || 'the deployment'}. This generates the official clearance
            evaluation and review package.
          </p>

          <div className="stamp-summary-box">
            <div className="stamp-summary-item">
              <span className="item-label">Deployment:</span>
              <strong>{candidate.deployment}</strong>
            </div>
            <div className="stamp-summary-item">
              <span className="item-label">Location:</span>
              <strong>{candidate.zone}</strong>
            </div>
            <div className="stamp-summary-item">
              <span className="item-label">Attribute:</span>
              <strong>{candidate.changedAttribute}</strong>
            </div>
            <div className="stamp-summary-item">
              <span className="item-label">Evaluation:</span>
              <strong style={{ color: '#EA580C' }}>{candidate.currentValue} ➔ {candidate.proposedValue}</strong>
            </div>
          </div>

          <div className="stamp-action-row">
            <button
              className="btn btn-inspect-orange btn-lg"
              onClick={handleConfirm}
              disabled={loading || isProcessing}
            >
              {isProcessing ? 'Computing Coverage...' : 'Confirm Relationship & Compute Coverage ➔'}
            </button>
            <button
              className="btn btn-outline-subtle btn-lg"
              onClick={() => setDismissModalOpen(true)}
              disabled={loading || isProcessing}
            >
              Dismiss Candidate (Not Related)
            </button>
          </div>
        </div>
      </div>

      {/* Dismissal Dialog Modal */}
      {dismissModalOpen && (
        <div className="andon-modal-overlay" role="dialog" aria-modal="true">
          <div className="andon-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Dismiss Candidate Relationship</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDismissModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-description">
              Provide an engineering justification for why this facilities work order does not intersect {candidate.deployment || 'the robot deployment'}.
            </p>
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="e.g. Facilities work applies exclusively to overhead ducting."
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn btn-outline-subtle"
                onClick={() => setDismissModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDismiss}
                disabled={isProcessing || !dismissReason.trim()}
              >
                {isProcessing ? 'Recording...' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
