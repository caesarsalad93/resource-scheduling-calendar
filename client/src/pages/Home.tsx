import { useState } from "react";
import { format, isSameDay } from "date-fns";
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
    // Dr. Sarah Johnson - Fully booked day with overlapping emergencies
    {
      id: "1",
      title: "Morning Rounds",
      resourceId: "1",
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(8, 30, 0, 0)),
      description: "Patient rounds",
      color: null,
      category: "appointment",
    },
    {
      id: "2",
      title: "Patient Consultation",
      resourceId: "1",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
      description: "Annual checkup",
      color: null,
      category: "appointment",
    },
    {
      id: "2a",
      title: "Lab Results Review",
      resourceId: "1",
      startTime: new Date(new Date().setHours(9, 30, 0, 0)),
      endTime: new Date(new Date().setHours(9, 45, 0, 0)),
      description: "Review patient labs",
      color: null,
      category: "appointment",
    },
    {
      id: "3",
      title: "Follow-up Visit",
      resourceId: "1",
      startTime: new Date(new Date().setHours(10, 15, 0, 0)),
      endTime: new Date(new Date().setHours(10, 45, 0, 0)),
      description: "Post-op follow-up",
      color: null,
      category: "appointment",
    },
    {
      id: "4",
      title: "Emergency Call",
      resourceId: "1",
      startTime: new Date(new Date().setHours(11, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)),
      description: "Urgent patient call",
      color: null,
      category: "emergency",
    },
    {
      id: "4a",
      title: "Chart Review",
      resourceId: "1",
      startTime: new Date(new Date().setHours(11, 15, 0, 0)),
      endTime: new Date(new Date().setHours(11, 45, 0, 0)),
      description: "Review patient charts",
      color: null,
      category: "appointment",
    },
    {
      id: "5",
      title: "Lunch Break",
      resourceId: "1",
      startTime: new Date(new Date().setHours(12, 0, 0, 0)),
      endTime: new Date(new Date().setHours(13, 0, 0, 0)),
      description: "Lunch",
      color: null,
      category: "break",
    },
    {
      id: "6",
      title: "New Patient Intake",
      resourceId: "1",
      startTime: new Date(new Date().setHours(13, 0, 0, 0)),
      endTime: new Date(new Date().setHours(14, 0, 0, 0)),
      description: "Initial consultation",
      color: null,
      category: "appointment",
    },
    {
      id: "7",
      title: "Checkup - Thompson",
      resourceId: "1",
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(14, 30, 0, 0)),
      description: "Routine checkup",
      color: null,
      category: "appointment",
    },
    {
      id: "8",
      title: "Physical Exam",
      resourceId: "1",
      startTime: new Date(new Date().setHours(15, 0, 0, 0)),
      endTime: new Date(new Date().setHours(16, 0, 0, 0)),
      description: "Annual physical",
      color: null,
      category: "appointment",
    },
    
    // Dr. Michael Chen - Surgery focus with overlapping consultations
    {
      id: "9",
      title: "Pre-Op Consultation",
      resourceId: "2",
      startTime: new Date(new Date().setHours(8, 30, 0, 0)),
      endTime: new Date(new Date().setHours(9, 30, 0, 0)),
      description: "Surgery preparation",
      color: null,
      category: "appointment",
    },
    {
      id: "10",
      title: "Surgery - Patient A",
      resourceId: "2",
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(12, 30, 0, 0)),
      description: "Scheduled procedure",
      color: null,
      category: "surgery",
    },
    {
      id: "10a",
      title: "Anesthesia Briefing",
      resourceId: "2",
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 15, 0, 0)),
      description: "Quick anesthesia review",
      color: null,
      category: "meeting",
    },
    {
      id: "11",
      title: "Post-Op Review",
      resourceId: "2",
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(15, 0, 0, 0)),
      description: "Recovery assessment",
      color: null,
      category: "appointment",
    },
    {
      id: "11a",
      title: "Family Consultation",
      resourceId: "2",
      startTime: new Date(new Date().setHours(14, 30, 0, 0)),
      endTime: new Date(new Date().setHours(14, 45, 0, 0)),
      description: "Speak with family",
      color: null,
      category: "appointment",
    },
    {
      id: "12",
      title: "Staff Training",
      resourceId: "2",
      startTime: new Date(new Date().setHours(15, 30, 0, 0)),
      endTime: new Date(new Date().setHours(17, 0, 0, 0)),
      description: "Surgical techniques workshop",
      color: null,
      category: "training",
    },
    
    // Conference Room A - Multiple overlapping bookings
    {
      id: "13",
      title: "Department Meeting",
      resourceId: "3",
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(9, 0, 0, 0)),
      description: "Weekly department sync",
      color: null,
      category: "meeting",
    },
    {
      id: "14",
      title: "Budget Review",
      resourceId: "3",
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)),
      description: "Q4 budget planning",
      color: null,
      category: "meeting",
    },
    {
      id: "14a",
      title: "Virtual Call - Team B",
      resourceId: "3",
      startTime: new Date(new Date().setHours(10, 30, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
      description: "Remote team sync",
      color: null,
      category: "meeting",
    },
    {
      id: "14b",
      title: "Emergency Meeting",
      resourceId: "3",
      startTime: new Date(new Date().setHours(10, 45, 0, 0)),
      endTime: new Date(new Date().setHours(11, 15, 0, 0)),
      description: "Urgent decision needed",
      color: null,
      category: "emergency",
    },
    {
      id: "15",
      title: "Staff Interview",
      resourceId: "3",
      startTime: new Date(new Date().setHours(13, 0, 0, 0)),
      endTime: new Date(new Date().setHours(14, 0, 0, 0)),
      description: "Candidate interview",
      color: null,
      category: "meeting",
    },
    {
      id: "16",
      title: "Training Session",
      resourceId: "3",
      startTime: new Date(new Date().setHours(14, 30, 0, 0)),
      endTime: new Date(new Date().setHours(16, 30, 0, 0)),
      description: "New software training",
      color: null,
      category: "training",
    },
    
    // Conference Room B - Client meetings
    {
      id: "17",
      title: "Client Presentation",
      resourceId: "4",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 30, 0, 0)),
      description: "Quarterly review",
      color: null,
      category: "meeting",
    },
    {
      id: "18",
      title: "Team Standup",
      resourceId: "4",
      startTime: new Date(new Date().setHours(11, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 15, 0, 0)),
      description: "Daily sync",
      color: null,
      category: "meeting",
    },
    {
      id: "19",
      title: "Project Planning",
      resourceId: "4",
      startTime: new Date(new Date().setHours(13, 30, 0, 0)),
      endTime: new Date(new Date().setHours(15, 30, 0, 0)),
      description: "Sprint planning session",
      color: null,
      category: "meeting",
    },
    {
      id: "20",
      title: "Board Meeting",
      resourceId: "4",
      startTime: new Date(new Date().setHours(16, 0, 0, 0)),
      endTime: new Date(new Date().setHours(18, 0, 0, 0)),
      description: "Monthly board meeting",
      color: null,
      category: "meeting",
    },
    
    // John Smith - Technician with concurrent tasks
    {
      id: "21",
      title: "Equipment Inspection",
      resourceId: "5",
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(9, 0, 0, 0)),
      description: "Morning equipment check",
      color: null,
      category: "maintenance",
    },
    {
      id: "22",
      title: "MRI Calibration",
      resourceId: "5",
      startTime: new Date(new Date().setHours(9, 30, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
      description: "Routine calibration",
      color: null,
      category: "maintenance",
    },
    {
      id: "22a",
      title: "Emergency Repair Call",
      resourceId: "5",
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 20, 0, 0)),
      description: "Urgent equipment issue",
      color: null,
      category: "emergency",
    },
    {
      id: "23",
      title: "Repair - Room 203",
      resourceId: "5",
      startTime: new Date(new Date().setHours(11, 30, 0, 0)),
      endTime: new Date(new Date().setHours(12, 30, 0, 0)),
      description: "Fix ventilation system",
      color: null,
      category: "maintenance",
    },
    {
      id: "24",
      title: "Preventive Maintenance",
      resourceId: "5",
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(16, 0, 0, 0)),
      description: "Scheduled maintenance",
      color: null,
      category: "maintenance",
    },
    {
      id: "24a",
      title: "Part Ordering",
      resourceId: "5",
      startTime: new Date(new Date().setHours(15, 0, 0, 0)),
      endTime: new Date(new Date().setHours(15, 30, 0, 0)),
      description: "Order replacement parts",
      color: null,
      category: "maintenance",
    },
    {
      id: "25",
      title: "Safety Inspection",
      resourceId: "5",
      startTime: new Date(new Date().setHours(16, 30, 0, 0)),
      endTime: new Date(new Date().setHours(17, 30, 0, 0)),
      description: "Monthly safety check",
      color: null,
      category: "maintenance",
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
        color: data.color || null,
        category: data.category || null,
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
    <div className="flex flex-col h-screen bg-background print-calendar-container">
      {/* Print Header - only visible when printing */}
      <div className="hidden print:block print-header">
        <h1 className="text-2xl font-bold">Resource Schedule</h1>
        <p className="text-sm text-gray-600">
          {format(currentDate, "EEEE, MMMM d, yyyy")} • {resources.length} Resources • {events.filter(e => isSameDay(new Date(e.startTime), currentDate)).length} Events
        </p>
      </div>

      {/* Interactive toolbar - hidden when printing */}
      <div className="flex items-center justify-between border-b no-print">
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
