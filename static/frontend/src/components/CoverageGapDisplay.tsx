import React from 'react';
import { CoverageDetail, CoverageStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface CoverageGapDisplayProps {
  status: CoverageStatus;
  explanation: string;
  details: CoverageDetail[];
  evidenceSourceRef: string;
}

export const CoverageGapDisplay: React.FC<CoverageGapDisplayProps> = ({
  status,
  explanation,
  details,
  evidenceSourceRef,
}) => {
  return (
    <div className="coverage-gap-card">
      <div className="coverage-gap-header">
        <h4 className="gap-alert-title">
          <span>⚠️ Evaluated Coverage Result:</span>
          <StatusBadge status={status} />
        </h4>
        <span style={{ fontSize: '12px', color: 'var(--ds-text-subtle)' }}>
          Baseline Source: <strong>{evidenceSourceRef}</strong>
        </span>
      </div>

      <div className="gap-explanation-text">
        {explanation}
      </div>

      <div style={{ marginTop: '14px' }}>
        <span className="delta-label" style={{ marginBottom: '8px', display: 'block' }}>
          Condition Delta Matrix
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {details.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: item.isCovered ? '#f0fbf6' : '#fff5f5',
                border: `1px solid ${item.isCovered ? '#baf3d7' : '#ffd5cc'}`,
                borderRadius: '4px',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px' }}>{item.conditionName}</strong>
                {item.alternativeEvidence && (
                  <div style={{ fontSize: '12px', color: 'var(--ds-text-subtle)', marginTop: '2px' }}>
                    {item.alternativeEvidence}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="delta-val-baseline">{item.actualValue || 'None'}</span>
                <span style={{ color: 'var(--ds-text-muted)' }}>➔</span>
                <span className="delta-val-proposed">{item.expectedValue}</span>
                <span className={`badge ${item.isCovered ? 'badge-green' : 'badge-red'}`}>
                  {item.isCovered ? 'COVERED' : 'GAP'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
