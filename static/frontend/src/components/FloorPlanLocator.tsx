import React from 'react';

export interface FloorPlanLocatorProps {
  siteName?: string;
  zoneName?: string;
  deploymentIdentifier?: string;
  hasLayoutData?: boolean;
}

export const FloorPlanLocator: React.FC<FloorPlanLocatorProps> = ({
  siteName = 'Facility Site',
  zoneName,
  deploymentIdentifier,
}) => {
  const displayZone = zoneName && zoneName !== 'Unknown' ? zoneName : 'Unmapped Zone';
  const displayDeployment = deploymentIdentifier && deploymentIdentifier !== 'Unknown' ? deploymentIdentifier : 'Unassigned Deployment';
  const isKnown = Boolean(zoneName && zoneName !== 'Unknown');

  return (
    <div className="facility-map-card-content">
      {/* Schematic Map Layout */}
      <div className="map-schematic-wrapper">
        <svg
          viewBox="0 0 460 160"
          className="facility-map-svg"
          role="img"
          aria-label={`Facility architectural map for ${siteName}, zone: ${displayZone}, deployment: ${displayDeployment}`}
        >
          <defs>
            <filter id="zoneGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#F97316" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Exterior Building Concrete Wall */}
          <rect x="8" y="14" width="444" height="132" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />

          {/* Wall Door Openings / Cutouts */}
          <line x1="8" y1="50" x2="8" y2="75" stroke="#FFFFFF" strokeWidth="4" />
          <line x1="452" y1="65" x2="452" y2="95" stroke="#FFFFFF" strokeWidth="4" />

          {/* Facility context label */}
          <text x="24" y="36" fill="#64748B" fontSize="11" fontWeight="600">
            {siteName}
          </text>

          {/* TARGET ACTIVE ZONE: Centered schematic area */}
          <g className={`map-zone ${isKnown ? 'zone-target' : 'zone-idle'}`} filter={isKnown ? 'url(#zoneGlow)' : undefined}>
            <rect
              x="140"
              y="38"
              width="180"
              height="90"
              rx="6"
              fill={isKnown ? '#FFF7ED' : '#F1F5F9'}
              stroke={isKnown ? '#F97316' : '#94A3B8'}
              strokeWidth={isKnown ? '2' : '1'}
              strokeDasharray={isKnown ? undefined : '4 4'}
            />
            <text
              x="230"
              y="74"
              textAnchor="middle"
              fill={isKnown ? '#EA580C' : '#64748B'}
              fontSize="12"
              fontWeight="700"
            >
              {displayZone}
            </text>

            {/* Deployment badge */}
            <g transform="translate(230, 28)">
              <rect x="-60" y="-8" width="120" height="18" rx="9" fill={isKnown ? '#EA580C' : '#64748B'} />
              <circle cx="-50" cy="1" r="3" fill="#FFFFFF" />
              <text x="-40" y="5" fill="#FFFFFF" fontSize="9" fontWeight="700">
                {displayDeployment}
              </text>
            </g>

            {/* Status indicator pin */}
            <g transform="translate(230, 102)">
              <circle cx="0" cy="0" r="10" fill={isKnown ? '#FFEDD5' : '#E2E8F0'} stroke={isKnown ? '#FDBA74' : '#CBD5E1'} strokeWidth="1" />
              <circle cx="0" cy="0" r="6" fill={isKnown ? '#0F172A' : '#64748B'} />
            </g>
          </g>
        </svg>
      </div>

      {/* Map Legend */}
      <div className="map-legend-col" aria-label="Map Legend">
        <div className="legend-item">
          <span className={`legend-dot ${isKnown ? 'dot-orange' : 'dot-gray'}`} />
          <span className="legend-label">{isKnown ? 'Identified Zone' : 'Unmapped Location'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-symbol-dark">
            <span className="mini-gear">⚙</span>
          </span>
          <span className="legend-label">Robot Deployment</span>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanLocator;
