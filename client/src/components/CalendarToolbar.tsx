import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";

type ViewMode = "day" | "week" | "month";

interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateEvent: () => void;
  onAddResource: () => void;
}

export function CalendarToolbar({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onCreateEvent,
  onAddResource,
}: CalendarToolbarProps) {
  const goToPrevious = () => {
    if (viewMode === "day") {
      onDateChange(addDays(currentDate, -1));
    } else if (viewMode === "week") {
      onDateChange(addDays(currentDate, -7));
    } else {
      onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "day") {
      onDateChange(addDays(currentDate, 1));
    } else if (viewMode === "week") {
      onDateChange(addDays(currentDate, 7));
    } else {
      onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getDateRange = () => {
    if (viewMode === "day") {
      return format(currentDate, "MMMM d, yyyy");
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            data-testid="button-previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToToday}
            data-testid="button-today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            data-testid="button-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold" data-testid="text-date-range">
          {getDateRange()}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "day" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("day")}
            data-testid="button-view-day"
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("week")}
            data-testid="button-view-week"
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("month")}
            data-testid="button-view-month"
          >
            Month
          </Button>
        </div>

        <Button variant="outline" onClick={onAddResource} data-testid="button-add-resource">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>

        <Button onClick={onCreateEvent} data-testid="button-create-event">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
    </div>
  );
}
