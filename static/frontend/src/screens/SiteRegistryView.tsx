import React from 'react';

interface SiteRegistryViewProps {
  onBack: () => void;
}

export const SiteRegistryView: React.FC<SiteRegistryViewProps> = ({ onBack }) => {
  return (
    <div className="site-registry-view" aria-label="Site Registry View">
      <div className="redline-top-action-bar">
        <button className="btn btn-outline-subtle btn-sm" onClick={onBack}>
          ← Back to Change Intake Lens
        </button>
        <div className="redline-header-titles">
          <h2 className="redline-main-title">Facility Site Registry (Page 10482)</h2>
          <p className="redline-main-subtitle">
            Registered physical zones, autonomous mobile robot deployments, and sensor baselines
          </p>
        </div>
      </div>

      <div className="andon-card" style={{ marginBottom: '20px' }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="header-icon">🏢</span>
            <h3 className="card-heading">Facility Alpha Registry Anchor</h3>
          </div>
          <span className="jira-key-pill">Confluence Page 10482</span>
        </div>

        <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 16px 0' }}>
          Authoritative anchor for Teamwork Graph traversal. Maps facilities zones to robot deployments and commissioning documentation.
        </p>

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
              <tr style={{ background: '#FFF7ED' }}>
                <td><strong>Aisle 7</strong></td>
                <td>Production Logistics Aisle</td>
                <td><strong style={{ color: '#EA580C' }}>AMR-12</strong></td>
                <td>Confluence Page 10483 rev 3</td>
                <td>Camera Config C4</td>
              </tr>
              <tr>
                <td><strong>Aisle 5</strong></td>
                <td>Inventory Storage</td>
                <td>AMR-08</td>
                <td>Confluence Page 10480 rev 1</td>
                <td>Standard LiDAR Rig</td>
              </tr>
              <tr>
                <td><strong>Aisle 6</strong></td>
                <td>Inventory Storage</td>
                <td>AMR-09</td>
                <td>Confluence Page 10481 rev 2</td>
                <td>Standard LiDAR Rig</td>
              </tr>
              <tr>
                <td><strong>Aisle 8</strong></td>
                <td>Palletizing Buffer</td>
                <td>AMR-14</td>
                <td>Confluence Page 10485 rev 1</td>
                <td>Camera Config C2</td>
              </tr>
              <tr>
                <td><strong>Staging Area</strong></td>
                <td>Loading &amp; Dispatch Dock</td>
                <td>AMR-12, AMR-14</td>
                <td>Confluence Page 10486 rev 4</td>
                <td>Dual Optical System</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

