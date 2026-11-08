import React from 'react';

export interface GraphNode {
  label: string;
  type: string;
  refId?: string;
  hasAccess?: boolean;
}

export interface EvidenceThreadProps {
  nodes: GraphNode[];
  ownerName: string;
  isCut?: boolean;
  cutReason?: string;
}

export const EvidenceThread: React.FC<EvidenceThreadProps> = ({
  nodes,
  ownerName,
  isCut = false,
  cutReason,
}) => {
  return (
    <div className="evidence-thread-card" aria-label="Teamwork Graph Provenance Thread">
      <div className="thread-title-bar">
        <span className="thread-heading">🔗 TEAMWORK GRAPH TRAVERSAL THREAD</span>
        <span className="thread-semantics-tag">SEMANTICS: RECORDED CONTEXT ONLY (NOT CAUSAL SUPPORT)</span>
      </div>

      {isCut || nodes.length === 0 ? (
        <div className="thread-cut-container">
          <div className="cut-wire">
            <span className="wire-segment" />
            <span className="cut-spark">⚡ [CUT / EMPTY TRAVERSAL]</span>
            <span className="wire-segment" />
          </div>
          <div className="cut-warning">
            <strong>Unknown: Graph returned nothing.</strong>
            <p>
              {cutReason ||
                'Teamwork Graph returned an empty node list for this site registry traversal. This is not the same as no relationship.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="thread-track">
          <div className="thread-line" />
          <div className="thread-nodes-list">
            {nodes.map((node, index) => (
              <React.Fragment key={index}>
                <div className={`thread-node-item ${node.hasAccess === false ? 'node-restricted' : ''}`}>
                  <div className="node-icon-circle">
                    {node.type === 'site' && '🏢'}
                    {node.type === 'zone' && '📍'}
                    {node.type === 'commissioning' && '📋'}
                    {node.type === 'deployment' && '🤖'}
                    {node.type === 'owner' && '👤'}
                  </div>
                  <div className="node-meta">
                    <span className="node-type-label">{node.type.toUpperCase()}</span>
                    <strong className="node-name">{node.label}</strong>
                    <span className={`perm-chip ${node.hasAccess === false ? 'chip-restricted' : 'chip-verified'}`}>
                      {node.hasAccess === false ? '🔒 RESTRICTED' : '✓ ACCESSIBLE'}
                    </span>
                  </div>
                </div>

                {index < nodes.length - 1 && (
                  <div className="thread-hop-arrow" aria-hidden="true">
                    <span>➔</span>
                  </div>
                )}
              </React.Fragment>
            ))}

            {ownerName && (
              <>
                <div className="thread-hop-arrow" aria-hidden="true">
                  <span>➔</span>
                </div>
                <div className="thread-node-item">
                  <div className="node-icon-circle">👤</div>
                  <div className="node-meta">
                    <span className="node-type-label">DOCUMENT OWNER</span>
                    <strong className="node-name">{ownerName}</strong>
                    <span className="perm-chip chip-verified">✓ GRAPH IDENTITY</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

