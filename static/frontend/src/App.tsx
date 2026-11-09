import { useState, useEffect } from 'react';
import { Screen } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PageHeader } from './components/PageHeader';
import { StatusFooter } from './components/StatusFooter';
import { ChangeLens } from './screens/ChangeLens';
import { EvidenceRedline } from './screens/EvidenceRedline';
import { ReviewPackage } from './screens/ReviewPackage';
import { SiteRegistryView } from './screens/SiteRegistryView';
import { DecisionHistoryView } from './screens/DecisionHistoryView';
import { AdminSettingsView } from './screens/AdminSettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.CHANGE_LENS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedReviewDecisionId, setSelectedReviewDecisionId] = useState<string>('');

  // Keyboard shortcut listener: 1, 2, 3 to navigate workflow steps
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

  return (
    <ErrorBoundary fallbackTitle="Application Error" onReset={handleBackToChangeLens}>
      <div className="andon-dashboard-shell">
        {/* Left Dark Navigation Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />

        {/* Right Main Working Area */}
        <div className="andon-main-wrapper">
          {typeof window !== 'undefined' && (window as any).__isStandaloneDev && (
            <div
              style={{
                background: '#FEF3C7',
                color: '#92400E',
                borderBottom: '1px solid #FCD34D',
                padding: '6px 16px',
                fontSize: '11px',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '0.4px',
              }}
            >
              ⚠️ [DEV HARNESS ONLY — SIMULATING RESOLVERS FOR LOCAL UI DEVELOPMENT]
            </div>
          )}

          {/* Top Bar Navigation */}
          <Topbar />

          {/* Subheader with Page Title and Workflow Stepper */}
          <PageHeader
            currentScreen={currentScreen}
            onSelectScreen={(screen) => setCurrentScreen(screen)}
          />

          {/* Main Dashboard Canvas Body */}
          <main className="andon-content-body" role="main">
            {currentScreen === Screen.CHANGE_LENS && (
              <ChangeLens
                onSelectCandidate={handleSelectCandidate}
                onOpenRegistry={() => setCurrentScreen(Screen.SITE_REGISTRY)}
              />
            )}

            {currentScreen === Screen.EVIDENCE_REDLINE && (
              <EvidenceRedline
                changeIntentId={selectedCandidateId}
                onBack={handleBackToChangeLens}
                onProceedToReview={handleProceedToReview}
              />
            )}

            {currentScreen === Screen.REVIEW_PACKAGE && (
              <ReviewPackage
                reviewDecisionId={selectedReviewDecisionId}
                onBack={handleBackToRedline}
              />
            )}

            {currentScreen === Screen.SITE_REGISTRY && (
              <SiteRegistryView onBack={handleBackToChangeLens} />
            )}

            {currentScreen === Screen.DECISION_HISTORY && (
              <DecisionHistoryView onBack={handleBackToChangeLens} />
            )}

            {currentScreen === Screen.ADMINISTRATION && (
              <AdminSettingsView onBack={handleBackToChangeLens} />
            )}
          </main>

          {/* Bottom Fixed Status Bar */}
          <StatusFooter />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
