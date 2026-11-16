/**
 * @file App.tsx
 * @description Master Application Shell for ANDON (Shadow-Change Radar for Robotized Workplaces).
 * Renders the production 3-step Safety Workflow (Change Lens -> Evidence Redline -> Review Package)
 * inside the Atlassian Forge Jira Issue Panel.
 */

import { useState } from 'react';
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
import './styles/theme.css';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.CHANGE_LENS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedReviewDecisionId, setSelectedReviewDecisionId] = useState<string>('');

  return (
    <ErrorBoundary fallbackTitle="Application Error" onReset={() => setCurrentScreen(Screen.CHANGE_LENS)}>
      <div className="andon-dashboard-shell" style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        <Sidebar currentScreen={currentScreen} onNavigate={(screen) => setCurrentScreen(screen)} />

        <div className="andon-main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <PageHeader currentScreen={currentScreen} onSelectScreen={(screen) => setCurrentScreen(screen)} />
          <main className="andon-content-body" role="main" style={{ flex: 1, overflowY: 'auto' }}>
            {currentScreen === Screen.CHANGE_LENS && (
              <ChangeLens
                onSelectCandidate={(id) => {
                  setSelectedCandidateId(id);
                  setCurrentScreen(Screen.EVIDENCE_REDLINE);
                }}
                onOpenRegistry={() => setCurrentScreen(Screen.SITE_REGISTRY)}
              />
            )}

            {currentScreen === Screen.EVIDENCE_REDLINE && (
              <EvidenceRedline
                changeIntentId={selectedCandidateId}
                onBack={() => setCurrentScreen(Screen.CHANGE_LENS)}
                onProceedToReview={(reviewDecisionId) => {
                  setSelectedReviewDecisionId(reviewDecisionId);
                  setCurrentScreen(Screen.REVIEW_PACKAGE);
                }}
              />
            )}

            {currentScreen === Screen.REVIEW_PACKAGE && (
              <ReviewPackage
                reviewDecisionId={selectedReviewDecisionId}
                onBack={() => setCurrentScreen(Screen.EVIDENCE_REDLINE)}
              />
            )}

            {currentScreen === Screen.DECISION_HISTORY && (
              <DecisionHistoryView onBack={() => setCurrentScreen(Screen.CHANGE_LENS)} />
            )}

            {currentScreen === Screen.SITE_REGISTRY && (
              <SiteRegistryView onBack={() => setCurrentScreen(Screen.CHANGE_LENS)} />
            )}

            {currentScreen === Screen.ADMINISTRATION && (
              <AdminSettingsView onBack={() => setCurrentScreen(Screen.CHANGE_LENS)} />
            )}
          </main>
          <StatusFooter />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
