import { useMemo } from "react";
import { format, addHours, startOfDay } from "date-fns";
import type { Room, Panel, Event } from "@shared/schema";
import {
  START_HOUR,
  END_HOUR,
  formatTime,
  minutesToTimeString,
  timeToMinutes,
  getColor,
  layoutEvents,
  mergeShowFlowBlocks,
  panelToTimeBlock,
  eventToTimeBlock,
  type TimeBlock,
} from "@/lib/calendar-utils";

interface RoomsGridProps {
  rooms: Room[];
  allRooms: Room[];
  panels: Panel[];
  events: Event[];
  currentDate: string;
}

export function RoomsGrid({ rooms, allRooms, panels, events, currentDate }: RoomsGridProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  const dayEvents = events.filter((e) => e.date === currentDate);

  const panelMap = new Map(panels.map((p) => [p.id, p]));

  // Compute holding room info per district represented in the visible rooms
  const holdingInfo = useMemo(() => {
    const districts = Array.from(new Set(rooms.map((r) => r.district).filter((d): d is string => !!d)));
    const result = new Map<string, { holdingRoom: Room; open: string; close: string }>();

    for (const district of districts) {
      const holdingRoom = allRooms.find((r) => r.district === district && r.roomType?.toLowerCase() === "holding");
      if (!holdingRoom) continue;

      const districtRoomIds = new Set(
        allRooms.filter((r) => r.district === district).map((r) => r.id),
      );
      const times: number[] = [];

      for (const p of panels) {
        if (p.roomId && districtRoomIds.has(p.roomId) && p.date === currentDate && p.startTime && p.endTime) {
          times.push(timeToMinutes(p.startTime), timeToMinutes(p.endTime));
        }
      }
      for (const e of dayEvents) {
        if (e.roomId && districtRoomIds.has(e.roomId)) {
          times.push(timeToMinutes(e.startTime), timeToMinutes(e.endTime));
        }
      }

      if (times.length > 0) {
        result.set(district, {
          holdingRoom,
          open: minutesToTimeString(Math.min(...times) - 90),
          close: minutesToTimeString(Math.max(...times) + 30),
        });
      }
    }

    return result;
  }, [rooms, allRooms, panels, dayEvents, currentDate]);

  // Build district banner groups from visible rooms
  const districtBanners = useMemo(() => {
    const groups: { district: string | null; count: number }[] = [];
    let currentDistrict: string | null | undefined = undefined;

    for (const room of rooms) {
      const d = room.district ?? null;
      if (d === currentDistrict) {
        groups[groups.length - 1].count++;
      } else {
        groups.push({ district: d, count: 1 });
        currentDistrict = d;
      }
    }
    return groups;
  }, [rooms]);

  const getBlocksForRoom = (roomId: string): TimeBlock[] => {
    const blocks: TimeBlock[] = [];
    for (const panel of panels) {
      const pb = panelToTimeBlock(panel);
      if (pb && pb.roomId === roomId && pb.date === currentDate) {
        blocks.push(pb);
      }
    }
    const roomEvents = dayEvents
      .filter((e) => e.roomId === roomId)
      .map(eventToTimeBlock);
    blocks.push(...roomEvents);
    return blocks;
  };

  const gridCols = `var(--grid-time-col, 80px) repeat(${rooms.length}, minmax(var(--grid-col-min, 160px), 1fr))`;

  return (
    <div className="flex-1 overflow-auto print-calendar-grid">
      <div className="min-w-max">
        {/* Sticky header: holding room banner + room names */}
        <div className="sticky top-0 bg-background z-10 print:static">
          {/* District holding room banner */}
          {districtBanners.some((g) => g.district && holdingInfo.has(g.district)) && (
            <div
              className="grid border-b"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="border-r" />
              {districtBanners.map((group, i) => {
                const info = group.district ? holdingInfo.get(group.district) : null;
                return (
                  <div
                    key={`${group.district ?? "__none"}-${i}`}
                    style={{ gridColumn: `span ${group.count}` }}
                    className="px-3 py-1.5 border-r bg-muted/50 text-xs"
                  >
                    {info ? (
                      <span className="font-medium">
                        Holding: {info.holdingRoom.roomName} — {formatTime(info.open)} – {formatTime(info.close)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Room name header row */}
          <div
            className="grid border-b"
            style={{ gridTemplateColumns: gridCols }}
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
        </div>

        {/* Time grid body */}
        <div
          className="grid"
          style={{ gridTemplateColumns: gridCols }}
        >
          {/* Time labels column */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b p-1 text-xs text-muted-foreground sticky left-0 bg-background" style={{ height: 'var(--grid-row-h)' }}
              >
                {format(addHours(startOfDay(new Date()), hour), "h a")}
              </div>
            ))}
          </div>

          {/* Room columns */}
          {rooms.map((room) => {
            const blocks = mergeShowFlowBlocks(getBlocksForRoom(room.id));
            const laid = layoutEvents(blocks);
            return (
              <div key={room.id} className="border-r relative">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div key={hour} className="border-b" style={{ height: 'var(--grid-row-h)' }} />
                ))}

                {/* Event blocks */}
                {laid.map((item) => {
                  const color = getColor(item.block);
                  const duration = timeToMinutes(item.block.endTime) - timeToMinutes(item.block.startTime);
                  const compact = duration <= 20 && !item.block.mergedItems;
                  return (
                    <div
                      key={item.block.id}
                      className="absolute rounded px-2 py-1 text-xs overflow-hidden print-event avoid-page-break"
                      style={{
                        top: item.top,
                        height: item.height,
                        minHeight: item.height,
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
                              <span className="text-white/70 print:text-gray-500 text-[10px]">
                                <span className="print:hidden">{formatTime(mi.startTime)} – {formatTime(mi.endTime)}</span>
                                <span className="hidden print:inline">{formatTime(mi.startTime)}</span>
                              </span>{" "}
                              <span className="font-medium">{mi.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : compact ? (
                        <div className="font-medium text-white truncate print:text-black">
                          {item.block.title} · {formatTime(item.block.startTime)}–{formatTime(item.block.endTime)}
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-white print:text-black leading-tight">
                            {item.block.title}
                          </div>
                          <div className="text-white/80 text-[10px] print:text-gray-700">
                            {formatTime(item.block.startTime)} – {formatTime(item.block.endTime)}
                          </div>
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
