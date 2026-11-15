/**
 * @file CreateItemModal.tsx
 * @description Working modal for creating new AI Agents, IoT Facility Assets, or Floors.
 */

import React, { useState } from 'react';
import { AssetCategory, AssetStatus } from '../types/hybrid-spec';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (agent: {
    code: string;
    name: string;
    role: string;
    description: string;
  }) => void;
  onCreateAsset: (asset: {
    name: string;
    code: string;
    category: AssetCategory;
    status: AssetStatus;
    roomName: string;
    description: string;
  }) => void;
  onCreateFloor: (floorName: string) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onCreateAgent,
  onCreateAsset,
  onCreateFloor,
}) => {
  const [tab, setTab] = useState<'agent' | 'asset' | 'floor'>('agent');

  // Agent form
  const [agentCode, setAgentCode] = useState('#850');
  const [agentName, setAgentName] = useState('Chiller Plant Optimizer');
  const [agentRole, setAgentRole] = useState('Thermal Load Specialist');
  const [agentDesc, setAgentDesc] = useState(
    'Monitors chilled water delta-T and optimizes variable speed compressor cycles.'
  );

  // Asset form
  const [assetName, setAssetName] = useState('Air Handling Unit #4');
  const [assetCode, setAssetCode] = useState('AHU-04');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Other Equipment');
  const [assetStatus, setAssetStatus] = useState<AssetStatus>('Optimal');
  const [assetRoom, setAssetRoom] = useState('Plant Room');
  const [assetDesc, setAssetDesc] = useState('Variable air volume rooftop air handler.');

  // Floor form
  const [floorName, setFloorName] = useState('Floor 03 (South Wing)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'agent') {
      if (!agentName.trim()) return;
      onCreateAgent({
        code: agentCode.startsWith('#') ? agentCode : `#${agentCode}`,
        name: agentName,
        role: agentRole,
        description: agentDesc,
      });
    } else if (tab === 'asset') {
      if (!assetName.trim()) return;
      onCreateAsset({
        name: assetName,
        code: assetCode,
        category: assetCategory,
        status: assetStatus,
        roomName: assetRoom,
        description: assetDesc,
      });
    } else if (tab === 'floor') {
      if (!floorName.trim()) return;
      onCreateFloor(floorName);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 500,
          borderRadius: 16,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-float)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--accent-primary-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                fontWeight: 800,
              }}
            >
              +
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Create New Entity
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                ANDON Autonomous Operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '8px 20px 0',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
            gap: 12,
          }}
        >
          <button
            onClick={() => setTab('agent')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              borderBottom: tab === 'agent' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: tab === 'agent' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            🤖 AI Agent Monitor
          </button>
          <button
            onClick={() => setTab('asset')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              borderBottom: tab === 'asset' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: tab === 'asset' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            📍 IoT Facility Asset
          </button>
          <button
            onClick={() => setTab('floor')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              borderBottom: tab === 'floor' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: tab === 'floor' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            🏢 Building Floor
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'agent' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Code
                  </label>
                  <input
                    type="text"
                    value={agentCode}
                    onChange={(e) => setAgentCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Operational Role
                </label>
                <input
                  type="text"
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Description & Autonomous Goal
                </label>
                <textarea
                  rows={3}
                  value={agentDesc}
                  onChange={(e) => setAgentDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    resize: 'none',
                  }}
                />
              </div>
            </>
          )}

          {tab === 'asset' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Asset Display Name
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Tag Code
                  </label>
                  <input
                    type="text"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  >
                    <option value="Lighting">Lighting</option>
                    <option value="Other Equipment">Other Equipment</option>
                    <option value="Non-Equipment">Non-Equipment</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Initial Status
                  </label>
                  <select
                    value={assetStatus}
                    onChange={(e) => setAssetStatus(e.target.value as AssetStatus)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  >
                    <option value="Optimal">Optimal</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Default Room
                </label>
                <input
                  type="text"
                  value={assetRoom}
                  onChange={(e) => setAssetRoom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={assetDesc}
                  onChange={(e) => setAssetDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    resize: 'none',
                  }}
                />
              </div>
            </>
          )}

          {tab === 'floor' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Floor Name
              </label>
              <input
                type="text"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              />
              <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                Creating a new floor initializes an empty blueprint canvas ready for CAD/SVG upload or template loading.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 242, 254, 0.3)',
              }}
            >
              Create {tab === 'agent' ? 'AI Agent' : tab === 'asset' ? 'Facility Asset' : 'Floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
