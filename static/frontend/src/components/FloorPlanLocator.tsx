import React from 'react';

export interface FloorPlanLocatorProps {
  siteName: string;
  siteName?: string;
  zoneName: string;
  deploymentIdentifier: string;
  hasLayoutData?: boolean;
}

export const FloorPlanLocator: React.FC<FloorPlanLocatorProps> = ({
  siteName,
  zoneName,
  deploymentIdentifier,
  hasLayoutData = true,
  siteName: _siteName = 'Facility Alpha',
  zoneName = 'Aisle 7',
  deploymentIdentifier = 'AMR-12',
}) => {
  return (
    <div className="floorplan-container">
      <div className="floorplan-header">
        <span className="drawing-ref">DWG: LOC-FAC-01</span>
        <span className="site-tag">SITE: {siteName || 'Facility Alpha'}</span>
      </div>
    <div className="facility-map-card-content">
      {/* Schematic Map Layout */}
      <div className="map-schematic-wrapper">
        <svg
          viewBox="0 0 460 160"
          className="facility-map-svg"
          role="img"
          aria-label={`Facility architectural map highlighting ${zoneName} with deployment ${deploymentIdentifier}`}
        >
          <defs>
            <filter id="zoneGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#F97316" floodOpacity="0.25" />
            </filter>
          </defs>

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
          {/* Exterior Building Concrete Wall */}
          <rect x="8" y="14" width="444" height="132" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="3" />

            {/* Perimeter Walls */}
            <rect x="10" y="10" width="320" height="110" fill="none" stroke="var(--andon-ink)" strokeWidth="1.5" />
          {/* Wall Door Openings / Cutouts */}
          <line x1="8" y1="50" x2="8" y2="75" stroke="#FFFFFF" strokeWidth="4" />
          <line x1="452" y1="65" x2="452" y2="95" stroke="#FFFFFF" strokeWidth="4" />

            {/* Inactive Aisles */}
            <rect x="25" y="25" width="40" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="45" y="68" textAnchor="middle" className="aisle-num">A-5</text>
          {/* Inactive Zone: Aisle 5 */}
          <g className="map-zone zone-idle">
            <rect x="22" y="26" width="70" height="108" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <text x="57" y="74" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">Aisle</text>
            <text x="57" y="92" textAnchor="middle" fill="#0F172A" fontSize="16" fontWeight="700">5</text>
          </g>

            <rect x="80" y="25" width="40" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="100" y="68" textAnchor="middle" className="aisle-num">A-6</text>
          {/* Inactive Zone: Aisle 6 */}
          <g className="map-zone zone-idle">
            <rect x="104" y="26" width="70" height="108" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <text x="139" y="74" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">Aisle</text>
            <text x="139" y="92" textAnchor="middle" fill="#0F172A" fontSize="16" fontWeight="700">6</text>
          </g>

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
          {/* TARGET ACTIVE ZONE: Aisle 7 (Highlighted Warm Amber/Orange) */}
          <g className="map-zone zone-target" filter="url(#zoneGlow)">
            <rect
              x="186"
              y="22"
              width="82"
              height="116"
              rx="6"
              fill="#FFF7ED"
              stroke="#F97316"
              strokeWidth="2.5"
            />
            <text x="227" y="60" textAnchor="middle" fill="#EA580C" fontSize="11" fontWeight="700">Aisle</text>
            <text x="227" y="80" textAnchor="middle" fill="#EA580C" fontSize="20" fontWeight="800">7</text>

              {/* Animated Sonar Radar Ping */}
              <circle cx="165" cy="72" r="14" fill="none" stroke="var(--andon-signal-amber)" strokeWidth="1.2" opacity="0.8">
                <animate attributeName="r" values="10;26;10" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0;0.9" dur="2.4s" repeatCount="indefinite" />
              </circle>
            {/* Pinned Robot Deployment AMR-12 Tag above Aisle 7 */}
            <g transform="translate(227, 12)">
              <rect x="-36" y="-8" width="72" height="18" rx="9" fill="#EA580C" />
              <circle cx="-26" cy="1" r="3" fill="#FFFFFF" />
              <text x="-16" y="5" fill="#FFFFFF" fontSize="9" fontWeight="700">AMR-12</text>
            </g>

              {/* Pinned Robot Deployment AMR-12 */}
              <circle cx="165" cy="72" r="10" fill="var(--andon-ink)" stroke="var(--andon-signal-amber)" strokeWidth="2" />
              <text x="165" y="75" textAnchor="middle" fill="var(--andon-surface)" fontSize="8" fontWeight="800">R</text>

              {/* Pin Callout Marker */}
              <line x1="165" y1="84" x2="165" y2="102" stroke="var(--andon-ink)" strokeWidth="1" />
              <rect x="135" y="100" width="60" height="14" fill="var(--andon-ink)" rx="2" />
              <text x="165" y="110" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">
                {deploymentIdentifier}
              </text>
            {/* Robot Marker Pin in Aisle 7 */}
            <g transform="translate(227, 108)">
              {/* Pin outer radar pulse circle */}
              <circle cx="0" cy="0" r="14" fill="#FFEDD5" stroke="#FDBA74" strokeWidth="1" />
              {/* Pin dark inner circle */}
              <circle cx="0" cy="0" r="9" fill="#0F172A" />
              {/* Robot icon glyph */}
              <path d="M -4 -2 L 4 -2 L 4 3 L -4 3 Z" fill="#F97316" />
              <circle cx="-2" cy="0" r="1" fill="#FFFFFF" />
              <circle cx="2" cy="0" r="1" fill="#FFFFFF" />
            </g>
          </g>

            {/* Other Facility Zones */}
            <rect x="210" y="25" width="40" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="230" y="68" textAnchor="middle" className="aisle-num">A-8</text>
          {/* Inactive Zone: Aisle 8 */}
          <g className="map-zone zone-idle">
            <rect x="280" y="26" width="70" height="108" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <text x="315" y="74" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">Aisle</text>
            <text x="315" y="92" textAnchor="middle" fill="#0F172A" fontSize="16" fontWeight="700">8</text>
          </g>

            <rect x="265" y="25" width="50" height="80" fill="var(--andon-surface)" stroke="var(--andon-border)" strokeWidth="1" />
            <text x="290" y="68" textAnchor="middle" className="aisle-num">STAGING</text>
          </svg>
          {/* Staging Area Zone */}
          <g className="map-zone zone-staging">
            <rect x="362" y="26" width="78" height="108" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <text x="401" y="74" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">Staging</text>
            <text x="401" y="92" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="700">Area</text>
          </g>
        </svg>
      </div>

      {/* Map Legend */}
      <div className="map-legend-col" aria-label="Map Legend">
        <div className="legend-item">
          <span className="legend-dot dot-orange" />
          <span className="legend-label">Selected Zone</span>
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
        <div className="legend-item">
          <span className="legend-symbol-dark">
            <span className="mini-gear">⚙</span>
          </span>
          <span className="legend-label">AMR Deployment</span>
        </div>
      )}

      <div className="floorplan-footer">
        <span>COORDINATES: Z-07 / SEC-ALPHA</span>
        <span>ODD BASELINE: AMR-12.ODD.v3</span>
        <div className="legend-item">
          <span className="legend-dot dot-gray" />
          <span className="legend-label">Other Zones</span>
        </div>
      </div>
    </div>
  );
};

