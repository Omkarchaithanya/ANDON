import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

interface DecisionHistoryViewProps {
  onBack: () => void;
}

interface DecisionRow {
  id: string;
  timestamp: string;
  workRequestKey: string;
  deploymentIdentifier: string;
  zoneName: string;
  decisionStatus: string;
  coverageResult: string;
  reviewerAccountId: string;
  followupKey?: string;
}

export const DecisionHistoryView: React.FC<DecisionHistoryViewProps> = ({ onBack }) => {
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const res: any = await invoke('getAssessmentHistory').catch(() => null);
        if (res && Array.isArray(res.decisions)) {
          setDecisions(res.decisions);
        } else if (Array.isArray(res)) {
          setDecisions(res);
        } else {
          setDecisions([]);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load assessment history.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="decision-history-view" aria-label="Decision History View">
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Change Intake Lens
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">Decision History &amp; Clearance Ledger</h2>
          <p className="redline-main-subtitle">
            Auditable log of candidate discoveries, human reviewer determinations, and follow-up dispatches
          </p>
        </div>
      </div>

      {error && (
        <div className="redline-alert-box alert-error" style={{ marginBottom: '16px' }}>
          <strong>Notice:</strong> {error}
        </div>
      )}

      <div className="andon-card">
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="header-icon">📜</span>
            <h3 className="card-heading">Clearance Audit Trail</h3>
          </div>
          <span className="source-status-live">Forge SQL Ledger</span>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
            Loading ledger records from Forge SQL...
          </div>
        ) : decisions.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', margin: '16px 0' }}>
            <strong>No review decisions recorded in Forge SQL ledger.</strong>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>
              Decisions will appear here once candidates are reviewed on Jira work requests.
            </p>
          </div>
        ) : (
          <div className="coverage-breakdown-table-wrap">
            <table className="coverage-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>WORK REQUEST</th>
                  <th>DEPLOYMENT</th>
                  <th>DECISION / STATUS</th>
                  <th>QUALIFIED REVIEWER</th>
                  <th>FOLLOW-UP TASK</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d.id}>
                    <td>{d.timestamp ? new Date(d.timestamp).toLocaleString() : 'Unknown'}</td>
                    <td><strong>{d.workRequestKey || 'Unknown'}</strong></td>
                    <td>{d.deploymentIdentifier ? `${d.deploymentIdentifier} (${d.zoneName || 'General'})` : 'Unknown'}</td>
                    <td>
                      <span className={d.coverageResult === 'gap' ? 'badge-gap' : 'source-status-live'}>
                        {d.decisionStatus || d.coverageResult || 'REVIEWED'}
                      </span>
                    </td>
                    <td><code>{d.reviewerAccountId || 'Unknown'}</code></td>
                    <td>
                      {d.followupKey ? (
                        <code className="code-proposed">{d.followupKey}</code>
                      ) : (
                        'None'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionHistoryView;
