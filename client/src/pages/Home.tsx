import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalendarToolbar } from "@/components/CalendarToolbar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { RoomsGrid } from "@/components/RoomsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Panel, Room, Event } from "@shared/schema";

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

  const { data: panels = [] } = useQuery<Panel[]>({ queryKey: ["/api/panels"] });
  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  // Derive available dates from events
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(events.map((e) => e.date))).sort();
    return dates;
  }, [events]);

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

  // Filter panels to only those with events on the current date
  const filteredPanels = useMemo(() => {
    const panelIdsWithEvents = new Set(
      events.filter((e) => e.date === currentDate).map((e) => e.panelId)
    );
    return panels.filter((p) => panelIdsWithEvents.has(p.id));
  }, [panels, events, currentDate]);

  // Filter rooms by district
  const filteredRooms = districtFilter
    ? rooms.filter((r) => r.district === districtFilter)
    : rooms;

  return (
    <div className="flex flex-col h-screen bg-background print-calendar-container">
      {/* Print header */}
      <div className="hidden print:block print-header">
        <h1 className="text-2xl font-bold">
          {gridMode === "panels" ? "Panel Schedule" : "Room Schedule"}
        </h1>
        <p className="text-sm text-gray-600">{currentDate}</p>
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
      {gridMode === "panels" ? (
        <CalendarGrid panels={filteredPanels} events={events} currentDate={currentDate} />
      ) : (
        <RoomsGrid rooms={filteredRooms} panels={panels} events={events} currentDate={currentDate} />
      )}
    </div>
  );
}
