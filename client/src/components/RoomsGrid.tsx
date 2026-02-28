import { format, addHours, startOfDay } from "date-fns";
import type { Room, Panel, Event } from "@shared/schema";

interface RoomsGridProps {
  rooms: Room[];
  panels: Panel[];
  events: Event[];
  currentDate: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  "Panel Room": "#3b82f6",
  "Autograph Area": "#eab308",
  "Exclusive Signing": "#22c55e",
  "Catering": "#14b8a6",
  "Cart": "#f97316",
  "Media Room": "#a855f7",
  "Exhibit Floor": "#f97316",
  "Show Flow": "#6b7280",
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const START_HOUR = 9;
const END_HOUR = 21;
const SLOT_MINUTES = 15;
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

export function RoomsGrid({ rooms, panels, events, currentDate }: RoomsGridProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  const dayEvents = events.filter((e) => e.date === currentDate);

  const panelMap = new Map(panels.map((p) => [p.id, p]));

  const getEventsForRoom = (roomId: string) =>
    dayEvents.filter((e) => e.roomId === roomId);

  const getEventStyle = (event: Event) => {
    const startMin = timeToMinutes(event.startTime);
    const endMin = timeToMinutes(event.endTime);
    const gridStart = START_HOUR * 60;

    const topPct = ((startMin - gridStart) / (TOTAL_SLOTS * SLOT_MINUTES)) * 100;
    const heightPct = ((endMin - startMin) / (TOTAL_SLOTS * SLOT_MINUTES)) * 100;

    return { top: `${topPct}%`, height: `${heightPct}%` };
  };

  const getColor = (event: Event) =>
    EVENT_TYPE_COLORS[event.eventType || ""] || "#6b7280";

  return (
    <div className="flex-1 overflow-auto print-calendar-grid">
      <div className="min-w-max">
        {/* Header row */}
        <div
          className="grid border-b sticky top-0 bg-background z-10 print:static"
          style={{
            gridTemplateColumns: `var(--grid-time-col, 80px) repeat(${rooms.length}, minmax(var(--grid-col-min, 160px), 1fr))`,
          }}
        >
          <div className="p-3 border-r" />
          {rooms.map((room) => (
            <div key={room.id} className="p-3 border-r">
              <div className="font-medium text-sm truncate">{room.roomName}</div>
              {room.district && (
                <div className="text-xs text-muted-foreground">{room.district}</div>
              )}
            </div>
          ))}
        </div>

        {/* Time grid body */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `var(--grid-time-col, 80px) repeat(${rooms.length}, minmax(var(--grid-col-min, 160px), 1fr))`,
          }}
        >
          {/* Time labels column */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-20 border-b p-1 text-xs text-muted-foreground sticky left-0 bg-background"
              >
                {format(addHours(startOfDay(new Date()), hour), "h a")}
              </div>
            ))}
          </div>

          {/* Room columns */}
          {rooms.map((room) => {
            const roomEvents = getEventsForRoom(room.id);
            return (
              <div key={room.id} className="border-r relative">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div key={hour} className="h-20 border-b" />
                ))}

                {/* Event blocks */}
                {roomEvents.map((event) => {
                  const style = getEventStyle(event);
                  const color = getColor(event);
                  const panel = event.panelId ? panelMap.get(event.panelId) : null;
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded px-2 py-1 text-xs overflow-hidden print-event avoid-page-break"
                      style={{
                        ...style,
                        backgroundColor: color,
                        opacity: 0.9,
                      }}
                    >
                      <div className="font-medium text-white truncate print:text-black">
                        {event.title}
                      </div>
                      <div className="text-white/80 text-[10px] print:text-gray-700">
                        {formatTime(event.startTime)} – {formatTime(event.endTime)}
                      </div>
                      {panel && (
                        <div className="text-white/70 text-[10px] truncate print:text-gray-600">
                          {panel.panelName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
