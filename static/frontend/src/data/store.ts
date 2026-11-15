/**
 * @file store.ts
 * @description Unified Reactive State & Persistence Engine for ANDON.
 * Connects the 6 relational entities: Floors, Zones, IoT Assets, AI Agents,
 * TelemetrySeries, and Activity/Reasoning Traces with localStorage persistence.
 */

import {
  BuildingFloor,
  IoTAsset,
  AIAgent,
  ReasoningTraceItem,
  TechnicianMessage,
  TimeframeFilter,
  TelemetrySeries,
  isPointInPolygon,
} from '../types/hybrid-spec';
import {
  INITIAL_FLOORS,
  INITIAL_AGENTS,
  UNASSIGNED_ASSETS,
  INITIAL_REASONING_TRACES,
  INITIAL_TECHNICIAN_MESSAGES,
} from './facility-data';

// Storage keys
const STORAGE_PREFIX = 'andon_v2_';
const KEYS = {
  FLOORS: `${STORAGE_PREFIX}floors`,
  UNASSIGNED: `${STORAGE_PREFIX}unassigned`,
  AGENTS: `${STORAGE_PREFIX}agents`,
  TRACES: `${STORAGE_PREFIX}traces`,
  MESSAGES: `${STORAGE_PREFIX}messages`,
  TIMEFRAME: `${STORAGE_PREFIX}timeframe`,
};

function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSetStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`Failed to persist key ${key}:`, err);
  }
}

export interface AndonStoreState {
  floors: BuildingFloor[];
  unassignedAssets: IoTAsset[];
  agents: AIAgent[];
  traces: ReasoningTraceItem[];
  technicianMessages: TechnicianMessage[];
  timeframe: TimeframeFilter;
}

export function loadInitialStoreState(): AndonStoreState {
  return {
    floors: safeGetStorage<BuildingFloor[]>(KEYS.FLOORS, INITIAL_FLOORS),
    unassignedAssets: safeGetStorage<IoTAsset[]>(KEYS.UNASSIGNED, UNASSIGNED_ASSETS),
    agents: safeGetStorage<AIAgent[]>(KEYS.AGENTS, INITIAL_AGENTS),
    traces: safeGetStorage<ReasoningTraceItem[]>(KEYS.TRACES, INITIAL_REASONING_TRACES),
    technicianMessages: safeGetStorage<TechnicianMessage[]>(
      KEYS.MESSAGES,
      INITIAL_TECHNICIAN_MESSAGES
    ),
    timeframe: safeGetStorage<TimeframeFilter>(KEYS.TIMEFRAME, 'Today'),
  };
}

export function saveEntireStore(state: AndonStoreState): void {
  safeSetStorage(KEYS.FLOORS, state.floors);
  safeSetStorage(KEYS.UNASSIGNED, state.unassignedAssets);
  safeSetStorage(KEYS.AGENTS, state.agents);
  safeSetStorage(KEYS.TRACES, state.traces);
  safeSetStorage(KEYS.MESSAGES, state.technicianMessages);
  safeSetStorage(KEYS.TIMEFRAME, state.timeframe);
}

/**
 * Recalculate auto-assigned count for all zones on a floor based on point-in-polygon math.
 */
export function recalculateFloorZoneAssignments(floor: BuildingFloor): BuildingFloor {
  const updatedZones = floor.zones.map((zone) => {
    const assetsInside = floor.assets.filter(
      (a) => a.visible !== false && isPointInPolygon({ x: a.x, y: a.y }, zone.points)
    );
    return {
      ...zone,
      autoAssignedCount: assetsInside.length,
    };
  });

  // Assign zoneId to assets
  const updatedAssets = floor.assets.map((asset) => {
    const containingZone = updatedZones.find((z) =>
      isPointInPolygon({ x: asset.x, y: asset.y }, z.points)
    );
    return {
      ...asset,
      zoneId: containingZone ? containingZone.id : null,
    };
  });

  return {
    ...floor,
    zones: updatedZones,
    assets: updatedAssets,
  };
}

/**
 * Generate dynamic step-line telemetry series based on active timeframe and agent state.
 */
export function generateTelemetrySeries(
  timeframe: TimeframeFilter,
  selectedAgent?: AIAgent | null
): TelemetrySeries {
  let points = [
    { date: '01', tokens: 45, tasks: 8, errors: 1 },
    { date: '05', tokens: 68, tasks: 12, errors: 2 },
    { date: '06', tokens: 150, tasks: 24, errors: 0 },
    { date: '07', tokens: 92, tasks: 16, errors: 1 },
    { date: '11', tokens: 110, tasks: 19, errors: 1 },
  ];

  if (timeframe === '7D') {
    points = [
      { date: 'Mon', tokens: 75, tasks: 14, errors: 2 },
      { date: 'Tue', tokens: 110, tasks: 18, errors: 1 },
      { date: 'Wed', tokens: 165, tasks: 26, errors: 0 },
      { date: 'Thu', tokens: 140, tasks: 22, errors: 1 },
      { date: 'Fri', tokens: 195, tasks: 31, errors: 3 },
      { date: 'Sat', tokens: 85, tasks: 12, errors: 0 },
      { date: 'Sun', tokens: 95, tasks: 15, errors: 1 },
    ];
  } else if (timeframe === '30D') {
    points = [
      { date: 'W1', tokens: 420, tasks: 85, errors: 6 },
      { date: 'W2', tokens: 680, tasks: 124, errors: 4 },
      { date: 'W3', tokens: 910, tasks: 188, errors: 8 },
      { date: 'W4', tokens: 780, tasks: 160, errors: 5 },
    ];
  }

  // Adjust if specific agent selected
  if (selectedAgent) {
    const scale = selectedAgent.status === 'RUNNING' ? 1.2 : selectedAgent.status === 'FAILED' ? 0.6 : 0.8;
    points = points.map((p) => ({
      ...p,
      tokens: Math.round(p.tokens * scale),
      tasks: Math.round(p.tasks * scale),
    }));
  }

  return {
    timeframe,
    points,
    totals: {
      tokensDelta: '+75',
      tasksDelta: '-10',
      errorsRate: '5%',
    },
  };
}

/**
 * Standard default SVG blueprint template for newly created or initialized floors.
 */
export const DEFAULT_BLUEPRINT_TEMPLATE = {
  svgRooms: [
    { id: 'room-exh', name: 'Exhibition space', sub: 'Ambient Gallery (142 m²)', x: 180, y: 180, width: 220, height: 160 },
    { id: 'room-bike', name: 'Bike parking', sub: 'Commuter Bay', x: 180, y: 80, width: 110, height: 100 },
    { id: 'room-clean', name: "Cleaner's Cupboard", sub: 'Supply Hub', x: 290, y: 80, width: 110, height: 100 },
    { id: 'room-bar', name: 'Bar back of house', sub: 'Catering Node', x: 400, y: 80, width: 160, height: 120 },
    { id: 'room-server', name: 'Server Room', sub: 'High Density (18°C)', x: 560, y: 80, width: 180, height: 120 },
    { id: 'room-plant', name: 'Plant Room', sub: 'Primary Pumps & AHU', x: 400, y: 200, width: 160, height: 140 },
    { id: 'room-store', name: 'Storage Room', sub: 'Equipment Bay', x: 560, y: 200, width: 180, height: 140 },
  ],
};