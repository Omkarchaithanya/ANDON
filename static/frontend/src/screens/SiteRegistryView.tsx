import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

interface SiteRegistryViewProps {
  onBack: () => void;
}

interface RegistryRow {
  zoneName: string;
  zoneType?: string;
  deploymentIdentifier: string;
  baselinePageId?: string;
  baselineVersion?: number | string;
  sensorRig?: string;
}

export const SiteRegistryView: React.FC<SiteRegistryViewProps> = ({ onBack }) => {
  const [siteRegistryPageId, setSiteRegistryPageId] = useState<string | null>(null);
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRegistry() {
      setLoading(true);
      setError(null);
      try {
        const config: any = await invoke('getAppConfig');
        const pageId = config?.siteRegistryPageId;
        setSiteRegistryPageId(pageId || null);

        if (pageId) {
          const registryData: any = await invoke('getSiteRegistry', { pageId }).catch(() => null);
          if (registryData && Array.isArray(registryData.rows)) {
            setRows(registryData.rows);
          } else {
            setRows([]);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load site registry.');
      } finally {
        setLoading(false);
      }
    }
    loadRegistry();
  }, []);

  return (
    <div className="site-registry-view" aria-label="Site Registry View">
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Change Intake Lens
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">
            Facility Site Registry {siteRegistryPageId ? `(Page ${siteRegistryPageId})` : '(Unconfigured)'}
          </h2>
          <p className="redline-main-subtitle">
            Registered physical zones, autonomous mobile robot deployments, and sensor baselines
          </p>
        </div>
      </div>

      {error && (
        <div className="redline-alert-box alert-error" style={{ marginBottom: '16px' }}>
          <strong>Notice:</strong> {error}
        </div>
      )}

      <div className="andon-card" style={{ marginBottom: '20px' }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="header-icon">🏢</span>
            <h3 className="card-heading">Facility Site Registry Anchor</h3>
          </div>
          {siteRegistryPageId ? (
            <span className="jira-key-pill">Confluence Page {siteRegistryPageId}</span>
          ) : (
            <span className="badge-gap">NOT CONFIGURED</span>
          )}
        </div>

        <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 16px 0' }}>
          Authoritative anchor for Teamwork Graph traversal. Maps facilities zones to robot deployments and commissioning documentation.
        </p>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
            Loading site registry records...
          </div>
        ) : !siteRegistryPageId ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
            <strong>No Site Registry Page Configured.</strong>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>
              Please set the Confluence Site Registry Page ID in Administration settings to map facility zones.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
            <strong>No registered zones or robot deployments found in Confluence Page {siteRegistryPageId}.</strong>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>
              Add a markdown table or page links in the Confluence registry page to establish coverage baselines.
            </p>
          </div>
        ) : (
          <div className="coverage-breakdown-table-wrap">
            <table className="coverage-table">
              <thead>
                <tr>
                  <th>ZONE IDENTIFIER</th>
                  <th>ZONE TYPE</th>
                  <th>DEPLOYMENT</th>
                  <th>ACTIVE BASELINE</th>
                  <th>ODD SENSOR RIG</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.zoneName}</strong></td>
                    <td>{row.zoneType || 'General Zone'}</td>
                    <td><strong>{row.deploymentIdentifier}</strong></td>
                    <td>
                      {row.baselinePageId ? `Confluence Page ${row.baselinePageId} rev ${row.baselineVersion || 1}` : 'None'}
                    </td>
                    <td>{row.sensorRig || 'Standard'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteRegistryView;
