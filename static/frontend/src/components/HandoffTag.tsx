import React, { useState } from 'react';

export type ActionState = 'IDLE' | 'PENDING' | 'CONFIRMED' | 'OUTCOME_UNCERTAIN';

export interface HandoffTagProps {
  targetProjectKey: string;
  defaultSummary: string;
  defaultDescription: string;
  actionState: ActionState;
  createdIssueKey?: string;
  onSubmit: (projectKey: string, summary: string, description: string, includeExcerpts: boolean) => void;
  onBack: () => void;
  loading: boolean;
}

export const HandoffTag: React.FC<HandoffTagProps> = ({
  targetProjectKey,
  defaultSummary,
  defaultDescription,
  actionState,
  createdIssueKey,
  onSubmit,
  onBack,
  loading,
}) => {
  const [projectKey, setProjectKey] = useState(targetProjectKey || 'ROBOT');
  const [summary, setSummary] = useState(defaultSummary || '');
  const [description, setDescription] = useState(defaultDescription || '');
  const [includeExcerpts, setIncludeExcerpts] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectKey.trim() || !summary.trim() || loading || actionState === 'CONFIRMED') return;
    onSubmit(projectKey.trim().toUpperCase(), summary.trim(), description.trim(), includeExcerpts);
  };

  return (
    <div className="handoff-tag-card" aria-label="Jira Engineering Handoff Tag">
      {/* Physical Luggage/Equipment Tag Styling Header */}
      <div className="tag-rivet-hole">
        <span className="wire-loop" />
      </div>

      <div className="tag-inner">
        <div className="tag-header-row">
          <div>
            <span className="tag-serial">TAG NO: HD-2026-ENG</span>
            <h3 className="tag-title">Engineering Follow-Up Work Tag</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg viewBox="0 0 100 24" width="90" height="22" aria-hidden="true" style={{ opacity: 0.8 }}>
              <rect x="0" y="0" width="3" height="24" fill="currentColor" />
              <rect x="5" y="0" width="1" height="24" fill="currentColor" />
              <rect x="8" y="0" width="4" height="24" fill="currentColor" />
              <rect x="14" y="0" width="2" height="24" fill="currentColor" />
              <rect x="18" y="0" width="5" height="24" fill="currentColor" />
              <rect x="25" y="0" width="1" height="24" fill="currentColor" />
              <rect x="28" y="0" width="3" height="24" fill="currentColor" />
              <rect x="33" y="0" width="2" height="24" fill="currentColor" />
              <rect x="37" y="0" width="4" height="24" fill="currentColor" />
              <rect x="43" y="0" width="1" height="24" fill="currentColor" />
              <rect x="46" y="0" width="6" height="24" fill="currentColor" />
              <rect x="54" y="0" width="2" height="24" fill="currentColor" />
              <rect x="58" y="0" width="3" height="24" fill="currentColor" />
              <rect x="63" y="0" width="1" height="24" fill="currentColor" />
              <rect x="66" y="0" width="5" height="24" fill="currentColor" />
              <rect x="73" y="0" width="2" height="24" fill="currentColor" />
              <rect x="77" y="0" width="3" height="24" fill="currentColor" />
              <rect x="82" y="0" width="4" height="24" fill="currentColor" />
              <rect x="88" y="0" width="1" height="24" fill="currentColor" />
              <rect x="91" y="0" width="3" height="24" fill="currentColor" />
              <rect x="96" y="0" width="4" height="24" fill="currentColor" />
            </svg>
            <div className="action-state-pill">
              <span className={`state-dot dot-${actionState.toLowerCase()}`} />
              <span className="state-label">STATE: {actionState}</span>
            </div>
          </div>
        </div>

        {createdIssueKey ? (
          <div className="tag-confirmed-banner">
            <div className="confirmed-icon">✓</div>
            <div>
              <strong className="confirmed-heading">Task Dispatched to Jira</strong>
              <p className="confirmed-desc">
                Created accountable engineering task{' '}
                <a href={`/browse/${createdIssueKey}`} target="_blank" rel="noreferrer" className="issue-link">
                  {createdIssueKey}
                </a>{' '}
                with version-bound pointers to Confluence baseline and facilities intake ticket.
              </p>
            </div>
            <span className="badge badge-green">{createdIssueKey}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="tag-form">
            <div className="form-group">
              <label className="form-label">Destination Jira Project Key *</label>
              <input
                type="text"
                className="form-input mono"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                disabled={loading || actionState === 'PENDING'}
                placeholder="e.g. ROBOT or ENG"
                required
              />
              <span className="form-help">
                Destination project must be accessible to qualified deployment reviewers.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Task Summary (Neutral Title) *</label>
              <input
                type="text"
                className="form-input"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={loading || actionState === 'PENDING'}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Description (Structured Scope References) *</label>
              <textarea
                className="form-textarea mono"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading || actionState === 'PENDING'}
                required
              />
            </div>

            {/* Privacy & Disclosure Boundary Toggle */}
            <div className="disclosure-toggle-box">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={includeExcerpts}
                  onChange={(e) => setIncludeExcerpts(e.target.checked)}
                  disabled={loading || actionState === 'PENDING'}
                />
                <div>
                  <strong>Cross-Project Disclosure Opt-In (Default: OFF)</strong>
                  <p className="toggle-sub">
                    When unchecked, raw Confluence page excerpts are omitted; only versioned URL pointers are shared.
                  </p>
                </div>
              </label>
            </div>

            {/* Action State Warnings */}
            {actionState === 'OUTCOME_UNCERTAIN' && (
              <div className="state-uncertain-box">
                ⚠️ External mutation response timed out. Action state set to <strong>OUTCOME_UNCERTAIN</strong>.
                Automated reconciliation in progress; duplicate dispatch prevented.
              </div>
            )}

            <div className="tag-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
                disabled={loading || actionState === 'PENDING'}
              >
                ← Back to Redline
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || actionState === 'PENDING' || !projectKey.trim() || !summary.trim()}
              >
                {actionState === 'PENDING'
                  ? 'Dispatching Task to Jira...'
                  : 'Approve & Create Accountable Follow-Up Task ➔'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

