/**
 * @file App.tsx
 * @description Master Application Shell implementing the 3 UI specifications for ANDON:
 * 1. Desktop Floorplan Digital Twin (01_facility_management_floorplan_ui_spec.md)
 * 2. ANDON AI Agent Monitoring Dashboard (02_meely_ai_agent_monitoring_dashboard_ui_spec.md)
 * 3. Mobile/Tablet Field Technician PWA (03_unified_hybrid_ui_master_spec_and_pwa_reference.md)
 * 4. Unified Command View (Part B 3-in-1 Master Architecture)
 * + Seamless toggle to the Atlassian Forge ANDON Safety Lens workflow.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ViewMode,
  ThemeMode,
  BuildingFloor,
  IoTAsset,
  FloorZone,
  AIAgent,
  ReasoningTraceItem,
  TechnicianMessage,
  TimeframeFilter,
  AssetCategory,
  AssetStatus,
} from './types/hybrid-spec';
import {
  loadInitialStoreState,
  saveEntireStore,
  recalculateFloorZoneAssignments,
  DEFAULT_BLUEPRINT_TEMPLATE,
} from './data/store';

import { TopNavBar } from './components/TopNavBar';
import { UnifiedCommandView } from './screens/UnifiedCommandView';
import { FloorplanDigitalTwinView } from './screens/FloorplanDigitalTwinView';
import { MeelyAgentDashboard } from './screens/MeelyAgentDashboard';
import { FieldTechnicianPWA } from './screens/FieldTechnicianPWA';
import { TelemetryTroubleshootingDrawer } from './components/TelemetryTroubleshootingDrawer';
import { QRScannerModal } from './components/QRScannerModal';
import { CreateItemModal } from './components/CreateItemModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// ANDON Safety Workflow
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

import './styles/globals.css';
import './styles/theme.css';

export function App() {
  // Load persistent store state
  const initial = useMemo(() => loadInitialStoreState(), []);

  // Navigation & Theme — Default strictly to the real product (ANDON Safety Radar)
  const [currentView, setCurrentView] = useState<ViewMode | 'andon-workflow'>('andon-workflow');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isDemoHarness = Boolean(import.meta.env.VITE_DEMO_HARNESS);

  // Floorplan & IoT Assets State
  const [floors, setFloors] = useState<BuildingFloor[]>(initial.floors);
  const [activeFloorId, setActiveFloorId] = useState<string>(
    initial.floors[0]?.id || 'floor-01'
  );
  const [unassignedAssets, setUnassignedAssets] = useState<IoTAsset[]>(initial.unassignedAssets);
  const [selectedAsset, setSelectedAsset] = useState<IoTAsset | null>(
    initial.floors[0]?.assets[0] || null
  );
  const [selectedZone, setSelectedZone] = useState<FloorZone | null>(
    initial.floors[0]?.zones[0] || null
  );
  const [activeTool, setActiveTool] = useState<'select' | 'polygon' | 'rect' | 'text'>('select');

  // AI Agents State
  const [agents, setAgents] = useState<AIAgent[]>(initial.agents);

  // Telemetry, Traces & Field Messages
  const [traces, setTraces] = useState<ReasoningTraceItem[]>(initial.traces);
  const [technicianMessages, setTechnicianMessages] = useState<TechnicianMessage[]>(
    initial.technicianMessages
  );
  const [timeframe, setTimeframe] = useState<TimeframeFilter>(initial.timeframe);

  // Modals & Feedback Toasts
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ANDON Safety Workflow State
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.CHANGE_LENS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedReviewDecisionId, setSelectedReviewDecisionId] = useState<string>('');

  // Sync theme attribute to HTML document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist state changes to localStorage
  useEffect(() => {
    saveEntireStore({
      floors,
      unassignedAssets,
      agents,
      traces,
      technicianMessages,
      timeframe,
    });
  }, [floors, unassignedAssets, agents, traces, technicianMessages, timeframe]);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Keyboard shortcut listener: 1, 2, 3, 4, 5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') setCurrentView('unified');
      if (e.key === '2') setCurrentView('floorplan');
      if (e.key === '3') setCurrentView('agent-monitor');
      if (e.key === '4') setCurrentView('field-pwa');
      if (e.key === '5') setCurrentView('andon-workflow');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeFloor = floors.find((f) => f.id === activeFloorId) || floors[0];

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleTogglePauseAgent = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextPaused = !a.isPaused;
          const updatedStatus = nextPaused ? 'IDLED' : 'RUNNING';

          // Log trace event
          const now = new Date();
          const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
          const traceItem: ReasoningTraceItem = {
            id: `trace-${Date.now()}`,
            timestamp,
            type: nextPaused ? 'info' : 'received',
            title: `Agent ${a.code} state changed to ${updatedStatus}`,
            description: `Manual operator toggle by Lead Systems Integrator.`,
          };
          setTraces((t) => [traceItem, ...t]);

          return {
            ...a,
            isPaused: nextPaused,
            status: updatedStatus,
          };
        }
        return a;
      })
    );
  };

  // Multi-step diagnostic workflow simulation (real streaming events)
  const handleRunDiagnosticTask = (agentId: string) => {
    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetAgent) return;

    showToast(`Dispatched diagnostic routine to ${targetAgent.name} (${targetAgent.code})`);

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Step 1: Immediate
    const step1: ReasoningTraceItem = {
      id: `trace-${Date.now()}-1`,
      timestamp: timeStr,
      type: 'received',
      title: `Task Dispatched: Multi-Point Spatial Diagnostics`,
      description: `Targeting operational perimeter on ${activeFloor.name}.`,
    };
    setTraces((t) => [step1, ...t]);

    // Step 2: 1.2s later
    setTimeout(() => {
      const step2: ReasoningTraceItem = {
        id: `trace-${Date.now()}-2`,
        timestamp: timeStr,
        type: 'parsed',
        title: `Parsed Telemetry: 14 Sensor Nodes Online`,
        description: `Variance checking baseline delta against commissioning standards.`,
      };
      setTraces((t) => [step2, ...t]);
    }, 1200);

    // Step 3: 2.4s later
    setTimeout(() => {
      const step3: ReasoningTraceItem = {
        id: `trace-${Date.now()}-3`,
        timestamp: timeStr,
        type: 'filtered',
        title: `Filtered Results: Chilled water bypass nominal`,
        description: `Correlated thermal gradient across Server Room and Plant Room.`,
      };
      setTraces((t) => [step3, ...t]);
    }, 2400);

    // Step 4: 3.6s later (finish & update agent metrics)
    setTimeout(() => {
      const step4: ReasoningTraceItem = {
        id: `trace-${Date.now()}-4`,
        timestamp: timeStr,
        type: 'generated',
        title: `Generated Output: Diagnostics Complete (Optimal)`,
        description: `Telemetry validated. No physical hazard or shadow drift detected.`,
      };
      setTraces((t) => [step4, ...t]);

      // Increment agent stats
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === agentId) {
            return {
              ...a,
              totalRequests: a.totalRequests + 1,
              status: 'RUNNING',
              isPaused: false,
            };
          }
          return a;
        })
      );
      showToast(`Diagnostic task completed for ${targetAgent.code} ✓`);
    }, 3600);
  };

  const handleAssignAsset = (asset: IoTAsset, coords: { x: number; y: number }) => {
    // Remove from unassigned
    setUnassignedAssets((prev) => prev.filter((a) => a.id !== asset.id));

    // Place onto active floor
    const placedAsset: IoTAsset = {
      ...asset,
      floorId: activeFloorId,
      x: coords.x,
      y: coords.y,
      roomName: coords.x > 500 ? 'Server Room' : 'Plant Room',
      status: 'Optimal',
    };

    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const withAsset = {
            ...f,
            assets: [...f.assets, placedAsset],
          };
          return recalculateFloorZoneAssignments(withAsset);
        }
        return f;
      })
    );
    setSelectedAsset(placedAsset);
    showToast(`Placed ${asset.name} at coordinates (${coords.x}, ${coords.y})`);
  };

  const handleUpdateZone = (updatedZone: FloorZone) => {
    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const updatedZones = f.zones.map((z) => (z.id === updatedZone.id ? updatedZone : z));
          return recalculateFloorZoneAssignments({ ...f, zones: updatedZones });
        }
        return f;
      })
    );
    setSelectedZone(updatedZone);
    showToast(`Updated zone: ${updatedZone.name}`);
  };

  const handleUpdateZonePoints = (zoneId: string, points: Array<{ x: number; y: number }>) => {
    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const updatedZones = f.zones.map((z) => (z.id === zoneId ? { ...z, points } : z));
          return recalculateFloorZoneAssignments({ ...f, zones: updatedZones });
        }
        return f;
      })
    );
  };

  const handleCreateZone = (zoneData: Omit<FloorZone, 'id' | 'floorId' | 'autoAssignedCount'>) => {
    const newZone: FloorZone = {
      ...zoneData,
      id: `zone-${Date.now()}`,
      floorId: activeFloorId,
      autoAssignedCount: 0,
    };

    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const withZone = { ...f, zones: [...f.zones, newZone] };
          return recalculateFloorZoneAssignments(withZone);
        }
        return f;
      })
    );

    setSelectedZone(newZone);
    showToast(`Created new zone: ${newZone.name}`);
  };

  const handleUpdateAsset = (updatedAsset: IoTAsset) => {
    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const updatedAssets = f.assets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
          return recalculateFloorZoneAssignments({ ...f, assets: updatedAssets });
        }
        return f;
      })
    );
    setSelectedAsset(updatedAsset);

    // Also update in unassigned if it happened to be there
    setUnassignedAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
    );

    showToast(`Saved changes for ${updatedAsset.name} (${updatedAsset.status})`);
  };

  const handleSendMessage = (text: string, assetId?: string) => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes} ${ampm}`;

    const newMsg: TechnicianMessage = {
      id: `msg-${Date.now()}`,
      dateGroup: 'Today',
      author: 'George Vaalden',
      avatarColor: '#8B5CF6',
      timestamp: formattedTime,
      statusBadge: 'In Progress',
      text,
      assetId: assetId || selectedAsset?.id,
    };

    setTechnicianMessages((prev) => [...prev, newMsg]);

    // Append autonomous reasoning trace
    const newTrace: ReasoningTraceItem = {
      id: `trace-${Date.now()}`,
      timestamp: `${hours}:${minutes}`,
      type: 'received',
      title: `Field Dispatch: ${text.slice(0, 30)}...`,
      description: `Technician log against ${selectedAsset?.name || 'facility hardware'}.`,
    };
    setTraces((prev) => [newTrace, ...prev]);

    // Schedule automated AI Agent diagnostic Co-Pilot response 1s later
    setTimeout(() => {
      const aiReply: TechnicianMessage = {
        id: `msg-ai-${Date.now()}`,
        dateGroup: 'Today',
        author: 'ANDON Co-Pilot (#750)',
        avatarColor: '#00F2FE',
        timestamp: formattedTime,
        statusBadge: 'Optimal',
        text: `Acknowledged field update from George Vaalden. Diagnostic subroutines refreshed; hardware parameters calibrated to baseline specifications.`,
        assetId: assetId || selectedAsset?.id,
      };
      setTechnicianMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  const handleAddFloorClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateFloor = (floorName: string) => {
    const floorIndex = floors.length + 1;
    const newFloor: BuildingFloor = {
      id: `floor-0${floorIndex}`,
      name: floorName || `Floor 0${floorIndex}`,
      isEmpty: true,
      zones: [],
      assets: [],
      createdAt: new Date().toISOString(),
    };
    setFloors((prev) => [...prev, newFloor]);
    setActiveFloorId(newFloor.id);
    showToast(`Created floor: ${newFloor.name}`);
  };

  const handleUploadFloorMap = (blueprintUrl: string) => {
    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const updated: BuildingFloor = {
            ...f,
            isEmpty: false,
            blueprintUrl,
            svgRooms: DEFAULT_BLUEPRINT_TEMPLATE.svgRooms,
            zones: [
              {
                id: `zone-${Date.now()}`,
                floorId: f.id,
                name: 'Zone A',
                label: 'Zone A (Uploaded Perimeter)',
                points: [
                  { x: 200, y: 120 },
                  { x: 500, y: 120 },
                  { x: 500, y: 350 },
                  { x: 200, y: 350 },
                ],
                color: 'rgba(59, 130, 246, 0.18)',
                autoAssignedCount: 0,
                description: 'Uploaded CAD architectural zone.',
                visible: true,
              },
            ],
            assets: [
              {
                id: `asset-${Date.now()}`,
                name: 'Main Distribution Substation',
                code: 'ELEC-01',
                category: 'Other Equipment',
                status: 'Optimal',
                roomName: 'Plant Room',
                x: 460,
                y: 260,
                floorId: f.id,
                description: 'Primary 480V substation breaker line.',
                visible: true,
                qrCode: 'QR-ELEC-480V-01',
              },
            ],
          };
          return recalculateFloorZoneAssignments(updated);
        }
        return f;
      })
    );
    showToast(`Blueprint uploaded successfully for ${activeFloor.name}!`);
  };

  const handleLoadTemplate = () => {
    handleUploadFloorMap('template');
  };

  const handleCreateAgent = (agentData: {
    code: string;
    name: string;
    role: string;
    description: string;
  }) => {
    const newAgent: AIAgent = {
      id: `agent-${Date.now()}`,
      code: agentData.code,
      name: agentData.name,
      role: agentData.role,
      description: agentData.description,
      status: 'RUNNING',
      successRate: 95,
      successDelta: 2.0,
      responseTime: 12.4,
      costPerRun: '$0.14',
      totalRequests: 1,
    };
    setAgents((prev) => [newAgent, ...prev]);
    showToast(`AI Agent ${newAgent.name} (${newAgent.code}) deployed!`);
  };

  const handleCreateAsset = (assetData: {
    name: string;
    code: string;
    category: AssetCategory;
    status: AssetStatus;
    roomName: string;
    description: string;
  }) => {
    const newAsset: IoTAsset = {
      id: `asset-${Date.now()}`,
      name: assetData.name,
      code: assetData.code,
      category: assetData.category,
      status: assetData.status,
      roomName: assetData.roomName,
      x: 480,
      y: 260,
      floorId: activeFloorId,
      description: assetData.description,
      visible: true,
      qrCode: `QR-${assetData.code}`,
    };

    setFloors((prev) =>
      prev.map((f) => {
        if (f.id === activeFloorId) {
          const withAsset = { ...f, assets: [...f.assets, newAsset] };
          return recalculateFloorZoneAssignments(withAsset);
        }
        return f;
      })
    );
    setSelectedAsset(newAsset);
    showToast(`Created and pinned asset: ${newAsset.name}`);
  };

  return (
    <ErrorBoundary fallbackTitle="Application Error" onReset={() => setCurrentView('andon-workflow')}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
      >
        {/* Persistent Executive Top Navigation Bar (Gated to Demo Harness) */}
        {isDemoHarness && (
          <TopNavBar
            currentView={currentView}
            onSelectView={(v) => setCurrentView(v)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={setActiveFloorId}
            onAddFloor={handleAddFloorClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSave={() => showToast('All floor layouts, zones, and agent telemetry saved to persistent storage ✓')}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* View Routing */}
        <div style={{ flex: 1, height: isDemoHarness ? 'calc(100% - 52px)' : '100%', overflow: 'hidden', display: 'flex' }}>
          {/* 1. Unified Command View */}
          {isDemoHarness && currentView === 'unified' && (
            <UnifiedCommandView
              floor={activeFloor}
              agents={agents}
              unassignedAssets={unassignedAssets}
              selectedAsset={selectedAsset}
              selectedZone={selectedZone}
              onSelectAsset={setSelectedAsset}
              onSelectZone={setSelectedZone}
              onAssignAsset={handleAssignAsset}
              onTogglePauseAgent={handleTogglePauseAgent}
              onRunDiagnostic={handleRunDiagnosticTask}
              onUpdateZone={handleUpdateZone}
              onUpdateAsset={handleUpdateAsset}
              traces={traces}
              technicianMessages={technicianMessages}
              onSendMessage={handleSendMessage}
              onOpenQrScanner={() => setIsQrModalOpen(true)}
              onUploadFloorMap={handleUploadFloorMap}
              onLoadTemplate={handleLoadTemplate}
              onCreateZone={handleCreateZone}
              onUpdateZonePoints={handleUpdateZonePoints}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              activeTool={activeTool}
              onSelectTool={setActiveTool}
            />
          )}

          {/* 2. Desktop Floorplan Digital Twin */}
          {isDemoHarness && currentView === 'floorplan' && (
            <FloorplanDigitalTwinView
              floor={activeFloor}
              unassignedAssets={unassignedAssets}
              selectedAsset={selectedAsset}
              selectedZone={selectedZone}
              onSelectAsset={setSelectedAsset}
              onSelectZone={setSelectedZone}
              onAssignAsset={handleAssignAsset}
              onUpdateZone={handleUpdateZone}
              onUpdateAsset={handleUpdateAsset}
              traces={traces}
              technicianMessages={technicianMessages}
              onSendMessage={handleSendMessage}
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              onUploadFloorMap={handleUploadFloorMap}
              onLoadTemplate={handleLoadTemplate}
              onCreateZone={handleCreateZone}
              onUpdateZonePoints={handleUpdateZonePoints}
              timeframe={timeframe}
            />
          )}

          {/* 3. ANDON AI Agent Monitoring Dashboard */}
          {isDemoHarness && currentView === 'agent-monitor' && (
            <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
              <div style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
                <MeelyAgentDashboard
                  agents={agents}
                  onTogglePauseAgent={handleTogglePauseAgent}
                  onRunDiagnostic={handleRunDiagnosticTask}
                  onSelectAgent={(agent) => {
                    if (agent.assignedAssetId) {
                      const target = activeFloor.assets.find((a) => a.id === agent.assignedAssetId);
                      if (target) setSelectedAsset(target);
                    }
                  }}
                  selectedAgentId={selectedAsset?.assignedAgentId}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  searchQuery={searchQuery}
                />
              </div>
              <TelemetryTroubleshootingDrawer
                selectedAsset={selectedAsset}
                selectedZone={selectedZone}
                onUpdateZone={handleUpdateZone}
                onUpdateAsset={handleUpdateAsset}
                traces={traces}
                technicianMessages={technicianMessages}
                onSendMessage={handleSendMessage}
                timeframe={timeframe}
              />
            </div>
          )}

          {/* 4. Mobile / Tablet Field Technician PWA */}
          {isDemoHarness && currentView === 'field-pwa' && (
            <FieldTechnicianPWA
              floor={activeFloor}
              selectedAsset={selectedAsset}
              selectedZone={selectedZone}
              onSelectAsset={setSelectedAsset}
              onSelectZone={setSelectedZone}
              technicianMessages={technicianMessages}
              onSendMessage={handleSendMessage}
              agents={agents}
            />
          )}

          {/* 5. Atlassian Forge ANDON Safety Lens Workflow */}
          {currentView === 'andon-workflow' && (
            <div className="andon-dashboard-shell" style={{ width: '100%', height: '100%', display: 'flex' }}>
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
                      onProceedToReview={(decisionId) => {
                        setSelectedReviewDecisionId(decisionId);
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

                  {currentScreen === Screen.SITE_REGISTRY && (
                    <SiteRegistryView onBack={() => setCurrentScreen(Screen.CHANGE_LENS)} />
                  )}

                  {currentScreen === Screen.DECISION_HISTORY && (
                    <DecisionHistoryView onBack={() => setCurrentScreen(Screen.CHANGE_LENS)} />
                  )}

                  {currentScreen === Screen.ADMINISTRATION && (
                    <AdminSettingsView onBack={() => setCurrentScreen(Screen.CHANGE_LENS)} />
                  )}
                </main>
                <StatusFooter />
              </div>
            </div>
          )}
        </div>

        {/* Global QR Scanner Modal */}
        <QRScannerModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          availableAssets={activeFloor.assets}
          onScanSuccess={(asset) => {
            setSelectedAsset(asset);
            showToast(`QR Verified: Standing in front of ${asset.name} (${asset.roomName})`);
          }}
        />

        {/* Global + Create Item Modal */}
        <CreateItemModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateAgent={handleCreateAgent}
          onCreateAsset={handleCreateAsset}
          onCreateFloor={handleCreateFloor}
        />

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 99999,
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-float)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
              }}
            />
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
