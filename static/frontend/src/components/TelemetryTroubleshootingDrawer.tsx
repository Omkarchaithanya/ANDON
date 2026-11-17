/**
 * @file TelemetryTroubleshootingDrawer.tsx
 * @description Right 340px Contextual Drawer with Telemetry Step-Line Chart,
 * Live Reasoning Trace Log, Field Technician Chat Feed, and Asset/Zone Inspector.
 * Features:
 * - Real Clipboard Copy with "✓ Copied!" badge
 * - Real JSON file download for telemetry dump
 * - Fully editable Inspector form with Status dropdown, Name, Description, and Visibility toggle
 * - Dynamic Step-Line Chart adapting to timeframe
 */

import React, { useState, useEffect } from 'react';
import {
  FloorZone,
  IoTAsset,
  ReasoningTraceItem,
  TechnicianMessage,
  AssetStatus,
  TimeframeFilter,
  TelemetrySeries,
} from '../types/hybrid-spec';
import { generateTelemetrySeries } from '../data/store';

interface TelemetryTroubleshootingDrawerProps {
  selectedAsset: IoTAsset | null;
  selectedZone: FloorZone | null;
  onUpdateAsset?: (asset: IoTAsset) => void;
  onUpdateZone?: (zone: FloorZone) => void;
  onClearSelection?: () => void;
  traces: ReasoningTraceItem[];
  technicianMessages: TechnicianMessage[];
  onSendMessage: (text: string, assetId?: string) => void;
  timeframe?: TimeframeFilter;
  onClose?: () => void;
}

