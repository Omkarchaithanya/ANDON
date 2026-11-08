import React, { useState } from 'react';

interface DismissalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

export const DismissalDialog: React.FC<DismissalDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Dismiss Candidate Relationship</h3>
          <p className="page-desc">
            Provide a technical audit reason why this facilities maintenance request is not related to the robot commissioning condition.
          </p>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Audit Log Explanation (Mandatory)</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="e.g. Work is scheduled outside the robot operational path / different sub-bay..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-subtle" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason)}
          >
            {loading ? 'Logging Dismissal...' : 'Confirm Dismissal'}
          </button>
        </div>
      </div>
    </div>
  );
};
