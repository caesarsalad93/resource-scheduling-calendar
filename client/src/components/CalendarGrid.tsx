import { format, addHours, startOfDay } from "date-fns";
import type { Panel, Room, Event, Volunteer, VolunteerPanel } from "@shared/schema";
import {
  START_HOUR,
  END_HOUR,
  formatTime,
  getColor,
  layoutEvents,
  panelToTimeBlock,
  eventToTimeBlock,
  timeToMinutes,
  mergeShowFlowBlocks,
  type TimeBlock,
} from "@/lib/calendar-utils";

interface CalendarGridProps {
  panels: Panel[];
  rooms: Room[];
  events: Event[];
  volunteers: Volunteer[];
  volunteerPanels: VolunteerPanel[];
  currentDate: string;
}

export function CalendarGrid({ panels, rooms, events, volunteers, volunteerPanels, currentDate }: CalendarGridProps) {
  // Build panelId → volunteer names lookup via join table
  const volunteerMap = new Map(volunteers.map((v) => [v.id, v]));
  const volunteerNamesByPanel = new Map<string, string[]>();
  for (const vp of volunteerPanels) {
    const vol = volunteerMap.get(vp.volunteerId);
    if (!vol) continue;
    const list = volunteerNamesByPanel.get(vp.panelId) || [];
    list.push(vol.name);
    volunteerNamesByPanel.set(vp.panelId, list);
  }
  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r.roomName]));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  const dayEvents = events.filter((e) => e.date === currentDate);

  const getBlocksForPanel = (panel: Panel): TimeBlock[] => {
    const blocks: TimeBlock[] = [];
    const panelBlock = panelToTimeBlock(panel);
    if (panelBlock && panelBlock.date === currentDate) {
      blocks.push(panelBlock);
    }
    const panelEvents = dayEvents
      .filter((e) => e.panelId === panel.id)
      .map(eventToTimeBlock);
    blocks.push(...panelEvents);
    return blocks;
  };

  return (
    <div className="flex-1 overflow-auto print-calendar-grid">
      <div className="min-w-max">
        {/* Header row */}
        <div
          className="grid border-b sticky top-0 bg-background z-10 print:static"
          style={{
            gridTemplateColumns: `var(--grid-time-col, 80px) repeat(${panels.length}, minmax(var(--grid-col-min, 160px), 1fr))`,
          }}
        >
          <div className="p-3 border-r" />
          {panels.map((panel) => {
            const names = volunteerNamesByPanel.get(panel.id) || [];
            return (
              <div key={panel.id} className="p-3 border-r">
                <div className="font-medium text-sm truncate">{panel.panelName}</div>
                {names.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    Volunteers: {names.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid body */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `var(--grid-time-col, 80px) repeat(${panels.length}, minmax(var(--grid-col-min, 160px), 1fr))`,
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

          {/* Panel columns */}
          {panels.map((panel) => {
            const blocks = mergeShowFlowBlocks(getBlocksForPanel(panel));
            const laid = layoutEvents(blocks);
            return (
              <div key={panel.id} className="border-r relative">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div key={hour} className="h-20 border-b" />
                ))}

                {/* Event blocks */}
                {laid.map((item) => {
                  const color = getColor(item.block);
                  const duration = timeToMinutes(item.block.endTime) - timeToMinutes(item.block.startTime);
                  const compact = duration <= 20 && !item.block.mergedItems;
                  const roomName = item.block.roomId ? roomMap[item.block.roomId] : null;
                  return (
                    <div
                      key={item.block.id}
                      className="absolute rounded px-2 py-1 text-xs overflow-hidden print-event avoid-page-break"
                      style={{
                        top: item.top,
                        height: item.height,
                        left: item.left,
                        width: item.width,
                        backgroundColor: color,
                        opacity: 0.9,
                        '--print-event-color': color,
                      } as React.CSSProperties}
                    >
                      {item.block.mergedItems ? (
                        <div className="text-white print:text-black">
                          {item.block.mergedItems.map((mi, idx) => (
                            <div key={idx} className="truncate leading-tight">
                              <span className="text-white/70 print:text-gray-500 text-[10px]">{formatTime(mi.startTime)} – {formatTime(mi.endTime)}</span>{" "}
                              <span className="font-medium">{mi.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : compact ? (
                        <div className="font-medium text-white truncate print:text-black">
                          {item.block.title} · {formatTime(item.block.startTime)}–{formatTime(item.block.endTime)}{roomName ? ` · ${roomName}` : ""}
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-white truncate print:text-black">
                            {item.block.title}
                          </div>
                          <div className="text-white/80 text-[10px] print:text-gray-700">
                            {formatTime(item.block.startTime)} – {formatTime(item.block.endTime)}
                          </div>
                          {roomName && (
                            <div className="text-white/70 text-[10px] truncate print:text-gray-600">
                              {roomName}
                            </div>
                          )}
                        </>
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
