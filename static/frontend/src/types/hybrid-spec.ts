/**
 * @file hybrid-spec.ts
 * @description Types for Floorplan Digital Twin, ANDON AI Agent Monitoring, and Field Technician PWA.
 */

export type ViewMode = 'unified' | 'floorplan' | 'agent-monitor' | 'field-pwa';
export type ThemeMode = 'dark' | 'light';

export type AgentStatus = 'RUNNING' | 'IDLED' | 'FAILED';
export type AssetStatus = 'Optimal' | 'Needs Attention' | 'In Progress' | 'Normal';
export type AssetCategory = 'Lighting' | 'Other Equipment' | 'Non-Equipment';

export interface AIAgent {
  id: string;
  code: string; // e.g. #750
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  successRate: number; // e.g. 87
  successDelta: number; // e.g. +2.5
  responseTime: number; // e.g. 15.0 (seconds)
  totalRequests: number; // e.g. 750
  assignedZoneId?: string;
  assignedAssetId?: string;
  isPaused?: boolean;
}

export interface FloorZone {
  id: string;
  floorId: string;
  name: string;
  label: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  autoAssignedCount: number;
  assignedAgentId?: string;
  description: string;
  visible: boolean;
}

export interface IoTAsset {
  id: string;
  name: string;
  code: string;
  category: AssetCategory;
  status: AssetStatus;
  roomName: string;
  x: number;
  y: number;
  floorId: string | null; // null if unassigned
  zoneId?: string | null;
  assignedAgentId?: string;
  description: string;
  visible: boolean;
  qrCode: string;
  temperature?: number;
  lastServiced?: string;
}

export interface SvgRoomDefinition {
  id: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BuildingFloor {
  id: string;
  name: string;
  isEmpty: boolean;
  blueprintUrl?: string | null;
  svgRooms?: SvgRoomDefinition[];
  zones: FloorZone[];
  assets: IoTAsset[];
  createdAt?: string;
}

export interface ReasoningTraceItem {
  id: string;
  timestamp: string; // e.g. "13:05"
  type: 'received' | 'parsed' | 'error' | 'filtered' | 'generated' | 'info';
  title: string;
  description?: string;
  agentId?: string;
  isError?: boolean;
  pillColor?: string;
}

export interface TechnicianMessage {
  id: string;
  dateGroup: 'Yesterday' | 'Today';
  author: string;
  avatarColor: string;
  timestamp: string; // e.g. "8:56 PM"
  statusBadge?: 'Needs Attention' | 'In Progress' | 'Optimal' | 'Resolved' | null;
  text: string;
  assetId?: string;
}

export type TimeframeFilter = 'Today' | '7D' | '30D';

export interface TelemetryPoint {
  date: string;
  tokens: number;
  tasks: number;
  errors: number;
}

export interface TelemetrySeries {
  timeframe: TimeframeFilter;
  points: TelemetryPoint[];
  totals: {
    tokensDelta: string;
    tasksDelta: string;
    errorsRate: string;
  };
}

/**
 * Standard Ray-Casting Point-in-Polygon check.
 * Used dynamically whenever a zone polygon is created, dragged, or modified.
 */
export function isPointInPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>
): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
