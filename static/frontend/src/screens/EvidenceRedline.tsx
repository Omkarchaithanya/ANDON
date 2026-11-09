import React, { useEffect, useState } from 'react';
import { useReviewState } from '../hooks/useReviewState';
import { RedlineSheet } from '../components/RedlineSheet';
import { EvidenceThread } from '../components/EvidenceThread';
import { TheStamp } from '../components/TheStamp';
import { StaleRibbon } from '../components/StaleRibbon';

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
    loadRedline(changeIntentId);
  }, [changeIntentId, loadRedline]);

  const handleConfirm = async () => {
    if (!redlineData) return;
    setConfirmError(null);
    setIsProcessing(true);
    try {
      const reviewDecisionId = await confirmCandidate(
        changeIntentId,
        redlineData.changeIntent.deployment || 'AMR-12',
        redlineData.changeIntent.changedAttribute || 'surface_finish',
        redlineData.changeIntent.proposedValue || 'high_gloss_clear_finish'
      );
      onProceedToReview(reviewDecisionId);
    } catch (err: any) {
      setConfirmError(err?.message || 'Failed to record relationship confirmation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async (reason: string) => {
    await dismissCandidate(changeIntentId, reason);
    onBack();
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

  if (!redlineData) {
    return (
      <div className="empty-state-card" style={{ padding: '48px 24px' }}>
        <span style={{ fontSize: '28px' }}>📡</span>
        <h4>Retrieving Live Evidence Redline from Confluence and Teamwork Graph...</h4>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--andon-ink-subtle)' }}>
          Traversing Site Registry Page 10482 ➔ Aisle 7 ➔ AMR-12 Baseline.
        </p>
      </div>
    );
  }
  const candidate = redlineData?.changeIntent || {
    zone: 'Aisle 7',
    deployment: 'AMR-12',
    changedAttribute: 'surface_finish',
    currentValue: 'matte_epoxy',
    proposedValue: 'high_gloss_clear_finish',
  };

  const isStale = redlineData.commissionedSource.isStale;
  const proposed = redlineData?.proposedSource || {
    sourceRef: 'FAC-1042',
    text: 'Apply high-gloss clear finish to Aisle 7 next Saturday',
  };

  const baseline = redlineData?.commissionedSource || {
    sourceRef: 'Confluence Page 10483',
    version: 3,
    text: 'Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.',
  };

  return (
    <div className="drawing-sheet-main" aria-label="Evidence Redline Sheet">
      {/* Title & Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-subtle btn-sm" onClick={onBack} style={{ paddingLeft: 0, marginBottom: '4px' }}>
            ← Back to Change Intake Lens
          </button>
          <div>
            <span className="drawing-box-id">SHEET 2 OF 3 // EVIDENCE REDLINE</span>
            <h2 style={{ margin: '4px 0 2px 0', fontSize: '18px', fontWeight: 800 }}>
              Evidence Redline & Provenance Inspection
            </h2>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
              SIDE-BY-SIDE EXAMINATION: JIRA WORK ORDER VS CONFLUENCE COMMISSIONING BASELINE
            </span>
          </div>
    <div className="evidence-redline-view" aria-label="Evidence Redline Screen">
      {/* Top Navigation & Header */}
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Change Intake Lens
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">Evidence Redline & Provenance Inspection</h2>
          <p className="redline-main-subtitle">
            Side-by-side examination: Jira Work Order (FAC-1042) vs Confluence Commissioning Baseline (Page 10483 rev 3)
          </p>
        </div>
      </div>

      {(error || confirmError) && (
        <div style={{ background: 'var(--andon-signal-red-light)', border: '1px solid var(--andon-signal-red)', padding: '10px 14px' }}>
          <strong style={{ color: 'var(--andon-signal-red)' }}>Verification Error:</strong> {error || confirmError}
        <div className="redline-alert-box alert-error">
          <strong>Verification Notice:</strong> {error || confirmError}
        </div>
      )}

      {isStale && (
        <StaleRibbon
          sourceRef={redlineData.commissionedSource.sourceRef}
          reviewedVersion={redlineData.commissionedSource.version}
          currentVersion={redlineData.commissionedSource.version + 1}
        />
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

      {/* Signature Component 3: Redline Sheet */}
      <RedlineSheet
        jiraIssueKey={redlineData.proposedSource.sourceRef || 'FAC-1042'}
        jiraQuoteText={redlineData.proposedSource.text}
        jiraTargetZone={redlineData.changeIntent.zone || 'Aisle 7'}
        jiraTargetDate="Next Saturday (Scheduled)"
        confluencePageRef={redlineData.commissionedSource.sourceRef || 'Confluence Page 10483'}
        confluenceRevision={redlineData.commissionedSource.version || 3}
        confluenceClauseText={redlineData.commissionedSource.text}
        attributeName={redlineData.changeIntent.changedAttribute || 'surface_finish'}
        currentValue={redlineData.changeIntent.currentValue || 'matte_epoxy'}
        proposedValue={redlineData.changeIntent.proposedValue || 'high_gloss_clear_finish'}
        isStale={isStale}
        isRestricted={false}
      />
          <div className="source-card-meta">
            <span>Target Zone: <strong>{candidate.zone || 'Aisle 7'}</strong></span>
            <span>Execution: <strong>Next Saturday (Scheduled)</strong></span>
          </div>

      {/* Signature Component 4: Evidence Thread (Teamwork Graph Traversal) */}
      <EvidenceThread
        nodes={
          redlineData.graphContext.path.length > 0
            ? redlineData.graphContext.path.map((node) => ({
                label: node.label,
                type: node.type,
                hasAccess: true,
              }))
            : [
                { label: 'Facility Site Registry (Page 10482)', type: 'site', hasAccess: true },
                { label: 'Zone: Aisle 7', type: 'zone', hasAccess: true },
                { label: 'Deployment: AMR-12', type: 'deployment', hasAccess: true },
                { label: 'Commissioning Baseline (Page 10483 v3)', type: 'commissioning', hasAccess: true },
              ]
        }
        ownerName={redlineData.graphContext.ownerName || 'qm:lead-robotics-eng'}
        isCut={false}
      />
          <div className="source-quote-container">
            <span className="quote-label">VERBATIM QUOTE FROM TICKET DESCRIPTION:</span>
            <blockquote className="source-quote-text">
              “{proposed.text}”
            </blockquote>
          </div>

      {/* Signature Component 7: The Stamp Ceremony */}
      <TheStamp
        zone={redlineData.changeIntent.zone || 'Aisle 7'}
        deployment={redlineData.changeIntent.deployment || 'AMR-12'}
        attribute={redlineData.changeIntent.changedAttribute || 'surface_finish'}
        currentValue={redlineData.changeIntent.currentValue || 'matte_epoxy'}
        proposedValue={redlineData.changeIntent.proposedValue || 'high_gloss_clear_finish'}
        reviewerAccount={redlineData.graphContext.ownerName || 'qm:lead-robotics-eng'}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
        loading={loading}
      />
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
            <span>Deployment: <strong>{candidate.deployment || 'AMR-12'}</strong></span>
            <span>ODD Sensor Rig: <strong>Camera Config C4</strong></span>
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
            <span className="extracted-hint">Declared in AMR-12 Commissioning Baseline &amp; ODD</span>
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
              <strong className="step-title">Facility Alpha (Page 10482)</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill">
            <span className="step-icon">📍</span>
            <div className="step-info">
              <span className="step-type">FACILITY ZONE</span>
              <strong className="step-title">Zone: Aisle 7</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill">
            <span className="step-icon">🤖</span>
            <div className="step-info">
              <span className="step-type">ROBOT DEPLOYMENT</span>
              <strong className="step-title">Deployment: AMR-12</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill">
            <span className="step-icon">📋</span>
            <div className="step-info">
              <span className="step-type">COMMISSIONING ODD</span>
              <strong className="step-title">Baseline (Page 10483 v3)</strong>
            </div>
            <span className="step-perm-tag">✓ ACCESSIBLE</span>
          </div>

          <span className="chain-step-arrow">➔</span>

          <div className="chain-step-pill owner-pill">
            <span className="step-icon">👤</span>
            <div className="step-info">
              <span className="step-type">DOCUMENT OWNER</span>
              <strong className="step-title">Lead Robotics Engineer</strong>
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
            AUTHORITY: QUALIFIED REVIEWER (qm:lead-robotics-eng)
          </div>
        </div>

        <div className="stamp-body">
          <h3 className="stamp-title">
            Confirm Operating Assumption Relationship
          </h3>
          <p className="stamp-description">
            Confirming this candidate asserts that the planned surface finish modification in Aisle 7
            intersects the declared Operating Design Domain of AMR-12. This generates the official clearance
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
              Provide an engineering justification for why this facilities work order does not intersect AMR-12.
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
