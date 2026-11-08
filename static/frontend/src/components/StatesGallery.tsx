import React, { useState } from 'react';
import { HatchedUnknown } from './HatchedUnknown';
import { StaleRibbon } from './StaleRibbon';
import { CoverageRuler } from './CoverageRuler';
import { TwoClockTimeline } from './TwoClockTimeline';
import { EvidenceThread } from './EvidenceThread';

export const StatesGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('unknown');

  return (
    <div className="states-gallery-card">
      <div className="gallery-header">
        <span className="badge badge-grey">DEVELOPER HARNESS</span>
        <h3 style={{ margin: '4px 0 0 0', fontSize: '15px' }}>ANDON States & Edge Cases Gallery</h3>
        <p style={{ margin: '2px 0 12px 0', fontSize: '12px', color: 'var(--andon-ink-subtle)' }}>
          Audit all 8 formal states required by the SPEC: Loading, Empty, Candidate, Unknown, Restricted, Stale, Dismissed, Outcome Uncertain.
        </p>

        <div className="gallery-tabs">
          {['unknown', 'restricted', 'stale', 'coverage-gap', 'empty', 'cut-thread', 'two-clock'].map((tab) => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="gallery-body" style={{ marginTop: '16px' }}>
        {activeTab === 'unknown' && (
          <HatchedUnknown
            title="Aisle 7 Geometric Boundary Unresolved"
            reason="Ticket FAC-1042 mentions Aisle 7, but Site Registry Page 10482 lacks mapped polygon vertices."
            resolutionStep="Check Site Registry Page 10482 in Confluence and add CAD coordinates tag."
          />
        )}

        {activeTab === 'restricted' && (
          <HatchedUnknown
            title="Confluence Commissioning Record Access Restricted"
            reason="Current user account lacks read permissions on page 10483 (AMR-12 Commissioning Baseline). Evidence clause redacted."
            resolutionStep="Request space view permission from space administrator."
            isRestricted
          />
        )}

        {activeTab === 'stale' && (
          <StaleRibbon
            sourceRef="Page 10483 (AMR-12 Commissioning Baseline)"
            reviewedVersion={3}
            currentVersion={4}
          />
        )}

        {activeTab === 'coverage-gap' && (
          <CoverageRuler
            attributeName="surface_finish"
            declaredScopeValues={['matte_epoxy']}
            proposedValue="high_gloss_clear_finish"
            isCovered={false}
            baselineSourceRef="Page 10483 rev 3"
          />
        )}

        {activeTab === 'empty' && (
          <div className="empty-state-card">
            <span style={{ fontSize: '28px' }}>🛡️</span>
            <h4>No Unreviewed Maintenance Dependencies</h4>
            <p>All active facility tickets in this space have verified baseline coverage.</p>
          </div>
        )}

        {activeTab === 'cut-thread' && (
          <EvidenceThread
            nodes={[]}
            ownerName=""
            isCut
            cutReason="Curated query confluencePageLinkedConfluencePages returned HTTP 200 with empty list. Not the same as no relationship."
          />
        )}

        {activeTab === 'two-clock' && (
          <TwoClockTimeline
            effectiveTime="Next Saturday (2026-11-14)"
            isEffectiveConfirmed={false}
            learnedTime={new Date().toISOString()}
            confluenceRevision={3}
            jiraUpdatedTime="2026-11-07T14:32:00Z"
          />
        )}
      </div>
    </div>
  );
};
