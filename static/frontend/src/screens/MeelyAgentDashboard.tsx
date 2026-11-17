/**
 * @file MeelyAgentDashboard.tsx
 * @description Pure implementation of 02_meely_ai_agent_monitoring_dashboard_ui_spec.md for ANDON.
 * Features:
 * - 3D particle constellation sphere cards with live pause/resume and diagnostic execution
 * - Run Diagnostic Task action streaming real execution steps into the Reasoning Trace
 * - Agents Health Status Table with interactive Timeframe filter (Today, 7D, 30D)
 * - Map location cross-linking and real-time search filtering
 */

import React from 'react';
import { AIAgent, TimeframeFilter } from '../types/hybrid-spec';
import { CanvasParticleSphere } from '../components/CanvasParticleSphere';

interface MeelyAgentDashboardProps {
  agents: AIAgent[];
  onTogglePauseAgent: (agentId: string) => void;
  onRunDiagnostic?: (agentId: string) => void;
  onSelectAgent?: (agent: AIAgent) => void;
  selectedAgentId?: string;
  timeframe?: TimeframeFilter;
  onTimeframeChange?: (timeframe: TimeframeFilter) => void;
  searchQuery?: string;
}

export const MeelyAgentDashboard: React.FC<MeelyAgentDashboardProps> = ({
  agents,
  onTogglePauseAgent,
  onRunDiagnostic,
  onSelectAgent,
  selectedAgentId,
  timeframe = 'Today',
  onTimeframeChange,
  searchQuery = '',
}) => {
  // Filter agents by search query if present
  const filteredAgents = searchQuery.trim()
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : agents;

  const featuredAgent = filteredAgents.find((a) => a.code === '#750') || filteredAgents[0] || agents[0];
  const idledAgent = filteredAgents.find((a) => a.code === '#420') || filteredAgents[1] || agents[1];
  const failedAgent = filteredAgents.find((a) => a.code === '#908') || filteredAgents[2] || agents[2];

  // Helper to render radial progress circle gauge in SVG
  const renderRadialGauge = (percent: number, color: string) => {
    const radius = 14;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (percent / 100) * circ;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 34, height: 34 }}>
          <svg width="34" height="34" viewBox="0 0 34 34">
            <circle cx="17" cy="17" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
            <circle
              cx="17"
              cy="17"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 17 17)"
            />
          </svg>
        </div>
        <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {percent}%
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* ======================================================== */}
      {/* UPPER HERO GRID: ACTIVE AGENTS BENTO                     */}
      {/* ======================================================== */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Active AI Agents
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Autonomous Observability, Telemetry & Robotic Diagnostics
            </p>
          </div>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            CLUSTER 04 // {agents.length} RUNTIMES DEPLOYED
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(420px, 1.35fr) 1fr 1fr',
            gap: 18,
          }}
        >
          {/* 1. Featured Agent Card — Autonomous Logistics Navigator (#750) */}
          {featuredAgent && (
            <div
              className="glass-panel"
              style={{
                padding: '20px 22px',
                borderRadius: 16,
                border: '1px solid var(--border-glow-cyan)',
                boxShadow: 'var(--accent-cyan-glow)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  'radial-gradient(circle at 20% 30%, rgba(0, 242, 254, 0.12), transparent 70%), var(--bg-surface-glass)',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      backgroundColor:
                        featuredAgent.status === 'RUNNING'
                          ? 'rgba(0, 242, 254, 0.15)'
                          : 'rgba(156, 163, 175, 0.15)',
                      color:
                        featuredAgent.status === 'RUNNING'
                          ? 'var(--accent-cyan)'
                          : 'var(--text-muted)',
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor:
                          featuredAgent.status === 'RUNNING'
                            ? 'var(--accent-cyan)'
                            : 'var(--text-muted)',
                        boxShadow:
                          featuredAgent.status === 'RUNNING'
                            ? '0 0 6px var(--accent-cyan)'
                            : 'none',
                      }}
                    />
                    {featuredAgent.status}
                  </span>
                </div>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {featuredAgent.code}
                </span>
              </div>

              {/* Core Body with 3D Rotating Constellation Sphere & KPI stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '14px 0' }}>
                <CanvasParticleSphere status={featuredAgent.status} size={118} isPaused={featuredAgent.isPaused} />

                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                        {featuredAgent.successRate}%
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--accent-teal-success)',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        +{featuredAgent.successDelta}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Performance
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                      {featuredAgent.responseTime.toFixed(1)}s
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Response time
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {featuredAgent.name}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {featuredAgent.description}
                </p>
              </div>

              {/* Control Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 242, 254, 0.2)',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    ● LIVE
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
                    {[12, 18, 8, 22, 14, 20].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          width: 2.5,
                          height: featuredAgent.isPaused ? 4 : h,
                          backgroundColor: 'var(--accent-cyan)',
                          borderRadius: 1,
                          transition: 'height 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {onRunDiagnostic && (
                    <button
                      onClick={() => onRunDiagnostic(featuredAgent.id)}
                      title="Dispatch multi-step diagnostic workflow"
                      style={{
                        border: '1px solid var(--border-glow-cyan)',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        color: 'var(--accent-cyan)',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Run Task
                    </button>
                  )}
                  <button
                    onClick={() => onTogglePauseAgent(featuredAgent.id)}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {featuredAgent.isPaused ? '▶ Resume' : '|| Pause'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Idled Agent Card — Task Planner (#420) */}
          {idledAgent && (
            <div
              className="glass-panel"
              style={{
                padding: '20px 22px',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  ● {idledAgent.status}
                </span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {idledAgent.code}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
                <CanvasParticleSphere status={idledAgent.status} size={88} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {idledAgent.successRate}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {idledAgent.responseTime.toFixed(1)}s response
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {idledAgent.name}
                </h3>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {idledAgent.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {onRunDiagnostic && (
                  <button
                    onClick={() => onRunDiagnostic(idledAgent.id)}
                    style={{
                      flex: 1,
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--accent-primary)',
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Run Task
                  </button>
                )}
                <button
                  onClick={() => onTogglePauseAgent(idledAgent.id)}
                  style={{
                    flex: 1,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    padding: '7px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {idledAgent.isPaused ? '▶ Resume' : '|| Pause'}
                </button>
              </div>
            </div>
          )}

          {/* 3. Failed Agent Card — Social Scheduler (#908) */}
          {failedAgent && (
            <div
              className="glass-panel"
              style={{
                padding: '20px 22px',
                borderRadius: 16,
                border: '1px solid var(--border-glow-orange)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  'radial-gradient(circle at 20% 30%, rgba(255, 87, 51, 0.12), transparent 70%), var(--bg-surface-glass)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(255, 87, 51, 0.15)',
                    color: 'var(--accent-orange)',
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  ● {failedAgent.status}
                </span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {failedAgent.code}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
                <CanvasParticleSphere status={failedAgent.status} size={88} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-orange)' }}>
                    {failedAgent.successRate}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--status-danger-text)' }}>
                    {failedAgent.responseTime.toFixed(1)}s (Timeout)
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {failedAgent.name}
                </h3>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {failedAgent.description}
                </p>
              </div>

              <button
                onClick={() => {
                  if (onRunDiagnostic) onRunDiagnostic(failedAgent.id);
                  else onTogglePauseAgent(failedAgent.id);
                }}
                style={{
                  marginTop: 14,
                  border: '1px solid var(--status-danger-text)',
                  backgroundColor: 'var(--status-danger-bg)',
                  color: 'var(--status-danger-text)',
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Restart Diagnostics
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* LOWER SECTION: AGENTS HEALTH STATUS TABLE                */}
      {/* ======================================================== */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Agents Health Status
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              Live telemetry and compute cost attribution across autonomous facility agents
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={timeframe}
              onChange={(e) => {
                if (onTimeframeChange) {
                  onTimeframeChange(e.target.value as TimeframeFilter);
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="Today">Today ▼</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* The Telemetry Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="font-mono" style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  AGENT
                </th>
                <th className="font-mono" style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  SUCCESS
                </th>
                <th className="font-mono" style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  REQUESTS
                </th>
                <th className="font-mono" style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  RESPONSE
                </th>
                <th className="font-mono" style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  COST
                </th>
                <th className="font-mono" style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                let gaugeColor = 'var(--accent-cyan)';
                if (agent.status === 'FAILED') gaugeColor = 'var(--accent-orange)';
                if (agent.status === 'IDLED') gaugeColor = 'var(--text-secondary)';

                return (
                  <tr
                    key={agent.id}
                    onClick={() => onSelectAgent && onSelectAgent(agent)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor:
                              agent.status === 'RUNNING'
                                ? 'var(--accent-cyan)'
                                : agent.status === 'FAILED'
                                ? 'var(--accent-orange)'
                                : 'var(--text-muted)',
                          }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {agent.name}
                          </div>
                          <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                            {agent.code} // {agent.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px' }}>
                      {renderRadialGauge(agent.successRate, gaugeColor)}
                    </td>

                    <td className="font-mono" style={{ padding: '14px', fontSize: 12.5, color: 'var(--text-primary)' }}>
                      {agent.totalRequests}
                    </td>

                    <td className="font-mono" style={{ padding: '14px', fontSize: 12.5, color: 'var(--text-primary)' }}>
                      {agent.responseTime.toFixed(1)}s
                    </td>

                    <td className="font-mono" style={{ padding: '14px', fontSize: 12.5, color: 'var(--accent-teal)' }}>
                      Standard
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectAgent) onSelectAgent(agent);
                        }}
                        style={{
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
