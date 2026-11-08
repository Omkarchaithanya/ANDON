import React from 'react';

export interface CoverageRulerProps {
  attributeName: string;
  declaredScopeValues: string[];
  proposedValue: string;
  isCovered: boolean;
  baselineSourceRef: string;
}

export const CoverageRuler: React.FC<CoverageRulerProps> = ({
  attributeName,
  declaredScopeValues,
  proposedValue,
  isCovered,
  baselineSourceRef,
}) => {
  return (
    <div className="coverage-ruler-container" aria-label="Coverage Set Membership Ruler">
      <div className="ruler-title-row">
        <span className="ruler-meta">SET-MEMBERSHIP ANALYSIS: <code>{attributeName}</code></span>
        <span className="ruler-provenance">SOURCE: {baselineSourceRef}</span>
      </div>

      <div className="ruler-scale">
        <div className="ruler-ticks">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((t) => (
            <div key={t} className="ruler-tick-mark">
              <span className="tick-line" />
              <span className="tick-label">{t}</span>
            </div>
          ))}
        </div>

        <div className="ruler-track">
          {/* Declared Scope Slot */}
          <div className="ruler-slot slot-declared" style={{ width: '45%' }}>
            <div className="slot-badge">DECLARED BASELINE DOMAIN</div>
            <div className="slot-values">
              {declaredScopeValues.map((v, i) => (
                <span key={i} className="val-slot">
                  ✓ {v}
                </span>
              ))}
            </div>
          </div>

          {/* Gap Zone or Covered Marker */}
          {isCovered ? (
            <div className="ruler-slot slot-covered" style={{ width: '35%' }}>
              <span className="slot-badge">SUPPORTED WITHIN SCOPE</span>
              <span className="val-slot">✓ {proposedValue}</span>
            </div>
          ) : (
            <div className="ruler-slot slot-gap" style={{ width: '50%' }}>
              <div className="gap-hatch-pattern" />
              <div className="slot-badge">PROSPECTIVE COVERAGE GAP</div>
              <div className="gap-marker">
                <span className="marker-pointer">▲</span>
                <span className="val-gap">✗ PROPOSED: {proposedValue}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authoritative Specific Finding Sentence */}
      <div className="ruler-finding-card">
        <div className="finding-glyph">⚠️</div>
        <div className="finding-body">
          <strong className="finding-headline">Evaluated Coverage Determination:</strong>
          <p className="finding-text">
            “The selected baseline does not establish coverage of the planned high-gloss condition.”
          </p>
          <span className="finding-subtext">
            Deterministic set comparison: condition value <code>{proposedValue}</code> ∉ {'{'}
            {declaredScopeValues.join(', ')}
            {'}'}.
          </span>
        </div>
      </div>
    </div>
  );
};
