import React from 'react';

export interface HatchedUnknownProps {
  title: string;
  reason: string;
  resolutionStep?: string;
  isRestricted?: boolean;
}

export const HatchedUnknown: React.FC<HatchedUnknownProps> = ({
  title,
  reason,
  resolutionStep,
  isRestricted = false,
}) => {
  return (
    <div className={`hatched-box ${isRestricted ? 'hatched-restricted' : 'hatched-default'}`} role="status">
      <div className="hatched-indicator">
        <span className="hatched-glyph">{isRestricted ? '🔒' : '▨'}</span>
      </div>
      <div className="hatched-content">
        <div className="hatched-header">
          <span className="hatched-status-badge">
            {isRestricted ? 'RESTRICTED ACCESS' : 'UNKNOWN / UNRESOLVED'}
          </span>
          <strong className="hatched-title">{title}</strong>
        </div>
        <p className="hatched-reason">{reason}</p>
        {resolutionStep && (
          <div className="hatched-action">
            <span className="action-tag">ACTION REQUIRED:</span> {resolutionStep}
          </div>
        )}
      </div>
    </div>
  );
};

