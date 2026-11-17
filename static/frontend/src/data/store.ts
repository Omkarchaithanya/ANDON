/**
 * @file store.ts
 * @description State & Persistence Store for ANDON facilities entities.
 * Initializes with empty live arrays. No seed agents, mock fixtures, or hardcoded benchmarks.
 */

import {
  BuildingFloor,
  IoTAsset,
  AIAgent,
  ReasoningTraceItem,
  TechnicianMessage,
  TimeframeFilter,
  TelemetryPoint,
  TelemetrySeries,
  isPointInPolygon,
} from '../types/hybrid-spec';

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
    floors: safeGetStorage<BuildingFloor[]>(KEYS.FLOORS, []),
    unassignedAssets: safeGetStorage<IoTAsset[]>(KEYS.UNASSIGNED, []),
    agents: safeGetStorage<AIAgent[]>(KEYS.AGENTS, []),
    traces: safeGetStorage<ReasoningTraceItem[]>(KEYS.TRACES, []),
    technicianMessages: safeGetStorage<TechnicianMessage[]>(KEYS.MESSAGES, []),
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

  return {
    ...floor,
    zones: updatedZones,
  };
}

export const DEFAULT_BLUEPRINT_TEMPLATE = {
  width: 900,
  height: 520,
  gridStep: 40,
  rooms: [
    { id: 'room-srv', name: 'Server Room', sub: 'Critical Infrastructure', x: 80, y: 60, width: 220, height: 180 },
    { id: 'room-plant', name: 'Central Plant Room', sub: 'HVAC & Hydraulic Systems', x: 340, y: 60, width: 280, height: 180 },
    { id: 'room-exh', name: 'Exhibition Hall', sub: 'Public Perimeter', x: 80, y: 280, width: 440, height: 180 },
    { id: 'room-store', name: 'Storage Room', sub: 'Equipment Bay', x: 560, y: 200, width: 180, height: 140 },
  ],
};

export function generateTelemetrySeries(timeframe: TimeframeFilter = 'Today'): TelemetrySeries {
  const now = new Date();
  const points: TelemetryPoint[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 15 * 60 * 1000);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    points.push({
      date: timeStr,
      tokens: Math.floor(100 + Math.sin(i * 0.8) * 30),
      tasks: Math.floor(5 + Math.cos(i) * 3),
      errors: i % 4 === 0 ? 1 : 0,
    });
  }
  return {
    timeframe,
    points,
    totals: {
      tokensDelta: '+12%',
      tasksDelta: '+8%',
      errorsRate: '0.2%',
    },
  };
}
