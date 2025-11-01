import { CalendarGrid } from "../CalendarGrid";

const mockResources = [
  { id: "1", name: "Dr. Sarah Johnson", type: "Doctor", color: "#3b82f6" },
  { id: "2", name: "Dr. Michael Chen", type: "Doctor", color: "#8b5cf6" },
  { id: "3", name: "Conference Room A", type: "Room", color: "#10b981" },
];

const mockEvents = [
  {
    id: "1",
    title: "Patient Consultation",
    resourceId: "1",
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(10, 0, 0, 0)),
    description: "Annual checkup",
    color: null,
    category: "appointment",
  },
  {
    id: "2",
    title: "Team Meeting",
    resourceId: "3",
    startTime: new Date(new Date().setHours(10, 30, 0, 0)),
    endTime: new Date(new Date().setHours(11, 30, 0, 0)),
    description: "Weekly sync",
    color: null,
    category: "meeting",
  },
  {
    id: "3",
    title: "Surgery Prep",
    resourceId: "2",
    startTime: new Date(new Date().setHours(14, 0, 0, 0)),
    endTime: new Date(new Date().setHours(15, 30, 0, 0)),
    description: "Pre-op consultation",
    color: null,
    category: "surgery",
  },
];

export default function CalendarGridExample() {
  return (
    <div className="h-screen bg-background">
      <CalendarGrid
        resources={mockResources}
        events={mockEvents}
        currentDate={new Date()}
        viewMode="day"
        onEventClick={(event) => console.log("Event clicked:", event.title)}
        onCellClick={(resourceId, time) => 
          console.log("Cell clicked:", resourceId, time)
        }
      />
    </div>
  );
}
