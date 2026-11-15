/**
 * @file UnifiedCommandView.tsx
 * @description Master 3-in-1 Synthesis Screen (Part B of 03_unified_hybrid_ui_master_spec_and_pwa_reference.md) for ANDON.
 * Fuses Top Hero Bento (3D particle constellation spheres), Central Vector Floorplan
 * Digital Twin, Lower Agents Health Status Table & Unassigned Assets, and the Right Telemetry
 * & Real-Time Troubleshooting Drawer.
 */

import React, { useState } from 'react';
import {
  BuildingFloor,
  IoTAsset,
  FloorZone,
  AIAgent,
  ReasoningTraceItem,
  TechnicianMessage,
  TimeframeFilter,
} from '../types/hybrid-spec';
import { CanvasParticleSphere } from '../components/CanvasParticleSphere';
import { VectorFloorplanMap } from '../components/VectorFloorplanMap';
import { UnassignedAssetsSidebar } from '../components/UnassignedAssetsSidebar';
import { TelemetryTroubleshootingDrawer } from '../components/TelemetryTroubleshootingDrawer';

interface UnifiedCommandViewProps {
  floor: BuildingFloor;
  agents: AIAgent[];
  unassignedAssets: IoTAsset[];
  selectedAsset: IoTAsset | null;
  selectedZone: FloorZone | null;
  onSelectAsset: (asset: IoTAsset | null) => void;
  onSelectZone: (zone: FloorZone | null) => void;
  onAssignAsset: (asset: IoTAsset, coords: { x: number; y: number }) => void;
  onTogglePauseAgent: (agentId: string) => void;
  onRunDiagnostic?: (agentId: string) => void;
  onUpdateZone: (zone: FloorZone) => void;
  onUpdateAsset: (asset: IoTAsset) => void;
  traces: ReasoningTraceItem[];
  technicianMessages: TechnicianMessage[];
  onSendMessage: (text: string, assetId?: string) => void;
  onOpenQrScanner?: () => void;
  onUploadFloorMap?: (blueprintUrl: string) => void;
  onLoadTemplate?: () => void;
  onCreateZone?: (zone: Omit<FloorZone, 'id' | 'floorId' | 'autoAssignedCount'>) => void;
  onUpdateZonePoints?: (zoneId: string, points: Array<{ x: number; y: number }>) => void;
  timeframe?: TimeframeFilter;
  onTimeframeChange?: (tf: TimeframeFilter) => void;
  activeTool?: 'select' | 'polygon' | 'rect' | 'text';
  onSelectTool?: (tool: 'select' | 'polygon' | 'rect' | 'text') => void;
}

