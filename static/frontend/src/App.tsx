import { useState, useEffect } from 'react';
import { Screen } from './types';
import { ChangeLens } from './screens/ChangeLens';
import { EvidenceRedline } from './screens/EvidenceRedline';
import { ReviewPackage } from './screens/ReviewPackage';
import { AndonLightStack, LampStatus } from './components/AndonLightStack';
import { StatesGallery } from './components/StatesGallery';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.CHANGE_LENS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('demo-intent-aisle7');
  const [selectedReviewDecisionId, setSelectedReviewDecisionId] = useState<string>('demo-rev-001');
  const [showGallery, setShowGallery] = useState<boolean>(false);

  // Keyboard shortcut listener: Enter to inspect, S to stamp
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') setCurrentScreen(Screen.CHANGE_LENS);
      if (e.key === '2') setCurrentScreen(Screen.EVIDENCE_REDLINE);
      if (e.key === '3') setCurrentScreen(Screen.REVIEW_PACKAGE);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setCurrentScreen(Screen.EVIDENCE_REDLINE);
  };

  const handleProceedToReview = (reviewDecisionId: string) => {
    setSelectedReviewDecisionId(reviewDecisionId);
    setCurrentScreen(Screen.REVIEW_PACKAGE);
  };

  const handleBackToChangeLens = () => {
    setCurrentScreen(Screen.CHANGE_LENS);
  };

  const handleBackToRedline = () => {
    setCurrentScreen(Screen.EVIDENCE_REDLINE);
  };

  const isStandalone = typeof window !== 'undefined' && (window as any).__isStandaloneDev;

  // Derive dynamic Andon light tower states based on active workflow step
  let discoveryLamp: LampStatus = 'AMBER';
  let applicabilityLamp: LampStatus = 'IDLE';
  let freshnessLamp: LampStatus = 'GREEN';

  if (currentScreen === Screen.EVIDENCE_REDLINE) {
    discoveryLamp = 'AMBER';
    applicabilityLamp = 'AMBER';
    freshnessLamp = 'GREEN';
  } else if (currentScreen === Screen.REVIEW_PACKAGE) {
    discoveryLamp = 'AMBER';
    applicabilityLamp = 'RED'; // Coverage gap
    freshnessLamp = 'GREEN';
  }

  return (
    <ErrorBoundary fallbackTitle="Application Error" onReset={handleBackToChangeLens}>
      <div className="andon-app-root">
        {/* Explicit Dev Harness Indicator - Only in Local Dev */}
        {isStandalone && (
          <aside className="dev-harness-bar" role="complementary" aria-label="Development Harness Notice">
            <span className="dev-harness-tag">
              [DEV HARNESS ONLY — SIMULATING RESOLVERS FOR LOCAL UI DEVELOPMENT — NOT PRODUCTION RUNTIME]
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowGallery(!showGallery)}
                style={{ padding: '2px 8px', fontSize: '10px' }}
              >
                {showGallery ? '✕ Close States Gallery' : '🔍 Open 8-States Gallery'}
              </button>
            </div>
          </aside>
        )}

        {/* Top Engineering Title Block */}
        <header className="andon-title-block-header">
          <div className="title-block-left">
            <div className="drawing-box-id">DWG: ANDON-2026-SYS</div>
            <div>
              <h1 className="system-title">
                ANDON <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--andon-signal-amber)' }}>// SHADOW-CHANGE RADAR</span>
              </h1>
              <span className="system-subtitle">
                ROBOTIZED WORKPLACE CLEARANCE CONTROL PLANE
              </span>
            </div>
          </div>

          <div className="title-block-right">
            <div className="mono" style={{ fontSize: '10px', color: 'var(--andon-ink-muted)', textAlign: 'right' }}>
              <div>AUTHORITY: QUALIFIED REVIEWER ONLY</div>
              <div>SHORTCUTS: [1] LENS &nbsp;[2] REDLINE &nbsp;[3] REVIEW</div>
            </div>
          </div>
        </header>

        {/* Blueprint Stepper Navigation */}
        <nav className="stepper-nav" aria-label="Workflow Drawing Index">
          <div
            className={`step-item ${currentScreen === Screen.CHANGE_LENS ? 'active' : 'completed'}`}
            onClick={handleBackToChangeLens}
            style={{ cursor: 'pointer' }}
          >
            <span className="step-number">1</span>
            <span>DWG 01: Change Intake Lens</span>
          </div>

          <span className="step-arrow">➔</span>

          <div
            className={`step-item ${
              currentScreen === Screen.EVIDENCE_REDLINE
                ? 'active'
                : currentScreen === Screen.REVIEW_PACKAGE
                ? 'completed'
                : ''
            }`}
            onClick={() => setCurrentScreen(Screen.EVIDENCE_REDLINE)}
            style={{ cursor: 'pointer' }}
          >
            <span className="step-number">2</span>
            <span>DWG 02: Evidence Redline & Thread</span>
          </div>

          <span className="step-arrow">➔</span>

          <div
            className={`step-item ${currentScreen === Screen.REVIEW_PACKAGE ? 'active' : ''}`}
            onClick={() => setCurrentScreen(Screen.REVIEW_PACKAGE)}
            style={{ cursor: 'pointer' }}
          >
            <span className="step-number">3</span>
            <span>DWG 03: Review Package & Handoff</span>
          </div>
        </nav>

        {/* Main Canvas with Andon Signal Tower on Left */}
        <div className="screen-layout-grid">
          <AndonLightStack
            discoveryStatus={discoveryLamp}
            applicabilityStatus={applicabilityLamp}
            freshnessStatus={freshnessLamp}
          />

          <main style={{ minWidth: 0 }}>
            {showGallery && (
              <div style={{ marginBottom: '24px' }}>
                <StatesGallery />
              </div>
            )}

            {currentScreen === Screen.CHANGE_LENS && (
              <ErrorBoundary fallbackTitle="Change Intake Lens Error" onReset={handleBackToChangeLens}>
                <ChangeLens onSelectCandidate={handleSelectCandidate} />
              </ErrorBoundary>
            )}

            {currentScreen === Screen.EVIDENCE_REDLINE && (
              <ErrorBoundary fallbackTitle="Evidence Redline Error" onReset={handleBackToChangeLens}>
                <EvidenceRedline
                  changeIntentId={selectedCandidateId}
                  onBack={handleBackToChangeLens}
                  onProceedToReview={handleProceedToReview}
                />
              </ErrorBoundary>
            )}

            {currentScreen === Screen.REVIEW_PACKAGE && (
              <ErrorBoundary fallbackTitle="Review Package Error" onReset={handleBackToRedline}>
                <ReviewPackage
                  reviewDecisionId={selectedReviewDecisionId}
                  onBack={handleBackToRedline}
                />
              </ErrorBoundary>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
