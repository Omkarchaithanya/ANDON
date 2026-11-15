/**
 * @file QRScannerModal.tsx
 * @description QR Equipment Scanner & Role Gate modal for the Field Technician PWA and Unified Command View.
 * Provides interactive camera viewfinder overlay, scanning animation, verified role badges,
 * and equipment confirmation to eliminate wasted repair visits.
 */

import React, { useState, useEffect } from 'react';
import { IoTAsset } from '../types/hybrid-spec';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAssets: IoTAsset[];
  onScanSuccess: (asset: IoTAsset) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  availableAssets,
  onScanSuccess,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    availableAssets[0]?.id || ''
  );
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(true);
      setScanProgress(0);
      setVerificationSuccess(false);
      return;
    }

    // Simulate scanning laser progress
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen, selectedAssetId]);

  if (!isOpen) return null;

  const currentAsset = availableAssets.find((a) => a.id === selectedAssetId) || availableAssets[0];

  const handleSimulateScan = () => {
    setIsScanning(false);
    setVerificationSuccess(true);
    setTimeout(() => {
      if (currentAsset) {
        onScanSuccess(currentAsset);
      }
      onClose();
    }, 600);
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
          maxWidth: 480,
          borderRadius: 20,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-glow-cyan)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
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
                backgroundColor: 'rgba(0, 242, 254, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan-neon)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Equipment QR Verification
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Zero-Loss Spatial Gate & Role Clearance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Camera Feed Simulation */}
        <div
          style={{
            position: 'relative',
            height: 260,
            backgroundColor: '#05070A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Subtle camera lens noise / grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle at center, rgba(0, 242, 254, 0.08) 0%, transparent 70%)',
            }}
          />

          {/* Viewfinder Framing Box */}
          <div
            style={{
              position: 'relative',
              width: 190,
              height: 190,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 4 Viewfinder Corners */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '3px solid var(--accent-primary)', borderLeft: '3px solid var(--accent-primary)' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '3px solid var(--accent-primary)', borderRight: '3px solid var(--accent-primary)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '3px solid var(--accent-primary)', borderLeft: '3px solid var(--accent-primary)' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '3px solid var(--accent-primary)', borderRight: '3px solid var(--accent-primary)' }} />

            {/* Simulated QR Code Graphic */}
            <svg width="130" height="130" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.85 }}>
              <rect x="5" y="5" width="28" height="28" stroke="var(--accent-primary)" strokeWidth="4" rx="2" />
              <rect x="12" y="12" width="14" height="14" fill="var(--accent-primary)" />
              <rect x="67" y="5" width="28" height="28" stroke="var(--accent-primary)" strokeWidth="4" rx="2" />
              <rect x="74" y="12" width="14" height="14" fill="var(--accent-primary)" />
              <rect x="5" y="67" width="28" height="28" stroke="var(--accent-primary)" strokeWidth="4" rx="2" />
              <rect x="12" y="74" width="14" height="14" fill="var(--accent-primary)" />
              {/* Pattern Blocks */}
              <rect x="42" y="10" width="8" height="8" fill="var(--accent-primary)" />
              <rect x="42" y="24" width="8" height="16" fill="var(--accent-primary)" />
              <rect x="10" y="42" width="16" height="8" fill="var(--accent-primary)" />
              <rect x="32" y="42" width="8" height="8" fill="var(--accent-primary)" />
              <rect x="46" y="48" width="12" height="12" fill="var(--accent-primary)" />
              <rect x="66" y="42" width="14" height="8" fill="var(--accent-primary)" />
              <rect x="86" y="42" width="8" height="14" fill="var(--accent-primary)" />
              <rect x="42" y="66" width="8" height="24" fill="var(--accent-primary)" />
              <rect x="60" y="66" width="26" height="8" fill="var(--accent-primary)" />
              <rect x="68" y="80" width="12" height="12" fill="var(--accent-primary)" />
            </svg>

            {/* Animated Laser Scanning Line */}
            {isScanning && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'var(--accent-primary)',
                  boxShadow: '0 0 8px var(--accent-primary)',
                  top: `${(Math.sin((scanProgress / 100) * Math.PI * 4) * 0.45 + 0.5) * 100}%`,
                  transition: 'top 0.15s ease-out',
                }}
              />
            )}

            {/* Verification Success Overlay */}
            {verificationSuccess && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(16, 185, 129, 0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  animation: 'fadeIn 0.2s ease-in-out',
                }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, marginTop: 6, letterSpacing: '0.5px' }}>
                  LOCATION VERIFIED
                </span>
              </div>
            )}
          </div>

          {/* Watermark Tag */}
          <div
            className="font-mono"
            style={{
              position: 'absolute',
              bottom: 12,
              fontSize: 11,
              color: 'var(--accent-primary)',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-default)',
            }}
          >
            TARGET: {currentAsset?.qrCode || 'SCANNING...'}
          </div>
        </div>

        {/* Role Gate & Equipment Selector */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Role badge */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-teal-success)',
                  boxShadow: '0 0 8px var(--accent-teal-success)',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Field Role Verified: HVAC Specialist L2
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              #TECH-4091
            </span>
          </div>

          {/* Quick Equipment Switcher for testing */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Simulate Physical Equipment Target:
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                outline: 'none',
              }}
            >
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.code} • {asset.roomName})
                </option>
              ))}
            </select>
          </div>

          {/* Metadata preview */}
          {currentAsset && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: 'var(--bg-subtle)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>Location:</strong> {currentAsset.roomName}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span
                  style={{
                    color:
                      currentAsset.status === 'Needs Attention'
                        ? 'var(--status-danger-text)'
                        : currentAsset.status === 'In Progress'
                        ? 'var(--status-info-text)'
                        : 'var(--accent-teal-success)',
                    fontWeight: 600,
                  }}
                >
                  {currentAsset.status}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSimulateScan}
              style={{
                flex: 2,
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Verify Presence & Unlock Actions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

