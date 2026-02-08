import { useState } from "react";
import { ChevronLeft, ChevronRight, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";

type GridMode = "panels" | "rooms";

interface CalendarToolbarProps {
  currentDate: string;
  gridMode: GridMode;
  districts: string[];
  districtFilter: string | null;
  onDateChange: (date: string) => void;
  onGridModeChange: (mode: GridMode) => void;
  onDistrictFilterChange: (district: string | null) => void;
  availableDates: string[];
  onSync: () => Promise<void>;
}

export function CalendarToolbar({
  currentDate,
  gridMode,
  districts,
  districtFilter,
  onDateChange,
  onGridModeChange,
  onDistrictFilterChange,
  availableDates,
  onSync,
}: CalendarToolbarProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };
  const goToPrevious = () => {
    const idx = availableDates.indexOf(currentDate);
    if (idx > 0) {
      onDateChange(availableDates[idx - 1]);
    } else {
      // fallback: go back one day
      const d = new Date(currentDate + "T00:00:00");
      onDateChange(format(addDays(d, -1), "yyyy-MM-dd"));
    }
  };

  const goToNext = () => {
    const idx = availableDates.indexOf(currentDate);
    if (idx >= 0 && idx < availableDates.length - 1) {
      onDateChange(availableDates[idx + 1]);
    } else {
      const d = new Date(currentDate + "T00:00:00");
      onDateChange(format(addDays(d, 1), "yyyy-MM-dd"));
    }
  };

  const displayDate = currentDate
    ? format(new Date(currentDate + "T00:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  return (
    <div className="flex flex-col gap-3 p-4 border-b bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{displayDate}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid mode toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={gridMode === "panels" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onGridModeChange("panels")}
            >
              Panels
            </Button>
            <Button
              variant={gridMode === "rooms" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onGridModeChange("rooms")}
            >
              Rooms
            </Button>
          </div>

          {/* District filter (rooms mode only) */}
          {gridMode === "rooms" && districts.length > 0 && (
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={districtFilter === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onDistrictFilterChange(null)}
              >
                All
              </Button>
              {districts.map((d) => (
                <Button
                  key={d}
                  variant={districtFilter === d ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onDistrictFilterChange(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          )}

          {/* Date picker from available dates */}
          {availableDates.length > 1 && (
            <select
              className="border rounded-md px-2 py-1 text-sm bg-background"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {format(new Date(d + "T00:00:00"), "MMM d, yyyy")}
                </option>
              ))}
            </select>
          )}

          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
