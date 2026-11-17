import React, { useState } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { useReviewState } from '../hooks/useReviewState';

interface ChangeLensProps {
  onSelectCandidate: (candidateId: string) => void;
  onOpenRegistry?: () => void;
}

export const ChangeLens: React.FC<ChangeLensProps> = ({
  onSelectCandidate,
  onOpenRegistry,
}) => {
  const {
    context,
    candidates,
    pipelineTrace,
    registeredZones,
    loading,
    error,
    jiraStatus,
    confluenceStatus,
    graphStatus,
    loadContext,
    triggerDiscovery,
  } = useDiscovery();

  const { dismissCandidate } = useReviewState();
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissModalOpen, setDismissModalOpen] = useState(false);

  const activeCandidate = candidates.length > 0 ? candidates[0] : null;

  // Determine Verdict according to Requirement 4: UNKNOWN, GAP, COVERED, or STALE
  let verdict: 'UNKNOWN' | 'GAP' | 'COVERED' | 'STALE' = 'UNKNOWN';
  const candStatus = (activeCandidate?.status as string) || '';
  if (pipelineTrace?.status === 'STALE' || candStatus === 'STALE') {
    verdict = 'STALE';
  } else if (pipelineTrace?.coverageResult === 'GAP' || candStatus === 'PROSPECTIVE_GAP' || candStatus === 'GAP') {
    verdict = 'GAP';
  } else if (pipelineTrace?.coverageResult === 'COVERED' || candStatus === 'COVERED') {
    verdict = 'COVERED';
  } else {
    verdict = 'UNKNOWN';
  }

  // Requirement 1: If bridge or resolver fails, status pill, location, zone, map label must be "Not loaded"
  const statusPill = error ? 'Not loaded' : verdict;
  const displayLocation = error ? 'Not loaded' : (context?.location || 'Not loaded');
  const displayZone = error ? 'Not loaded' : (activeCandidate?.zoneName || 'Not loaded');
  const mapLabel = error ? 'Not loaded' : (activeCandidate?.zoneName || 'No zone registered');

  // Reason sentence
  let reasonSentence = 'No physical operating-assumption candidate confirmed for this work request.';
  if (error) {
    reasonSentence = 'Forge bridge call could not complete.';
  } else if (pipelineTrace?.reason) {
    reasonSentence = pipelineTrace.reason;
  } else if (activeCandidate?.pipelineReason) {
    reasonSentence = activeCandidate.pipelineReason;
  } else if (verdict === 'GAP') {
    reasonSentence = 'The selected baseline does not establish coverage of the planned condition.';
  } else if (verdict === 'COVERED') {
    reasonSentence = 'The proposed condition is documented within commissioning baseline limits.';
  } else if (verdict === 'STALE') {
    reasonSentence = 'Source records have changed; re-evaluation required.';
  }

  // Quotes for Band 2
  const jiraSentence = !error && (context?.plannedWorkSummary || activeCandidate?.sourceReference);
  const commissioningSentence = !error && (pipelineTrace?.extraction?.quote || (activeCandidate?.currentValue !== 'Not loaded' ? activeCandidate?.currentValue : null));

  // Requirement 5: Check if getSiteRegistry returns a matching zone
  const matchingRegisteredZone = !error && activeCandidate?.zoneName
    ? registeredZones.find((rz: any) => rz.zoneName === activeCandidate.zoneName)
    : null;

  const handleDismissSubmit = async () => {
    if (!activeCandidate || !dismissReason.trim()) return;
    setIsDismissing(true);
    try {
      await dismissCandidate(activeCandidate.id, dismissReason);
      setDismissModalOpen(false);
      setDismissReason('');
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="change-lens-container" aria-label="Change Intake Lens">
      {/* Requirement 1: Single banner when bridge or resolver fails */}
      {error && (
        <div
          className="andon-error-banner"
          role="alert"
          style={{
            background: '#FEE2E2',
            border: '1px solid #F87171',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
          }}
        >
          <div>
            <strong>Platform Error:</strong> {error}
          </div>
          <button
            className="btn btn-outline-subtle btn-sm"
            onClick={() => loadContext()}
            style={{ marginLeft: '12px', flexShrink: 0 }}
          >
            ↻ Retry
          </button>
        </div>
      )}

      {/* ==============================================================
          BAND 1: Verdict (UNKNOWN, GAP, COVERED, or STALE) + Issue Key + One Reason Sentence
          ============================================================== */}
      <section className="andon-card verdict-band" style={{ marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                padding: '4px 10px',
                borderRadius: '6px',
                background:
                  statusPill === 'Not loaded'
                    ? '#F3F4F6'
                    : verdict === 'GAP'
                    ? '#FEE2E2'
                    : verdict === 'COVERED'
                    ? '#DCFCE7'
                    : verdict === 'STALE'
                    ? '#FEF3C7'
                    : '#F1F5F9',
                color:
                  statusPill === 'Not loaded'
                    ? '#6B7280'
                    : verdict === 'GAP'
                    ? '#DC2626'
                    : verdict === 'COVERED'
                    ? '#16A34A'
                    : verdict === 'STALE'
                    ? '#D97706'
                    : '#475569',
                border: '1px solid currentColor',
              }}
            >
              {statusPill}
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#2563EB',
                fontFamily: 'monospace',
                background: '#EFF6FF',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #BFDBFE',
              }}
            >
              {context?.issueKey || (error ? 'Not loaded' : 'UNKNOWN')}
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={triggerDiscovery}
            disabled={loading || !context?.issueKey}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading || !context?.issueKey ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Running Discovery...' : 'Run Discovery ➔'}
          </button>
        </div>

        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1F2937', fontWeight: 500, lineHeight: 1.5 }}>
          {reasonSentence}
        </p>

        <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: '#6B7280', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
          <div>Location: <strong style={{ color: '#1F2937' }}>{displayLocation}</strong></div>
          <div>Zone: <strong style={{ color: '#1F2937' }}>{displayZone}</strong></div>
          <div>Deployment: <strong style={{ color: '#1F2937' }}>{error ? 'Not loaded' : (activeCandidate?.deploymentIdentifier || 'Not loaded')}</strong></div>
        </div>
      </section>

      {/* ==============================================================
          BAND 2: Two Quotes (Jira Sentence vs Commissioning Sentence)
          Empty side is hatched, not a fake map label.
          ============================================================== */}
      <section className="andon-card quotes-band" style={{ marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            Evidence Quotes: Work Request vs. Commissioning Baseline
          </h3>
          {activeCandidate && (
            <button
              className="btn btn-outline-subtle btn-sm"
              onClick={() => onSelectCandidate(activeCandidate.id)}
              style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: 600 }}
            >
              Inspect Evidence Redline ➔
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Quote 1: Jira Work Request */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px' }}>
              Jira Work Request ({context?.issueKey || (error ? 'Not loaded' : 'Source')})
            </div>
            {jiraSentence ? (
              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#1F2937',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                "{jiraSentence}"
              </div>
            ) : (
              <div
                className="hatched-empty-quote"
                style={{
                  background: 'repeating-linear-gradient(45deg, #F9FAFB, #F9FAFB 10px, #F3F4F6 10px, #F3F4F6 20px)',
                  border: '1px dashed #D1D5DB',
                  borderRadius: '6px',
                  padding: '16px 14px',
                  fontSize: '12px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {error ? 'Not loaded' : 'No Jira statement available'}
              </div>
            )}
          </div>

          {/* Quote 2: Commissioning Baseline */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px' }}>
              Confluence Commissioning Baseline
            </div>
            {commissioningSentence ? (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#166534',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                "{commissioningSentence}"
              </div>
            ) : (
              <div
                className="hatched-empty-quote"
                style={{
                  background: 'repeating-linear-gradient(45deg, #F9FAFB, #F9FAFB 10px, #F3F4F6 10px, #F3F4F6 20px)',
                  border: '1px dashed #D1D5DB',
                  borderRadius: '6px',
                  padding: '16px 14px',
                  fontSize: '12px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {error ? 'Not loaded' : 'No baseline quote recorded'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==============================================================
          BAND 3: Five-Step Trace (INTAKE, CONTEXT, GROUND, COMPARE, PACKAGE)
          Filled only from runDiscovery payload, including model name or error.
          Do not claim LLM ran on localhost without bridge.
          ============================================================== */}
      <section className="andon-card trace-band" style={{ marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            Five-Step Pipeline Trace
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: '4px',
              background: pipelineTrace?.model ? '#EFF6FF' : '#F3F4F6',
              color: pipelineTrace?.model ? '#2563EB' : '#6B7280',
              border: '1px solid #E5E7EB',
            }}
          >
            Model: {pipelineTrace?.model || 'Not run (no resolver execution)'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '12px' }}>
          {/* 1. INTAKE */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>1. INTAKE</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: pipelineTrace?.extraction ? '#16A34A' : '#6B7280' }}>
                {pipelineTrace ? (pipelineTrace.extraction ? '✓ Extracted' : 'Failed') : 'Not run'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              {pipelineTrace?.extraction
                ? `${pipelineTrace.extraction.attribute || 'Attr'}: ${pipelineTrace.extraction.proposedValue || 'Val'}`
                : 'Semantic proposal'}
            </div>
          </div>

          {/* 2. CONTEXT */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>2. CONTEXT</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: pipelineTrace && pipelineTrace.linkedPageCount > 0 ? '#16A34A' : '#6B7280' }}>
                {pipelineTrace ? (pipelineTrace.linkedPageCount > 0 ? `✓ ${pipelineTrace.linkedPageCount} Pages` : '0 Pages') : 'Not run'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              Teamwork Graph
            </div>
          </div>

          {/* 3. GROUND */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>3. GROUND</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: pipelineTrace?.quoteVerified ? '#16A34A' : '#6B7280' }}>
                {pipelineTrace ? (pipelineTrace.quoteVerified ? '✓ Verified' : 'Failed') : 'Not run'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              NFKC Substring
            </div>
          </div>

          {/* 4. COMPARE */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>4. COMPARE</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: pipelineTrace?.coverageResult ? '#16A34A' : '#6B7280' }}>
                {pipelineTrace?.coverageResult || 'Not run'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              Scope Comparator
            </div>
          </div>

          {/* 5. PACKAGE */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>5. PACKAGE</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: pipelineTrace?.changeIntentId ? '#16A34A' : '#6B7280' }}>
                {pipelineTrace ? (pipelineTrace.changeIntentId ? '✓ Packaged' : 'Pending') : 'Not run'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              Review Gate
            </div>
          </div>
        </div>

        {pipelineTrace?.reason && (
          <div
            style={{
              fontSize: '11.5px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: pipelineTrace.status === 'COMPLETED' ? '#DCFCE7' : '#FEE2E2',
              color: pipelineTrace.status === 'COMPLETED' ? '#166534' : '#991B1B',
            }}
          >
            <strong>Trace Outcome ({pipelineTrace.stepReached}):</strong> {pipelineTrace.reason}
          </div>
        )}
      </section>

      {/* ==============================================================
          REQUIREMENT 5: Zone Outline only when getSiteRegistry returns one.
          Otherwise say "No zone registered" and link to Admin.
          ============================================================== */}
      <section className="andon-card zone-outline-band" style={{ marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: matchingRegisteredZone ? '12px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Registered Facility Zone:</span>
            <span style={{ fontSize: '13px', color: matchingRegisteredZone ? '#111827' : '#6B7280', fontWeight: matchingRegisteredZone ? 600 : 400 }}>
              {matchingRegisteredZone ? matchingRegisteredZone.zoneName : mapLabel}
            </span>
          </div>
          {onOpenRegistry && (
            <button
              className="btn btn-outline-subtle btn-sm"
              onClick={onOpenRegistry}
              style={{ fontSize: '11.5px', color: '#2563EB' }}
            >
              Open Site Registry Settings ➔
            </button>
          )}
        </div>

        {matchingRegisteredZone ? (
          <div style={{ marginTop: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
            <svg viewBox="0 0 400 100" style={{ width: '100%', height: '80px', display: 'block' }}>
              <rect x="10" y="10" width="380" height="80" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
              <text x="200" y="45" textAnchor="middle" fill="#1E40AF" fontSize="13" fontWeight="700">
                {matchingRegisteredZone.zoneName}
              </text>
              <text x="200" y="68" textAnchor="middle" fill="#6B7280" fontSize="10">
                Deployment: {matchingRegisteredZone.deploymentIdentifier || 'Unassigned'} • Sensor Rig: {matchingRegisteredZone.sensorRig || 'Standard'}
              </text>
            </svg>
          </div>
        ) : (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
            No geometric zone outline is registered in Forge SQL for this location. Link to Admin to add or configure facility zones.
          </div>
        )}
      </section>

      {/* ==============================================================
          REQUIREMENT 3: Evidence Freshness
          May say Verified only after a successful response. A failed call is Failed.
          ============================================================== */}
      <section className="andon-card freshness-band" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px 20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Evidence Freshness &amp; Integration Health
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '8px 12px', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '12px', color: '#374151' }}>Jira Context</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: jiraStatus === 'Verified' ? '#16A34A' : jiraStatus === 'Failed' ? '#DC2626' : '#6B7280' }}>
              {jiraStatus}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '8px 12px', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '12px', color: '#374151' }}>Confluence Baseline</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: confluenceStatus === 'Verified' ? '#16A34A' : confluenceStatus === 'Failed' ? '#DC2626' : '#6B7280' }}>
              {confluenceStatus}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '8px 12px', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '12px', color: '#374151' }}>Teamwork Graph</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: graphStatus === 'Verified' ? '#16A34A' : graphStatus === 'Failed' ? '#DC2626' : '#6B7280' }}>
              {graphStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Dismissal Dialog Modal */}
      {dismissModalOpen && activeCandidate && (
        <div className="andon-modal-overlay" role="dialog" aria-modal="true">
          <div className="andon-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Dismiss Candidate Relationship</h3>
              <button className="modal-close-btn" onClick={() => setDismissModalOpen(false)}>
                ✕
              </button>
            </div>
            <p className="modal-description">
              Provide an engineering justification for why this work request does not affect {activeCandidate.deployment || 'the robot'}.
            </p>
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="e.g. Work is restricted to overhead area."
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn btn-outline-subtle"
                onClick={() => setDismissModalOpen(false)}
                disabled={isDismissing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDismissSubmit}
                disabled={isDismissing || !dismissReason.trim()}
              >
                {isDismissing ? 'Recording...' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
