import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalendarToolbar } from "@/components/CalendarToolbar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { RoomsGrid } from "@/components/RoomsGrid";
import { CalendarGridSkeleton } from "@/components/CalendarGridSkeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { timeToMinutes, EVENT_TYPE_COLORS } from "@/lib/calendar-utils";
import { format } from "date-fns";
import type { Panel, Room, Event, Volunteer, VolunteerPanel } from "@shared/schema";

const STORAGE_KEY = "calendar-filters";

type GridMode = "panels" | "rooms";

interface StoredFilters {
  gridMode: GridMode;
  date: string | null;
  districtFilter: string | null;
}

function loadFilters(): StoredFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { gridMode: "panels", date: null, districtFilter: null };
}

function saveFilters(f: StoredFilters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
}

export default function Home() {
  const stored = useMemo(() => loadFilters(), []);
  const [gridMode, setGridMode] = useState<GridMode>(stored.gridMode);
  const [currentDate, setCurrentDate] = useState<string>("2026-03-27");
  const [districtFilter, setDistrictFilter] = useState<string | null>(stored.districtFilter);

  const qc = useQueryClient();

  const handleSync = async () => {
    await apiRequest("POST", "/api/sync/airtable");
    await qc.invalidateQueries();
  };

  const { data: panels = [], isLoading: panelsLoading } = useQuery<Panel[]>({ queryKey: ["/api/panels"] });
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });
  const { data: volunteers = [] } = useQuery<Volunteer[]>({ queryKey: ["/api/volunteers"] });
  const { data: volunteerPanels = [] } = useQuery<VolunteerPanel[]>({ queryKey: ["/api/volunteer-panels"] });
  const isLoading = panelsLoading || roomsLoading || eventsLoading;

  // Derive available dates from events and panels
  const availableDates = useMemo(() => {
    const eventDates = events.map((e) => e.date);
    const panelDates = panels.map((p) => p.date).filter((d): d is string => !!d);
    return Array.from(new Set([...eventDates, ...panelDates])).sort();
  }, [events, panels]);

  // Set default date to first available if not set
  useEffect(() => {
    if (!currentDate && availableDates.length > 0) {
      setCurrentDate(availableDates[0]);
    }
  }, [availableDates, currentDate]);

  // Persist filters
  useEffect(() => {
    saveFilters({ gridMode, date: currentDate, districtFilter });
  }, [gridMode, currentDate, districtFilter]);

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("mode", gridMode);
    if (currentDate) params.set("date", currentDate);
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [gridMode, currentDate]);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const date = params.get("date");
    if (mode === "panels" || mode === "rooms") setGridMode(mode);
    if (date) setCurrentDate(date);
  }, []);

  // Derive districts from rooms
  const districts = useMemo(() => {
    const d = rooms.map((r) => r.district).filter((v): v is string => !!v);
    return Array.from(new Set(d)).sort();
  }, [rooms]);

  // Build room district lookup
  const roomDistrictMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const r of rooms) m.set(r.id, r.district ?? null);
    return m;
  }, [rooms]);

  // Filter panels to those with events or own schedule on the current date, sorted by earliest time
  const filteredPanels = useMemo(() => {
    const dayEvents = events.filter((e) => e.date === currentDate);
    const panelIdsWithEvents = new Set(dayEvents.map((e) => e.panelId));
    const earliestByPanel = new Map<string, number>();
    // Consider panel's own start time
    for (const p of panels) {
      if (p.startTime && p.date === currentDate) {
        earliestByPanel.set(p.id, timeToMinutes(p.startTime));
      }
    }
    // Consider linked event start times
    for (const e of dayEvents) {
      if (!e.panelId) continue;
      const mins = timeToMinutes(e.startTime);
      const prev = earliestByPanel.get(e.panelId);
      if (prev === undefined || mins < prev) earliestByPanel.set(e.panelId, mins);
    }
    return panels
      .filter((p) => panelIdsWithEvents.has(p.id) || p.date === currentDate)
      .filter((p) => {
        if (!districtFilter) return true;
        const district = p.roomId ? roomDistrictMap.get(p.roomId) : null;
        return district === districtFilter;
      })
      .sort((a, b) => (earliestByPanel.get(a.id) ?? Infinity) - (earliestByPanel.get(b.id) ?? Infinity));
  }, [panels, events, currentDate, districtFilter, roomDistrictMap]);

  // Filter rooms by district, sorted by earliest event or panel time
  const filteredRooms = useMemo(() => {
    const base = districtFilter ? rooms.filter((r) => r.district === districtFilter) : rooms;
    const dayEvents = events.filter((e) => e.date === currentDate);
    const earliestByRoom = new Map<string, number>();
    // From events
    for (const e of dayEvents) {
      if (!e.roomId) continue;
      const mins = timeToMinutes(e.startTime);
      const prev = earliestByRoom.get(e.roomId);
      if (prev === undefined || mins < prev) earliestByRoom.set(e.roomId, mins);
    }
    // From panels
    for (const p of panels) {
      if (!p.roomId || !p.startTime || p.date !== currentDate) continue;
      const mins = timeToMinutes(p.startTime);
      const prev = earliestByRoom.get(p.roomId);
      if (prev === undefined || mins < prev) earliestByRoom.set(p.roomId, mins);
    }
    return [...base].sort((a, b) => (earliestByRoom.get(a.id) ?? Infinity) - (earliestByRoom.get(b.id) ?? Infinity));
  }, [rooms, panels, events, currentDate, districtFilter]);

  return (
    <div className="flex flex-col h-screen bg-background print-calendar-container">
      {/* Print header */}
      <div className="hidden print:block print-header">
        <h1 className="text-2xl font-bold">
          {gridMode === "panels" ? "Panel Schedule" : "Room Schedule"}
          {districtFilter && ` — ${districtFilter}`}
        </h1>
        <p className="text-sm text-gray-600">
          {currentDate ? format(new Date(currentDate + "T00:00:00"), "EEEE, MMMM d, yyyy") : ""}
        </p>
        <div className="flex items-center gap-4 flex-wrap mt-2">
          {Object.entries(EVENT_TYPE_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
              />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b no-print">
        <div className="flex-1">
          <CalendarToolbar
            currentDate={currentDate}
            gridMode={gridMode}
            districts={districts}
            districtFilter={districtFilter}
            onDateChange={setCurrentDate}
            onGridModeChange={setGridMode}
            onDistrictFilterChange={setDistrictFilter}
            availableDates={availableDates}
            onSync={handleSync}
          />
        </div>
        <div className="px-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <CalendarGridSkeleton />
      ) : gridMode === "panels" ? (
        <CalendarGrid panels={filteredPanels} rooms={rooms} events={events} volunteers={volunteers} volunteerPanels={volunteerPanels} currentDate={currentDate} />
      ) : (
        <RoomsGrid rooms={filteredRooms} allRooms={rooms} panels={panels} events={events} currentDate={currentDate} />
      )}
    </div>
  );
}
