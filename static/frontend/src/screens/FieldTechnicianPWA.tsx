/**
 * @file FieldTechnicianPWA.tsx
 * @description Mobile/Tablet Field Technician PWA view based on 03_unified_hybrid_ui_master_spec_and_pwa_reference.md.
 * Features split map + draggable bottom-sheet activity feed, QR verification gate,
 * chronological troubleshooting messages, and sticky contextual composer.
 */

import React, { useState } from 'react';
import {
  BuildingFloor,
  IoTAsset,
  FloorZone,
  TechnicianMessage,
  AIAgent,
} from '../types/hybrid-spec';
import { VectorFloorplanMap } from '../components/VectorFloorplanMap';
import { QRScannerModal } from '../components/QRScannerModal';

interface FieldTechnicianPWAProps {
  floor: BuildingFloor;
  selectedAsset: IoTAsset | null;
  selectedZone: FloorZone | null;
  onSelectAsset: (asset: IoTAsset | null) => void;
  onSelectZone: (zone: FloorZone | null) => void;
  technicianMessages: TechnicianMessage[];
  onSendMessage: (text: string, assetId?: string) => void;
  agents: AIAgent[];
}

export const FieldTechnicianPWA: React.FC<FieldTechnicianPWAProps> = ({
  floor,
  selectedAsset,
  selectedZone,
  onSelectAsset,
  onSelectZone,
  technicianMessages,
  onSendMessage,
  agents,
}) => {
  const [deviceFrame, setDeviceFrame] = useState<'mobile' | 'tablet' | 'full'>('mobile');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sheetExpanded, setSheetExpanded] = useState<'half' | 'full' | 'collapsed'>('half');

  // Filter messages for the active asset if selected
  const displayedMessages = selectedAsset
    ? technicianMessages.filter((m) => !m.assetId || m.assetId === selectedAsset.id)
    : technicianMessages;

  const yesterdayMessages = displayedMessages.filter((m) => m.dateGroup === 'Yesterday');
  const todayMessages = displayedMessages.filter((m) => m.dateGroup === 'Today');

  const assignedAgent = selectedAsset?.assignedAgentId
    ? agents.find((a) => a.id === selectedAsset.assignedAgentId)
    : null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(messageInput.trim(), selectedAsset?.id);
    setMessageInput('');
  };

  const handleScanSuccess = (asset: IoTAsset) => {
    onSelectAsset(asset);
    setSheetExpanded('half');
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: deviceFrame === 'full' ? 0 : '16px 20px',
        overflow: 'hidden',
      }}
    >
      {/* Device Emulation Toolbar */}
      <div
        style={{
          width: '100%',
          maxWidth: deviceFrame === 'mobile' ? 420 : deviceFrame === 'tablet' ? 820 : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          marginBottom: 10,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Viewport Emulation:
          </span>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', borderRadius: 6, padding: 2 }}>
            <button
              onClick={() => setDeviceFrame('mobile')}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                backgroundColor: deviceFrame === 'mobile' ? 'var(--accent-primary)' : 'transparent',
                color: deviceFrame === 'mobile' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📱 Mobile (375px)
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                backgroundColor: deviceFrame === 'tablet' ? 'var(--accent-primary)' : 'transparent',
                color: deviceFrame === 'tablet' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📱 Tablet (768px)
            </button>
            <button
              onClick={() => setDeviceFrame('full')}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                backgroundColor: deviceFrame === 'full' ? 'var(--accent-primary)' : 'transparent',
                color: deviceFrame === 'full' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💻 Full Responsive
            </button>
          </div>
        </div>

        {/* Scan Equipment CTA */}
        <button
          onClick={() => setIsQrModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--accent-cyan-neon)',
            color: '#0B0C10',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 242, 254, 0.35)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Scan Equipment QR
        </button>
      </div>

      {/* Main Container Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: deviceFrame === 'mobile' ? 390 : deviceFrame === 'tablet' ? 768 : '100%',
          height: deviceFrame === 'full' ? 'calc(100% - 60px)' : 'calc(100% - 65px)',
          borderRadius: deviceFrame === 'full' ? 0 : 24,
          border: deviceFrame === 'full' ? 'none' : '2px solid var(--border-subtle)',
          boxShadow: deviceFrame === 'full' ? 'none' : '0 12px 36px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        {/* Top Half: Floorplan Viewport */}
        <div
          style={{
            height: sheetExpanded === 'full' ? '18%' : sheetExpanded === 'collapsed' ? '82%' : '48%',
            transition: 'height 0.25s ease-in-out',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <VectorFloorplanMap
            floor={floor}
            selectedAsset={selectedAsset}
            selectedZone={selectedZone}
            onSelectAsset={onSelectAsset}
            onSelectZone={onSelectZone}
            activeTool="select"
          />

          {/* Quick Active Badge Floating on Map */}
          {selectedAsset && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 10,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                padding: '6px 12px',
                border: '1px solid var(--border-glow-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    selectedAsset.status === 'Needs Attention'
                      ? 'var(--status-danger-text)'
                      : 'var(--accent-teal-success)',
                  boxShadow: `0 0 6px ${
                    selectedAsset.status === 'Needs Attention'
                      ? 'var(--status-danger-text)'
                      : 'var(--accent-teal-success)'
                  }`,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                {selectedAsset.name} ({selectedAsset.roomName})
              </span>
            </div>
          )}
        </div>

        {/* Bottom Half: Draggable Activity Sheet */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-surface)',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.15)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 20,
          }}
        >
          {/* Bottom Sheet Drag Handle Bar */}
          <div
            onClick={() =>
              setSheetExpanded(
                sheetExpanded === 'half' ? 'full' : sheetExpanded === 'full' ? 'collapsed' : 'half'
              )
            }
            style={{
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--border-default)',
              }}
            />
          </div>

          {/* Sheet Header with Target Info and Expand Controls */}
          <div
            style={{
              padding: '6px 16px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedAsset ? selectedAsset.name : 'Facility Field Troubleshooting Log'}
                </h4>
                {selectedAsset && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      backgroundColor:
                        selectedAsset.status === 'Needs Attention'
                          ? 'var(--status-danger-bg)'
                          : 'var(--status-info-bg)',
                      color:
                        selectedAsset.status === 'Needs Attention'
                          ? 'var(--status-danger-text)'
                          : 'var(--status-info-text)',
                    }}
                  >
                    {selectedAsset.status}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {selectedAsset
                  ? `Tagged in ${selectedAsset.roomName} • QR: ${selectedAsset.qrCode} • Temp: ${selectedAsset.temperature || 24.5}°C`
                  : 'Select an asset on the floorplan above or tap "Scan Equipment QR"'}
              </div>
            </div>

            {/* Expand / Minimize Toggle */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setSheetExpanded(sheetExpanded === 'full' ? 'half' : 'full')}
                title="Toggle expand"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {sheetExpanded === 'full' ? '↓ Half' : '↑ Full'}
              </button>
            </div>
          </div>

          {/* Linked AI Agent Banner if available */}
          {assignedAgent && (
            <div
              style={{
                margin: '8px 16px 0',
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-cyan-neon)',
                    boxShadow: '0 0 6px var(--accent-cyan-neon)',
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Assigned Autonomous Agent: {assignedAgent.name} ({assignedAgent.code})
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--accent-cyan-neon)' }}>
                {assignedAgent.successRate}% Success
              </span>
            </div>
          )}

          {/* Chronological Messages Scroll Feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Yesterday Divider */}
            {yesterdayMessages.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    YESTERDAY
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                </div>
                {yesterdayMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: msg.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {msg.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {msg.author}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {msg.timestamp}
                        </span>
                        {msg.statusBadge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 9999,
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
                          fontSize: 13,
                          lineHeight: 1.4,
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '8px 12px',
                          borderRadius: '0 12px 12px 12px',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Today Divider */}
            {todayMessages.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    TODAY
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                </div>
                {todayMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: msg.avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {msg.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {msg.author}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {msg.timestamp}
                        </span>
                        {msg.statusBadge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 9999,
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
                          fontSize: 13,
                          lineHeight: 1.4,
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '8px 12px',
                          borderRadius: '0 12px 12px 12px',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Sticky Contextual Equipment Composer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                selectedAsset
                  ? `Message ${selectedAsset.name.split(' ')[0]}...`
                  : 'Message HVAC...'
              }
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 20,
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: messageInput.trim() ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                color: messageInput.trim() ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: messageInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        availableAssets={floor.assets}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

