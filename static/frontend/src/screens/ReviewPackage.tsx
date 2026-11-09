import React, { useEffect, useState } from 'react';
import { useReviewState } from '../hooks/useReviewState';

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
    loading,
    error,
    loadReviewPackage,
    approveFollowup,
  } = useReviewState();

  const [createdIssueKey, setCreatedIssueKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [includeExcerpts, setIncludeExcerpts] = useState(false);

  const [targetProject, setTargetProject] = useState('ROBOT');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (reviewDecisionId) {
      loadReviewPackage(reviewDecisionId);
    }
  }, [reviewDecisionId, loadReviewPackage]);

  useEffect(() => {
    if (packageData?.createdIssueKey) {
      setCreatedIssueKey(packageData.createdIssueKey);
    }
    if (packageData?.followUp) {
      if (packageData.followUp.projectKey) setTargetProject(packageData.followUp.projectKey);
      if (packageData.followUp.summary) setSummary(packageData.followUp.summary);
      if (packageData.followUp.description) setDescription(packageData.followUp.description);
    }
  }, [packageData]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const sanitizedDescription = includeExcerpts
        ? description
        : `${description}\n\n[PROVENANCE POINTERS]: Reference baseline ID: ${packageData?.evidenceSourceRef || 'Confluence Baseline'}.`;

      const res: any = await approveFollowup(
        reviewDecisionId,
        targetProject,
        summary,
        sanitizedDescription
      );

      if (res && (res.issueKey || res.createdIssueKey)) {
        setCreatedIssueKey(res.issueKey || res.createdIssueKey);
      } else {
        throw new Error('Follow-up task created without returned issue key.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to dispatch follow-up task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-package-view">
        <div className="redline-top-action-bar">
          <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
            ← Back to Evidence Redline
          </button>
        </div>
        <div className="andon-card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748B' }}>Loading review package from platform...</p>
        </div>
      </div>
    );
  }

  if (!reviewDecisionId || !packageData) {
    return (
      <div className="review-package-view">
        <div className="redline-top-action-bar">
          <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
            ← Back to Evidence Redline
          </button>
        </div>
        <div className="redline-alert-box alert-error" style={{ marginTop: '20px' }}>
          <strong>Unknown:</strong> {error || 'No review package found for this decision. Evaluation requires confirmed candidate and accessible evidence.'}
        </div>
      </div>
    );
  }

  const isGap = packageData.coverageStatus !== 'COVERED';

  return (
    <div className="review-package-view" aria-label="Review Package &amp; Handoff Screen">
      {/* Top Action Bar */}
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Evidence Redline
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">Deterministic Coverage Evaluation &amp; Engineering Handoff</h2>
          <p className="redline-main-subtitle">
            Evaluating planned changes against {packageData.reviewer?.deployment || 'declared'} commissioning baseline scope
          </p>
        </div>
      </div>

      {(error || submitError) && (
        <div className="redline-alert-box alert-error">
          <strong>Dispatch Notice:</strong> {error || submitError}
        </div>
      )}

      {/* Coverage Status Evaluation Card */}
      <div className="andon-card coverage-evaluation-card">
        <div className="coverage-eval-header">
          <div className="eval-status-group">
            <span className={`eval-status-pill ${isGap ? 'pill-gap' : 'pill-covered'}`}>
              {packageData.coverageStatus === 'UNKNOWN'
                ? 'UNKNOWN COVERAGE STATUS'
                : isGap
                ? 'PROSPECTIVE COVERAGE GAP'
                : 'COVERED BY BASELINE'}
            </span>
            <span className="eval-mode-tag">DETERMINISTIC ENGINE // SET MEMBERSHIP</span>
          </div>
          <span className="source-ref-badge">{packageData.evidenceSourceRef}</span>
        </div>

        <div className="coverage-finding-quote">
          “{packageData.gapExplanation}”
        </div>

        {/* Condition Comparison Breakdown Table */}
        <div className="coverage-breakdown-table-wrap">
          <table className="coverage-table">
            <thead>
              <tr>
                <th>OPERATING ATTRIBUTE</th>
                <th>DECLARED COMMISSIONING BASELINE</th>
                <th>PROPOSED FACILITIES WORK</th>
                <th>EVALUATION RESULT</th>
              </tr>
            </thead>
            <tbody>
              {packageData.coverageDetails.length > 0 ? (
                packageData.coverageDetails.map((cond, idx) => (
                  <tr key={idx}>
                    <td><strong>{cond.conditionName}</strong></td>
                    <td><code>{cond.actualValue}</code></td>
                    <td><code className="code-proposed">{cond.expectedValue}</code></td>
                    <td>
                      <span className={cond.isCovered ? 'badge-covered' : 'badge-gap'}>
                        {cond.isCovered ? 'COVERED' : 'GAP'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#64748B' }}>
                    No conditions recorded in baseline scope. Status is Unknown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Clock Timeline Card */}
      <div className="andon-card timeline-card">
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="header-icon">⏱️</span>
            <h3 className="card-heading">Two-Clock Revalidation Timeline</h3>
          </div>
          <span className="meta-value">Coordination Window</span>
        </div>

        <div className="two-clock-grid">
          <div className="clock-col clock-facilities">
            <div className="clock-col-header">
              <span className="clock-icon">🏢</span>
              <strong>Clock 1: Facilities Execution Window</strong>
            </div>
            <p className="clock-time">Scheduled Work Window</p>
            <p className="clock-desc">
              Physical modifications proceed according to facilities schedule unless flagged.
            </p>
          </div>

          <div className="clock-divider-arrow">➔</div>

          <div className="clock-col clock-robotics">
            <div className="clock-col-header">
              <span className="clock-icon">🤖</span>
              <strong>Clock 2: Robotics Revalidation Deadline</strong>
            </div>
            <p className="clock-time">Prior to Modification Execution</p>
            <p className="clock-desc">
              Robotics engineering evaluation required before floor or environment modifications proceed.
            </p>
          </div>
        </div>
      </div>

      {/* Engineering Handoff Dispatch Card */}
      <div className="andon-card handoff-dispatch-card">
        <div className="card-top-row">
          <div className="card-title-group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <h3 className="card-heading">Engineering Handoff &amp; Dispatch</h3>
          </div>
          <span className="jira-key-pill">Target Project: {targetProject}</span>
        </div>

        {createdIssueKey ? (
          <div className="dispatch-success-banner">
            <div className="success-icon-wrap">✓</div>
            <div className="success-content">
              <h4 className="success-title">Follow-up Task Dispatched Successfully</h4>
              <p className="success-msg">
                Created Jira engineering task <strong>{createdIssueKey}</strong> in project <strong>{targetProject}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="handoff-form">
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Target Engineering Project</label>
                <input
                  type="text"
                  className="form-input"
                  value={targetProject}
                  onChange={(e) => setTargetProject(e.target.value)}
                  placeholder="e.g. ROBOT"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Qualified Reviewer</label>
                <input
                  type="text"
                  className="form-input"
                  value={packageData.reviewer?.name || 'Qualified Reviewer'}
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Issue Summary</label>
              <input
                type="text"
                className="form-input"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Issue summary"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Structured Description &amp; Provenance Pointers</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>

            <div className="form-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeExcerpts}
                  onChange={(e) => setIncludeExcerpts(e.target.checked)}
                />
                <span>Include verbatim text excerpts (subject to cross-project permission boundary)</span>
              </label>
            </div>

            <div className="form-actions-row">
              <button
                className="btn btn-inspect-orange btn-lg"
                onClick={handleApprove}
                disabled={isSubmitting || !summary.trim()}
              >
                {isSubmitting ? 'Dispatching Task...' : `Approve & Dispatch Engineering Follow-up (${targetProject}) ➔`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
