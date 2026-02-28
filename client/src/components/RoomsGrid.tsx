import { format, addHours, startOfDay } from "date-fns";
import type { Room, Panel, Event } from "@shared/schema";
import {
  START_HOUR,
  END_HOUR,
  formatTime,
  getColor,
  layoutEvents,
} from "@/lib/calendar-utils";

interface RoomsGridProps {
  rooms: Room[];
  panels: Panel[];
  events: Event[];
  currentDate: string;
}

export function RoomsGrid({ rooms, panels, events, currentDate }: RoomsGridProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  const dayEvents = events.filter((e) => e.date === currentDate);

  const panelMap = new Map(panels.map((p) => [p.id, p]));

  const getEventsForRoom = (roomId: string) =>
    dayEvents.filter((e) => e.roomId === roomId);

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
            const laid = layoutEvents(roomEvents);
            return (
              <div key={room.id} className="border-r relative">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div key={hour} className="h-20 border-b" />
                ))}

                {/* Event blocks */}
                {laid.map((item) => {
                  const color = getColor(item.event);
                  const panel = item.event.panelId ? panelMap.get(item.event.panelId) : null;
                  return (
                    <div
                      key={item.event.id}
                      className="absolute rounded px-2 py-1 text-xs overflow-hidden print-event avoid-page-break"
                      style={{
                        top: item.top,
                        height: item.height,
                        left: item.left,
                        width: item.width,
                        backgroundColor: color,
                        opacity: 0.9,
                      }}
                    >
                      <div className="font-medium text-white truncate print:text-black">
                        {item.event.title}
                      </div>
                      <div className="text-white/80 text-[10px] print:text-gray-700">
                        {formatTime(item.event.startTime)} – {formatTime(item.event.endTime)}
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
