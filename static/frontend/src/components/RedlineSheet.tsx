import React, { useState } from 'react';

export interface RedlineSheetProps {
  jiraIssueKey: string;
  jiraQuoteText: string;
  jiraTargetZone: string;
  jiraTargetDate: string;
  confluencePageRef: string;
  confluenceRevision: number;
  confluenceClauseText: string;
  attributeName: string;
  currentValue: string;
  proposedValue: string;
  isStale?: boolean;
  isRestricted?: boolean;
}

export const RedlineSheet: React.FC<RedlineSheetProps> = ({
  jiraIssueKey,
  jiraQuoteText,
  jiraTargetZone,
  jiraTargetDate,
  confluencePageRef,
  confluenceRevision,
  confluenceClauseText,
  attributeName,
  currentValue,
  proposedValue,
  isStale = false,
  isRestricted = false,
}) => {
  const [hoveredSpan, setHoveredSpan] = useState<string | null>(null);

  return (
    <div className="redline-sheet-assembly" aria-label="Evidence Redline Drawing Sheets">
      <div className="assembly-title-bar">
        <span className="assembly-drawing-no">DWG: ANDON-REDLINE-02</span>
        <span className="assembly-status">STATUS: PROSPECTIVE EVIDENCE GAP // UNCONFIRMED</span>
      </div>

      <div className="dual-sheets-grid">
        {/* Left Sheet: Facilities Work Request */}
        <div className="drafting-sheet sheet-jira">
          <div className="sheet-title-block">
            <div className="block-row">
              <span className="block-label">SOURCE 1: LIVE JIRA WORK REQUEST</span>
              <span className="block-val mono">{jiraIssueKey}</span>
            </div>
            <div className="block-row sub">
              <span>TARGET ZONE: <strong>{jiraTargetZone || 'Aisle 7'}</strong></span>
              <span>SCHEDULED: <strong>{jiraTargetDate || 'Next Saturday'}</strong></span>
            </div>
          </div>

          <div className="sheet-canvas">
            <span className="field-caption">VERBATIM QUOTE FROM TICKET DESCRIPTION:</span>
            <blockquote className="verbatim-quote-box">
              “{jiraQuoteText}”
            </blockquote>

            <div className="callout-pointer-row">
              <div
                className={`callout-pill pill-proposed ${hoveredSpan === 'proposed' ? 'active' : ''}`}
                onMouseEnter={() => setHoveredSpan('proposed')}
                onMouseLeave={() => setHoveredSpan(null)}
              >
                <span className="pill-dot">●</span>
                <span>Proposed: <code>{proposedValue}</code></span>
              </div>
              <span className="callout-hint">Extracted condition candidate</span>
            </div>
          </div>

          <div className="sheet-footer">
            <span>PERMISSIONS: ✓ READ:JIRA-WORK VERIFIED</span>
            <span>PROVENANCE: JIRA API REST v3</span>
          </div>
        </div>

        {/* Center Leader Line Gutter */}
        <div className="sheets-gutter">
          <svg className="gutter-svg" viewBox="0 0 40 180" preserveAspectRatio="none">
            <path
              d="M 0 90 C 20 90, 20 90, 40 90"
              fill="none"
              stroke="var(--andon-signal-amber)"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            <circle cx="2" cy="90" r="4" fill="var(--andon-signal-amber)" />
            <circle cx="38" cy="90" r="4" fill="var(--andon-signal-amber)" />
          </svg>
          <div className="gutter-divergence-tag">
            <span className="gutter-glyph">≠</span>
            <span className="gutter-text">DIVERGENCE</span>
          </div>
        </div>

        {/* Right Sheet: Commissioning Baseline Record */}
        <div className="drafting-sheet sheet-confluence">
          <div className="sheet-title-block">
            <div className="block-row">
              <span className="block-label">SOURCE 2: CONFLUENCE COMMISSIONING RECORD</span>
              <span className="block-val mono">▲ REV {confluenceRevision}</span>
            </div>
            <div className="block-row sub">
              <span>PAGE: <strong>{confluencePageRef}</strong></span>
              <span>{isStale ? '⚠️ STALE' : '✓ VERIFIED RECORD'}</span>
            </div>
          </div>

          <div className="sheet-canvas">
            <span className="field-caption">AUTHORITATIVE BASELINE CLAUSE:</span>
            {isRestricted ? (
              <div className="restricted-clause-box">
                🔒 [RESTRICTED: Current user lacks permission to view referenced Confluence page content. Quote redacted.]
              </div>
            ) : (
              <blockquote className="verbatim-quote-box">
                “{confluenceClauseText}”
              </blockquote>
            )}

            {/* Standard Redline Convention: Struck-through Old + Proposed New */}
            <div className="redline-strike-container">
              <span className="strike-caption">CONDITION REDLINE // {attributeName.toUpperCase()}:</span>
              <div className="strike-pair">
                <del className="redline-deleted">
                  <code>{currentValue}</code>
                </del>
                <span className="redline-arrow">➔</span>
                <ins className="redline-inserted">
                  <code>{proposedValue}</code>
                </ins>
              </div>
            </div>
          </div>

          <div className="sheet-footer">
            <span>PERMISSIONS: {isRestricted ? '🔒 RESTRICTED' : '✓ READ:CONFLUENCE-CONTENT VERIFIED'}</span>
            <span>ANCHOR: NATIVE PAGE REVISION {confluenceRevision}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
