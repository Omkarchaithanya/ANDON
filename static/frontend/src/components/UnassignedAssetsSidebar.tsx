/**
 * @file UnassignedAssetsSidebar.tsx
 * @description Left 270px sidebar with collapsible Unassigned Assets accordion tree.
 * Supports drag-and-drop and click-to-pin onto the vector floorplan map canvas.
 */

import React, { useState } from 'react';
import { AssetCategory, IoTAsset } from '../types/hybrid-spec';

interface UnassignedAssetsSidebarProps {
  unassignedAssets: IoTAsset[];
  onSelectAsset?: (asset: IoTAsset) => void;
  onQuickPinAsset?: (asset: IoTAsset) => void;
}

export const UnassignedAssetsSidebar: React.FC<UnassignedAssetsSidebarProps> = ({
  unassignedAssets,
  onSelectAsset,
  onQuickPinAsset,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    Lighting: false,
    'Other Equipment': false,
    'Non-Equipment': false,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const categories: AssetCategory[] = ['Lighting', 'Other Equipment', 'Non-Equipment'];

  const handleDragStart = (e: React.DragEvent, asset: IoTAsset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      style={{
        width: isSidebarOpen ? 270 : 48,
        minWidth: isSidebarOpen ? 270 : 48,
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          height: 48,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        {isSidebarOpen ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Unassigned Assets
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                {unassignedAssets.length}
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              title="Collapse sidebar"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Expand sidebar"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
              margin: '0 auto',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Accordion Categories Tree */}
      {isSidebarOpen && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          <p
            style={{
              margin: '0 0 10px 6px',
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            Drag an unassigned item onto the floorplan blueprint to pin its spatial node.
          </p>

          {categories.map((category) => {
            const assetsInCat = unassignedAssets.filter((a) => a.category === category);
            const isCollapsed = collapsedCategories[category];

            return (
              <div key={category} style={{ marginBottom: 12 }}>
                {/* Category Header */}
                <div
                  onClick={() => toggleCategory(category)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: 'var(--bg-elevated)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {category}
                    </span>
                  </div>
                  <span
                    className="font-mono"
                    style={{ fontSize: 10, color: 'var(--text-muted)' }}
                  >
                    ({assetsInCat.length})
                  </span>
                </div>

                {/* Category Items */}
                {!isCollapsed && (
                  <div style={{ paddingLeft: 10, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {assetsInCat.map((asset) => (
                      <div
                        key={asset.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, asset)}
                        onClick={() => onSelectAsset && onSelectAsset(asset)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          cursor: 'grab',
                          transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {asset.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onQuickPinAsset) onQuickPinAsset(asset);
                            }}
                            title="Quick-place on Floorplan"
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'var(--accent-primary)',
                              fontSize: 10,
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: '2px 4px',
                            }}
                          >
                            + Pin
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                            {asset.code}
                          </span>
                          <span
                            style={{
                              fontSize: 9.5,
                              padding: '1px 5px',
                              borderRadius: 4,
                              backgroundColor: 'var(--bg-elevated)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {asset.category}
                          </span>
                        </div>
                      </div>
                    ))}
                    {assetsInCat.length === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 6px' }}>
                        No items in this category
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};

