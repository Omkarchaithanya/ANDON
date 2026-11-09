import { useState, useEffect } from 'react';
import { Screen } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PageHeader } from './components/PageHeader';
import { StatusFooter } from './components/StatusFooter';
import { ChangeLens } from './screens/ChangeLens';
import { EvidenceRedline } from './screens/EvidenceRedline';
import { ReviewPackage } from './screens/ReviewPackage';
import { AndonLightStack, LampStatus } from './components/AndonLightStack';
import { StatesGallery } from './components/StatesGallery';
import { SiteRegistryView } from './screens/SiteRegistryView';
import { DecisionHistoryView } from './screens/DecisionHistoryView';
import { AdminSettingsView } from './screens/AdminSettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.CHANGE_LENS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('demo-intent-aisle7');
  const [selectedReviewDecisionId, setSelectedReviewDecisionId] = useState<string>('demo-rev-001');
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('andon_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark'; // Modern cyber-industrial default
  });

  // Keyboard shortcut listener: 1, 2, 3 to navigate workflow steps
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('andon_theme', theme);
  }, [theme]);

  // Keyboard shortcut listener: 1, 2, 3 to navigate; T for theme; G for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') setCurrentScreen(Screen.CHANGE_LENS);
      if (e.key === '2') setCurrentScreen(Screen.EVIDENCE_REDLINE);
      if (e.key === '3') setCurrentScreen(Screen.REVIEW_PACKAGE);
      if (e.key === 't' || e.key === 'T') setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      if (e.key === 'g' || e.key === 'G') setShowGallery((prev) => !prev);
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
      <div className="andon-dashboard-shell">
        {/* Left Dark Navigation Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />

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
        {/* Right Main Working Area */}
        <div className="andon-main-wrapper">
          {/* Top Bar Navigation */}
          <Topbar />

          <div className="title-block-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              title="Toggle Theme Mode (Shortcut: T)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{theme === 'dark' ? 'Daylight Drafting' : 'Mission Control'}</span>
            </button>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--andon-ink-muted)', textAlign: 'right' }}>
              <div>AUTHORITY: QUALIFIED REVIEWER ONLY</div>
              <div>SHORTCUTS: [1] LENS &nbsp;[2] REDLINE &nbsp;[3] REVIEW &nbsp;[T] THEME</div>
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
          {/* Subheader with Page Title and Workflow Stepper */}
          <PageHeader
            currentScreen={currentScreen}
            onSelectScreen={(screen) => setCurrentScreen(screen)}
          />

          <main style={{ minWidth: 0 }}>
            {showGallery && (
              <div style={{ marginBottom: '24px' }}>
                <StatesGallery />
              </div>
            )}

          {/* Main Dashboard Canvas Body */}
          <main className="andon-content-body" role="main">
            {currentScreen === Screen.CHANGE_LENS && (
              <ErrorBoundary fallbackTitle="Change Intake Lens Error" onReset={handleBackToChangeLens}>
                <ChangeLens onSelectCandidate={handleSelectCandidate} />
              </ErrorBoundary>
              <ChangeLens
                onSelectCandidate={handleSelectCandidate}
                onOpenRegistry={() => setCurrentScreen(Screen.SITE_REGISTRY)}
              />
            )}

            {currentScreen === Screen.EVIDENCE_REDLINE && (
              <ErrorBoundary fallbackTitle="Evidence Redline Error" onReset={handleBackToChangeLens}>
                <EvidenceRedline
                  changeIntentId={selectedCandidateId}
                  onBack={handleBackToChangeLens}
                  onProceedToReview={handleProceedToReview}
                />
              </ErrorBoundary>
              <EvidenceRedline
                changeIntentId={selectedCandidateId}
                onBack={handleBackToChangeLens}
                onProceedToReview={handleProceedToReview}
              />
            )}

            {currentScreen === Screen.REVIEW_PACKAGE && (
              <ErrorBoundary fallbackTitle="Review Package Error" onReset={handleBackToRedline}>
                <ReviewPackage
                  reviewDecisionId={selectedReviewDecisionId}
                  onBack={handleBackToRedline}
                />
              </ErrorBoundary>
              <ReviewPackage
                reviewDecisionId={selectedReviewDecisionId}
                onBack={handleBackToRedline}
              />
            )}
          </main>
        </div>

        {/* Floating Modern Command HUD */}
        <aside className="floating-command-hud" role="toolbar" aria-label="Command Bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', borderRight: '1px solid var(--andon-border)' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--andon-signal-green)',
              boxShadow: '0 0 8px var(--andon-signal-green)',
              display: 'inline-block'
            }} />
            <span className="mono" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
              ANDON RADAR
            </span>
          </div>
            {currentScreen === Screen.SITE_REGISTRY && (
              <SiteRegistryView onBack={handleBackToChangeLens} />
            )}

          <div
            className={`hud-shortcut-item ${currentScreen === Screen.CHANGE_LENS ? 'active' : ''}`}
            onClick={handleBackToChangeLens}
          >
            <span className="hud-kbd">1</span>
            <span>Intake Lens</span>
          </div>
            {currentScreen === Screen.DECISION_HISTORY && (
              <DecisionHistoryView onBack={handleBackToChangeLens} />
            )}

          <div
            className={`hud-shortcut-item ${currentScreen === Screen.EVIDENCE_REDLINE ? 'active' : ''}`}
            onClick={() => setCurrentScreen(Screen.EVIDENCE_REDLINE)}
          >
            <span className="hud-kbd">2</span>
            <span>Redline</span>
          </div>
            {currentScreen === Screen.ADMINISTRATION && (
              <AdminSettingsView onBack={handleBackToChangeLens} />
            )}
          </main>

          <div
            className={`hud-shortcut-item ${currentScreen === Screen.REVIEW_PACKAGE ? 'active' : ''}`}
            onClick={() => setCurrentScreen(Screen.REVIEW_PACKAGE)}
          >
            <span className="hud-kbd">3</span>
            <span>Dispatch</span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--andon-border)' }} />

          <div
            className="hud-shortcut-item"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            title="Toggle Daylight / Dark Mission Control Mode (T)"
          >
            <span className="hud-kbd">T</span>
            <span>{theme === 'dark' ? '☀️ Daylight' : '🌙 Dark'}</span>
          </div>

          <div
            className="hud-shortcut-item"
            onClick={() => setShowGallery((prev) => !prev)}
            title="Toggle States Gallery (G)"
          >
            <span className="hud-kbd">G</span>
            <span>{showGallery ? '✕ Hide Gallery' : '🔍 8 States'}</span>
          </div>
        </aside>
          {/* Bottom Fixed Status Bar */}
          <StatusFooter />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
