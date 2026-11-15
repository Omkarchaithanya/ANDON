/**
 * @file TopNavBar.tsx
 * @description Executive 52px Single Top Navigation Bar for ANDON.
 * Built with professional web design standards (Linear / Datadog style):
 * - Seamless 5-view navigation (Unified, Floorplan, Agents, Field PWA, Safety Radar)
 * - Floor dropdown & quick switcher
 * - Real-time search
 * - Theme switcher & modal triggers
 */

import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, ThemeMode, BuildingFloor } from '../types/hybrid-spec';

interface TopNavBarProps {
  currentView: ViewMode | 'andon-workflow';
  onSelectView: (view: ViewMode | 'andon-workflow') => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  floors: BuildingFloor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  onAddFloor: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSave?: () => void;
  onOpenCreateModal?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onSelectView,
  theme,
  onToggleTheme,
  floors,
  activeFloorId,
  onSelectFloor,
  onAddFloor,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
}) => {
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
  const floorMenuRef = useRef<HTMLDivElement>(null);

  // Close floor menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (floorMenuRef.current && !floorMenuRef.current.contains(e.target as Node)) {
        setIsFloorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFloor = floors.find((f) => f.id === activeFloorId) || floors[0];

  const navItems: Array<{ id: ViewMode | 'andon-workflow'; label: string; shortcut: string }> = [
    { id: 'andon-workflow', label: 'Safety Radar (Jira)', shortcut: '1' },
    { id: 'floorplan', label: '[Harness] Floorplan Twin', shortcut: '2' },
    { id: 'agent-monitor', label: '[Harness] AI Agents', shortcut: '3' },
    { id: 'field-pwa', label: '[Harness] Field PWA', shortcut: '4' },
    { id: 'unified', label: '[Harness] Unified Command', shortcut: '5' },
  ];

  return (
    <header
      style={{
        height: 52,
        minHeight: 52,
        padding: '0 16px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        gap: 16,
      }}
    >
      {/* Brand & Main View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>A</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
              ANDON
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
              Radar
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-default)' }} />

        {/* 5-Mode Segmented Navigation */}
        <nav
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 7,
            padding: 2,
            border: '1px solid var(--border-subtle)',
          }}
        >
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={`Switch to ${item.label} [Shortcut ${item.shortcut}]`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 11px',
                  borderRadius: 5,
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  fontSize: 11.5,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center Floor Switcher Dropdown (when relevant) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }} ref={floorMenuRef}>
        {(currentView === 'floorplan' || currentView === 'unified' || currentView === 'field-pwa') && (
          <>
            <button
              onClick={() => setIsFloorMenuOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>{activeFloor?.name || 'Floor 01'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isFloorMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  marginTop: 6,
                  left: 0,
                  width: 200,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-float)',
                  zIndex: 100,
                  padding: 4,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Level / Floor
                </div>
                {floors.map((fl) => (
                  <button
                    key={fl.id}
                    onClick={() => {
                      onSelectFloor(fl.id);
                      setIsFloorMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 5,
                      border: 'none',
                      backgroundColor: fl.id === activeFloorId ? 'var(--accent-primary-subtle)' : 'transparent',
                      color: fl.id === activeFloorId ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: fl.id === activeFloorId ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{fl.name}</span>
                    {fl.id === activeFloorId && <span>✓</span>}
                  </button>
                ))}
                <div style={{ height: 1, backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setIsFloorMenuOpen(false);
                    onAddFloor();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 10px',
                    borderRadius: 5,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--accent-primary)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>+ Add New Level</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 6,
            padding: '4px 9px',
            border: '1px solid var(--border-default)',
            width: 170,
            gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter assets..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 11.5,
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 10,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light Blueprint' : 'Dark Obsidian'} mode`}
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {theme === 'dark' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* + Create Primary Button */}
        <button
          onClick={onOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 6,
            backgroundColor: 'var(--accent-primary)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create
        </button>

        {/* User Profile */}
        <div
          title="George Vaalden (Lead Systems Integrator)"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          GV
        </div>
      </div>
    </header>
  );
};
