import React from 'react';

export type LampStatus = 'IDLE' | 'AMBER' | 'RED' | 'GREEN' | 'UNKNOWN';

export interface AndonLightStackProps {
  discoveryStatus: LampStatus;
  applicabilityStatus: LampStatus;
  freshnessStatus: LampStatus;
  compact?: boolean;
}

export const AndonLightStack: React.FC<AndonLightStackProps> = ({
  discoveryStatus,
  applicabilityStatus,
  freshnessStatus,
  compact = false,
}) => {
  const renderLamp = (
    label: string,
    axis: string,
    shape: 'circle' | 'diamond' | 'hexagon',
    status: LampStatus
  ) => {
    let statusClass = 'lamp-idle';
    let glyph = '○';

    if (shape === 'circle') glyph = status === 'AMBER' ? '●' : '○';
    if (shape === 'diamond') glyph = status === 'RED' ? '◆' : status === 'GREEN' ? '◇' : '◇';
    if (shape === 'hexagon') glyph = status === 'RED' ? '⬢' : status === 'GREEN' ? '⬡' : '⬡';

    switch (status) {
      case 'AMBER':
        statusClass = 'lamp-amber';
        break;
      case 'RED':
        statusClass = 'lamp-red';
        break;
      case 'GREEN':
        statusClass = 'lamp-green';
        break;
      case 'UNKNOWN':
        statusClass = 'lamp-unknown';
        glyph = '⊗';
        break;
      default:
        statusClass = 'lamp-idle';
    }

    return (
      <div className={`andon-lamp-unit ${statusClass}`} title={`${axis}: ${status}`}>
        <div className={`lamp-lens ${shape}`}>
          <span className="lamp-glyph">{glyph}</span>
        </div>
        {!compact && (
          <div className="lamp-info">
            <span className="lamp-axis">{axis}</span>
            <span className="lamp-label">{label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`andon-tower ${compact ? 'tower-compact' : 'tower-vertical'}`} aria-label="Andon Signal Tower">
      <div className="tower-cap">ANDON STACK</div>
      <div className="tower-body">
        {renderLamp(
          discoveryStatus === 'AMBER' ? 'CANDIDATE' : 'QUIET',
          'DISCOVERY',
          'circle',
          discoveryStatus
        )}
        {renderLamp(
          applicabilityStatus === 'RED'
            ? 'COVERAGE GAP'
            : applicabilityStatus === 'GREEN'
            ? 'SUPPORTED'
            : 'EVAL PENDING',
          'APPLICABILITY',
          'diamond',
          applicabilityStatus
        )}
        {renderLamp(
          freshnessStatus === 'RED'
            ? 'STALE REV'
            : freshnessStatus === 'GREEN'
            ? 'VERIFIED'
            : 'CHECKING',
          'FRESHNESS',
          'hexagon',
          freshnessStatus
        )}
      </div>
    </aside>
  );
};

