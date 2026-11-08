import React, { useState } from 'react';

export interface StaleRibbonProps {
  sourceRef: string;
  reviewedVersion: number;
  currentVersion: number;
  onRefreshReview?: () => void;
}

export const StaleRibbon: React.FC<StaleRibbonProps> = ({
  sourceRef,
  reviewedVersion,
  currentVersion,
  onRefreshReview,
}) => {
  const [diffOpen, setDiffOpen] = useState(false);

  return (
    <>
      <div className="stale-ribbon-banner" role="alert">
        <div className="stale-badge-corner">
          <span>▲ STALE REVISION DETECTED</span>
        </div>
        <div className="stale-message">
          <strong>Source content was modified after this assessment was recorded.</strong>
          <span>
            Document <code>{sourceRef}</code> moved from <strong>rev {reviewedVersion}</strong> to{' '}
            <strong>rev {currentVersion}</strong>. Re-review is locked until refreshed.
          </span>
        </div>
        <div className="stale-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setDiffOpen(true)}>
            View Revision Delta
          </button>
          {onRefreshReview && (
            <button className="btn btn-primary btn-sm" onClick={onRefreshReview}>
              🔄 Refresh & Re-evaluate
            </button>
          )}
        </div>
      </div>

      {diffOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Source Revision Delta: {sourceRef}</h3>
              <p className="page-desc">
                Comparing reviewed baseline (rev {reviewedVersion}) against live Confluence page (rev {currentVersion}).
              </p>
            </div>
            <div className="modal-body">
              <div className="delta-box" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="delta-item">
                  <span className="delta-label">ASSESSED AT REV {reviewedVersion}</span>
                  <p className="mono" style={{ fontSize: '12px' }}>
                    “Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, existing matte epoxy finish.”
                  </p>
                </div>
                <div className="delta-item">
                  <span className="delta-label">LIVE PAGE AT REV {currentVersion}</span>
                  <p className="mono" style={{ fontSize: '12px' }}>
                    “Observed route/perception results apply to AMR-12, camera configuration C4, Aisle 7, [UPDATED SPECIFICATION].”
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-subtle" onClick={() => setDiffOpen(false)}>
                Close Delta Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
