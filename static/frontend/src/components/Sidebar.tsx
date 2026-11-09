import React from 'react';
import { Screen } from '../types';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    {
      screen: Screen.CHANGE_LENS,
      label: 'Change Intake',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
        </svg>
      ),
    },
    {
      screen: Screen.EVIDENCE_REDLINE,
      label: 'Evidence Review',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      screen: Screen.REVIEW_PACKAGE,
      label: 'Review Packages',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      screen: Screen.DECISION_HISTORY,
      label: 'Decision History',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      screen: Screen.SITE_REGISTRY,
      label: 'Site Registry',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
    {
      screen: Screen.ADMINISTRATION,
      label: 'Administration',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="andon-sidebar" aria-label="Main Navigation">
      {/* Brand Logo & Name */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 2L2 24H8L14 12L20 24H26L14 2Z"
              fill="url(#brandGradA)"
            />
            <path
              d="M10 18H18L14 10L10 18Z"
              fill="#0F172A"
            />
            <defs>
              <linearGradient id="brandGradA" x1="2" y1="2" x2="26" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FB923C" />
                <stop offset="1" stopColor="#EA580C" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title">ANDON</div>
          <div className="brand-tagline">Shadow-Change Radar</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.screen)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-btn-icon">{item.icon}</span>
              <span className="nav-btn-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Promo Card */}
      <div className="sidebar-promo-card">
        <div className="promo-robot-graphic">
          <svg viewBox="0 0 120 70" width="100%" height="70" fill="none">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
            </defs>
            {/* Base platform */}
            <rect x="25" y="55" width="70" height="10" rx="3" fill="url(#darkMetal)" stroke="#64748B" strokeWidth="0.8" />
            <circle cx="60" cy="55" r="9" fill="url(#goldGrad)" stroke="#FDE68A" strokeWidth="0.8" />
            {/* Lower segment */}
            <path d="M 58 52 L 42 30 L 48 26 L 64 48 Z" fill="url(#goldGrad)" />
            <circle cx="45" cy="28" r="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
            {/* Upper arm segment */}
            <path d="M 46 28 L 76 16 L 79 21 L 49 33 Z" fill="url(#goldGrad)" />
            <circle cx="77" cy="19" r="5" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
            {/* Wrist and gripper */}
            <path d="M 78 19 L 92 23 L 90 28 L 77 24 Z" fill="#94A3B8" />
            <path d="M 92 23 L 98 18 M 92 26 L 98 31" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="promo-text">
          <div>Discover. Verify.</div>
          <div style={{ color: '#F1F5F9' }}>Ship with Confidence.</div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <span className="footer-version">ANDON v1.0 • Powered by Atlassian Forge</span>
      </div>
    </aside>
  );
};
