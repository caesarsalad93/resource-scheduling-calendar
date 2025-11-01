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
    const slotStart = new Date(currentDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(currentDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        event.resourceId === resourceId &&
        isSameDay(eventStart, currentDate) &&
        ((eventStart >= slotStart && eventStart < slotEnd) ||
          (eventEnd > slotStart && eventEnd <= slotEnd) ||
          (eventStart <= slotStart && eventEnd >= slotEnd))
      );
    });
  };

  const getEventPosition = (event: Event, hour: number) => {
    const slotStart = new Date(currentDate);
    slotStart.setHours(hour, 0, 0, 0);
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    const minutesFromSlotStart = Math.max(0, differenceInMinutes(eventStart, slotStart));
    const eventDurationMinutes = differenceInMinutes(eventEnd, eventStart);
    const heightMinutes = Math.min(60 - minutesFromSlotStart, eventDurationMinutes);

    return {
      top: `${(minutesFromSlotStart / 60) * 100}%`,
      height: `${(heightMinutes / 60) * 100}%`,
    };
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-max">
        <div 
          className="grid border-b sticky top-0 bg-background z-10"
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
            className="grid border-b"
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
                  {cellEvents.map((event) => {
                    const position = getEventPosition(event, hour);
                    return (
                      <div
                        key={event.id}
                        className="absolute inset-x-1 rounded px-2 py-1 text-xs cursor-pointer overflow-hidden"
                        style={{
                          top: position.top,
                          height: position.height,
                          backgroundColor: event.color || resource.color,
                          opacity: 0.9,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="font-medium text-white truncate">
                          {event.title}
                        </div>
                        <div className="text-white/80 text-[10px]">
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
