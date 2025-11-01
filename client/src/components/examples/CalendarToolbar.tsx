import { useState } from "react";
import { CalendarToolbar } from "../CalendarToolbar";

export default function CalendarToolbarExample() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  return (
    <div className="h-screen bg-background">
      <CalendarToolbar
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
        onCreateEvent={() => console.log("Create event clicked")}
      />
    </div>
  );
}
