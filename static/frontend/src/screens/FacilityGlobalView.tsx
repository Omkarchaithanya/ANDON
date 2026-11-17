import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

interface RegistryCondition {
  id: string;
  attributeName: string;
  attributeValue: string;
  quotedText?: string;
  pageId?: string;
}

interface FacilityZoneRow {
  zoneName: string;
  zoneType?: string;
  deploymentIdentifier: string;
  baselinePageId?: string;
  baselineVersion?: number | string;
  sensorRig?: string;
  conditions?: RegistryCondition[];
}

export const FacilityGlobalView: React.FC = () => {
  const [rows, setRows] = useState<FacilityZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteRegistryPageId, setSiteRegistryPageId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const config: any = await invoke('getAppConfig').catch(() => null);
      setSiteRegistryPageId(config?.siteRegistryPageId || null);

      const registryData: any = await invoke('getSiteRegistry', { pageId: config?.siteRegistryPageId });
      if (registryData && Array.isArray(registryData.rows)) {
        setRows(registryData.rows);
      } else {
        setRows([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to query facility site registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div
      className="facility-global-blueprint-view"
      style={{
        padding: '24px 32px',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* Blueprint Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #DBEAFE',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📐</span>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E3A8A', letterSpacing: '0.3px' }}>
              ANDON Facility Site Blueprint
            </h1>
            <span
              style={{
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              GLOBAL VIEW
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
            Live spatial registry of physical facility zones, autonomous robot deployments, and baseline operating conditions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: '8px 14px',
            backgroundColor: '#1E40AF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Registry'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '13px',
          }}
        >
          <strong>Registry Notice:</strong> {error}
        </div>
      )}

      {/* Blueprint Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '10px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(30, 58, 138, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Confluence Anchor
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', marginTop: '4px' }}>
            {siteRegistryPageId ? `Page ${siteRegistryPageId}` : 'Not Configured'}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            Authoritative site registry page
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '10px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(30, 58, 138, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Registered Zones
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', marginTop: '4px' }}>
            {rows.length} {rows.length === 1 ? 'Zone' : 'Zones'}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            Physical operational sectors
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '10px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(30, 58, 138, 0.05)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Autonomous Deployments
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', marginTop: '4px' }}>
            {rows.filter((r) => r.deploymentIdentifier && r.deploymentIdentifier !== 'Unassigned').length} Active
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            Tracked robotics units in Forge SQL
          </div>
        </div>
      </div>

      {/* Blueprint Zone Grid */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #BFDBFE',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 2px 6px rgba(30, 58, 138, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1E3A8A' }}>
            Facility Operational Zones &amp; Robotics Scope
          </h2>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Source: Forge SQL Relational Registry
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
            Loading live facility registry records...
          </div>
        ) : rows.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#F0F9FF',
              borderRadius: '8px',
              border: '1px dashed #BFDBFE',
              color: '#3B82F6',
            }}
          >
            <strong>No zones registered in Forge SQL yet.</strong>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '6px 0 0 0' }}>
              Configure your Confluence Site Registry Page ID in Administration or register a deployment to populate facility rows.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {rows.map((row, idx) => (
              <div
                key={idx}
                style={{
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderTop: '3px solid #1E40AF',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                      {row.zoneName}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'capitalize' }}>
                      {row.zoneType || 'Operational Aisle'}
                    </span>
                  </div>
                  <span
                    style={{
                      backgroundColor: row.deploymentIdentifier !== 'Unassigned' ? '#DCFCE7' : '#F1F5F9',
                      color: row.deploymentIdentifier !== 'Unassigned' ? '#166534' : '#64748B',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {row.deploymentIdentifier}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                  <div>Sensor Rig: <strong>{row.sensorRig || 'Standard'}</strong></div>
                  {row.baselinePageId && (
                    <div style={{ marginTop: '2px' }}>
                      Baseline Page: <code>{row.baselinePageId} (v{row.baselineVersion || 1})</code>
                    </div>
                  )}
                </div>

                {row.conditions && row.conditions.length > 0 ? (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                      Documented Operating Conditions:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {row.conditions.map((cond, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            color: '#1E40AF',
                          }}
                        >
                          {cond.attributeName}: <strong>{cond.attributeValue}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', marginTop: '6px' }}>
                    No baseline conditions registered
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityGlobalView;
