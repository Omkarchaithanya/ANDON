import React from 'react';

export interface FloorPlanLocatorProps {
  siteName: string;
  zoneName: string;
  deploymentIdentifier: string;
  hasLayoutData?: boolean;
}

export const FloorPlanLocator: React.FC<FloorPlanLocatorProps> = ({
  siteName,
  zoneName,
  deploymentIdentifier,
  hasLayoutData = true,
}) => {
  return (
    <div className="floorplan-container">
      <div className="floorplan-header">
        <span className="drawing-ref">DWG: LOC-FAC-01</span>
        <span className="site-tag">SITE: {siteName || 'Facility Alpha'}</span>
      </div>

      {hasLayoutData ? (
        <div className="floorplan-schematic">
          <svg
            viewBox="0 0 340 130"
            className="floorplan-svg"
            role="img"
            aria-label={`Schematic showing ${zoneName} and deployment ${deploymentIdentifier}`}
          >
            {/* Architectural Grid */}
            <defs>
              <pattern id="planGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--andon-ink-muted)" strokeWidth="0.4" strokeDasharray="1,3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#planGrid)" />

            {/* Perimeter Walls */}
            <rect x="10" y="10" width="320" height="110" fill="none" stroke="var(--andon-ink)" strokeWidth="1.5" />

            {/* Inactive Aisles */}
            <rect x="25" y="25" width="40" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="45" y="68" textAnchor="middle" className="aisle-num">A-5</text>

            <rect x="80" y="25" width="40" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="100" y="68" textAnchor="middle" className="aisle-num">A-6</text>

            {/* Target Active Zone (Aisle 7) - Highlighted */}
            <g className="active-zone-group">
              <rect
                x="135"
                y="20"
                width="60"
                height="90"
                fill="rgba(217, 119, 6, 0.12)"
                stroke="var(--andon-signal-amber)"
                strokeWidth="1.8"
                strokeDasharray="4,2"
              />
              <text x="165" y="40" textAnchor="middle" className="active-zone-text">
                {zoneName}
              </text>

              {/* Pinned Robot Deployment AMR-12 */}
              <circle cx="165" cy="72" r="10" fill="var(--andon-ink)" stroke="var(--andon-surface)" strokeWidth="2" />
              <text x="165" y="75" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">R</text>

              {/* Pin Callout Marker */}
              <line x1="165" y1="84" x2="165" y2="102" stroke="var(--andon-ink)" strokeWidth="1" />
              <rect x="135" y="100" width="60" height="14" fill="var(--andon-ink)" rx="2" />
              <text x="165" y="110" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">
                {deploymentIdentifier}
              </text>
            </g>

            {/* Other Facility Zones */}
            <rect x="210" y="25" width="40" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="230" y="68" textAnchor="middle" className="aisle-num">A-8</text>

            <rect x="265" y="25" width="50" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="290" y="68" textAnchor="middle" className="aisle-num">STAGING</text>
          </svg>
        </div>
      ) : (
        <div className="zone-chip-diagram">
          <div className="zone-chip active">
            <span className="chip-tag">TARGET ZONE</span>
            <strong>{zoneName}</strong>
          </div>
          <span className="chip-link">➔</span>
          <div className="zone-chip active">
            <span className="chip-tag">DEPLOYMENT</span>
            <strong>{deploymentIdentifier}</strong>
          </div>
        </div>
      )}

      <div className="floorplan-footer">
        <span>COORDINATES: Z-07 / SEC-ALPHA</span>
        <span>ODD BASELINE: AMR-12.ODD.v3</span>
      </div>
    </div>
  );
};