export const UnifiedCommandView: React.FC<UnifiedCommandViewProps> = ({
  floor,
  agents,
  unassignedAssets,
  selectedAsset,
  selectedZone,
  onSelectAsset,
  onSelectZone,
  onAssignAsset,
  onTogglePauseAgent,
  onRunDiagnostic,
  onUpdateZone,
  onUpdateAsset,
  traces,
  technicianMessages,
  onSendMessage,
  onOpenQrScanner,
  onUploadFloorMap,
  onLoadTemplate,
  onCreateZone,
  onUpdateZonePoints,
  timeframe = 'Today',
  onTimeframeChange,
  activeTool = 'select',
  onSelectTool,
}) => {
  const [activeTab, setActiveTab] = useState<'floorplan' | 'health-table'>('floorplan');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const featuredAgent = agents.find((a) => a.code === '#750') || agents[0];
  const idledAgent = agents.find((a) => a.code === '#420') || agents[1];
  const failedAgent = agents.find((a) => a.code === '#908') || agents[2];

  // Helper for circular radial progress ring in health table
  const renderRadialGauge = (percent: number, color: string) => {
    const radius = 13;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (percent / 100) * circ;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative', width: 30, height: 30 }}>
          <svg width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
            <circle
              cx="15"
              cy="15"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 15 15)"
            />
          </svg>
        </div>
        <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
          {percent}%
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* Optional Left Collapsible Unassigned Assets Sidebar */}
      <UnassignedAssetsSidebar
        unassignedAssets={unassignedAssets}
        onQuickPinAsset={(asset) => onAssignAsset(asset, { x: 500, y: 250 })}
      />

      {/* Main Central Workspace */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '16px 20px',
          gap: 16,
        }}
      >
        {/* Top 3-Card ANDON Hero Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {/* Card 1: RUNNING (#750) */}
          {featuredAgent && (
            <div
              className="glass-card"
              style={{
                padding: '14px 18px',
                borderRadius: 16,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-glow-cyan)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onClick={() => {
                if (featuredAgent.assignedAssetId) {
                  const target = floor.assets.find((a) => a.id === featuredAgent.assignedAssetId);
                  if (target) onSelectAsset(target);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      backgroundColor: 'rgba(0, 242, 254, 0.12)',
                      color: 'var(--accent-cyan-neon)',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-cyan-neon)',
                        boxShadow: '0 0 6px var(--accent-cyan-neon)',
                      }}
                    />
                    RUNNING
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Zone 2 Linked</span>
                </div>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan-neon)' }}>
                  {featuredAgent.code}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
                <div style={{ width: 68, height: 68 }}>
                  <CanvasParticleSphere
                    status="RUNNING"
                    isPaused={featuredAgent.isPaused}
                    size={68}
                  />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {featuredAgent.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {featuredAgent.successRate}%
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal-success)' }}>
                      +{featuredAgent.successDelta}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                      {featuredAgent.responseTime}s Latency
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Bound to: Server Room HVAC
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {onRunDiagnostic && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunDiagnostic(featuredAgent.id);
                      }}
                      style={{
                        background: 'rgba(0, 242, 254, 0.1)',
                        border: '1px solid var(--border-glow-cyan)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        color: 'var(--accent-cyan-neon)',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Run Task
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePauseAgent(featuredAgent.id);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      padding: '2px 8px',
                      color: 'var(--text-primary)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {featuredAgent.isPaused ? '▶ Resume' : '|| Pause'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: IDLED (#420) */}
          {idledAgent && (
            <div
              className="glass-card"
              style={{
                padding: '14px 18px',
                borderRadius: 16,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(156, 163, 175, 0.15)',
                    color: 'var(--text-muted)',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-muted)',
                    }}
                  />
                  IDLED
                </span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {idledAgent.code}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
                <div style={{ width: 68, height: 68 }}>
                  <CanvasParticleSphere
                    status="IDLED"
                    size={68}
                  />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {idledAgent.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {idledAgent.successRate}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {idledAgent.responseTime}s Latency
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Cost: {idledAgent.costPerRun} / run
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {onRunDiagnostic && (
                    <button
                      onClick={() => onRunDiagnostic(idledAgent.id)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        color: 'var(--accent-primary)',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Run Task
                    </button>
                  )}
                  <button
                    onClick={() => onTogglePauseAgent(idledAgent.id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      padding: '2px 8px',
                      color: 'var(--text-secondary)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {idledAgent.isPaused ? '▶ Resume' : '|| Pause'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: FAILED (#908) */}
          {failedAgent && (
            <div
              className="glass-card"
              style={{
                padding: '14px 18px',
                borderRadius: 16,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid rgba(255, 87, 51, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(255, 87, 51, 0.15)',
                    color: 'var(--accent-orange-fail)',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-orange-fail)',
                      boxShadow: '0 0 6px var(--accent-orange-fail)',
                    }}
                  />
                  FAILED
                </span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-orange-fail)' }}>
                  {failedAgent.code}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
                <div style={{ width: 68, height: 68 }}>
                  <CanvasParticleSphere
                    status="FAILED"
                    size={68}
                  />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {failedAgent.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-orange-fail)' }}>
                      {failedAgent.successRate}%
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-orange-fail)' }}>
                      {failedAgent.successDelta}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                      {failedAgent.responseTime}s Latency
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--accent-orange-fail)', fontWeight: 600 }}>
                  High latency error (Zone 2)
                </span>
                <button
                  onClick={() => {
                    if (onRunDiagnostic) onRunDiagnostic(failedAgent.id);
                    else onTogglePauseAgent(failedAgent.id);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--accent-orange-fail)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    color: 'var(--accent-orange-fail)',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Central Workspace Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 4,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveTab('floorplan')}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === 'floorplan' ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'floorplan' ? '2px solid var(--accent-primary)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              60fps Vector Floorplan Digital Twin
            </button>
            <button
              onClick={() => setActiveTab('health-table')}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === 'health-table' ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'health-table' ? '2px solid var(--accent-primary)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Agents Health Status Matrix
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onOpenQrScanner && (
              <button
                onClick={onOpenQrScanner}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Scan QR Code
              </button>
            )}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {drawerOpen ? 'Hide Drawer →' : '← Show Drawer'}
            </button>
          </div>
        </div>

        {/* Tab 1: Floorplan Digital Twin */}
        {activeTab === 'floorplan' && (
          <div
            style={{
              flex: 1,
              minHeight: 460,
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <VectorFloorplanMap
              floor={floor}
              selectedAsset={selectedAsset}
              selectedZone={selectedZone}
              onSelectAsset={onSelectAsset}
              onSelectZone={onSelectZone}
              onDropAssetOnCanvas={onAssignAsset}
              activeTool={activeTool}
              onSelectTool={onSelectTool}
              onUploadFloorMap={onUploadFloorMap}
              onLoadTemplate={onLoadTemplate}
              onCreateZone={onCreateZone}
              onUpdateZonePoints={onUpdateZonePoints}
            />
          </div>
        )}

        {/* Tab 2: Agents Health Status Matrix Table */}
        {activeTab === 'health-table' && (
          <div
            className="glass-card"
            style={{
              flex: 1,
              minHeight: 460,
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Agents Health Status
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  Autonomous Agent Telemetry, Latency, and Cost Attribution
                </p>
              </div>
              <select
                value={timeframe}
                onChange={(e) => {
                  if (onTimeframeChange) {
                    onTimeframeChange(e.target.value as TimeframeFilter);
                  }
                }}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Today">Today ▼</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="font-mono" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>AGENT</th>
                    <th className="font-mono" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>STATUS</th>
                    <th className="font-mono" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>SUCCESS</th>
                    <th className="font-mono" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>REQUESTS</th>
                    <th className="font-mono" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>RESPONSE</th>
                    <th className="font-mono" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>COST</th>
                    <th className="font-mono" style={{ textAlign: 'right', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: agent.assignedAssetId === selectedAsset?.id ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan-neon)' }}>
                            {agent.code}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {agent.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {agent.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 9999,
                            backgroundColor:
                              agent.status === 'RUNNING'
                                ? 'rgba(0, 242, 254, 0.12)'
                                : agent.status === 'FAILED'
                                ? 'rgba(255, 87, 51, 0.15)'
                                : 'rgba(156, 163, 175, 0.15)',
                            color:
                              agent.status === 'RUNNING'
                                ? 'var(--accent-cyan-neon)'
                                : agent.status === 'FAILED'
                                ? 'var(--accent-orange-fail)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {renderRadialGauge(
                          agent.successRate,
                          agent.status === 'FAILED' ? 'var(--accent-orange-fail)' : 'var(--accent-cyan-neon)'
                        )}
                      </td>
                      <td className="font-mono" style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-primary)' }}>
                        {agent.totalRequests}
                      </td>
                      <td className="font-mono" style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-primary)' }}>
                        {agent.responseTime}s
                      </td>
                      <td className="font-mono" style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-primary)' }}>
                        {agent.costPerRun}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            if (agent.assignedAssetId) {
                              const found = floor.assets.find((a) => a.id === agent.assignedAssetId);
                              if (found) {
                                onSelectAsset(found);
                                setActiveTab('floorplan');
                              }
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Locate Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Telemetry, Inspector & Troubleshooting Drawer */}
      {drawerOpen && (
        <TelemetryTroubleshootingDrawer
          selectedAsset={selectedAsset}
          selectedZone={selectedZone}
          onUpdateZone={onUpdateZone}
          onUpdateAsset={onUpdateAsset}
          traces={traces}
          technicianMessages={technicianMessages}
          onSendMessage={onSendMessage}
          timeframe={timeframe}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
};
