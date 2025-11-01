import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { CalendarToolbar, type SavedView } from "@/components/CalendarToolbar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDialog } from "@/components/EventDialog";
import { ResourceDialog } from "@/components/ResourceDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Resource, Event, Panel } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const SAVED_VIEWS_KEY = "calendar-saved-views";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event>();
  const [defaultEventData, setDefaultEventData] = useState<{
    resourceId?: string;
    startTime?: Date;
  }>({});

  // Load saved views from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SAVED_VIEWS_KEY);
    if (stored) {
      try {
        setSavedViews(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved views:", e);
      }
    }
  }, []);

  // Save views to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  // Fetch panels from API
  const { data: panels = [], isLoading: panelsLoading } = useQuery<Panel[]>({
    queryKey: ["/api/panels"],
  });

  // Fetch events by current date
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { date: format(currentDate, "yyyy-MM-dd") }],
  });

  // Create panel mutation
  const createPanelMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/panels", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
    },
  });

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/events", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/events/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/events/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

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

  const handleEventSubmit = async (data: any) => {
    const eventData = {
      ...data,
      panelId: data.resourceId,  // Map resourceId to panelId for backend
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
    };

    if (selectedEvent) {
      await updateEventMutation.mutateAsync({
        id: selectedEvent.id,
        data: eventData,
      });
    } else {
      await createEventMutation.mutateAsync(eventData);
    }
    setEventDialogOpen(false);
  };

  const handleEventDelete = async () => {
    if (selectedEvent) {
      await deleteEventMutation.mutateAsync(selectedEvent.id);
      setEventDialogOpen(false);
    }
  };

  const handleResourceSubmit = async (data: any) => {
    await createPanelMutation.mutateAsync(data);
    setResourceDialogOpen(false);
  };

  const handleSaveView = () => {
    const viewName = prompt("Enter a name for this view:");
    if (!viewName) return;

    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName,
      date: format(currentDate, "yyyy-MM-dd"),
      resourceTypeFilter,
    };

    setSavedViews([...savedViews, newView]);
  };

  const handleLoadView = (view: SavedView) => {
    setCurrentDate(new Date(view.date));
    setResourceTypeFilter(view.resourceTypeFilter);
  };

  const handleDeleteView = (viewId: string) => {
    setSavedViews(savedViews.filter(v => v.id !== viewId));
  };

  // Filter panels based on type
  const filteredResources = resourceTypeFilter
    ? panels.filter(r => r.type === resourceTypeFilter)
    : panels;

  return (
    <div className="flex flex-col h-screen bg-background print-calendar-container">
      {/* Print Header - only visible when printing */}
      <div className="hidden print:block print-header">
        <h1 className="text-2xl font-bold">Resource Schedule</h1>
        <p className="text-sm text-gray-600">
          {format(currentDate, "EEEE, MMMM d, yyyy")} • {panels.length} Resources • {events.filter(e => isSameDay(new Date(e.startTime), currentDate)).length} Events
        </p>
      </div>

      {/* Interactive toolbar - hidden when printing */}
      <div className="flex items-center justify-between border-b no-print">
        <div className="flex-1">
          <CalendarToolbar
            currentDate={currentDate}
            viewMode={viewMode}
            resourceTypeFilter={resourceTypeFilter}
            savedViews={savedViews}
            onDateChange={setCurrentDate}
            onViewModeChange={setViewMode}
            onResourceTypeFilterChange={setResourceTypeFilter}
            onSaveView={handleSaveView}
            onLoadView={handleLoadView}
            onDeleteView={handleDeleteView}
            onCreateEvent={handleCreateEvent}
            onAddResource={() => setResourceDialogOpen(true)}
          />
        </div>
        <div className="px-4">
          <ThemeToggle />
        </div>
      </div>

      <CalendarGrid
        resources={filteredResources}
        events={events}
        currentDate={currentDate}
        viewMode={viewMode}
        onEventClick={handleEventClick}
        onCellClick={handleCellClick}
      />

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        resources={panels}
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
