import React, { useState } from 'react';

interface ConfirmationControlsProps {
  zone: string;
  deployment: string;
  attribute: string;
  currentValue: string;
  proposedValue: string;
  onConfirm: () => void;
  onDismiss: () => void;
  loading: boolean;
}

export const ConfirmationControls: React.FC<ConfirmationControlsProps> = ({
  zone,
  deployment,
  attribute,
  currentValue,
  proposedValue,
  onConfirm,
  onDismiss,
  loading,
}) => {
  const [matchLocation, setMatchLocation] = useState(false);
  const [matchDeployment, setMatchDeployment] = useState(false);
  const [matchAttribute, setMatchAttribute] = useState(false);

  const canConfirm = matchLocation && matchDeployment && matchAttribute && !loading;

  return (
    <div className="checklist-card">
      <h3 className="checklist-title">
        🛡️ Human Verification & Accountability Checklist
      </h3>
      <p className="checklist-desc">
        Before engineering evaluation can proceed, an authorized reviewer must confirm the interaction between this facility request and the robot operating design domain.
      </p>

      <div className="checklist-items">
        <label className="checklist-row">
          <input
            type="checkbox"
            checked={matchLocation}
            onChange={(e) => setMatchLocation(e.target.checked)}
          />
          <div>
            <strong>1. Location Verification:</strong> Confirmed work takes place in <code>{zone}</code>.
          </div>
        </label>

        <label className="checklist-row">
          <input
            type="checkbox"
            checked={matchDeployment}
            onChange={(e) => setMatchDeployment(e.target.checked)}
          />
          <div>
            <strong>2. Deployment Interaction:</strong> Confirmed <code>{deployment}</code> operates within this facility zone.
          </div>
        </label>

        <label className="checklist-row">
          <input
            type="checkbox"
            checked={matchAttribute}
            onChange={(e) => setMatchAttribute(e.target.checked)}
          />
          <div>
            <strong>3. Physical Condition Divergence:</strong> Confirmed planned <code>{attribute}</code> (<em>{proposedValue}</em>) modifies documented baseline (<em>{currentValue}</em>).
          </div>
        </label>
      </div>

      <div className="candidate-footer-actions" style={{ borderTop: '1px solid var(--ds-border-subtle)', paddingTop: '16px' }}>
        <button
          className="btn btn-subtle"
          onClick={onDismiss}
          disabled={loading}
        >
          Dismiss (Not Related)
        </button>

        <button
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          {loading ? 'Evaluating Coverage...' : '✓ Confirm Relationship & Evaluate Coverage →'}
        </button>
      </div>
    </div>
  );
};
