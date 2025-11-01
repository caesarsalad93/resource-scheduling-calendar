import { useState } from "react";
import { EventDialog } from "../EventDialog";
import { Button } from "@/components/ui/button";

const mockResources = [
  { id: "1", name: "Dr. Sarah Johnson", type: "Doctor", color: "#3b82f6" },
  { id: "2", name: "Conference Room A", type: "Room", color: "#10b981" },
];

export default function EventDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen bg-background p-8">
      <Button onClick={() => setOpen(true)}>Open Event Dialog</Button>
      <EventDialog
        open={open}
        onOpenChange={setOpen}
        resources={mockResources}
        defaultStartTime={new Date()}
        onSubmit={(data) => console.log("Event created:", data)}
      />
    </div>
  );
}
