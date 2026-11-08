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

  useEffect(() => {
    loadRedline(changeIntentId);
  }, [changeIntentId, loadRedline]);

  const handleConfirm = async () => {
    if (!redlineData) return;
    setConfirmError(null);
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
    }
  };

  const handleDismiss = async (reason: string) => {
    await dismissCandidate(changeIntentId, reason);
    onBack();
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

  const isStale = redlineData.commissionedSource.isStale;

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
        </div>
      </div>

      {(error || confirmError) && (
        <div style={{ background: 'var(--andon-signal-red-light)', border: '1px solid var(--andon-signal-red)', padding: '10px 14px' }}>
          <strong style={{ color: 'var(--andon-signal-red)' }}>Verification Error:</strong> {error || confirmError}
        </div>
      )}

      {isStale && (
        <StaleRibbon
          sourceRef={redlineData.commissionedSource.sourceRef}
          reviewedVersion={redlineData.commissionedSource.version}
          currentVersion={redlineData.commissionedSource.version + 1}
        />
      )}

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
    </div>
  );
};
