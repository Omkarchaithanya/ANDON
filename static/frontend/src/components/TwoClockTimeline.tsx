import React from 'react';

export interface TwoClockTimelineProps {
  effectiveTime: string;
  isEffectiveConfirmed: boolean;
  learnedTime: string;
  confluenceRevision: number;
  jiraUpdatedTime?: string;
}

export const TwoClockTimeline: React.FC<TwoClockTimelineProps> = ({
  effectiveTime,
  isEffectiveConfirmed,
  learnedTime,
  confluenceRevision,
  jiraUpdatedTime,
}) => {
  return (
    <div className="two-clock-container" aria-label="Bitemporal Two-Clock Timeline">
      <div className="two-clock-header">
        <span className="clock-title">BITEMPORAL PROVENANCE TIMELINE</span>
        <span className="clock-sub">BUSINESS TIME VS SYSTEM TIME</span>
      </div>

      <div className="tracks-wrapper">
        {/* Track 1: Business Time (Effective) */}
        <div className="time-track">
          <div className="track-label-col">
            <span className="track-name">EFFECTIVE TIME</span>
            <span className="track-desc">When physical work is scheduled</span>
          </div>
          <div className={`track-rail ${isEffectiveConfirmed ? 'rail-solid' : 'rail-dashed'}`}>
            <div className="event-node node-effective">
              <span className="node-marker">{isEffectiveConfirmed ? '●' : '○'}</span>
              <div className="node-tooltip">
                <span className="node-time">{effectiveTime || 'Next Saturday'}</span>
                <span className="node-type">
                  {isEffectiveConfirmed ? 'Confirmed Execution' : 'Prospective / Planned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Track 2: System Time (Learned) */}
        <div className="time-track">
          <div className="track-label-col">
            <span className="track-name">LEARNED TIME</span>
            <span className="track-desc">When ANDON discovered the dependency</span>
          </div>
          <div className="track-rail rail-solid">
            <div className="event-node node-learned">
              <span className="node-marker">▲</span>
              <div className="node-tooltip">
                <span className="node-time">
                  {learnedTime ? new Date(learnedTime).toLocaleTimeString() : 'Current Session'}
                </span>
                <span className="node-type">
                  Baseline Anchor: Confluence rev {confluenceRevision}
                </span>
              </div>
            </div>
            {jiraUpdatedTime && (
              <div className="event-node node-jira" style={{ left: '70%' }}>
                <span className="node-marker">▪</span>
                <div className="node-tooltip">
                  <span className="node-time">Ticket Updated</span>
                  <span className="node-type">Jira Event Ingested</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
