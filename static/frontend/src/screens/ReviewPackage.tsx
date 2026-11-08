import React, { useEffect, useState } from 'react';
import { useReviewState } from '../hooks/useReviewState';
import { CoverageRuler } from '../components/CoverageRuler';
import { TwoClockTimeline } from '../components/TwoClockTimeline';
import { HandoffTag, ActionState } from '../components/HandoffTag';

interface ReviewPackageProps {
  reviewDecisionId: string;
  onBack: () => void;
}

export const ReviewPackage: React.FC<ReviewPackageProps> = ({
  reviewDecisionId,
  onBack,
}) => {
  const {
    packageData,
    error,
    loadReviewPackage,
    approveFollowup,
  } = useReviewState();

  const [actionState, setActionState] = useState<ActionState>('IDLE');
  const [createdIssueKey, setCreatedIssueKey] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadReviewPackage(reviewDecisionId);
  }, [reviewDecisionId, loadReviewPackage]);

  useEffect(() => {
    if (packageData?.createdIssueKey) {
      setCreatedIssueKey(packageData.createdIssueKey);
      setActionState('CONFIRMED');
    }
  }, [packageData]);

  const handleApproveHandoff = async (
    projectKey: string,
    summary: string,
    description: string,
    includeExcerpts: boolean
  ) => {
    setActionState('PENDING');
    setSubmitError(null);
    try {
      // In accordance with SPEC privacy guidelines:
      // If includeExcerpts is false, description contains structured pointers only.
      const sanitizedDescription = includeExcerpts
        ? description
        : `${description}\n\n[PROVENANCE POINTERS]: Confluence Page 10483 rev 3 (AMR-12 Commissioning Baseline). Raw excerpts omitted per cross-project disclosure boundary.`;

      const res: any = await approveFollowup(
        reviewDecisionId,
        projectKey,
        summary,
        sanitizedDescription
      );

      if (res && (res.issueKey || res.createdIssueKey)) {
        const issueKey = res.issueKey || res.createdIssueKey;
        setCreatedIssueKey(issueKey);
        setActionState('CONFIRMED');
      } else {
        setActionState('OUTCOME_UNCERTAIN');
        throw new Error('Follow-up task dispatch response unconfirmed. Reconciling transaction state.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to dispatch follow-up task to Jira.');
      if (actionState !== 'CONFIRMED') {
        setActionState('OUTCOME_UNCERTAIN');
      }
    }
  };

  if (!packageData) {
    return (
      <div className="empty-state-card" style={{ padding: '48px 24px' }}>
        <span style={{ fontSize: '28px' }}>📡</span>
        <h4>Evaluating Deterministic Coverage & Compiling Engineering Review Package...</h4>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--andon-ink-subtle)' }}>
          Computing set-membership against AMR-12 Commissioning Scope.
        </p>
      </div>
    );
  }

  const isCovered = packageData.coverageStatus === 'COVERED';

  return (
    <div className="drawing-sheet-main" aria-label="Review Package Sheet">
      {/* Title & Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-subtle btn-sm" onClick={onBack} style={{ paddingLeft: 0, marginBottom: '4px' }}>
            ← Back to Evidence Redline
          </button>
          <div>
            <span className="drawing-box-id">SHEET 3 OF 3 // REVIEW PACKAGE & HANDOFF</span>
            <h2 style={{ margin: '4px 0 2px 0', fontSize: '18px', fontWeight: 800 }}>
              Deterministic Review Package & Jira Handoff
            </h2>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--andon-ink-subtle)' }}>
              ACCOUNTABLE WORK CONVERSION // DISPATCHING VERIFIED GAP TO RESPONSIBLE SQUAD
            </span>
          </div>
        </div>
      </div>

      {(error || submitError) && (
        <div style={{ background: 'var(--andon-signal-red-light)', border: '1px solid var(--andon-signal-red)', padding: '10px 14px' }}>
          <strong style={{ color: 'var(--andon-signal-red)' }}>Handoff Notice:</strong> {error || submitError}
        </div>
      )}

      {/* Signature Component 5: Coverage Ruler */}
      <CoverageRuler
        attributeName="surface_finish"
        declaredScopeValues={['matte_epoxy']}
        proposedValue="high_gloss_clear_finish"
        isCovered={isCovered}
        baselineSourceRef={packageData.evidenceSourceRef || 'Page 10483 rev 3'}
      />

      {/* Signature Component 6: Two Clock Timeline */}
      <TwoClockTimeline
        effectiveTime="Next Saturday (Scheduled Work Window)"
        isEffectiveConfirmed={false}
        learnedTime={new Date().toISOString()}
        confluenceRevision={3}
        jiraUpdatedTime="2026-11-07T14:32:00Z"
      />

      {/* Responsible Team & Test Plan Verification Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Reviewer / Deployment Profile */}
        <div style={{ background: 'var(--andon-surface)', border: '1px solid var(--andon-border)', padding: '16px' }}>
          <span className="mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--andon-ink-subtle)', display: 'block', marginBottom: '8px' }}>
            QUALIFIED DEPLOYMENT PROFILE
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div>
              <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Target Robot: </span>
              <strong>{packageData.reviewer?.deployment || 'AMR-12'}</strong>
            </div>
            <div>
              <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Zone: </span>
              <strong>{packageData.reviewer?.zone || 'Aisle 7'}</strong>
            </div>
            <div>
              <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Responsible Lead: </span>
              <strong>{packageData.reviewer?.name || 'Lead Robotics Engineer'}</strong>
            </div>
            <div>
              <span className="mono" style={{ color: 'var(--andon-ink-muted)' }}>Role: </span>
              <span className="badge badge-grey">{packageData.reviewer?.role || 'Robotics Engineering Lead'}</span>
            </div>
          </div>
        </div>

        {/* Existing Procedures or Expert-Definition Request (SPEC Requirement) */}
        <div style={{ background: 'var(--andon-surface)', border: '1px solid var(--andon-border)', padding: '16px' }}>
          <span className="mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--andon-ink-subtle)', display: 'block', marginBottom: '8px' }}>
            TEST PLAN PROCEDURE CHECK
          </span>
          {packageData.procedures && packageData.procedures.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {packageData.procedures.map((proc, i) => (
                <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span>
                  <span>{proc}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--andon-surface-sunken)', border: '1px dashed var(--andon-border)', padding: '10px 12px' }}>
              <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--andon-signal-amber)' }}>
                ▲ EXPERT-DEFINITION REQUEST REQUIRED
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--andon-ink-subtle)' }}>
                No standard test procedure cataloged in baseline evidence for <code>surface_finish</code> modification. A qualified robotics engineer must define verification requirements prior to execution.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Component 8: Handoff Tag */}
      <HandoffTag
        targetProjectKey={packageData.followUp.projectKey || 'ROBOT'}
        defaultSummary={packageData.followUp.summary || '[ANDON Review] AMR-12 - surface_finish change in Aisle 7'}
        defaultDescription={
          packageData.followUp.description ||
          `Prospective coverage gap identified by ANDON:\n\nWork request (FAC-1042) proposes modification of "surface_finish" to "high_gloss_clear_finish".\n\nBaseline commissioning evidence (Confluence Page 10483 rev 3) does not establish coverage of this condition.\n\nRequired Actions:\n1. Review the proposed physical change with facilities staff.\n2. Complete revalidation procedures prior to deployment window.`
        }
        actionState={actionState}
        createdIssueKey={createdIssueKey || undefined}
        onSubmit={handleApproveHandoff}
        onBack={onBack}
        loading={actionState === 'PENDING'}
      />
    </div>
  );
};
