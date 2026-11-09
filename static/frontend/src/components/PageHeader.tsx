import React from 'react';
import { Screen } from '../types';

interface PageHeaderProps {
  currentScreen: Screen;
  onSelectScreen: (screen: Screen) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ currentScreen, onSelectScreen }) => {
  return (
    <section className="andon-subheader" aria-label="Page Title & Workflow Steps">
      {/* Title & Icon Row */}
      <div className="subheader-title-row">
        <div className="subheader-icon-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill="#EA580C" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <div className="subheader-text-col">
          <h1 className="subheader-title">
            {currentScreen === Screen.CHANGE_LENS && 'Change Intake Lens'}
            {currentScreen === Screen.EVIDENCE_REDLINE && 'Evidence Redline & Thread'}
            {currentScreen === Screen.REVIEW_PACKAGE && 'Review Package & Handoff'}
            {currentScreen === Screen.DECISION_HISTORY && 'Decision History & Audit'}
            {currentScreen === Screen.SITE_REGISTRY && 'Facility Site Registry'}
            {currentScreen === Screen.ADMINISTRATION && 'System Administration'}
          </h1>
          <p className="subheader-subtitle">
            Find overlooked robotics dependencies in ordinary facilities work.
          </p>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="subheader-tabs-row" role="tablist">
        <button
          className={`subheader-tab-btn ${currentScreen === Screen.CHANGE_LENS ? 'active' : ''}`}
          onClick={() => onSelectScreen(Screen.CHANGE_LENS)}
          role="tab"
          aria-selected={currentScreen === Screen.CHANGE_LENS}
        >
          <span className="tab-number-badge">1</span>
          <span className="tab-label">Change Intake Lens</span>
        </button>

        <button
          className={`subheader-tab-btn ${currentScreen === Screen.EVIDENCE_REDLINE ? 'active' : ''}`}
          onClick={() => onSelectScreen(Screen.EVIDENCE_REDLINE)}
          role="tab"
          aria-selected={currentScreen === Screen.EVIDENCE_REDLINE}
        >
          <span className="tab-number-badge">2</span>
          <span className="tab-label">Evidence Redline & Thread</span>
        </button>

        <button
          className={`subheader-tab-btn ${currentScreen === Screen.REVIEW_PACKAGE ? 'active' : ''}`}
          onClick={() => onSelectScreen(Screen.REVIEW_PACKAGE)}
          role="tab"
          aria-selected={currentScreen === Screen.REVIEW_PACKAGE}
        >
          <span className="tab-number-badge">3</span>
          <span className="tab-label">Review Package & Handoff</span>
        </button>
      </div>
    </section>
  );
};