export const TelemetryTroubleshootingDrawer: React.FC<TelemetryTroubleshootingDrawerProps> = ({
  selectedAsset,
  selectedZone,
  onUpdateAsset,
  onUpdateZone,
  traces,
  technicianMessages,
  onSendMessage,
  timeframe = 'Today',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'traces' | 'technician' | 'inspector'>(
    selectedAsset || selectedZone ? 'inspector' : 'traces'
  );
  const [messageInput, setMessageInput] = useState<string>('');

  // Editable local state when asset or zone is selected
  const [localLabel, setLocalLabel] = useState<string>(selectedAsset?.name || selectedZone?.name || '');
  const [localDescription, setLocalDescription] = useState<string>(
    selectedAsset?.description || selectedZone?.description || ''
  );
  const [localVisible, setLocalVisible] = useState<boolean>(
    selectedAsset?.visible ?? selectedZone?.visible ?? true
  );
  const [localStatus, setLocalStatus] = useState<AssetStatus>(selectedAsset?.status || 'Optimal');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state if selection changes
  useEffect(() => {
    if (selectedAsset) {
      setLocalLabel(selectedAsset.name);
      setLocalDescription(selectedAsset.description);
      setLocalVisible(selectedAsset.visible);
      setLocalStatus(selectedAsset.status);
      setActiveTab('inspector');
    } else if (selectedZone) {
      setLocalLabel(selectedZone.name);
      setLocalDescription(selectedZone.description);
      setLocalVisible(selectedZone.visible);
      setActiveTab('inspector');
    }
  }, [selectedAsset, selectedZone]);

  const handleSaveInspector = () => {
    if (selectedAsset && onUpdateAsset) {
      onUpdateAsset({
        ...selectedAsset,
        name: localLabel,
        description: localDescription,
        visible: localVisible,
        status: localStatus,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } else if (selectedZone && onUpdateZone) {
      onUpdateZone({
        ...selectedZone,
        name: localLabel,
        description: localDescription,
        visible: localVisible,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim(), selectedAsset?.id);
    setMessageInput('');
  };

  const handleCopyLogs = () => {
    const text = traces
      .map(
        (t) =>
          `[${t.timestamp}] [${t.type.toUpperCase()}] ${t.title}${
            t.description ? ' - ' + t.description : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        traces,
        technicianMessages,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `andon-telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate dynamic step-line chart points
  const series: TelemetrySeries = generateTelemetrySeries(timeframe);

  // Calculate SVG orthogonal step line path
  const svgWidth = 280;
  const svgHeight = 70;
  const maxTokens = Math.max(...series.points.map((p) => p.tokens), 160);
  const stepX = svgWidth / (series.points.length - 1);

  // Generate step-line path "M x0,y0 H x1 V y1 H x2 ..."
  let pathD = '';
  series.points.forEach((pt, i) => {
    const x = i * stepX;
    const y = svgHeight - (pt.tokens / maxTokens) * (svgHeight - 16) - 8;
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      const prevX = (i - 1) * stepX;
      const midX = (prevX + x) / 2;
      pathD += ` H ${midX} V ${y} H ${x}`;
    }
  });

  return (
    <aside
      style={{
        width: 340,
        minWidth: 340,
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Top Drawer Segmented Header */}
      <div
        style={{
          height: 48,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setActiveTab('traces')}
            style={{
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'traces' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'traces' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'traces' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            AI Trace
          </button>
          <button
            onClick={() => setActiveTab('technician')}
            style={{
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'technician' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'technician' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'technician' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Field Chat
          </button>
          {(selectedAsset || selectedZone) && (
            <button
              onClick={() => setActiveTab('inspector')}
              style={{
                border: 'none',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'inspector' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'inspector' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'inspector' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Inspector
            </button>
          )}
        </div>

        {/* Header Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {copied && (
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--accent-teal-success)',
                fontWeight: 700,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              ✓ Copied!
            </span>
          )}
          <button
            title="Copy Logs to Clipboard"
            onClick={handleCopyLogs}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            title="Download Telemetry JSON"
            onClick={handleDownloadLogs}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
          {onClose && (
            <button
              title="Close Drawer"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOP CARD: USAGE STEP-LINE CHART                         */}
      {/* ======================================================== */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Metric KPI Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span
            className="font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-teal-success)',
            }}
          >
            TOKENS ↗ {series.totals.tokensDelta}
          </span>
          <span
            className="font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            TASKS ↘ {series.totals.tasksDelta}
          </span>
          <span
            className="font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--status-danger-text)',
            }}
          >
            ERRORS ↘ {series.totals.errorsRate}
          </span>
        </div>

        {/* Step-Line Graph Container */}
        <div style={{ position: 'relative', width: '100%', height: 86 }}>
          <svg width="100%" height="86" viewBox={`0 0 ${svgWidth} ${svgHeight + 16}`}>
            {/* Grid baseline */}
            <line x1="0" y1={svgHeight} x2={svgWidth} y2={svgHeight} stroke="var(--border-subtle)" strokeWidth="1" />

            {/* Stepped Telemetry Line */}
            <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />

            {/* Peak Callout Bubble on highest data point */}
            <g transform={`translate(${2 * stepX}, 14)`}>
              <rect x="-16" y="-12" width="32" height="18" rx="4" fill="var(--accent-primary)" />
              <text x="0" y="1" textAnchor="middle" fill="var(--text-inverse)" fontSize="10" fontWeight="800">
                150
              </text>
              <circle cx="0" cy="18" r="3" fill="var(--accent-primary)" />
            </g>

            {/* X-axis date labels */}
            {series.points.map((pt, idx) => (
              <text
                key={idx}
                x={idx * stepX}
                y={svgHeight + 12}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="9"
                fontFamily="monospace"
              >
                {pt.date}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* ======================================================== */}
      {/* LOWER TABBED CONTENT AREA                                */}
      {/* ======================================================== */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* TAB 1: AI Reasoning Trace */}
        {activeTab === 'traces' && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Reasoning Trace
              </span>
              <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                {traces.length} EVENTS
              </span>
            </div>

            {traces.map((trace) => (
              <div
                key={trace.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  backgroundColor: trace.isError ? 'var(--status-danger-bg)' : 'var(--bg-elevated)',
                  border: trace.isError ? '1px solid var(--status-danger-text)' : '1px solid var(--border-subtle)',
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    color: trace.isError ? 'var(--status-danger-text)' : 'var(--accent-primary)',
                    fontWeight: 700,
                    minWidth: 36,
                  }}
                >
                  {trace.timestamp}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: trace.isError ? 'var(--status-danger-text)' : 'var(--text-primary)',
                    }}
                  >
                    {trace.title}
                  </div>
                  {trace.description && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {trace.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Field Technician Chat */}
        {activeTab === 'technician' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {technicianMessages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: msg.avatarColor,
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {msg.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {msg.author}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                      {msg.statusBadge && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            backgroundColor:
                              msg.statusBadge === 'Needs Attention'
                                ? 'var(--status-danger-bg)'
                                : 'var(--status-info-bg)',
                            color:
                              msg.statusBadge === 'Needs Attention'
                                ? 'var(--status-danger-text)'
                                : 'var(--status-info-text)',
                          }}
                        >
                          {msg.statusBadge}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        lineHeight: 1.4,
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-elevated)',
                        padding: '8px 10px',
                        borderRadius: '0 10px 10px 10px',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Composer */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '10px 12px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                gap: 8,
              }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={selectedAsset ? `Message ${selectedAsset.name.split(' ')[0]}...` : 'Enter technician message...'}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 18,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Editable Inspector Form */}
        {activeTab === 'inspector' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedAsset ? 'Asset Properties' : selectedZone ? 'Zone Properties' : 'Inspector'}
              </span>
              {saveSuccess && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent-teal-success)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ✓ Changes Saved
                </span>
              )}
            </div>

            {/* Display Label Input */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Label / Display Name
              </label>
              <input
                type="text"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 12.5,
                  outline: 'none',
                }}
              />
            </div>

            {/* Operating Status Dropdown (for assets) */}
            {selectedAsset && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Operating Status
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value as AssetStatus)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                >
                  <option value="Optimal">Optimal</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>
            )}

            {/* Description Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Description & Constraints
              </label>
              <textarea
                rows={3}
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.4,
                }}
              />
            </div>

            {/* Visible Toggle Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Visible on Blueprint
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Controls spatial marker rendering
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocalVisible(!localVisible)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: localVisible ? 'var(--accent-primary)' : 'var(--border-strong)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    top: 3,
                    left: localVisible ? 23 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>

            {/* Selected Asset Metadata */}
            {selectedAsset && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Asset Code:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {selectedAsset.code}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Room:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {selectedAsset.roomName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>QR Identifier:</span>
                  <span className="font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {selectedAsset.qrCode}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveInspector}
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 'auto',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
