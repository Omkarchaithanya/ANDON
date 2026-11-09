import React from 'react';

interface DecisionHistoryViewProps {
  onBack: () => void;
}

export const DecisionHistoryView: React.FC<DecisionHistoryViewProps> = ({ onBack }) => {
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

      <div className="andon-card">
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="header-icon">📜</span>
            <h3 className="card-heading">Clearance Audit Trail</h3>
          </div>
          <span className="source-status-live">Forge SQL Ledger</span>
        </div>

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
              <tr>
                <td>Just now</td>
                <td><strong>FAC-1042</strong></td>
                <td>AMR-12 (Aisle 7)</td>
                <td><span className="badge-gap">PROSPECTIVE GAP</span></td>
                <td>qm:lead-robotics-eng</td>
                <td><code className="code-proposed">ROBOT-8821</code></td>
              </tr>
              <tr>
                <td>3 days ago</td>
                <td><strong>FAC-1039</strong></td>
                <td>AMR-08 (Aisle 5)</td>
                <td><span style={{ color: '#16A34A', fontWeight: 700 }}>COVERED</span></td>
                <td>qm:lead-robotics-eng</td>
                <td>None (Clearance Granted)</td>
              </tr>
              <tr>
                <td>1 week ago</td>
                <td><strong>FAC-1025</strong></td>
                <td>AMR-14 (Aisle 8)</td>
                <td><span style={{ color: '#64748B', fontWeight: 600 }}>DISMISSED</span></td>
                <td>qm:lead-robotics-eng</td>
                <td>Not Related (Overhead Work)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

