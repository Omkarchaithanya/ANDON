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
            title="Facility Geometric Boundary Unresolved"
            reason="Work request specifies a zone that is missing mapped polygon vertices in the registry page."
            resolutionStep="Check Site Registry Page in Confluence and add CAD coordinates tag."
          />
        )}

        {activeTab === 'restricted' && (
          <HatchedUnknown
            title="Confluence Commissioning Record Access Restricted"
            reason="Current user account lacks read permissions on target commissioning baseline page. Evidence clause redacted."
            resolutionStep="Request space view permission from space administrator."
            isRestricted
          />
        )}

        {activeTab === 'stale' && (
          <StaleRibbon
            sourceRef="Commissioning Baseline"
            reviewedVersion={1}
            currentVersion={2}
          />
        )}

        {activeTab === 'coverage-gap' && (
          <CoverageRuler
            attributeName="surface_finish"
            declaredScopeValues={['baseline_spec']}
            proposedValue="modified_spec"
            isCovered={false}
            baselineSourceRef="Confluence Baseline rev 1"
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
            ownerName="Qualified Reviewer"
            isCut={true}
            cutReason="Graph traversal returned no connected Confluence pages for this location."
          />
        )}

        {activeTab === 'two-clock' && (
          <TwoClockTimeline
            effectiveTime="Scheduled execution window"
            isEffectiveConfirmed={false}
            learnedTime={new Date().toISOString()}
            confluenceRevision={1}
            jiraUpdatedTime={new Date().toISOString()}
          />
        )}
      </div>
    </div>
  );
};

export default StatesGallery;
