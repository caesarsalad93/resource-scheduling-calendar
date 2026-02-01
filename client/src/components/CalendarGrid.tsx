import { format, addHours, isSameDay, startOfDay, differenceInMinutes } from "date-fns";
import type { Resource, Event } from "@shared/schema";

interface CalendarGridProps {
  resources: Resource[];
  events: Event[];
  currentDate: Date;
  viewMode: "day" | "week" | "month";
  onEventClick: (event: Event) => void;
  onCellClick: (resourceId: string, startTime: Date) => void;
}

const EVENT_COLORS = {
  appointment: "#3b82f6",
  meeting: "#10b981",
  surgery: "#8b5cf6",
  maintenance: "#ec4899",
  break: "#94a3b8",
  training: "#f59e0b",
  emergency: "#ef4444",
};

export function CalendarGrid({
  resources,
  events,
  currentDate,
  viewMode,
  onEventClick,
  onCellClick,
}: CalendarGridProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const getEventsForResourceAndTime = (resourceId: string, hour: number) => {
    return events.filter((event) => {
      if (event.panelId !== resourceId) return false;
      
      const eventStart = new Date(event.startTime);
      const eventHour = eventStart.getHours();
      
      return (
        isSameDay(eventStart, currentDate) &&
        eventHour === hour
      );
    });
  };

  const getOverlappingEvents = (resourceId: string, event: Event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    return events.filter((e) => {
      if (e.id === event.id || e.panelId !== resourceId) return false;
      
      const eStart = new Date(e.startTime);
      const eEnd = new Date(e.endTime);
      
      return (
        isSameDay(eStart, currentDate) &&
        ((eStart >= eventStart && eStart < eventEnd) ||
          (eEnd > eventStart && eEnd <= eventEnd) ||
          (eStart <= eventStart && eEnd >= eventEnd))
      );
    });
  };

  const getEventPosition = (event: Event, hour: number) => {
    const slotStart = new Date(currentDate);
    slotStart.setHours(hour, 0, 0, 0);
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    const minutesFromSlotStart = Math.max(0, differenceInMinutes(eventStart, slotStart));
    const totalEventDurationMinutes = differenceInMinutes(eventEnd, eventStart);

    return {
      top: `${(minutesFromSlotStart / 60) * 100}%`,
      height: `${(totalEventDurationMinutes / 60) * 100}%`,
    };
  };

  return (
    <div className="flex-1 overflow-auto print-calendar-grid">
      <div className="min-w-max">
        <div 
          className="grid border-b sticky top-0 bg-background z-10 print:static"
          style={{ 
            gridTemplateColumns: `80px repeat(${resources.length}, minmax(200px, 1fr))` 
          }}
        >
          <div className="p-3 border-r" />
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="p-3 border-r"
              data-testid={`header-resource-${resource.id}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: resource.color }}
                />
                <div>
                  <div className="font-medium text-sm">{resource.name}</div>
                  <div className="text-xs text-muted-foreground">{resource.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hours.map((hour) => (
          <div
            key={hour}
            className="grid border-b print-grid-row"
            style={{ 
              gridTemplateColumns: `80px repeat(${resources.length}, minmax(200px, 1fr))`,
              minHeight: '80px'
            }}
          >
            <div className="p-3 border-r text-xs text-muted-foreground sticky left-0 bg-background">
              {format(addHours(startOfDay(currentDate), hour), "h:mm a")}
            </div>
            {resources.map((resource) => {
              const cellEvents = getEventsForResourceAndTime(resource.id, hour);
              
              return (
                <div
                  key={resource.id}
                  className="border-r relative hover-elevate cursor-pointer"
                  onClick={() => {
                    const slotTime = new Date(currentDate);
                    slotTime.setHours(hour, 0, 0, 0);
                    onCellClick(resource.id, slotTime);
                  }}
                  data-testid={`cell-${resource.id}-${hour}`}
                >
                  {cellEvents.map((event, index) => {
                    const position = getEventPosition(event, hour);
                    const overlapping = getOverlappingEvents(resource.id, event);
                    const totalOverlapping = overlapping.length + 1;
                    const eventIndex = overlapping.filter(e => e.id < event.id).length;
                    
                    const width = totalOverlapping > 1 ? `${100 / totalOverlapping}%` : 'calc(100% - 8px)';
                    const left = totalOverlapping > 1 ? `${(eventIndex * 100) / totalOverlapping}%` : '4px';
                    
                    const eventColor = event.category && EVENT_COLORS[event.category as keyof typeof EVENT_COLORS]
                      ? EVENT_COLORS[event.category as keyof typeof EVENT_COLORS]
                      : event.color || resource.color;
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute rounded px-2 py-1 text-xs cursor-pointer overflow-hidden print-event print:cursor-default avoid-page-break"
                        style={{
                          top: position.top,
                          height: position.height,
                          left,
                          width,
                          backgroundColor: eventColor,
                          opacity: 0.9,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="font-medium text-white truncate print:text-black">
                          {event.title}
                        </div>
                        <div className="text-white/80 text-[10px] print:text-gray-700">
                          {format(new Date(event.startTime), "h:mm a")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
