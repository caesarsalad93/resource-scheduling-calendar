import type { Event, Panel } from "@shared/schema";

export const EVENT_TYPE_COLORS: Record<string, string> = {
  "Panel Room": "#3b82f6",
  "Autograph Area": "#eab308",
  "Exclusive Signing": "#22c55e",
  "Catering": "#14b8a6",
  "Cart": "#f97316",
  "Media Room": "#a855f7",
  "Exhibit Floor": "#f97316",
  "Show Flow": "#6b7280",
};

export const START_HOUR = 9;
export const END_HOUR = 21;
export const SLOT_MINUTES = 15;
export const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const clamped = Math.max(0, minutes);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// --- TimeBlock: unified type for rendering both panels and events on grids ---

export interface TimeBlock {
  id: string;
  title: string;
  eventType: string | null;
  startTime: string;
  endTime: string;
  panelId: string | null;
  roomId: string | null;
  date: string;
  source: "panel" | "event";
}

export function panelToTimeBlock(panel: Panel): TimeBlock | null {
  if (!panel.date || !panel.startTime || !panel.endTime) return null;
  return {
    id: panel.id,
    title: panel.panelName,
    eventType: "Panel Room",
    startTime: panel.startTime,
    endTime: panel.endTime,
    panelId: panel.id,
    roomId: panel.roomId,
    date: panel.date,
    source: "panel",
  };
}

export function eventToTimeBlock(event: Event): TimeBlock {
  return {
    id: event.id,
    title: event.title,
    eventType: event.eventType,
    startTime: event.startTime,
    endTime: event.endTime,
    panelId: event.panelId,
    roomId: event.roomId,
    date: event.date,
    source: "event",
  };
}

export function getColor(block: { eventType: string | null }): string {
  return EVENT_TYPE_COLORS[block.eventType || ""] || "#6b7280";
}

export interface LayoutBlock {
  block: TimeBlock;
  top: string;
  height: string;
  left: string;
  width: string;
}

const MIN_HEIGHT_MINUTES = 10;

export function layoutEvents(blocks: TimeBlock[]): LayoutBlock[] {
  if (blocks.length === 0) return [];

  const gridStart = START_HOUR * 60;
  const gridDuration = TOTAL_SLOTS * SLOT_MINUTES;

  // Sort by start time ASC, then duration DESC (longer events first for ties)
  const sorted = [...blocks].sort((a, b) => {
    const aStart = timeToMinutes(a.startTime);
    const bStart = timeToMinutes(b.startTime);
    if (aStart !== bStart) return aStart - bStart;
    const aDur = timeToMinutes(a.endTime) - aStart;
    const bDur = timeToMinutes(b.endTime) - bStart;
    return bDur - aDur;
  });

  interface Interval {
    block: TimeBlock;
    start: number;
    end: number;
  }

  const intervals: Interval[] = sorted.map((block) => {
    const start = timeToMinutes(block.startTime);
    const end = Math.max(timeToMinutes(block.endTime), start + MIN_HEIGHT_MINUTES);
    return { block, start, end };
  });

  // Group overlapping events using sweep-line
  const groups: Interval[][] = [];
  let currentGroup: Interval[] = [];
  let groupEnd = -1;

  for (const interval of intervals) {
    if (currentGroup.length === 0 || interval.start < groupEnd) {
      currentGroup.push(interval);
      groupEnd = Math.max(groupEnd, interval.end);
    } else {
      groups.push(currentGroup);
      currentGroup = [interval];
      groupEnd = interval.end;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Assign column indices within each group, then compute CSS
  const result: LayoutBlock[] = [];

  for (const group of groups) {
    const columnEnds: number[] = [];
    const colAssignments: number[] = [];

    for (const interval of group) {
      let placed = false;
      for (let col = 0; col < columnEnds.length; col++) {
        if (interval.start >= columnEnds[col]) {
          columnEnds[col] = interval.end;
          colAssignments.push(col);
          placed = true;
          break;
        }
      }
      if (!placed) {
        colAssignments.push(columnEnds.length);
        columnEnds.push(interval.end);
      }
    }

    const totalCols = columnEnds.length;

    for (let i = 0; i < group.length; i++) {
      const interval = group[i];
      const colIndex = colAssignments[i];

      const topPct = ((interval.start - gridStart) / gridDuration) * 100;
      const rawHeight = ((interval.end - interval.start) / gridDuration) * 100;
      const minHeight = (MIN_HEIGHT_MINUTES / gridDuration) * 100;
      const heightPct = Math.max(rawHeight, minHeight);

      const widthPct = 100 / totalCols;
      const leftPct = colIndex * widthPct;

      result.push({
        block: interval.block,
        top: `${topPct}%`,
        height: `${heightPct}%`,
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
      });
    }
  }

  return result;
}
