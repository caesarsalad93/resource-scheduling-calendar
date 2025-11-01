import { useState } from "react";
import { CalendarToolbar } from "@/components/CalendarToolbar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDialog } from "@/components/EventDialog";
import { ResourceDialog } from "@/components/ResourceDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Resource, Event } from "@shared/schema";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event>();
  const [defaultEventData, setDefaultEventData] = useState<{
    resourceId?: string;
    startTime?: Date;
  }>({});

  const [resources, setResources] = useState<Resource[]>([
    { id: "1", name: "Dr. Sarah Johnson", type: "Doctor", color: "#3b82f6" },
    { id: "2", name: "Dr. Michael Chen", type: "Doctor", color: "#8b5cf6" },
    { id: "3", name: "Conference Room A", type: "Room", color: "#10b981" },
    { id: "4", name: "Conference Room B", type: "Room", color: "#f59e0b" },
    { id: "5", name: "John Smith", type: "Technician", color: "#ec4899" },
  ]);

  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Patient Consultation",
      resourceId: "1",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
      description: "Annual checkup with patient",
      color: "#3b82f6",
    },
    {
      id: "2",
      title: "Team Meeting",
      resourceId: "3",
      startTime: new Date(new Date().setHours(10, 30, 0, 0)),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)),
      description: "Weekly team sync meeting",
      color: "#10b981",
    },
    {
      id: "3",
      title: "Surgery Prep",
      resourceId: "2",
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(15, 30, 0, 0)),
      description: "Pre-operative consultation",
      color: "#8b5cf6",
    },
    {
      id: "4",
      title: "Equipment Maintenance",
      resourceId: "5",
      startTime: new Date(new Date().setHours(13, 0, 0, 0)),
      endTime: new Date(new Date().setHours(14, 0, 0, 0)),
      description: "Routine equipment check",
      color: "#ec4899",
    },
  ]);

  const handleCreateEvent = () => {
    setSelectedEvent(undefined);
    setDefaultEventData({});
    setEventDialogOpen(true);
  };

  const handleCellClick = (resourceId: string, startTime: Date) => {
    setSelectedEvent(undefined);
    setDefaultEventData({ resourceId, startTime });
    setEventDialogOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDefaultEventData({});
    setEventDialogOpen(true);
  };

  const handleEventSubmit = (data: any) => {
    if (selectedEvent) {
      setEvents(events.map(e => 
        e.id === selectedEvent.id
          ? {
              ...e,
              ...data,
              startTime: new Date(data.startTime),
              endTime: new Date(data.endTime),
            }
          : e
      ));
    } else {
      const newEvent: Event = {
        id: Date.now().toString(),
        title: data.title,
        resourceId: data.resourceId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        description: data.description,
        color: data.color || resources.find(r => r.id === data.resourceId)?.color,
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleEventDelete = () => {
    if (selectedEvent) {
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setEventDialogOpen(false);
    }
  };

  const handleResourceSubmit = (data: any) => {
    const newResource: Resource = {
      id: Date.now().toString(),
      ...data,
    };
    setResources([...resources, newResource]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between border-b">
        <div className="flex-1">
          <CalendarToolbar
            currentDate={currentDate}
            viewMode={viewMode}
            onDateChange={setCurrentDate}
            onViewModeChange={setViewMode}
            onCreateEvent={handleCreateEvent}
            onAddResource={() => setResourceDialogOpen(true)}
          />
        </div>
        <div className="px-4">
          <ThemeToggle />
        </div>
      </div>

      <CalendarGrid
        resources={resources}
        events={events}
        currentDate={currentDate}
        viewMode={viewMode}
        onEventClick={handleEventClick}
        onCellClick={handleCellClick}
      />

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        resources={resources}
        event={selectedEvent}
        defaultResourceId={defaultEventData.resourceId}
        defaultStartTime={defaultEventData.startTime}
        onSubmit={handleEventSubmit}
        onDelete={selectedEvent ? handleEventDelete : undefined}
      />

      <ResourceDialog
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
        onSubmit={handleResourceSubmit}
      />
    </div>
  );
}
