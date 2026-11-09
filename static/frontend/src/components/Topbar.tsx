import React from 'react';

interface TopbarProps {
  onSearchChange?: (val: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearchChange }) => {
  return (
    <header className="andon-topbar" role="banner">
      {/* Left Pill Dropdowns */}
      <div className="topbar-left">
        <button className="topbar-dropdown-pill" title="Selected Facility Context">
          <span className="pill-icon">🏢</span>
          <span className="pill-text">Facility Alpha</span>
          <span className="pill-caret">⌄</span>
        </button>

        <button className="topbar-dropdown-pill env-pill" title="Active Environment">
          <span className="env-dot" />
          <span className="pill-text">Production Environment</span>
          <span className="pill-caret">⌄</span>
        </button>
      </div>

      {/* Middle Global Search */}
      <div className="topbar-search">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search Jira, Confluence, or Teamwork Graph..."
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right User Actions & Avatar */}
      <div className="topbar-right">
        {/* Notification Bell */}
        <button className="topbar-icon-btn" title="Pending Notifications (2)" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-badge">2</span>
        </button>

        {/* User Profile */}
        <div className="user-profile-widget" title="Logged in as Qualified Reviewer">
          <div className="user-avatar-circle">OC</div>
          <span className="user-name">Omkarchaithanya R</span>
          <span className="user-caret">⌄</span>
        </div>
      </div>
    </header>
  );
};
