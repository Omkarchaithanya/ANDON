import React from 'react';

interface VisibilityWarningProps {
  projectKey: string;
}

export const VisibilityWarning: React.FC<VisibilityWarningProps> = ({ projectKey }) => {
  return (
    <div className="warning-banner">
      <span className="warning-icon">⚠️</span>
      <div className="warning-text">
        <strong>Cross-Team Disclosure Notice:</strong> Creating this follow-up will publish a review request to Jira project <code>{projectKey}</code>. Private source document excerpts are omitted from the ticket payload; only structured scope pointers are shared.
      </div>
    </div>
  );
};

