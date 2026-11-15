/**
 * @file FloorplanDigitalTwinView.tsx
 * @description Dedicated Desktop Digital Twin view implementing 01_facility_management_floorplan_ui_spec.md for ANDON.
 * Features 4-zone spatial shell: Unassigned Assets left sidebar, 60fps Vector Blueprint Canvas,
 * Zone 2 translucent polygon with auto-assigned tooltip, room labels, empty floor map card,
 * and Right contextual properties/troubleshooting drawer.
 */

import React, { useState } from 'react';
import {
  BuildingFloor,
  IoTAsset,
  FloorZone,
  ReasoningTraceItem,
  TechnicianMessage,
  TimeframeFilter,
} from '../types/hybrid-spec';
import { UnassignedAssetsSidebar } from '../components/UnassignedAssetsSidebar';
import { VectorFloorplanMap } from '../components/VectorFloorplanMap';
import { TelemetryTroubleshootingDrawer } from '../components/TelemetryTroubleshootingDrawer';

interface FloorplanDigitalTwinViewProps {
  floor: BuildingFloor;
  unassignedAssets: IoTAsset[];
  selectedAsset: IoTAsset | null;
  selectedZone: FloorZone | null;
  onSelectAsset: (asset: IoTAsset | null) => void;
  onSelectZone: (zone: FloorZone | null) => void;
  onAssignAsset: (asset: IoTAsset, coords: { x: number; y: number }) => void;
  onUpdateZone: (zone: FloorZone) => void;
  onUpdateAsset: (asset: IoTAsset) => void;
  traces: ReasoningTraceItem[];
  technicianMessages: TechnicianMessage[];
  onSendMessage: (text: string, assetId?: string) => void;
  activeTool: 'select' | 'polygon' | 'rect' | 'text';
  onSelectTool?: (tool: 'select' | 'polygon' | 'rect' | 'text') => void;
  onUploadFloorMap?: (blueprintUrl: string) => void;
  onLoadTemplate?: () => void;
  onCreateZone?: (zone: Omit<FloorZone, 'id' | 'floorId' | 'autoAssignedCount'>) => void;
  onUpdateZonePoints?: (zoneId: string, points: Array<{ x: number; y: number }>) => void;
  timeframe?: TimeframeFilter;
}

export const FloorplanDigitalTwinView: React.FC<FloorplanDigitalTwinViewProps> = ({
  floor,
  unassignedAssets,
  selectedAsset,
  selectedZone,
  onSelectAsset,
  onSelectZone,
  onAssignAsset,
  onUpdateZone,
  onUpdateAsset,
  traces,
  technicianMessages,
  onSendMessage,
  activeTool,
  onSelectTool,
  onUploadFloorMap,
  onLoadTemplate,
  onCreateZone,
  onUpdateZonePoints,
  timeframe = 'Today',
}) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* Zone 1: Left Unassigned Assets Sidebar */}
      <UnassignedAssetsSidebar
        unassignedAssets={unassignedAssets}
        onQuickPinAsset={(asset) => onAssignAsset(asset, { x: 500, y: 250 })}
      />

      {/* Zone 2: Central 60fps Vector Floorplan Canvas */}
      <div
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        <VectorFloorplanMap
          floor={floor}
          selectedAsset={selectedAsset}
          selectedZone={selectedZone}
          onSelectAsset={onSelectAsset}
          onSelectZone={onSelectZone}
          onDropAssetOnCanvas={onAssignAsset}
          activeTool={activeTool}
          onSelectTool={onSelectTool}
          onUploadFloorMap={onUploadFloorMap}
          onLoadTemplate={onLoadTemplate}
          onCreateZone={onCreateZone}
          onUpdateZonePoints={onUpdateZonePoints}
        />
      </div>

      {/* Zone 3: Right Contextual Inspector & Troubleshooting Drawer */}
      {drawerOpen && (
        <TelemetryTroubleshootingDrawer
          selectedAsset={selectedAsset}
          selectedZone={selectedZone}
          onUpdateZone={onUpdateZone}
          onUpdateAsset={onUpdateAsset}
          traces={traces}
          technicianMessages={technicianMessages}
          onSendMessage={onSendMessage}
          timeframe={timeframe}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
};
