import React, { useState } from 'react';

export interface TheStampProps {
  zone: string;
  deployment: string;
  attribute: string;
  currentValue: string;
  proposedValue: string;
  reviewerAccount: string;
  onConfirm: () => void;
  onDismiss: (reason: string) => void;
  loading: boolean;
}

export const TheStamp: React.FC<TheStampProps> = ({
  zone,
  deployment,
  attribute,
  currentValue,
  proposedValue,
  reviewerAccount,
  onConfirm,
  onDismiss,
  loading,
}) => {
  const [stampLocation, setStampLocation] = useState(false);
  const [stampDeployment, setStampDeployment] = useState(false);
  const [stampAttribute, setStampAttribute] = useState(false);

  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissalCommitted, setDismissalCommitted] = useState<string | null>(null);

  const allStamped = stampLocation && stampDeployment && stampAttribute && !loading;
  const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const handleDismissSubmit = () => {
    if (!dismissReason.trim()) return;
    setDismissalCommitted(dismissReason.trim());
    onDismiss(dismissReason.trim());
    setDismissModalOpen(false);
  };

  return (
    <div className="stamp-ceremony-card" aria-label="Reviewer Confirmation Stamps">
      <div className="stamp-card-header">
        <div>
          <span className="drawing-sheet-label">CERTIFICATION BLOCK // FORM QM-ENG-03</span>
          <h3 className="stamp-title">Human Verification & Accountability Seals</h3>
          <p className="stamp-subtext">
            Autonomous radar proposes candidate dependencies; an authorized human engineer must apply three independent verification stamps before deterministic coverage evaluation is unlocked.
          </p>
        </div>
        <div className="reviewer-seal-info">
          <span className="meta-label">QUALIFIED REVIEWER:</span>
          <strong>{reviewerAccount || 'Robotics Lead'}</strong>
        </div>
      </div>

      {dismissalCommitted ? (
        <div className="stamp-dismissed-banner">
          <div className="rubber-stamp stamp-rejected">
            <span>DISMISSED</span>
            <small>NOT RELATED</small>
            <time>{nowStamp}</time>
          </div>
          <div className="dismissed-audit-trail">
            <strong>Technical Audit Justification:</strong>
            <p>“{dismissalCommitted}”</p>
            <span className="audit-author">Logged by {reviewerAccount}</span>
          </div>
        </div>
      ) : (
        <div className="stamps-grid">
          {/* Stamp 1: Location */}
          <div
            className={`stamp-box ${stampLocation ? 'stamped' : 'unstamped'}`}
            onClick={() => setStampLocation(!stampLocation)}
          >
            <div className="stamp-box-header">
              <span className="stamp-num">SEAL 1 OF 3</span>
              <span className="stamp-checkbox">{stampLocation ? '☑ STAMPED' : '☐ UNCONFIRMED'}</span>
            </div>
            <div className="stamp-box-body">
              <strong>1. Location Identity</strong>
              <p>Confirmed maintenance work is scheduled inside facility zone <code>{zone}</code>.</p>
            </div>
            {stampLocation && (
              <div className="rubber-stamp stamp-approved">
                <span>VERIFIED</span>
                <small>{zone}</small>
                <time>{nowStamp}</time>
              </div>
            )}
          </div>

          {/* Stamp 2: Deployment */}
          <div
            className={`stamp-box ${stampDeployment ? 'stamped' : 'unstamped'}`}
            onClick={() => setStampDeployment(!stampDeployment)}
          >
            <div className="stamp-box-header">
              <span className="stamp-num">SEAL 2 OF 3</span>
              <span className="stamp-checkbox">{stampDeployment ? '☑ STAMPED' : '☐ UNCONFIRMED'}</span>
            </div>
            <div className="stamp-box-body">
              <strong>2. Deployment Interaction</strong>
              <p>Confirmed robot <code>{deployment}</code> operates within this operational zone.</p>
            </div>
            {stampDeployment && (
              <div className="rubber-stamp stamp-approved">
                <span>DEPLOYMENT</span>
                <small>{deployment}</small>
                <time>{nowStamp}</time>
              </div>
            )}
          </div>

          {/* Stamp 3: Condition Divergence */}
          <div
            className={`stamp-box ${stampAttribute ? 'stamped' : 'unstamped'}`}
            onClick={() => setStampAttribute(!stampAttribute)}
          >
            <div className="stamp-box-header">
              <span className="stamp-num">SEAL 3 OF 3</span>
              <span className="stamp-checkbox">{stampAttribute ? '☑ STAMPED' : '☐ UNCONFIRMED'}</span>
            </div>
            <div className="stamp-box-body">
              <strong>3. Condition Divergence</strong>
              <p>
                Confirmed planned <code>{attribute}</code> (<em>{proposedValue}</em>) modifies documented baseline (<em>{currentValue}</em>).
              </p>
            </div>
            {stampAttribute && (
              <div className="rubber-stamp stamp-approved">
                <span>DIVERGENCE</span>
                <small>{attribute}</small>
                <time>{nowStamp}</time>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      {!dismissalCommitted && (
        <div className="stamp-actions-footer">
          <button
            className="btn btn-subtle"
            onClick={() => setDismissModalOpen(true)}
            disabled={loading}
          >
            Reject Candidate (Not Related — Reason Required)
          </button>

          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!allStamped}
          >
            {loading
              ? 'Evaluating Deterministic Coverage...'
              : allStamped
              ? 'Confirm All 3 Seals & Evaluate Coverage ➔'
              : 'Apply All 3 Seals to Unlock Coverage Evaluation'}
          </button>
        </div>
      )}

      {/* Required-Reason Dismissal Dialog Modal */}
      {dismissModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Dismiss Candidate Relationship</h3>
              <p className="page-desc">
                Engineering dismissals require a non-empty audit rationale. This decision and source versions are permanently recorded.
              </p>
            </div>
            <div className="modal-body">
              <label className="form-label">Technical Audit Reason (Mandatory) *</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="e.g. Work is restricted to overhead mezzanine above Aisle 7; floor surface unaffected."
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-subtle"
                onClick={() => setDismissModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={!dismissReason.trim() || loading}
                onClick={handleDismissSubmit}
              >
                Confirm Technical Dismissal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

