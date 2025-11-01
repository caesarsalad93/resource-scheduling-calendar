import { ChevronLeft, ChevronRight, Plus, Save, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ViewMode = "day" | "week" | "month";

export interface SavedView {
  id: string;
  name: string;
  date: string;
  resourceTypeFilter: string | null;
}

interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  resourceTypeFilter: string | null;
  savedViews: SavedView[];
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onResourceTypeFilterChange: (type: string | null) => void;
  onSaveView: () => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
  onCreateEvent: () => void;
  onAddResource: () => void;
}

export function CalendarToolbar({
  currentDate,
  viewMode,
  resourceTypeFilter,
  savedViews,
  onDateChange,
  onViewModeChange,
  onResourceTypeFilterChange,
  onSaveView,
  onLoadView,
  onDeleteView,
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
    <div className="flex flex-col gap-3 p-4 border-b bg-background">
      <div className="flex items-center justify-between">
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

          <Button variant="outline" size="sm" onClick={onSaveView} data-testid="button-save-view">
            <Save className="h-4 w-4 mr-2" />
            Save View
          </Button>

          {savedViews.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-saved-views">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Views ({savedViews.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {savedViews.map((view) => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => onLoadView(view)}
                    data-testid={`menu-item-view-${view.id}`}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{view.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteView(view.id);
                        }}
                        data-testid={`button-delete-view-${view.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by type:</span>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={resourceTypeFilter === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onResourceTypeFilterChange(null)}
            data-testid="button-filter-all"
          >
            All
          </Button>
          <Button
            variant={resourceTypeFilter === "Doctor" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onResourceTypeFilterChange("Doctor")}
            data-testid="button-filter-doctor"
          >
            Doctors
          </Button>
          <Button
            variant={resourceTypeFilter === "Room" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onResourceTypeFilterChange("Room")}
            data-testid="button-filter-room"
          >
            Rooms
          </Button>
          <Button
            variant={resourceTypeFilter === "Technician" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onResourceTypeFilterChange("Technician")}
            data-testid="button-filter-technician"
          >
            Technicians
          </Button>
        </div>
      </div>
    </div>
  );
}
