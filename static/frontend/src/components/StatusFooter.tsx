import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="andon-status-footer" role="contentinfo">
      <div className="footer-left">
        <span className="footer-powered">
          ▲ ANDON v1.0 • Powered by Atlassian Forge
        </span>
      </div>

      <div className="footer-right">
        <div className="footer-connected-pill">
          <span className="status-live-dot" />
          <span className="status-connected-label">Connected to Atlassian</span>
          <span className="status-divider">|</span>
          <span className="status-env-label">Demo Environment</span>
        </div>
      </div>
    </footer>
  );
};
